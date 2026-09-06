# WP-P6-001 — Farm Operations

Status:
APPROVED — AUTHORITATIVE FOR PROGRAMME 3 IMPLEMENTATION

Scope:
Farm/plot/livestock records, calendars, workers, tasks, inputs,
yields, expenses, evidence, and offline synchronization.

Core operating relationship:

Farm
→ Plot/Production Unit
→ Production Cycle
→ Activities/Tasks
→ Inputs
→ Production/Yield
→ Expenses
→ Evidence

Livestock:

Farm
→ Livestock Unit
→ Batch/Individual Animal
→ Operational Events
→ Inputs
→ Production
→ Expenses
→ Evidence

REQUIRED SPECIFICATION

1. TENANT OWNERSHIP

Every operational record belongs to an organization.

Tenant isolation MUST be server-side.

Cross-tenant retrieval, mutation, association and foreign-key
relationships must be rejected.

Platform administration must not weaken ordinary tenant APIs.

2. FARMS

Support:
- name
- description
- farm/operation type
- address/location
- coordinates where available
- area/unit
- tenure/ownership classification
- status
- responsible manager
- optional contacts
- timestamps
- tenant ownership
- evidence/media

Lifecycle:

DRAFT → ACTIVE → INACTIVE → ARCHIVED

Dependent operational history must not be destructively deleted.

3. PLOTS / PRODUCTION UNITS

Support:
- farm
- unique farm/tenant-scoped identifier
- size/capacity and unit
- coordinates/location
- production type
- land/soil notes where relevant
- status
- notes
- evidence

Lifecycle:

AVAILABLE → ACTIVE → RESTING/INACTIVE → ARCHIVED

Must support non-crop agricultural operations as well.

4. PRODUCTION/CROP CYCLES

Support:
- farm
- plot/unit
- crop/product
- variety
- planned/actual start
- expected/actual completion
- planned quantity/area
- status
- notes
- responsible worker/team

Lifecycle:

PLANNED → ACTIVE → COMPLETED

and appropriate cancellation.

Historical completed cycles remain auditable.

5. LIVESTOCK

Reconcile existing livestock functionality rather than duplicating it.

Support batch/flock/herd and individual-animal models where applicable.

Support:
- farm
- livestock unit
- species
- breed
- identifier
- acquisition/birth/hatch date
- starting/current quantity
- sex where relevant
- source
- purpose
- status
- notes

Events include:
- acquisition/birth/hatching
- feeding/input usage
- health/treatment
- vaccination
- mortality
- sale/transfer
- production
- movement
- batch closure

Quantity changes must derive from attributable events.

6. OPERATIONAL CALENDAR

Support tenant-scoped:
- farm
- unit
- cycle/livestock relationship
- task/activity
- start/due date
- recurrence where supported
- responsible worker/team
- status
- priority
- existing notification/reminder integration

Views must expose upcoming, overdue and completed operations.

7. WORKERS

Support:
- existing MicroFAMS member/user; OR
- tenant-managed non-login operational worker.

Fields include:
- name
- authorized contact information
- linked user where applicable
- organization
- farm assignments
- operational role
- status
- start/end dates

Lifecycle:
ACTIVE → INACTIVE

Historical assignments retained.

8. RBAC

Minimum roles/capabilities:

Organization Admin:
full tenant farm administration.

Farm Manager:
authorized farm operational management.

Farm Worker:
assigned operational visibility/actions.

Viewer/Auditor:
read-only authorized farm access.

Financially sensitive actions must respect established finance/admin
permissions.

Organization membership alone must NOT grant farm-management rights.

Backend APIs enforce authorization.

9. TASKS

Support:
- organization
- farm
- unit
- cycle/livestock relationship
- title
- description
- type
- assignees
- priority
- scheduled/start/due dates
- completion timestamp
- status
- notes
- evidence

Lifecycle:

PLANNED → IN_PROGRESS → COMPLETED

with appropriate cancellation.

Overdue should normally be derived.

