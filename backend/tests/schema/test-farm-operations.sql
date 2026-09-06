-- Real disposable-database WP-P6-001 invariants. No hosted database is used.
BEGIN;
INSERT INTO users(id,email,password,name,role) VALUES
 ('60000000-0000-4000-8000-000000000001','farm-owner@example.test','synthetic-unused-password','Farm owner','farmer'),
 ('60000000-0000-4000-8000-000000000002','farm-worker@example.test','synthetic-unused-password','Farm worker','farmer'),
 ('60000000-0000-4000-8000-000000000003','farm-outsider@example.test','synthetic-unused-password','Farm outsider','farmer');
INSERT INTO organization_memberships(organization_id,user_id,role,status) VALUES
 ('60000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002','member','active');
CREATE FUNCTION pg_temp.command(k TEXT, resource TEXT, farm TEXT, data JSONB, version INTEGER DEFAULT 0, state TEXT DEFAULT NULL, actor TEXT DEFAULT '60000000-0000-4000-8000-000000000001', op UUID DEFAULT gen_random_uuid())
RETURNS JSONB LANGUAGE SQL AS $$
 SELECT execute_farm_command('60000000-0000-4000-8000-000000000001',actor::UUID,op,jsonb_build_object(
 'id',resource,'farmId',farm,'kind',k,'version',version,'state',COALESCE(state,CASE k WHEN 'farm' THEN 'DRAFT' WHEN 'unit' THEN 'AVAILABLE' WHEN 'task' THEN 'PLANNED' WHEN 'cycle' THEN 'PLANNED' WHEN 'worker' THEN 'ACTIVE' WHEN 'livestock' THEN 'ACTIVE' ELSE 'RECORDED' END),'data',data));
