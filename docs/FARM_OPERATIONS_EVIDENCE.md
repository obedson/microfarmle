# WP-P6-001 implementation evidence

## Pre-implementation assessment

Baseline: `c351a1134d416d2df8de763f73266215d566a8d9`.
Specification: [approved Farm Operations](specs/FARM_OPERATIONS.md), committed before this assessment.
This matrix records the baseline, not acceptance of the forthcoming implementation. No requirement is deferred.

| Approved section | Status | Existing evidence and missing behavior |
|---|---|---|
| 01 Tenant ownership | PARTIAL | Legacy organization_id, tenant middleware and RLS exist; farm association constraints and farm-specific authorization missing. |
| 02 Farms | MISSING | No operational farm model, lifecycle, UI or tests; rental properties are not operational farms. |
| 03 Units | MISSING | No production-unit hierarchy, identifiers, capacity or lifecycle. |
| 04 Cycles | MISSING | No crop/non-crop production cycles or transition evidence. |
| 05 Livestock | PARTIAL | FarmRecord model stores aggregate counts/feed/mortality, but no batch/animal identity or event-derived quantities. |
| 06 Calendar | MISSING | Booking calendar is a different domain; no operational tasks/calendar/reminders. |
| 07 Workers | MISSING | User memberships exist; non-login workers, farm assignments and their history do not. |
| 08 RBAC | PARTIAL | Tenant role/permission middleware exists; farm records allow all resolved members; no farm-specific assignments. |
| 09 Tasks | MISSING | No farm task model, assignments, progress or completion workflow. |
| 10 Inputs | PARTIAL | Feed totals and inventory foundation exist; no transactional farm consumption or atomic replay-safe integration. |
| 11 Production | MISSING | No discrete harvest/production events or correction/inventory linkage. |
| 12 Expenses | PARTIAL | Legacy decimal expenses and authoritative journal engine exist; no transaction-level farm expense lifecycle/linkage. |
| 13 Evidence | MISSING | Private group-document access is reusable precedent; no farm evidence parent authorization/upload. |
| 14 Audit | PARTIAL | Shared audit infrastructure exists; farm mutations lack atomic attributable history. |
| 15 Offline | MISSING | Farm web/mobile calls require connectivity; no protected cache/queue/media persistence. |
| 16 Synchronization | MISSING | No durable farm operation IDs, retry state machine or replay protection. |
| 17 Conflicts | MISSING | Legacy update is unversioned; no visible conflict resolution. |
| 18 Offline security | PARTIAL | Live auth/membership revalidation exists; no offline partition/logout/reconnect controls. |
| 19 API architecture | PARTIAL | Mounted /api/farm-records and shared web API client exist; missing rich validation, paging and concurrency. |
| 20 Validation | PARTIAL | Booking owner/tenant linkage and update whitelist exist; numeric/date/state/cross-farm checks incomplete. |
| 21 Operational views | PARTIAL | Recent records and aggregate analytics exist; no domain search/calendar/upcoming work. |
| 22 Web acceptance | MISSING | frontend/e2e/farm-records.spec.ts intercepts APIs; no authenticated real-backend farm journey. |
| 23 Offline acceptance | MISSING | No offline/replay/conflict/revocation acceptance tests. |
| 24 Responsive/mobile | PARTIAL | Responsive legacy web form and online mobile farm screen exist; no full operational field journey. |
| 25 Automated verification | PARTIAL | Legacy API/model tests and schema read-isolation probes exist; approved domain invariant suite missing. |
| 26 Integration boundaries | PARTIAL | Inventory and accounting engines exist; farm integration not implemented. InventoryService.move replay can double-apply. |
| 27 Retention | PARTIAL | Runbook prohibits history deletion; legacy DELETE still physically deletes records. |
| 28 Feature gating | PARTIAL | farm_erp.operations registered; legacy farm mutation routes do not enforce it. |
| 29 Definition of done | PARTIAL | Approved specification now recorded; implementation, acceptance and reconciliation remain open. |

## Inspected implementation references