Task assignment/completion changes are auditable.

10. INPUTS

Record transactional usage rather than aggregate totals.

Categories include:
- seed
- feed
- fertilizer
- treatment/chemical
- medication
- fuel
- consumables
- configurable other inputs

Usage supports:
- item
- quantity/unit
- timestamp
- farm
- plot/cycle/livestock unit
- task
- worker
- cost
- notes
- evidence

When WP-P6-002 inventory is active, use inventory movements and prevent
double consumption.

11. YIELD / PRODUCTION

Record discrete production events.

Support:
- farm
- plot/cycle/livestock relationship
- product
- quantity/unit
- production/harvest date
- quality/grade
- recorded-by
- notes
- evidence

Corrections are auditable.

Inventory integration must be idempotent.

12. EXPENSES

Transaction-level farm expenses.

Support:
- organization
- farm
- plot/cycle/livestock relationship
- category
- description
- amount
- currency
- date
- payee/vendor
- payment/reference information where appropriate
- recorded-by
- evidence/receipt
- status

DO NOT create a competing accounting ledger.

Integrate with established MicroFAMS accounting where applicable.

Corrections/reversals follow accounting/audit rules.

13. EVIDENCE

Support authorized:
- photos/images
- receipts
- permitted documents

Record:
- tenant
- uploader
- parent entity/type
- timestamp
- storage reference
- content metadata
- caption/description

Evidence authorization follows parent-resource authorization.

Private evidence must not become public merely through knowledge of its
storage reference.

Retention/removal must respect audit/financial requirements.

14. AUDIT

Audit at least:
- farm lifecycle
- unit lifecycle
- worker assignments
- cycle transitions
- livestock quantity events
- task lifecycle
- input consumption
- yield creation/correction
- expense creation/correction/reversal
- evidence changes

Audit records identify actor, tenant, action, entity, timestamp and
appropriate non-secret metadata.

15. OFFLINE OPERATION

Offline support is REQUIRED.

At minimum support offline:
- viewing synchronized assigned farms/tasks
- task progress/completion
- input usage
- livestock events
- production/yield
- expenses
- evidence capture metadata/media for later upload where technically
  supported

Administrative configuration need not be offline-writable unless required
elsewhere.

16. OFFLINE SYNCHRONIZATION

Every offline mutation receives a client-generated unique operation /
idempotency identifier.

Replay must not duplicate:
- expenses
- input consumption
- yields
- livestock events
- task completions
- evidence

Synchronization states include:

PENDING → SYNCING → SYNCED

and:

FAILED
CONFLICT

where applicable.

User data must not silently disappear after sync failure.

17. CONFLICT HANDLING

Do not rely exclusively on blind last-write-wins.

Append-only transactions:
idempotent operation replay.

Mutable descriptive records:
optimistic concurrency/version detection.

Financial records:
server/accounting state authoritative; unsafe conflicts require explicit
reconciliation.

Task completion:
idempotent.

Evidence retries:
must not create duplicate logical attachments.

Unsafe conflicts must surface to the user.

18. OFFLINE SECURITY

Reconnect must revalidate:
- authentication
- tenant membership
- permissions

Revoked users must not automatically succeed with queued mutations.

Server remains authoritative.

Protected tenant cache must follow established secure-storage/logout
policy.

19. API ARCHITECTURE

Use established shared MicroFAMS API architecture.

No privileged frontend database bypass.

Provide:
- authentication
- tenant scoping
- RBAC
- validation
- pagination
- filtering
- idempotency
- concurrency
- consistent errors
- auditing

20. VALIDATION

Reject invalid states including:
- invalid negative quantities
- zero/negative input consumption
- invalid yield quantity
- mortality exceeding available livestock
- cross-tenant/cross-farm relationships
- impossible dates
- expense amount <= 0
- invalid currency
- unauthorized worker assignment
- prohibited operations against archived farms

Backend validation is authoritative.

21. SEARCH / OPERATIONAL VIEWS

