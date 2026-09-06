-- Synthetic identities only, installed exclusively into a disposable Docker DB.
ALTER ROLE service_role BYPASSRLS;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT,UPDATE ON users TO service_role;
GRANT SELECT,INSERT ON refresh_tokens TO service_role;
GRANT SELECT ON organizations,organization_memberships,feature_flags,feature_flag_overrides TO service_role;
INSERT INTO users(id,email,password,name,role) VALUES
 ('61000000-0000-4000-8000-000000000001','farm-owner@example.com',crypt('Synthetic-field-test-42!',gen_salt('bf')),'Synthetic Farm Manager','farmer'),
 ('61000000-0000-4000-8000-000000000002','farm-worker@example.com',crypt('Synthetic-field-test-42!',gen_salt('bf')),'Synthetic Farm Worker','farmer'),
 ('61000000-0000-4000-8000-000000000003','farm-outsider@example.com',crypt('Synthetic-field-test-42!',gen_salt('bf')),'Synthetic Other Tenant','farmer');
INSERT INTO users(id,email,password,name,role) VALUES
 ('61000000-0000-4000-8000-000000000004','farm-manager@example.com',crypt('Synthetic-field-test-42!',gen_salt('bf')),'Distinct Farm Manager','farmer');
INSERT INTO organization_memberships(organization_id,user_id,role,status) VALUES
 ('61000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000004','farm_manager','active');
INSERT INTO organization_memberships(organization_id,user_id,role,status) VALUES
 ('61000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000002','member','active');
INSERT INTO feature_flag_overrides(feature_key,scope_type,scope_id,environment,enabled,reason,status)
 VALUES('farm_erp.operations','global',NULL,'test',true,'Synthetic farm E2E enablement','approved');