- Backend/API: `backend/src/routes/farmRecords.ts`, `backend/src/controllers/farmRecordController.ts`, `backend/src/models/FarmRecord.ts`, `backend/src/services/farmRecordService.ts`, `backend/src/index.ts`.
- Schema: `backend/migrations/create_farm_records.sql`, `add_integration_columns.sql`, `add_domain_tenant_ownership.sql`, `harden_tenant_membership_rls.sql`.
- Web: `frontend/src/pages/FarmRecords.tsx`, `components/FarmRecordForm.tsx`, `components/FarmAnalytics.tsx`, `hooks/useFarmRecords.ts`, `api/farmRecords.ts`, `services/farmRecordAPI.ts`, `App.tsx`.
- Mobile: `mobile/src/screens/FarmRecordsScreen.tsx`, `mobile/src/api/client.ts`, `mobile/src/navigation/AppNavigator.tsx`.
- Tests: `backend/src/tests/farmRecordApi.test.ts`, `farmRecordCreateValidation.test.ts`, `farmRecordModel.test.ts`, `backend/scripts/verify-clean-schema.sh`, `frontend/e2e/farm-records.spec.ts`.
- Boundaries: `backend/src/domains/inventory/inventoryService.ts`, `backend/migrations/install_inventory_foundation.sql`, `backend/src/domains/financial/financialLedgerService.ts`, `backend/migrations/create_financial_ledger.sql`, `backend/src/utils/audit.ts`, `backend/src/domains/groups/groupDocumentAccessService.ts`.
- Operations/evidence: `docs/runbooks/FARM_RECORDS_OPERATIONS.md`, `docs/runbooks/INVENTORY_FOUNDATION.md`, `docs/V1_RECONCILIATION.json`, legacy specification Requirement 15.

## Completion status

WP-P6-001 remains PARTIAL until every approved requirement has implementation and acceptance evidence. The generated reconciliation currently includes unrelated financial documents as farm specification evidence and classifies the client layer as not required. Neither is proof of the approved operational scope.
## Implementation and local acceptance

Specification commit: `bd3ec919eba64550b676eccfba7822e4b17f911c`.
The baseline matrix above is preserved unchanged: 0 complete, 16 partial and
13 missing requirements. None were deferred.

Evidence keys:

- RULES: `backend/src/domains/farm/farmRules.ts` and `backend/src/tests/farmOperationsRules.test.ts`.
- API: `backend/src/routes/farmOperations.ts`, `backend/src/domains/farm/farmService.ts`, and `backend/src/tests/farmOperationsApi.test.ts`.
- DB: `backend/migrations/install_farm_operations.sql` and `backend/tests/schema/test-farm-operations.sql`.
- WEB: `frontend/src/pages/FarmOperations.tsx`, `frontend/src/pages/farmOperationFields.ts`, and `frontend/src/pages/FarmOperations.test.tsx`.
- OFFLINE: `frontend/src/services/farmOffline.ts`, its tests, and `frontend/public/farm-offline-sw.js`.
- REAL: `frontend/e2e/farm/operations.spec.ts`, `backend/scripts/verify-farm-e2e.mjs`, and `.github/workflows/farm-operations.yml`.
- RETENTION: `backend/migrations/install_farm_legacy_retention.sql`, `backend/tests/schema/test-farm-upgrade.sql`, and existing farm-record regression tests.
- OPS: `docs/runbooks/FARM_OPERATIONS.md`.

“Implemented/local evidence” below does not mean the package satisfies its full
definition of done. Required CI and acceptance are separate gates.

