BEGIN;
-- Preserve all existing tenant, role and parent-resource boundaries.
-- Effective dates must apply to task-specific access as well as farm access.
CREATE OR REPLACE FUNCTION farm_resource_visible(p_org UUID,p_actor UUID,p_id UUID) RETURNS BOOLEAN
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
   AND w.data->>'linkedUserId'=p_actor::TEXT AND (r.data->'workerIds') ? w.id::TEXT
   AND (w.data->>'startOn')::DATE<=CURRENT_DATE
   AND (NOT w.data ? 'endOn' OR (w.data->>'endOn')::DATE>=CURRENT_DATE));
 END IF;
 RETURN TRUE;
END $$;

CREATE OR REPLACE FUNCTION emit_farm_task_reminders() RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r RECORD; n INTEGER:=0; inserted INTEGER;
BEGIN
 FOR r IN SELECT t.id task_id,w.id worker_id,(w.data->>'linkedUserId')::UUID user_id,(t.data->>'dueOn')::DATE due_on
 FROM farm_resources t JOIN farm_resources w ON w.organization_id=t.organization_id AND w.farm_id=t.farm_id
  AND w.kind='worker' AND w.state='ACTIVE' AND (t.data->'workerIds') ? w.id::TEXT
 WHERE t.kind='task' AND t.state IN('PLANNED','IN_PROGRESS') AND (t.data->>'dueOn')::DATE<=CURRENT_DATE+1
 AND w.data ? 'linkedUserId' AND farm_active_member(t.organization_id,(w.data->>'linkedUserId')::UUID)
 -- Check the recipient assignment itself, even if another role grants farm-wide visibility.
 AND (w.data->>'startOn')::DATE<=CURRENT_DATE
 AND (NOT w.data ? 'endOn' OR (w.data->>'endOn')::DATE>=CURRENT_DATE)
 AND farm_resource_visible(t.organization_id,(w.data->>'linkedUserId')::UUID,t.id)
 LOOP
  INSERT INTO farm_task_reminders(task_id,worker_id,due_on) VALUES(r.task_id,r.worker_id,r.due_on) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted=ROW_COUNT;
  IF inserted=1 THEN
   INSERT INTO notifications(user_id,title,message,type) VALUES(r.user_id,'Farm task reminder','Assigned work is due or overdue. Open Farm Operations.','farm_task');
   n:=n+1;
  END IF;
 END LOOP;
 RETURN n;
END $$;
COMMIT;
