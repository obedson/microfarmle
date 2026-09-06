BEGIN;
DO $$
DECLARE actor UUID:='62000000-0000-4000-8000-000000000001'; record UUID:='62000000-0000-4000-8000-000000000002';
BEGIN
 IF NOT EXISTS(SELECT 1 FROM farm_records WHERE id=record AND livestock_count=10 AND expenses=500 AND archived_at IS NULL) THEN RAISE EXCEPTION 'additive upgrade lost historical data'; END IF;
 PERFORM archive_legacy_farm_record(actor,actor,record);
 PERFORM archive_legacy_farm_record(actor,actor,record);
 IF NOT EXISTS(SELECT 1 FROM farm_records WHERE id=record AND archived_at IS NOT NULL) THEN RAISE EXCEPTION 'archive removed source history'; END IF;
 IF (SELECT count(*) FROM organization_audit_log WHERE resource_id=record::TEXT AND action='farm.legacy_record.archived')<>1 THEN RAISE EXCEPTION 'archive replay duplicated audit'; END IF;
 BEGIN DELETE FROM farm_records WHERE id=record;
  RAISE EXCEPTION 'destructive deletion succeeded';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM<>'Farm records must be archived' THEN RAISE; END IF;
 END;
 BEGIN UPDATE farm_records SET livestock_count=99 WHERE id=record;
  RAISE EXCEPTION 'archived history update succeeded';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM<>'FARM_ARCHIVED' THEN RAISE; END IF;
 END;
END $$;
ROLLBACK;