| Section | Implementation and exercised evidence | Current assessment |
|---|---|---|
| 01 Ownership | API derives actor/tenant; DB checks all relationships; REAL rejects other tenant and revoked membership; WEB masks previous partition immediately. | Implemented/local evidence |
| 02 Farms | Fields, responsible manager, lifecycle, archival guards; DB tests lifecycle and manager creation; REAL creates farm. | Implemented/local evidence |
| 03 Units | Scoped identifiers, capacity/units, crop/non-crop metadata; DB tests transitions and foreign-farm associations. | Implemented/local evidence |
| 04 Cycles | Versioned plan/active/completed/cancelled states and assignments; DB transition/terminal-state assertions; REAL creates crop cycle. | Implemented/local evidence |
| 05 Livestock | Batch/individual metadata, event-derived starting/current count; DB replay, mortality bounds, movement/closure and safe reversal; existing snapshots remain provenance, not reconstructed events. | Implemented/local evidence |
| 06 Calendar | Upcoming/overdue/completed filters, recurrence, existing notifications and idempotent reminder job; DB recurrence/reminder assertions. | Implemented/local evidence |
| 07 Workers | Registered or non-login, farm-scoped assignments, effective dates, contact masking, retained versions; DB assignment and REAL worker setup. | Implemented/local evidence |
| 08 RBAC | Admin, explicitly assigned farm manager/worker/viewer and separate finance permission; DB/API/REAL privileged mutation rejection. | Implemented/local evidence |
| 09 Tasks | Assignees, priority, dates, server completion timestamp, versioned transitions and audit; DB + REAL completion/replay. | Implemented/local evidence |
| 10 Inputs | Transaction events, positive quantity, optional stock integration via existing atomic movement ledger; DB exactly-once consumption/reversal and API validation. | Implemented/local evidence |
| 11 Production | Discrete dated events, grade/relationships, reversals; DB stock-yield replay and REAL production recording. | Implemented/local evidence |
| 12 Expenses | Integer minor units, currency, vendor/reference, authoritative journal status; DB posting, permission denial, replay and accounting reversal; REAL offline expense. | Implemented/local evidence |
| 13 Evidence | Private bytes, permitted media validation, parent authorization, immutable metadata/history and replay; REAL upload/download. | Implemented/local evidence |
| 14 Audit | Atomic actor/org/resource/operation history plus existing organization audit; derived livestock effects retained; DB completion/event/archive replay assertions. | Implemented/local evidence |
| 15 Offline | Assigned snapshot and field-event outbox, IndexedDB media retention, production shell worker; REAL offline reload retains pending operation. | Implemented/local evidence |
| 16 Sync | UUID command receipts; visible pending/syncing/synced/failed/conflict states; atomic local queue merge; OFFLINE + REAL exactly-once replay. | Implemented/local evidence |
| 17 Conflicts | Database optimistic versions and immutable transactions; no blind overwrite; OFFLINE conflict retention and REAL stale-version rejection. | Implemented/local evidence |
| 18 Offline security | Server revalidates auth/membership/assignment; user/org partitions, in-flight guards, cross-tab auth rehydration, explicit logout clear, session-expiry queue preservation; REAL revoked queued expense is rejected. | Implemented/local evidence |
| 19 API | Shared authentication, tenant headers/client, strict typed commands, bounded paging/search, stable errors, flags and idempotency. | Implemented/local evidence |
| 20 Validation | RULES invalid dates/quantities/currency/metadata; DB foreign-farm links, terminal states, archive and quantity bounds; legacy standalone property association now checked. | Implemented/local evidence |
| 21 Views | Farm/type/search selection, records, recent production, task calendar and paginated operational history in WEB. | Implemented/local evidence |
| 22 Web acceptance | REAL performs authenticated setup, assignments, tasks, input, yield, expense, evidence/history and forbidden operations without API interception. | Local acceptance passed; CI remains separate |
| 23 Offline acceptance | REAL removes connectivity, saves pending expense, reloads, reconnects, proves one server record, replays, rejects version conflict and revoked queued work; OFFLINE tests preserve failures. | Local acceptance passed; CI remains separate |
| 24 Responsive/mobile | Same REAL journey on desktop and iPhone-sized Chromium, usable file upload and no page overflow. Existing native client remains unchanged; its regression gate passes. | Local acceptance passed; no native offline claim |
| 25 Verification | Focused backend, full frontend, schema, real E2E, mobile, build/type and secret gates; full backend has an unchanged baseline invitation-test failure. | PARTIAL: required full CI is not green |
| 26 Boundaries | Existing inventory movement and financial journal engines reused; shared stock replay defect corrected, with no second ledger or new sibling-domain workflow. | Implemented/local evidence |
| 27 Retention | Events/audit/evidence immutable; legacy DELETE archives once, archived/linked history cannot be rewritten; populated baseline upgrade retains source records. | Implemented/local evidence |
| 28 Gating | New commands and legacy mutations require farm_erp.operations; posting additionally requires accounting flag; reads remain accessible with rollout disabled. | Implemented/local evidence |
| 29 Done | Approved spec, implemented scope and local evidence are present; required green full CI/product acceptance remain outstanding. | PARTIAL, not COMPLETE |

## Verification record

Commands were run in the Codespace, never the stale Windows checkout.

| Gate | Observed local result |
|---|---|
| Backend focused (`npm exec -- jest --runInBand farm`) | 6 suites, 43 tests passed |
| Full backend unit (`npm run test:unit`) | 201 suites: 200 passed, 1 failed; 988 tests: 987 passed, 1 failed |
| Backend typecheck/build | Passed |
| Full clean schema | Passed, including farm invariants |
| Populated baseline farm upgrade | Passed in disposable PostgreSQL; original livestock counts/expenses retained, archival/audit replay verified |
| Hosted schema upgrade | Script now checks/applies the farm layer in its disposable schema copy; current PR CI is required, not inferred from the local upgrade |
| Frontend typecheck/tests | Passed; 46 suites, 121 tests passed |
| Production build / CRA lint | Passed; existing Browserslist-data and tooling-deprecation warnings remain, with no dependency changes |
| Real API/database/browser acceptance | 2 passed: desktop and mobile Chromium; production build, actual login, membership, route and database gateway; no hosted DB or mocked API substitute |
| Existing browser regressions | 3 passed: farm-records, inventory, login |
| Existing native mobile | Typecheck passed; 1 suite, 3 tests passed; no new native-client functionality claimed |
| Pinned Gitleaks current-tree scan | Passed; one newly introduced synthetic test-signing literal was replaced with per-run ephemeral test keys; no scanner exceptions or history baseline added |
| Reconciliation | 2 tests passed; only WP-P6-001 evidence/layers changed, status remains partial |
| Production dependency audit | Backend: 3 moderate; frontend: 1 moderate; mobile: 18 moderate; zero high/critical in each. Dependency manifests/locks unchanged; findings require separate baseline triage, not a zero-vulnerability claim. |
| Whitespace diff check | Passed |