Provide usable filtering/search for:
- farms
- units
- cycles
- livestock
- workers
- tasks
- inputs
- yields
- expenses

Expose useful operational information such as upcoming/overdue work and
recent production.

22. WEB ACCEPTANCE

Real authenticated journey must demonstrate:

1. manager creates farm
2. creates operational unit
3. creates crop cycle or livestock operation
4. assigns worker
5. creates/completes task
6. records input consumption
7. records production/yield
8. records expense
9. attaches/retrieves evidence
10. views operational history/calendar
11. unauthorized role cannot perform privileged mutation
12. second tenant cannot retrieve/mutate records

Mock-only Playwright is insufficient as sole acceptance evidence.

23. OFFLINE ACCEPTANCE

Demonstrate:

1. authorized operational data synchronized locally
2. connectivity removed
3. supported operation recorded offline
4. operation remains visibly pending
5. connectivity restored
6. queued mutation synchronizes
7. server contains exactly one resulting operation
8. replay does not duplicate
9. mutable-record conflict demonstrated
10. revoked/unauthorized sync rejected by server

24. RESPONSIVE/MOBILE ACCEPTANCE

Field workflows must function on supported mobile viewport sizes.

No:
- inaccessible controls
- horizontal page overflow
- unusable forms
- hidden required information

Evidence/photo capture/upload must be mobile-accessible.

Separate mobile clients, if involved, use the same authoritative backend
contracts.

25. AUTOMATED VERIFICATION

Required tests include appropriate coverage for:
- CRUD/lifecycles
- tenant isolation
- RBAC
- cross-tenant ID attacks
- validation
- livestock quantity integrity
- tasks
- inputs
- yields
- expenses/accounting
- evidence authorization
- idempotency
- offline replay
- conflict detection
- revoked-access synchronization
- frontend flows
- migration/schema verification
- production build/typecheck/lint

Do not hide unrelated failures.

26. INTEGRATION BOUNDARIES

WP-P6-001 owns farm operational records.

WP-P6-002 remains authoritative for:
- generalized inventory
- warehouses
- equipment
- maintenance
- resource booking
- utilization

WP-P6-001 input consumption integrates with WP-P6-002 inventory
transactions where active.

WP-P6-001 production may generate inventory movements.

Do not duplicate the inventory ledger.

Existing accounting remains authoritative for accounting journals.

27. RETENTION

Operational history must not disappear through ordinary destructive
deletion.

Use archival/status transitions where dependent history exists.

Financial/audit retention follows established MicroFAMS rules.

28. FEATURE GATING

Use established farm ERP / Phase 6 feature-gating architecture where
present.

Flags may control rollout but cannot be used to classify unfinished
functionality as complete.

29. DEFINITION OF DONE

WP-P6-001 is COMPLETE only when ALL specified capabilities are:

- implemented
- migration-backed
- tenant-isolated
- RBAC-protected
- audited where required
- integrated correctly with accounting/inventory boundaries
- offline-capable as specified
- idempotency/conflict tested
- web/mobile acceptance verified
- reconciliation evidence updated

NO listed requirement may be classified deferred merely to close
WP-P6-001.

PRODUCT-OWNER DECISIONS

- Operational data ownership: organization/tenant.
- Worker model: registered members plus tenant-managed non-login workers.
- Financial authority: existing MicroFAMS accounting.
- Inventory authority: WP-P6-002.
- Offline conflict model: idempotent events + optimistic concurrency +
  explicit reconciliation where unsafe.
- Evidence: private by default and parent-authorized.
- Historical deletion: archive rather than destructive deletion where
  dependent records exist.
- Acceptance: real backend-integrated journeys required; mocked E2E alone
  is insufficient.

Approval statement:

APPROVED — WP-P6-001 Farm Operations Specification.
This specification is authoritative for Programme 3 implementation.
All requirements are required for completion; none are classified as
deferred. Existing MicroFAMS security, tenant-isolation, accounting,
inventory, audit and API architecture remains authoritative where this
specification integrates with those systems.
