BEGIN;
-- WP-P6-001: one typed resource registry for farm aggregate membership and
-- append-only operational events. All relationships are checked in the command
-- transaction; metadata varies by kind, identity and lifecycle do not.
CREATE TABLE farm_resources (
 id UUID PRIMARY KEY,
 organization_id UUID NOT NULL REFERENCES organizations(id),
 farm_id UUID NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN('farm','unit','cycle','livestock','worker','task','input','yield','expense','livestock_event','evidence')),
 state TEXT NOT NULL,
 version INTEGER NOT NULL CHECK(version>0),
 data JSONB NOT NULL CHECK(jsonb_typeof(data)='object'),
 starting_quantity NUMERIC(20,3) NOT NULL DEFAULT 0 CHECK(starting_quantity>=0),
 quantity NUMERIC(20,3) NOT NULL DEFAULT 0 CHECK(quantity>=0),
 journal_entry_id UUID REFERENCES journal_entries(id),
 created_by UUID NOT NULL REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 completed_at TIMESTAMPTZ,
 UNIQUE(id,organization_id),
 FOREIGN KEY(farm_id,organization_id) REFERENCES farm_resources(id,organization_id) DEFERRABLE INITIALLY DEFERRED,
 CHECK((kind='farm' AND farm_id=id) OR (kind<>'farm' AND farm_id<>id))
);
CREATE UNIQUE INDEX farm_resource_identifier ON farm_resources(organization_id,farm_id,kind,(data->>'identifier'))
 WHERE kind IN('unit','livestock');