$$;
CREATE FUNCTION pg_temp.assert_failure(statement TEXT,expected TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
 BEGIN EXECUTE statement;
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM=expected THEN RETURN; END IF;
  RAISE EXCEPTION 'Expected %, received %',expected,SQLERRM;
 END;
 RAISE EXCEPTION 'Expected failure % but command succeeded',expected;
END $$;
DO $$
DECLARE
 f TEXT:='60000000-0000-4000-8000-000000000010'; u TEXT:='60000000-0000-4000-8000-000000000011';
 w TEXT:='60000000-0000-4000-8000-000000000012'; t TEXT:='60000000-0000-4000-8000-000000000013';
 l TEXT:='60000000-0000-4000-8000-000000000014'; e TEXT:='60000000-0000-4000-8000-000000000015';
 inv UUID:='60000000-0000-4000-8000-000000000016'; input_id TEXT:='60000000-0000-4000-8000-000000000017';
 a TEXT:='60000000-0000-4000-8000-000000000001'; worker TEXT:='60000000-0000-4000-8000-000000000002';
 foreign_actor TEXT:='60000000-0000-4000-8000-000000000003';
 op UUID:=gen_random_uuid(); d JSONB; out JSONB; replay JSONB;
BEGIN
 PERFORM pg_temp.command('farm',f,f,'{"name":"Farm A","operationType":"mixed","tenure":"owned"}');
 PERFORM pg_temp.command('unit',u,f,'{"name":"Unit A","identifier":"P1","quantity":"10","unit":"m2","productionType":"livestock"}');
 PERFORM pg_temp.command('worker',w,f,jsonb_build_object('name','Field worker','accessRole','worker','operationalRole','Livestock keeper','linkedUserId',worker,'startOn',CURRENT_DATE::TEXT));
 d:=jsonb_build_object('name','Feed animals','type','feeding','workerIds',jsonb_build_array(w),'scheduledOn',CURRENT_DATE::TEXT,'dueOn',CURRENT_DATE::TEXT,'priority','normal');
 PERFORM pg_temp.command('task',t,f,d);
 PERFORM pg_temp.command('task',t,f,d,1,'IN_PROGRESS',worker);
 out:=pg_temp.command('task',t,f,d,2,'COMPLETED',worker,op);
 replay:=pg_temp.command('task',t,f,d,2,'COMPLETED',worker,op);
 IF out<>replay OR (SELECT count(*) FROM farm_resource_history WHERE resource_id=t::UUID)<>3 THEN RAISE EXCEPTION 'task replay duplicated history'; END IF;
 PERFORM pg_temp.assert_failure(format('SELECT pg_temp.command(%L,%L,%L,%L::jsonb,1,%L,%L)','task',t,f,d,'IN_PROGRESS',worker),'FARM_VERSION_CONFLICT');
 PERFORM pg_temp.assert_failure(format('SELECT pg_temp.command(%L,%L,%L,%L::jsonb,0,NULL,%L)','unit',gen_random_uuid(),f,'{}',worker),'FARM_ACCESS_DENIED');
 PERFORM pg_temp.assert_failure(format('SELECT read_farm_operations(%L,%L,%L::jsonb)',a,foreign_actor,'{}'),'FARM_ACCESS_DENIED');
END $$;
DO $$
DECLARE f TEXT:='60000000-0000-4000-8000-000000000010'; u TEXT:='60000000-0000-4000-8000-000000000011';
 l TEXT:='60000000-0000-4000-8000-000000000014'; a TEXT:='60000000-0000-4000-8000-000000000001';
 inv UUID:='60000000-0000-4000-8000-000000000016'; rid TEXT:=gen_random_uuid()::TEXT; op UUID:=gen_random_uuid(); d JSONB; first JSONB; result JSONB;
BEGIN
 -- Previous DO intentionally catches no exceptions here: failed checks must not roll back fixture setup.
 IF NOT EXISTS(SELECT 1 FROM farm_resources WHERE id=f::UUID) THEN
  RAISE EXCEPTION 'farm setup rolled back';
 END IF;
 PERFORM pg_temp.command('livestock',l,f,jsonb_build_object('name','Goat herd','unitId',u,'model','batch','species','goat','identifier','G1','acquiredOn',CURRENT_DATE::TEXT));
 d:=jsonb_build_object('livestockId',l,'eventType','acquisition','quantity','10','occurredOn',CURRENT_DATE::TEXT);
 PERFORM pg_temp.command('livestock_event',rid,f,d,0,NULL,a,op);
 PERFORM pg_temp.command('livestock_event',rid,f,d,0,NULL,a,op);
 IF (SELECT quantity FROM farm_resources WHERE id=l::UUID)<>10 THEN RAISE EXCEPTION 'acquisition replay changed quantity'; END IF;
 d:=jsonb_build_object('livestockId',l,'eventType','mortality','quantity','11','occurredOn',CURRENT_DATE::TEXT);
 PERFORM pg_temp.assert_failure(format('SELECT pg_temp.command(%L,%L,%L,%L::jsonb)','livestock_event',gen_random_uuid(),f,d),'FARM_QUANTITY_INVALID');
 INSERT INTO inventory_items(id,organization_id,name,unit,quantity_minor) VALUES(inv,a::UUID,'Feed','g',100);
 d:=jsonb_build_object('item','Feed','category','feed','quantity','10','unit','g','inventoryItemId',inv,'occurredOn',CURRENT_DATE::TEXT);
 rid:=gen_random_uuid()::TEXT;op:=gen_random_uuid();
 PERFORM pg_temp.command('input',rid,f,d,0,NULL,a,op);
 PERFORM pg_temp.command('input',rid,f,d,0,NULL,a,op);
 IF (SELECT quantity_minor FROM inventory_items WHERE id=inv)<>90 THEN RAISE EXCEPTION 'input replay consumed stock twice'; END IF;
 PERFORM pg_temp.command('input',gen_random_uuid()::TEXT,f,d||jsonb_build_object('reversesId',rid));
 IF (SELECT quantity_minor FROM inventory_items WHERE id=inv)<>100 THEN RAISE EXCEPTION 'input reversal failed'; END IF;
 PERFORM pg_temp.assert_failure(format('SELECT pg_temp.command(%L,%L,%L,%L::jsonb)','input',gen_random_uuid(),f,d||jsonb_build_object('reversesId',rid)),'FARM_REVERSAL_INVALID');
 d:=jsonb_build_object('parentId',f,'filename','test.pdf','mediaType','application/pdf','content',encode(convert_to('%PDF-1.4 synthetic fixture','UTF8'),'base64'));
 rid:=gen_random_uuid()::TEXT;op:=gen_random_uuid();
 first:=pg_temp.command('evidence',rid,f,d,0,NULL,a,op);
 result:=pg_temp.command('evidence',rid,f,d,0,NULL,a,op);
 IF first<>result OR (SELECT count(*) FROM farm_evidence_content WHERE resource_id=rid::UUID)<>1 THEN RAISE EXCEPTION 'evidence replay failed'; END IF;
 IF EXISTS(SELECT 1 FROM farm_operations WHERE command->'data' ? 'content') THEN RAISE EXCEPTION 'media copied into operation history'; END IF;
 UPDATE organization_memberships SET status='suspended' WHERE organization_id=a::UUID AND user_id='60000000-0000-4000-8000-000000000002';
 PERFORM pg_temp.assert_failure(format('SELECT execute_farm_command(%L,%L,%L,%L::jsonb)',a,'60000000-0000-4000-8000-000000000002',gen_random_uuid(),'{}'),'FARM_ACCESS_DENIED');
 IF has_table_privilege('service_role','farm_resources','INSERT') OR has_table_privilege('authenticated','farm_evidence_content','SELECT') THEN RAISE EXCEPTION 'direct database bypass allowed'; END IF;
END $$;

-- Accounting, cross-farm RBAC, recurrence and event-derived livestock state.
DO $$
DECLARE
 a TEXT:='60000000-0000-4000-8000-000000000001'; worker TEXT:='60000000-0000-4000-8000-000000000002';
 f TEXT:='60000000-0000-4000-8000-000000000010'; u TEXT:='60000000-0000-4000-8000-000000000011';
 w TEXT:='60000000-0000-4000-8000-000000000012'; l TEXT:='60000000-0000-4000-8000-000000000014';
 f2 TEXT:=gen_random_uuid()::TEXT; u2 TEXT:=gen_random_uuid()::TEXT; u3 TEXT:=gen_random_uuid()::TEXT;
 rid TEXT:=gen_random_uuid()::TEXT; task TEXT:=gen_random_uuid()::TEXT; op UUID:=gen_random_uuid();
 debit UUID; credit UUID; result JSONB; replay JSONB; d JSONB; old JSONB; n INTEGER;
BEGIN
 UPDATE organization_memberships SET status='active' WHERE organization_id=a::UUID AND user_id=worker::UUID;
 PERFORM pg_temp.command('farm',f2,f2,'{"name":"Other farm","operationType":"mixed","tenure":"leased"}');
 PERFORM pg_temp.command('unit',u2,f2,'{"name":"Other unit","identifier":"P2","quantity":"1","unit":"m2","productionType":"crop"}');
 d:=jsonb_build_object('name','Bad association','unitId',u2,'product','Maize','plannedStart',CURRENT_DATE::TEXT,'expectedCompletion',(CURRENT_DATE+1)::TEXT);
 PERFORM pg_temp.assert_failure(format('SELECT pg_temp.command(%L,%L,%L,%L::jsonb)','cycle',gen_random_uuid(),f,d),'FARM_RELATION_INVALID');
 IF farm_access(a::UUID,worker::UUID,f2::UUID) IS NOT NULL THEN RAISE EXCEPTION 'worker gained another farm'; END IF;
 IF jsonb_array_length(read_farm_operations(a::UUID,worker::UUID,jsonb_build_object('farmId',f2))->'items')<>0 THEN RAISE EXCEPTION 'cross-farm read leaked'; END IF;
 d:=jsonb_build_object('category','transport','description','Harvest transport','amountMinor',500,'currency','NGN','occurredOn',CURRENT_DATE::TEXT);
 INSERT INTO accounting_periods(organization_id,name,starts_on,ends_on) VALUES(a::UUID,'Farm test period',CURRENT_DATE-1,CURRENT_DATE+1);
 INSERT INTO financial_accounts(organization_id,code,name,account_class,normal_side,currency,owner_type)
 VALUES(a::UUID,'FARM.EXPENSE','Farm expense','expense','debit','NGN','organization') RETURNING id INTO debit;
 INSERT INTO financial_accounts(organization_id,code,name,account_class,normal_side,currency,owner_type)
 VALUES(a::UUID,'FARM.CASH','Farm cash','asset','debit','NGN','organization') RETURNING id INTO credit;
 d:=d||jsonb_build_object('debitAccountId',debit,'creditAccountId',credit);
 PERFORM pg_temp.assert_failure(format('SELECT pg_temp.command(%L,%L,%L,%L::jsonb,0,NULL,%L)','expense',gen_random_uuid(),f,d,worker),'FARM_FINANCE_PERMISSION_REQUIRED');
 result:=pg_temp.command('expense',rid,f,d,0,NULL,a,op);
 replay:=pg_temp.command('expense',rid,f,d,0,NULL,a,op);
 IF result<>replay OR result->>'journal_entry_id' IS NULL THEN RAISE EXCEPTION 'expense journal/replay missing'; END IF;
 IF (SELECT count(*) FROM journal_lines WHERE journal_entry_id=(result->>'journal_entry_id')::UUID)<>2 THEN RAISE EXCEPTION 'expense journal not balanced'; END IF;
 PERFORM pg_temp.command('expense',gen_random_uuid()::TEXT,f,d||jsonb_build_object('reversesId',rid));
 IF (SELECT status FROM journal_entries WHERE id=(result->>'journal_entry_id')::UUID)<>'reversed' THEN RAISE EXCEPTION 'original accounting authority not reversed'; END IF;
 IF (SELECT count(*) FROM journal_entries WHERE reversal_of_entry_id=(result->>'journal_entry_id')::UUID)<>1 THEN RAISE EXCEPTION 'reversal journal missing'; END IF;
 -- Shared movement command rejects a changed replay without touching stock.
 PERFORM pg_temp.assert_failure(format('SELECT apply_inventory_movement(%L,%L,99,%L,%L)',a,'60000000-0000-4000-8000-000000000016','farm.input',
 (SELECT idempotency_key FROM inventory_movements WHERE item_id='60000000-0000-4000-8000-000000000016' AND quantity_minor<0 LIMIT 1)),'INVENTORY_IDEMPOTENCY_CONFLICT');
 -- Yield replay uses exactly one existing inventory movement.
 rid:=gen_random_uuid()::TEXT;op:=gen_random_uuid();
 d:=jsonb_build_object('product','Feed harvest','quantity','5','unit','g','inventoryItemId','60000000-0000-4000-8000-000000000016','occurredOn',CURRENT_DATE::TEXT);
 PERFORM pg_temp.command('yield',rid,f,d,0,NULL,a,op);PERFORM pg_temp.command('yield',rid,f,d,0,NULL,a,op);
 IF (SELECT quantity_minor FROM inventory_items WHERE id='60000000-0000-4000-8000-000000000016')<>105 THEN RAISE EXCEPTION 'yield replay duplicated stock'; END IF;
 d:=jsonb_build_object('name','Recurring work','type','feeding','workerIds',jsonb_build_array(w),'scheduledOn',CURRENT_DATE::TEXT,'dueOn',CURRENT_DATE::TEXT,'priority','high','recurrence','daily');
 PERFORM pg_temp.command('task',task,f,d);
 IF emit_farm_task_reminders()<>1 OR emit_farm_task_reminders()<>0 THEN RAISE EXCEPTION 'reminders not idempotent'; END IF;
 PERFORM pg_temp.command('task',task,f,d,1,'IN_PROGRESS');
 op:=gen_random_uuid();
 PERFORM pg_temp.command('task',task,f,d,2,'COMPLETED',a,op);PERFORM pg_temp.command('task',task,f,d,2,'COMPLETED',a,op);
 IF (SELECT count(*) FROM farm_resources WHERE kind='task' AND data->>'name'='Recurring work')<>2 THEN RAISE EXCEPTION 'recurrence replay duplicated task'; END IF;
 IF (SELECT completed_at FROM farm_resources WHERE id=task::UUID) IS NULL THEN RAISE EXCEPTION 'task completion timestamp missing'; END IF;
 -- Movement and its safe compensating reversal retain animal quantity and audit.
 PERFORM pg_temp.command('unit',u3,f,'{"name":"Second enclosure","identifier":"L2","quantity":"20","unit":"m2","productionType":"livestock"}');
 SELECT data INTO old FROM farm_resources WHERE id=l::UUID;
 PERFORM pg_temp.assert_failure(format('SELECT pg_temp.command(%L,%L,%L,%L::jsonb,2,%L)','livestock',l,f,old||jsonb_build_object('unitId',u3),'ACTIVE'),'FARM_EVENT_REQUIRED');
 rid:=gen_random_uuid()::TEXT;
 d:=jsonb_build_object('livestockId',l,'eventType','movement','quantity','0','destinationUnitId',u3,'occurredOn',CURRENT_DATE::TEXT);
 PERFORM pg_temp.command('livestock_event',rid,f,d);
 IF (SELECT data->>'unitId' FROM farm_resources WHERE id=l::UUID)<>u3 THEN RAISE EXCEPTION 'movement not applied'; END IF;
 PERFORM pg_temp.command('livestock_event',gen_random_uuid()::TEXT,f,d||jsonb_build_object('reversesId',rid));
 IF (SELECT data->>'unitId' FROM farm_resources WHERE id=l::UUID)<>u THEN RAISE EXCEPTION 'movement reversal failed'; END IF;
 IF (SELECT starting_quantity FROM farm_resources WHERE id=l::UUID)<>10 THEN RAISE EXCEPTION 'starting quantity not event-derived'; END IF;
 -- A viewer assignment permits reads but never writes.
 PERFORM pg_temp.command('worker',w,f,(SELECT data||'{"accessRole":"viewer"}' FROM farm_resources WHERE id=w::UUID),1,'ACTIVE');
 IF NOT farm_resource_visible(a::UUID,worker::UUID,f::UUID) THEN RAISE EXCEPTION 'viewer read missing'; END IF;
 PERFORM pg_temp.assert_failure(format('SELECT pg_temp.command(%L,%L,%L,%L::jsonb,0,NULL,%L)','yield',gen_random_uuid(),f,d,worker),'FARM_ACCESS_DENIED');
END $$;


DO $$
DECLARE
 a UUID:='60000000-0000-4000-8000-000000000001';
 manager UUID:='60000000-0000-4000-8000-000000000004';
 f TEXT:=gen_random_uuid()::TEXT; d JSONB;
BEGIN
 INSERT INTO users(id,email,password,name,role) VALUES(manager,'farm-manager@example.test','synthetic-unused-password','Assigned Manager','farmer');
 INSERT INTO organization_memberships(organization_id,user_id,role,status) VALUES(a,manager,'farm_manager','active');
 d:=jsonb_build_object('name','Manager farm','operationType','crop','tenure','owned','managerId',manager);
 PERFORM pg_temp.command('farm',f,f,d,0,NULL,manager::TEXT);
 IF farm_access(a,manager,f::UUID)<>'manager' THEN RAISE EXCEPTION 'authorized manager cannot create own farm'; END IF;
 IF farm_access(a,manager,'60000000-0000-4000-8000-000000000010') IS NOT NULL THEN RAISE EXCEPTION 'manager role granted unrelated farm'; END IF;
END $$;


DO $$
DECLARE f TEXT:=gen_random_uuid()::TEXT; u TEXT:=gen_random_uuid()::TEXT; c TEXT:=gen_random_uuid()::TEXT;
 l TEXT:=gen_random_uuid()::TEXT; e TEXT:=gen_random_uuid()::TEXT; empty_farm TEXT:=gen_random_uuid()::TEXT;
 d JSONB; fd JSONB:='{"name":"Lifecycle farm","operationType":"mixed","tenure":"owned"}';
BEGIN
 PERFORM pg_temp.command('farm',f,f,fd);
 PERFORM pg_temp.command('farm',f,f,fd,1,'ACTIVE');
 PERFORM pg_temp.command('farm',f,f,fd,2,'INACTIVE');
 PERFORM pg_temp.command('farm',f,f,fd,3,'ACTIVE');
 d:='{"name":"Lifecycle unit","identifier":"U1","quantity":"10","unit":"m2","productionType":"crop"}';
 PERFORM pg_temp.command('unit',u,f,d);
 PERFORM pg_temp.command('unit',u,f,d,1,'ACTIVE');
 PERFORM pg_temp.command('unit',u,f,d,2,'RESTING');
 PERFORM pg_temp.command('unit',u,f,d,3,'INACTIVE');
 PERFORM pg_temp.command('unit',u,f,d,4,'AVAILABLE');
 d:=jsonb_build_object('name','Lifecycle cycle','unitId',u,'product','Maize','plannedStart',CURRENT_DATE::TEXT,'expectedCompletion',(CURRENT_DATE+1)::TEXT,'plannedQuantity','1','unit','m2','workerIds','[]'::JSONB);
 PERFORM pg_temp.command('cycle',c,f,d);
 PERFORM pg_temp.command('cycle',c,f,d,1,'ACTIVE');
 PERFORM pg_temp.command('cycle',c,f,d,2,'COMPLETED');
 PERFORM pg_temp.assert_failure(format('SELECT pg_temp.command(%L,%L,%L,%L::jsonb,3,%L)','cycle',c,f,d,'ACTIVE'),'FARM_STATE_CONFLICT');
 d:=jsonb_build_object('name','Empty livestock','unitId',u,'model','individual','species','goat','identifier','AN1','acquiredOn',CURRENT_DATE::TEXT);
 PERFORM pg_temp.command('livestock',l,f,d);
 d:=jsonb_build_object('livestockId',l,'eventType','closure','quantity','0','occurredOn',CURRENT_DATE::TEXT);
 PERFORM pg_temp.command('livestock_event',e,f,d);
 IF (SELECT state FROM farm_resources WHERE id=l::UUID)<>'CLOSED' THEN RAISE EXCEPTION 'closure did not close livestock'; END IF;
 PERFORM pg_temp.command('livestock_event',gen_random_uuid()::TEXT,f,d||jsonb_build_object('reversesId',e));
 IF (SELECT state FROM farm_resources WHERE id=l::UUID)<>'ACTIVE' THEN RAISE EXCEPTION 'closure reversal failed'; END IF;
 PERFORM pg_temp.command('farm',f,f,fd,4,'INACTIVE');
 PERFORM pg_temp.assert_failure(format('SELECT pg_temp.command(%L,%L,%L,%L::jsonb,5,%L)','farm',f,f,fd,'ARCHIVED'),'FARM_STATE_CONFLICT');
 PERFORM pg_temp.command('farm',empty_farm,empty_farm,fd);
 PERFORM pg_temp.command('farm',empty_farm,empty_farm,fd,1,'ARCHIVED');
 PERFORM pg_temp.assert_failure(format('SELECT pg_temp.command(%L,%L,%L,%L::jsonb)','unit',gen_random_uuid(),empty_farm,'{}'),'FARM_ARCHIVED');
END $$;

ROLLBACK;