The full backend failure is
`backend/src/tests/groupInvitationApi.test.ts`, “creates a tenant-bound
invitation and prevents token caching.” Its fixed expiration is
`2026-09-02T10:00:00Z`, now in the past. Both that test and its controller are
unchanged from the authoritative baseline. No test was skipped, deleted, weakened,
clock-shifted, or changed in another domain to conceal this failure.

The real E2E harness uses only disposable synthetic identities and ephemeral test
signing material. No production credential is recorded or changed. Its externally
loaded provider script is blocked; actual local API and database requests are not
mocked. The repository owner separately confirmed that existing GitHub Actions
integration credentials target the isolated non-production test project; this
permits draft-PR CI without changing those credentials or PR #294.

## Reconciliation and release boundary

Explicit farm-only evidence mapping replaces unrelated financial specification
matches and makes the client layer required. New farm-specific sources are
excluded from fuzzy attribution to unrelated work-plan rows. Totals remain:
158 planned, 126 checked, 101 candidate-complete, 25 checked with evidence gaps,
31 partial, 1 not started. These are repository reconciliation categories, not
a production-completion verdict.

WP-P6-001 remains **PARTIAL**. No approved functional requirement is labeled
deferred. Outstanding closure gates are the full backend/CI baseline failure,
current-PR hosted integration and upgrade verification, and product-owner
acceptance/release approval. Production rollout, flag enablement, capacity,
retention and device-security checks have not been performed or implied.
No new production provider is required or approved by this implementation.
WP-P6-002/003/004, Phase 7 and Phase 8 were not implemented or promoted.

## PR #295 acceptance-gate correction (2026-09-06)

The preceding verification table records the original implementation head, not
the corrected head. Original head: 0a80e9758bdd14d8450407809e002b3e3d104ffb.
General CI run 34018934894 failed in the backend invitation test, the full
frontend audit, and the MCP-server production audit. Database integration,
hosted legacy upgrade, browser smoke, mobile and repository security passed.
Dedicated real farm acceptance run 34018934982 passed on that same head.

The invitation failure was reproduced locally (1 failed / 3 tests): its fixed
2026-09-02 expiration was older than wall-clock time. A test-scoped fixed clock
of 2026-09-01 now makes the existing valid-expiry fixture deterministic; real
timers are restored after each test. Original assertions and production
invitation validation are unchanged. After correction, the focused 3 tests and
the full 201 suites / 988 tests pass, as does backend typechecking.

Both failing dependency trees already locked fast-uri 3.1.5 on the baseline;
WP-P6-001 introduced no dependency changes. These were high-severity findings,
not the previously disclosed moderate findings. Existing ci.yml explicitly
requires full frontend and production MCP audits at audit-level=high;
WORK_PLAN.md Phase 0 also requires a green dependency gate. That policy justifies
the limited lock-only fast-uri 3.1.5 to 3.1.7 patch update in those two trees.
No other package, manifest, override, audit threshold or exception changed.
Advisory reference: https://github.com/advisories/GHSA-5jgf-p345-68v8 .

Before correction: frontend audit 6 moderate / 1 high; MCP audit 1 moderate /
1 high, both exit 1. After correction: both audit gates exit 0. Frontend
production audit also exits 0. Moderate findings are not described as resolved
or formally accepted by this change. Frontend clean install, typecheck, 46
suites / 121 tests and production build pass. MCP clean install with scripts
disabled, server syntax checks and AJV compile/validation smoke pass; no live
MCP service, provider or credentials were used for these checks.

Reconciliation remains unchanged and WP-P6-001 remains PARTIAL pending final
requirement-by-requirement acceptance/release review. New-head CI must be
evaluated independently; earlier passing runs are not substituted. No merge,
PR #294 change, credential change or WP-P6-002/003/004 work is authorized here.
Corrected-tree local regression: real farm desktop/mobile acceptance 2/2 passed;
existing browser smoke 3/3 passed; pinned current-tree Gitleaks and both
reconciliation tests passed. Remaining audit counts: full frontend 6 moderate
(1 in production scope), MCP production 1 moderate; zero high/critical.