CREATE INDEX farm_resource_scope ON farm_resources(organization_id,farm_id,kind,created_at,id);
CREATE TABLE farm_operations (
 organization_id UUID NOT NULL REFERENCES organizations(id),
 operation_id UUID NOT NULL,
 actor_id UUID NOT NULL REFERENCES users(id),
 command JSONB NOT NULL,
 result JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(organization_id,operation_id)
);
CREATE TABLE farm_resource_history (
 id BIGSERIAL PRIMARY KEY,
 organization_id UUID NOT NULL,
 farm_id UUID NOT NULL,
 resource_id UUID NOT NULL,
 actor_id UUID NOT NULL REFERENCES users(id),
 operation_id UUID NOT NULL,
 action TEXT NOT NULL,
 before_value JSONB,
 after_value JSONB NOT NULL,
 occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 FOREIGN KEY(resource_id,organization_id) REFERENCES farm_resources(id,organization_id),
 FOREIGN KEY(organization_id,operation_id) REFERENCES farm_operations(organization_id,operation_id) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE farm_evidence_content (
 resource_id UUID PRIMARY KEY REFERENCES farm_resources(id),
 organization_id UUID NOT NULL,
 content BYTEA NOT NULL CHECK(octet_length(content) BETWEEN 1 AND 5242880),
 FOREIGN KEY(resource_id,organization_id) REFERENCES farm_resources(id,organization_id)
);
CREATE UNIQUE INDEX farm_single_reversal ON farm_resources(organization_id,(data->>'reversesId')) WHERE data ? 'reversesId';
CREATE UNIQUE INDEX farm_legacy_event ON farm_resources(organization_id,(data->>'legacyRecordId')) WHERE data ? 'legacyRecordId' AND NOT data ? 'reversesId';

CREATE FUNCTION farm_active_member(p_org UUID,p_actor UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM organization_memberships m JOIN organizations o ON o.id=m.organization_id
 JOIN users u ON u.id=m.user_id WHERE m.organization_id=p_org AND m.user_id=p_actor AND m.status='active'
 AND o.status='active' AND NOT COALESCE(u.is_suspended,FALSE))
$$;
CREATE FUNCTION farm_access(p_org UUID,p_actor UUID,p_farm UUID) RETURNS TEXT
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE m organization_memberships; f farm_resources; r TEXT;
BEGIN
 IF NOT farm_active_member(p_org,p_actor) THEN RETURN NULL; END IF;
 SELECT * INTO m FROM organization_memberships WHERE organization_id=p_org AND user_id=p_actor;
 IF m.role IN('owner','admin') THEN RETURN 'admin'; END IF;
 SELECT * INTO f FROM farm_resources WHERE id=p_farm AND organization_id=p_org AND kind='farm';
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF f.data->>'managerId'=p_actor::TEXT AND (m.role='farm_manager' OR 'farm.manage'=ANY(m.permissions)) THEN RETURN 'manager'; END IF;
 SELECT w.data->>'accessRole' INTO r FROM farm_resources w
 WHERE w.organization_id=p_org AND w.farm_id=p_farm AND w.kind='worker' AND w.state='ACTIVE'
 AND w.data->>'linkedUserId'=p_actor::TEXT AND (w.data->>'startOn')::DATE<=CURRENT_DATE
 AND (NOT w.data ? 'endOn' OR (w.data->>'endOn')::DATE>=CURRENT_DATE)
 ORDER BY CASE w.data->>'accessRole' WHEN 'manager' THEN 1 WHEN 'worker' THEN 2 ELSE 3 END LIMIT 1;
 RETURN r;
END $$;
CREATE FUNCTION farm_resource_visible(p_org UUID,p_actor UUID,p_id UUID) RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE r farm_resources; a TEXT;
BEGIN
 SELECT * INTO r FROM farm_resources WHERE id=p_id AND organization_id=p_org;
 IF NOT FOUND THEN RETURN FALSE; END IF;
 a:=farm_access(p_org,p_actor,r.farm_id);
 IF a IS NULL THEN RETURN FALSE; END IF;
 IF r.kind='evidence' THEN
   RETURN farm_resource_visible(p_org,p_actor,(r.data->>'parentId')::UUID);
 END IF;
 IF a IN('admin','manager','viewer') THEN RETURN TRUE; END IF;
 IF r.kind='worker' THEN RETURN r.data->>'linkedUserId'=p_actor::TEXT; END IF;
 IF r.kind='expense' THEN RETURN r.created_by=p_actor; END IF;
 IF r.kind='task' THEN RETURN EXISTS(SELECT 1 FROM farm_resources w
   WHERE w.organization_id=p_org AND w.farm_id=r.farm_id AND w.kind='worker' AND w.state='ACTIVE'
   AND w.data->>'linkedUserId'=p_actor::TEXT AND (r.data->'workerIds') ? w.id::TEXT);
 END IF;
 RETURN TRUE;
END $$;

CREATE FUNCTION execute_farm_command(p_organization UUID,p_actor UUID,p_operation UUID,p_command JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
 v_id UUID:=(p_command->>'id')::UUID; v_farm UUID:=(p_command->>'farmId')::UUID;
 k TEXT:=p_command->>'kind'; s TEXT:=p_command->>'state'; d JSONB:=p_command->'data';
 expected INTEGER:=(p_command->>'version')::INTEGER; a TEXT;
 old farm_resources; current_farm farm_resources; related farm_resources; original farm_resources;
 prior farm_operations; ref TEXT; wanted TEXT; ref_id UUID; assignment UUID;
 result JSONB; before_value JSONB; delta NUMERIC:=0; item inventory_items;
 effect_before JSONB; effect_after JSONB; original_effect farm_resource_history;
 next_task UUID; next_date DATE; next_data JSONB; journal UUID; media BYTEA; membership organization_memberships; changes TEXT[];
BEGIN
 IF NOT farm_active_member(p_organization,p_actor) THEN RAISE EXCEPTION 'FARM_ACCESS_DENIED'; END IF;
 IF p_operation IS NULL OR v_id IS NULL OR v_farm IS NULL OR d IS NULL OR jsonb_typeof(d)<>'object'
 OR expected IS NULL OR expected<0 OR k NOT IN('farm','unit','cycle','livestock','worker','task','input','yield','expense','livestock_event','evidence')
 THEN RAISE EXCEPTION 'FARM_VALIDATION_FAILED'; END IF;
 -- Scope locks serialize authorization/aggregate changes and command replay.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_organization::TEXT,17));
 SELECT * INTO membership FROM organization_memberships WHERE organization_id=p_organization AND user_id=p_actor FOR SHARE;
 a:=farm_access(p_organization,p_actor,v_farm);
 IF k='farm' AND expected=0 AND a IS NULL AND (membership.role='farm_manager' OR 'farm.manage'=ANY(membership.permissions))
  AND d->>'managerId'=p_actor::TEXT THEN a:='manager'; END IF;
 SELECT * INTO current_farm FROM farm_resources WHERE organization_id=p_organization AND id=v_farm AND kind='farm' FOR UPDATE;
 IF k='farm' AND v_id<>v_farm THEN RAISE EXCEPTION 'FARM_RELATION_INVALID'; END IF;
 IF k<>'farm' AND current_farm.id IS NULL THEN RAISE EXCEPTION 'FARM_NOT_FOUND'; END IF;
 IF a IS NULL OR a='viewer' THEN RAISE EXCEPTION 'FARM_ACCESS_DENIED'; END IF;
 IF k IN('farm','unit','cycle','worker','livestock') AND a NOT IN('admin','manager') THEN RAISE EXCEPTION 'FARM_ACCESS_DENIED'; END IF;
 IF k='task' AND a='worker' AND (expected=0 OR NOT farm_resource_visible(p_organization,p_actor,v_id)) THEN RAISE EXCEPTION 'FARM_ACCESS_DENIED'; END IF;
 SELECT * INTO prior FROM farm_operations WHERE organization_id=p_organization AND operation_id=p_operation;
 IF FOUND THEN
   IF prior.actor_id<>p_actor OR prior.command<>(p_command-'data'||jsonb_build_object('data',(p_command->'data')-'content')) THEN RAISE EXCEPTION 'FARM_IDEMPOTENCY_CONFLICT'; END IF;
   IF k='evidence' AND NOT EXISTS(SELECT 1 FROM farm_evidence_content WHERE resource_id=v_id AND content=decode(d->>'content','base64')) THEN RAISE EXCEPTION 'FARM_IDEMPOTENCY_CONFLICT'; END IF;
   IF NOT farm_resource_visible(p_organization,p_actor,v_id) THEN RAISE EXCEPTION 'FARM_ACCESS_DENIED'; END IF;
   RETURN prior.result;
 END IF;
 IF current_farm.state='ARCHIVED' THEN RAISE EXCEPTION 'FARM_ARCHIVED'; END IF;
 SELECT * INTO old FROM farm_resources WHERE id=v_id FOR UPDATE;
 IF old.id IS NOT NULL AND (old.organization_id<>p_organization OR old.farm_id<>v_farm OR old.kind<>k) THEN RAISE EXCEPTION 'FARM_NOT_FOUND'; END IF;
 IF COALESCE(old.version,0)<>expected THEN RAISE EXCEPTION 'FARM_VERSION_CONFLICT'; END IF;
 IF k IN('input','yield','expense','livestock_event','evidence') AND expected<>0 THEN RAISE EXCEPTION 'FARM_EVENT_IMMUTABLE'; END IF;
 IF expected=0 THEN
   IF s<>(CASE k WHEN 'farm' THEN 'DRAFT' WHEN 'unit' THEN 'AVAILABLE' WHEN 'cycle' THEN 'PLANNED'
    WHEN 'task' THEN 'PLANNED' WHEN 'worker' THEN 'ACTIVE' WHEN 'livestock' THEN 'ACTIVE' ELSE 'RECORDED' END)
   THEN RAISE EXCEPTION 'FARM_STATE_CONFLICT'; END IF;
 ELSE
   IF old.state IN('ARCHIVED','COMPLETED','CANCELLED','CLOSED') THEN RAISE EXCEPTION 'FARM_STATE_CONFLICT'; END IF;
   IF old.state<>s AND NOT (
    (k='farm' AND old.state||':'||s IN('DRAFT:ACTIVE','DRAFT:ARCHIVED','ACTIVE:INACTIVE','INACTIVE:ACTIVE','INACTIVE:ARCHIVED')) OR
    (k='unit' AND old.state||':'||s IN('AVAILABLE:ACTIVE','AVAILABLE:INACTIVE','AVAILABLE:ARCHIVED','ACTIVE:RESTING','ACTIVE:INACTIVE','RESTING:ACTIVE','RESTING:INACTIVE','RESTING:ARCHIVED','INACTIVE:AVAILABLE','INACTIVE:ARCHIVED')) OR
    (k='cycle' AND old.state||':'||s IN('PLANNED:ACTIVE','ACTIVE:COMPLETED','PLANNED:CANCELLED','ACTIVE:CANCELLED')) OR
    (k='task' AND old.state||':'||s IN('PLANNED:IN_PROGRESS','IN_PROGRESS:COMPLETED','PLANNED:CANCELLED','IN_PROGRESS:CANCELLED')) OR
    (k='worker' AND old.state||':'||s IN('ACTIVE:INACTIVE','INACTIVE:ACTIVE')))
    THEN RAISE EXCEPTION 'FARM_STATE_CONFLICT'; END IF;
 END IF;
 IF a='worker' AND k='task' AND (old.data - ARRAY['notes','startedOn','completedOn'])<>(d - ARRAY['notes','startedOn','completedOn'])
 THEN RAISE EXCEPTION 'FARM_ACCESS_DENIED'; END IF;
 IF k='livestock' AND old.id IS NOT NULL AND (old.data->>'unitId' IS DISTINCT FROM d->>'unitId' OR old.data->>'model' IS DISTINCT FROM d->>'model')
 THEN RAISE EXCEPTION 'FARM_EVENT_REQUIRED'; END IF;
 IF k IN('farm','unit') AND s='ARCHIVED' AND EXISTS(SELECT 1 FROM farm_resources r
  WHERE r.organization_id=p_organization AND r.id<>v_id AND r.state IN('ACTIVE','IN_PROGRESS','PLANNED')
   AND ((k='farm' AND r.farm_id=v_id) OR (k='unit' AND r.data->>'unitId'=v_id::TEXT)))
 THEN RAISE EXCEPTION 'FARM_STATE_CONFLICT'; END IF;
 IF k IN('input','yield') AND (d->>'quantity')::NUMERIC<=0 THEN RAISE EXCEPTION 'FARM_QUANTITY_INVALID'; END IF;
 IF k='expense' AND ((d->>'amountMinor')::BIGINT<=0 OR d->>'currency' NOT IN('NGN','USD','EUR','GBP')) THEN RAISE EXCEPTION 'FARM_VALIDATION_FAILED'; END IF;

 -- Foreign references retain resource kinds as well as farm/tenant scope.
 FOREACH ref IN ARRAY ARRAY['unitId','cycleId','livestockId','taskId','workerId','destinationUnitId','parentId'] LOOP
  IF d ? ref THEN
   ref_id:=(d->>ref)::UUID;
   SELECT * INTO related FROM farm_resources WHERE id=ref_id AND organization_id=p_organization AND farm_id=v_farm;
   wanted:=CASE ref WHEN 'unitId' THEN 'unit' WHEN 'destinationUnitId' THEN 'unit' WHEN 'cycleId' THEN 'cycle'
    WHEN 'livestockId' THEN 'livestock' WHEN 'taskId' THEN 'task' WHEN 'workerId' THEN 'worker' ELSE NULL END;
   IF related.id IS NULL OR (wanted IS NOT NULL AND related.kind<>wanted) OR (related.state IN('ARCHIVED','INACTIVE','CANCELLED','CLOSED') AND NOT (k='livestock_event' AND d ? 'reversesId' AND ref='livestockId' AND related.state='CLOSED'))
    OR (ref='parentId' AND related.kind='evidence') THEN RAISE EXCEPTION 'FARM_RELATION_INVALID'; END IF;
   IF NOT farm_resource_visible(p_organization,p_actor,ref_id) THEN RAISE EXCEPTION 'FARM_ACCESS_DENIED'; END IF;
   IF ref IN('cycleId','livestockId') AND d ? 'unitId' AND d->>'unitId'<>related.data->>'unitId' THEN RAISE EXCEPTION 'FARM_RELATION_INVALID'; END IF;
  END IF;
 END LOOP;
 IF k IN('cycle','livestock') AND NOT d ? 'unitId' THEN RAISE EXCEPTION 'FARM_RELATION_INVALID'; END IF;
 FOR assignment IN SELECT jsonb_array_elements_text(COALESCE(d->'workerIds','[]'::JSONB))::UUID LOOP
  IF NOT EXISTS(SELECT 1 FROM farm_resources w WHERE w.id=assignment AND w.organization_id=p_organization AND w.farm_id=v_farm
   AND w.kind='worker' AND w.state='ACTIVE' AND (w.data->>'startOn')::DATE<=CURRENT_DATE
   AND (NOT w.data ? 'endOn' OR (w.data->>'endOn')::DATE>=CURRENT_DATE))
  THEN RAISE EXCEPTION 'FARM_ASSIGNMENT_INVALID'; END IF;
 END LOOP;
 IF k='worker' AND d ? 'linkedUserId' AND NOT farm_active_member(p_organization,(d->>'linkedUserId')::UUID)
 THEN RAISE EXCEPTION 'FARM_ASSIGNMENT_INVALID'; END IF;
 IF k='farm' AND d ? 'managerId' AND NOT farm_active_member(p_organization,(d->>'managerId')::UUID)
 THEN RAISE EXCEPTION 'FARM_ASSIGNMENT_INVALID'; END IF;
 IF s='COMPLETED' AND COALESCE(d->>'startedOn',d->>'actualStart',CURRENT_DATE::TEXT)>CURRENT_DATE::TEXT THEN RAISE EXCEPTION 'FARM_VALIDATION_FAILED'; END IF;
 IF k='task' AND s='COMPLETED' THEN d:=jsonb_set(d,'{completedOn}',to_jsonb(CURRENT_DATE::TEXT)); END IF;
 IF k='cycle' AND s='COMPLETED' THEN d:=jsonb_set(d,'{actualCompletion}',to_jsonb(CURRENT_DATE::TEXT)); END IF;

 IF d ? 'reversesId' THEN
  SELECT * INTO original FROM farm_resources WHERE id=(d->>'reversesId')::UUID AND organization_id=p_organization AND farm_id=v_farm AND kind=k FOR UPDATE;
  IF original.id IS NULL OR NOT farm_resource_visible(p_organization,p_actor,original.id) OR original.data ? 'reversesId' OR EXISTS(SELECT 1 FROM farm_resources WHERE organization_id=p_organization AND data->>'reversesId'=original.id::TEXT)
  THEN RAISE EXCEPTION 'FARM_REVERSAL_INVALID'; END IF;
  IF (d - ARRAY['reversesId','notes','occurredOn'])<>(original.data - ARRAY['notes','occurredOn']) THEN RAISE EXCEPTION 'FARM_REVERSAL_INVALID'; END IF;
 END IF;
 IF k='livestock_event' THEN
  SELECT * INTO related FROM farm_resources WHERE id=(d->>'livestockId')::UUID AND organization_id=p_organization AND farm_id=v_farm AND kind='livestock' FOR UPDATE;
  IF related.id IS NULL OR (related.state<>'ACTIVE' AND NOT (original.id IS NOT NULL AND d->>'eventType'='closure')) THEN RAISE EXCEPTION 'FARM_RELATION_INVALID'; END IF;
  effect_before:=to_jsonb(related);
  IF original.id IS NOT NULL AND d->>'eventType' IN('movement','closure') THEN
   SELECT h.* INTO original_effect FROM farm_resource_history h JOIN farm_operations o
    ON o.organization_id=h.organization_id AND o.operation_id=h.operation_id
    WHERE h.organization_id=p_organization AND h.resource_id=related.id AND h.action='livestock.event_applied' AND o.command->>'id'=original.id::TEXT;
   IF original_effect.id IS NULL OR (original_effect.after_value->>'version')::INTEGER<>related.version THEN RAISE EXCEPTION 'FARM_REVERSAL_INVALID'; END IF;
  END IF;
  IF (d->>'quantity')::NUMERIC<>trunc((d->>'quantity')::NUMERIC) THEN RAISE EXCEPTION 'FARM_QUANTITY_INVALID'; END IF;
  delta:=CASE WHEN d->>'eventType' IN('acquisition','birth','hatching','transfer_in') THEN (d->>'quantity')::NUMERIC
   WHEN d->>'eventType' IN('mortality','sale','transfer_out') THEN -(d->>'quantity')::NUMERIC ELSE 0 END;
  IF d ? 'reversesId' THEN delta:=-delta; END IF;
  IF delta=0 AND (d->>'quantity')::NUMERIC<>0 OR related.quantity+delta<0
    OR related.data->>'model'='individual' AND related.quantity+delta>1 THEN RAISE EXCEPTION 'FARM_QUANTITY_INVALID'; END IF;
  IF d->>'eventType'='closure' AND related.quantity<>0 THEN RAISE EXCEPTION 'FARM_QUANTITY_INVALID'; END IF;
  IF d ? 'legacyRecordId' AND NOT EXISTS(SELECT 1 FROM farm_records WHERE id=(d->>'legacyRecordId')::UUID AND organization_id=p_organization AND farmer_id=p_actor)
   THEN RAISE EXCEPTION 'FARM_RELATION_INVALID'; END IF;
  UPDATE farm_resources SET quantity=quantity+delta,version=version+1,updated_at=now(),
   starting_quantity=CASE WHEN delta>0 AND NOT EXISTS(SELECT 1 FROM farm_resources e WHERE e.organization_id=p_organization AND e.kind='livestock_event' AND e.data->>'livestockId'=related.id::TEXT AND (e.data->>'quantity')::NUMERIC>0) THEN delta ELSE starting_quantity END,
   state=CASE WHEN d->>'eventType'='closure' THEN CASE WHEN original.id IS NOT NULL THEN original_effect.before_value->>'state' ELSE 'CLOSED' END ELSE state END,
   data=CASE WHEN d->>'eventType'='movement' THEN jsonb_set(data,'{unitId}',CASE WHEN original.id IS NOT NULL THEN original_effect.before_value->'data'->'unitId' ELSE d->'destinationUnitId' END) ELSE data END
   WHERE id=related.id;
  SELECT to_jsonb(r) INTO effect_after FROM farm_resources r WHERE id=related.id;
 END IF;
 IF k IN('input','yield') AND d ? 'inventoryItemId' THEN
  SELECT * INTO item FROM inventory_items WHERE id=(d->>'inventoryItemId')::UUID AND organization_id=p_organization FOR UPDATE;
  IF item.id IS NULL OR item.unit<>d->>'unit' OR d->>'quantity' !~ '^[1-9][0-9]*$' THEN RAISE EXCEPTION 'FARM_INVENTORY_INVALID'; END IF;
  delta:=(d->>'quantity')::BIGINT * CASE WHEN k='input' THEN -1 ELSE 1 END * CASE WHEN d ? 'reversesId' THEN -1 ELSE 1 END;
  IF item.quantity_minor+delta<0 THEN RAISE EXCEPTION 'FARM_QUANTITY_INVALID'; END IF;
  PERFORM apply_inventory_movement(p_organization,item.id,delta::BIGINT,'farm.'||k,'farm:'||p_operation::TEXT);
 END IF;
 IF k='expense' AND (d ? 'debitAccountId' OR original.journal_entry_id IS NOT NULL) THEN
  IF membership.role NOT IN('owner','admin','finance_manager') AND NOT 'financial.accounting.post'=ANY(membership.permissions)
   THEN RAISE EXCEPTION 'FARM_FINANCE_PERMISSION_REQUIRED'; END IF;
  IF original.journal_entry_id IS NOT NULL THEN
   journal:=reverse_financial_journal(original.journal_entry_id,'farm:'||p_operation::TEXT,p_operation,p_actor,'Farm expense reversal');
  ELSE
   IF NOT EXISTS(SELECT 1 FROM financial_accounts WHERE id=(d->>'debitAccountId')::UUID AND organization_id=p_organization AND currency=d->>'currency' AND account_class='expense')
   OR NOT EXISTS(SELECT 1 FROM financial_accounts WHERE id=(d->>'creditAccountId')::UUID AND organization_id=p_organization AND currency=d->>'currency' AND account_class IN('asset','liability') AND owner_type='organization')
   THEN RAISE EXCEPTION 'FARM_RELATION_INVALID'; END IF;
   journal:=post_financial_journal(p_organization,d->>'currency',(d->>'occurredOn')::DATE,'farm.expense',v_id::TEXT,
    'farm:'||p_operation::TEXT,encode(digest(p_command::TEXT,'sha256'),'hex'),p_operation,d->>'description',p_actor,
    jsonb_build_array(jsonb_build_object('account_id',d->>'debitAccountId','line_number',1,'side','debit','amount_minor',d->>'amountMinor'),
     jsonb_build_object('account_id',d->>'creditAccountId','line_number',2,'side','credit','amount_minor',d->>'amountMinor')));
  END IF;
 END IF;
 IF k='evidence' THEN
  media:=decode(d->>'content','base64');
  IF octet_length(media) NOT BETWEEN 1 AND 5242880 THEN RAISE EXCEPTION 'FARM_VALIDATION_FAILED'; END IF;
  d:=(d-'content')||jsonb_build_object('storageReference',v_id::TEXT,'sizeBytes',octet_length(media));
 END IF;
 before_value:=CASE WHEN old.id IS NULL THEN NULL ELSE to_jsonb(old) END;
 INSERT INTO farm_resources(id,organization_id,farm_id,kind,state,version,data,journal_entry_id,created_by)
  VALUES(v_id,p_organization,v_farm,k,s,expected+1,d,journal,p_actor)
 ON CONFLICT(id) DO UPDATE SET state=excluded.state,version=excluded.version,data=excluded.data,updated_at=now(),
 completed_at=CASE WHEN excluded.state='COMPLETED' THEN now() ELSE farm_resources.completed_at END;
 IF media IS NOT NULL THEN INSERT INTO farm_evidence_content VALUES(v_id,p_organization,media); END IF;
 SELECT to_jsonb(r) INTO result FROM farm_resources r WHERE r.id=v_id;
 INSERT INTO farm_operations VALUES(p_organization,p_operation,p_actor,p_command - 'data'||jsonb_build_object('data',(p_command->'data')-'content'),result,now());
 IF effect_after IS NOT NULL THEN
  INSERT INTO farm_resource_history(organization_id,farm_id,resource_id,actor_id,operation_id,action,before_value,after_value)
  VALUES(p_organization,v_farm,(effect_after->>'id')::UUID,p_actor,p_operation,'livestock.event_applied',effect_before,effect_after);
 END IF;
 -- Media content is intentionally excluded from audit/command copies. Replay
 -- compares metadata plus the immutable stored bytes below.
 INSERT INTO farm_resource_history(organization_id,farm_id,resource_id,actor_id,operation_id,action,before_value,after_value)
 VALUES(p_organization,v_farm,v_id,p_actor,p_operation,k||CASE WHEN expected=0 THEN '.created' ELSE '.updated' END,before_value,result);
 INSERT INTO organization_audit_log(organization_id,actor_id,action,resource_type,resource_id,before_value,after_value)
 VALUES(p_organization,p_actor,'farm.'||k||'.command','farm_resource',v_id::TEXT,
 jsonb_build_object('version',expected),jsonb_build_object('version',expected+1,'state',s,'operationId',p_operation));
 IF k='task' AND s='COMPLETED' AND COALESCE(d->>'recurrence','none')<>'none' THEN
  next_task:=gen_random_uuid();
  next_date:=((d->>'dueOn')::DATE + CASE d->>'recurrence' WHEN 'daily' THEN INTERVAL '1 day' WHEN 'weekly' THEN INTERVAL '7 days' ELSE INTERVAL '1 month' END)::DATE;
  next_data:=(d-ARRAY['startedOn','completedOn'])||jsonb_build_object('scheduledOn',
   (next_date-((d->>'dueOn')::DATE-(d->>'scheduledOn')::DATE))::TEXT,'dueOn',next_date::TEXT);
  INSERT INTO farm_resources(id,organization_id,farm_id,kind,state,version,data,created_by)
   VALUES(next_task,p_organization,v_farm,'task','PLANNED',1,next_data,p_actor);
  INSERT INTO farm_resource_history(organization_id,farm_id,resource_id,actor_id,operation_id,action,after_value)
   VALUES(p_organization,v_farm,next_task,p_actor,p_operation,'task.recurrence_created',jsonb_build_object('previousTaskId',v_id,'data',next_data));
 END IF;
 IF k='task' AND (old.id IS NULL OR old.state<>s OR old.data->'workerIds' IS DISTINCT FROM d->'workerIds') THEN
  INSERT INTO notifications(user_id,title,message,type)
  SELECT DISTINCT (w.data->>'linkedUserId')::UUID,'Farm task updated','A farm task assigned to you has changed. Open Farm Operations.','farm_task'
  FROM farm_resources w WHERE w.organization_id=p_organization AND w.farm_id=v_farm AND w.kind='worker'
   AND w.data ? 'linkedUserId' AND (d->'workerIds') ? w.id::TEXT;
 END IF;
 RETURN result;
