BEGIN;
CREATE TABLE farm_task_reminders (
 task_id UUID NOT NULL REFERENCES farm_resources(id),
 worker_id UUID NOT NULL REFERENCES farm_resources(id),
 due_on DATE NOT NULL,
 sent_on DATE NOT NULL DEFAULT CURRENT_DATE,
 PRIMARY KEY(task_id,worker_id,sent_on)
);
ALTER TABLE farm_task_reminders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON farm_task_reminders FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION emit_farm_task_reminders() RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r RECORD; n INTEGER:=0; inserted INTEGER;
BEGIN
 FOR r IN SELECT t.id task_id,w.id worker_id,(w.data->>'linkedUserId')::UUID user_id,(t.data->>'dueOn')::DATE due_on
 FROM farm_resources t JOIN farm_resources w ON w.organization_id=t.organization_id AND w.farm_id=t.farm_id
  AND w.kind='worker' AND w.state='ACTIVE' AND (t.data->'workerIds') ? w.id::TEXT
 WHERE t.kind='task' AND t.state IN('PLANNED','IN_PROGRESS') AND (t.data->>'dueOn')::DATE<=CURRENT_DATE+1
 AND w.data ? 'linkedUserId' AND farm_active_member(t.organization_id,(w.data->>'linkedUserId')::UUID)
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
REVOKE ALL ON FUNCTION emit_farm_task_reminders() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION emit_farm_task_reminders() TO service_role;
COMMIT;
