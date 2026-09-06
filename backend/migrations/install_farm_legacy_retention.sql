BEGIN;
-- Preserve the existing livestock slice as historical source records.
ALTER TABLE farm_records ADD COLUMN archived_at TIMESTAMPTZ;
CREATE FUNCTION archive_legacy_farm_record(p_organization UUID,p_actor UUID,p_record UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r farm_records;
BEGIN
 IF NOT farm_active_member(p_organization,p_actor) THEN RAISE EXCEPTION 'FARM_ACCESS_DENIED'; END IF;
 SELECT * INTO r FROM farm_records WHERE organization_id=p_organization AND farmer_id=p_actor AND id=p_record FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'FARM_NOT_FOUND'; END IF;
 IF r.archived_at IS NOT NULL THEN RETURN; END IF;
 UPDATE farm_records SET archived_at=now() WHERE id=r.id;
 INSERT INTO organization_audit_log(organization_id,actor_id,action,resource_type,resource_id,after_value)
 VALUES(p_organization,p_actor,'farm.legacy_record.archived','farm_records',r.id::TEXT,jsonb_build_object('archived',true));
END $$;
CREATE FUNCTION protect_legacy_farm_deletion() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Farm records must be archived'; END $$;
CREATE TRIGGER legacy_farm_no_delete BEFORE DELETE ON farm_records FOR EACH ROW EXECUTE FUNCTION protect_legacy_farm_deletion();
REVOKE ALL ON FUNCTION archive_legacy_farm_record(UUID,UUID,UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION archive_legacy_farm_record(UUID,UUID,UUID) TO service_role;
-- Once used as event provenance, aggregate snapshots cannot be rewritten.
CREATE FUNCTION protect_linked_legacy_farm_record() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $farm$
BEGIN
 IF OLD.archived_at IS NOT NULL THEN RAISE EXCEPTION 'FARM_ARCHIVED'; END IF;
 IF (to_jsonb(OLD)-ARRAY['archived_at','updated_at'])<>(to_jsonb(NEW)-ARRAY['archived_at','updated_at'])
  AND EXISTS(SELECT 1 FROM farm_resources r WHERE r.organization_id=OLD.organization_id AND r.data->>'legacyRecordId'=OLD.id::TEXT)
 THEN RAISE EXCEPTION 'FARM_EVENT_IMMUTABLE'; END IF;
 RETURN NEW;
END $farm$;
CREATE TRIGGER legacy_farm_linked_history BEFORE UPDATE ON farm_records FOR EACH ROW EXECUTE FUNCTION protect_linked_legacy_farm_record();
COMMIT;