END $$;

CREATE FUNCTION read_farm_operations(p_organization UUID,p_actor UUID,p_query JSONB)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE rows JSONB; n INTEGER:=LEAST(COALESCE((p_query->>'limit')::INTEGER,50),100);
 off INTEGER:=GREATEST(COALESCE((p_query->>'offset')::INTEGER,0),0); f UUID:=(p_query->>'farmId')::UUID;
 resource farm_resources;
BEGIN
 IF NOT farm_active_member(p_organization,p_actor) THEN RAISE EXCEPTION 'FARM_ACCESS_DENIED'; END IF;
 IF p_query->>'view'='evidence' THEN
  SELECT * INTO resource FROM farm_resources WHERE id=(p_query->>'id')::UUID AND organization_id=p_organization AND kind='evidence';
  IF resource.id IS NULL OR NOT farm_resource_visible(p_organization,p_actor,resource.id) THEN RAISE EXCEPTION 'FARM_NOT_FOUND'; END IF;
  RETURN jsonb_build_object('metadata',to_jsonb(resource),'content',(SELECT encode(content,'base64') FROM farm_evidence_content WHERE resource_id=resource.id));
 END IF;
 IF p_query->>'view'='history' THEN
  SELECT COALESCE(jsonb_agg(t ORDER BY t.id),'[]') INTO rows FROM (
   SELECT h.id,h.organization_id,h.farm_id,h.resource_id,h.actor_id,h.operation_id,h.action,h.occurred_at,
    CASE WHEN h.before_value->>'kind'='worker' AND farm_access(p_organization,p_actor,h.farm_id) NOT IN('admin','manager')
     THEN h.before_value #- '{data,contact}' ELSE h.before_value END AS before_value,
    CASE WHEN h.after_value->>'kind'='worker' AND farm_access(p_organization,p_actor,h.farm_id) NOT IN('admin','manager')
     THEN h.after_value #- '{data,contact}' ELSE h.after_value END AS after_value
   FROM farm_resource_history h WHERE h.organization_id=p_organization AND (f IS NULL OR h.farm_id=f)
    AND farm_resource_visible(p_organization,p_actor,h.resource_id)
    AND (NOT p_query ? 'id' OR h.resource_id=(p_query->>'id')::UUID)
   ORDER BY h.id DESC LIMIT n OFFSET off
  )t;
 ELSE
  SELECT COALESCE(jsonb_agg(t ORDER BY t.created_at DESC,t.id),'[]') INTO rows FROM (
   SELECT r.id,r.organization_id,r.farm_id,r.kind,r.state,r.version,r.starting_quantity,r.quantity,r.journal_entry_id,r.created_by,r.created_at,r.updated_at,r.completed_at,
    (SELECT j.status FROM journal_entries j WHERE j.id=r.journal_entry_id AND j.organization_id=p_organization) AS accounting_status,
    (SELECT e.id FROM farm_resources e WHERE e.organization_id=p_organization AND e.data->>'reversesId'=r.id::TEXT) AS reversed_by,
    CASE WHEN r.kind='worker' AND farm_access(p_organization,p_actor,r.farm_id) NOT IN('admin','manager') THEN r.data-'contact' ELSE r.data END AS data
   FROM farm_resources r WHERE r.organization_id=p_organization AND (f IS NULL OR r.farm_id=f)
   AND farm_resource_visible(p_organization,p_actor,r.id)
   AND (NOT p_query ? 'id' OR r.id=(p_query->>'id')::UUID)
   AND (NOT p_query ? 'kind' OR r.kind=p_query->>'kind')
   AND (NOT p_query ? 'state' OR r.state=p_query->>'state')
   AND (NOT p_query ? 'search' OR COALESCE(r.data->>'name',r.data->>'item',r.data->>'product',r.data->>'description','') ILIKE '%'||(p_query->>'search')||'%')
   AND (NOT p_query ? 'view' OR
    p_query->>'view'='completed' AND r.state='COMPLETED' OR
    p_query->>'view'='overdue' AND r.kind='task' AND r.state IN('PLANNED','IN_PROGRESS') AND (r.data->>'dueOn')::DATE<CURRENT_DATE OR
    p_query->>'view'='upcoming' AND r.kind='task' AND r.state IN('PLANNED','IN_PROGRESS') AND (r.data->>'dueOn')::DATE>=CURRENT_DATE)
   ORDER BY r.created_at DESC,r.id LIMIT n OFFSET off
  )t;
 END IF;
 RETURN jsonb_build_object('items',rows,'limit',n,'offset',off,'hasMore',jsonb_array_length(rows)=n);
END $$;
CREATE FUNCTION protect_farm_history() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Farm operational evidence is immutable'; END $$;
CREATE TRIGGER farm_history_immutable BEFORE UPDATE OR DELETE ON farm_resource_history FOR EACH ROW EXECUTE FUNCTION protect_farm_history();
CREATE TRIGGER farm_operations_immutable BEFORE UPDATE OR DELETE ON farm_operations FOR EACH ROW EXECUTE FUNCTION protect_farm_history();
CREATE TRIGGER farm_content_immutable BEFORE UPDATE OR DELETE ON farm_evidence_content FOR EACH ROW EXECUTE FUNCTION protect_farm_history();
ALTER TABLE farm_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_resource_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_evidence_content ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON farm_resources,farm_operations,farm_resource_history,farm_evidence_content FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION farm_active_member(UUID,UUID),farm_access(UUID,UUID,UUID),farm_resource_visible(UUID,UUID,UUID),
 execute_farm_command(UUID,UUID,UUID,JSONB),read_farm_operations(UUID,UUID,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION execute_farm_command(UUID,UUID,UUID,JSONB),read_farm_operations(UUID,UUID,JSONB) TO service_role;
COMMIT;
