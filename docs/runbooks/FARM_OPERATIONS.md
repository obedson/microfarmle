# Farm Operations rollout, retention and recovery

Scope: WP-P6-001 only. The authoritative approved contract is
[Farm Operations](../specs/FARM_OPERATIONS.md).
[Evidence and baseline gaps](../FARM_OPERATIONS_EVIDENCE.md) distinguish implementation,
local verification, CI and production acceptance. File presence does not establish completion.

## Ownership and compatibility

The farm domain owns farms, production units, cycles, per-farm worker assignments,
tasks, livestock identities and append-only operational events. A typed resource
registry supplies common organization/farm identity, version, lifecycle and audit
relationships; kind-specific schemas validate metadata. Domain commands execute
authorization, relationship checks, ledger integration and audit in one database
transaction. Controllers do not calculate balances or livestock quantities.

The existing livestock aggregate `farm_records` remains historical source data,
with its existing farmer/tenant-scoped API and analytics. It is not silently
converted into transactions or used to infer missing animal events. An explicit
`legacyRecordId` links an attributable livestock event to an owned historical
snapshot, once per original snapshot. Linked snapshots cannot subsequently be
rewritten. DELETE archives instead of removing history. A historical aggregate
expense is not automatically reposted into the journal.

The existing inventory item/movement ledger and financial journal remain
authoritative. No warehouse, equipment, generalized accounting, intelligence,
marketplace or education subsystem is introduced by this package.

## API and authorization

Production mounts `/api/farm-operations` behind the existing authentication and
active-tenant middleware. Tenant and actor identifiers come from that middleware,
never the request body. No frontend privileged Supabase access is used.

- GET supports farmId, id, kind, state, search, limit (1–100), offset and view.
  Views: upcoming, overdue, completed, history, evidence. Evidence requires id.
- POST /commands requires an opaque UUID Idempotency-Key and a typed command:
  id, farmId, kind, version, state, data. New records use version zero.
- Organization owner/admin manages all its farms. A tenant farm_manager or
  farm.manage permission can create a farm with themselves as responsible manager.
  Existing farm management requires explicit manager assignment.
- ACTIVE, effective-dated worker assignments grant manager, worker or viewer access
  to that farm only. Task-specific visibility and reminder recipients also honor
  the individual assignment dates; another current assignment cannot revive an
  expired assignment. Registered workers must remain active organization members;
  non-login worker assignments do not grant authentication.
- Workers progress assigned tasks and record operational events; they cannot
  create farms/units/cycles/worker assignments or change task assignments.
  Viewers have authorized read-only access. Worker contact data is omitted from
  non-manager reads and history.
- Parent-resource authorization governs private evidence, including replay.
- Commands require farm_erp.operations. Legacy farm mutations use the same flag.
  Disabling it stops new commands without hiding retained history.
- Journal posting and posted-expense reversal additionally require
  financial.accounting.post plus established finance/admin permission.
  No provider or production flag is enabled by these migrations.

## Quantities, accounting and corrections

Physical quantities are decimal strings with at most three decimal places.
Money is a positive integer in minor currency units, with an explicit supported
currency. JavaScript floating-point arithmetic never calculates postings.

Inventory-linked input/yield quantities must be integer strings in the existing
item's exact unit. No undocumented decimal scale or unit conversion is guessed.
The shared atomic movement command serializes stock changes, enforces nonnegative
stock and rejects changed idempotent replays. Consumption, production, reversals,
the farm event and audit commit together or roll back together.

Expenses without accounts are operational records, not ledger postings.
Supplying authorized expense/offset accounts posts through post_financial_journal
inside the same transaction. Reads expose the authoritative journal status.
Corrections use a new operation with reversesId and the original immutable
transaction values; a separate replacement event records corrected values.
Posted reversals invoke reverse_financial_journal, never edit posted lines.
An expense lacking ledger accounts can be reversed and replaced with an explicitly
accounted event without counting both as unreversed operational expenses.

Livestock current quantities derive from recorded acquisition, birth, mortality,
sale and transfer events. Starting quantity derives from the initial acquisition
event. Individual models cannot exceed one animal. Movement/closure cannot be
performed through a descriptive edit. Their compensating reversal requires the
recorded effect version still to be current; otherwise manual reconciliation is
required. Financial, livestock and stock failures retain their original events.

## Calendar and notifications

Task completion is server timestamped. Daily/weekly/monthly recurrence creates
one next task in the same idempotent transaction. Dates advance from the previous
due date, retaining the scheduled-to-due interval. Monthly recurrence follows
PostgreSQL calendar-month arithmetic. Assignment/completion notifications use the
existing notifications table. An hourly job emits at most one due/overdue
reminder per active assigned worker/task/day, without disclosing farm details
in the notification body. Completed/cancelled work is not reminded.

## Offline and device security

The production /farm-operations page installs a service worker that caches only
the static application shell. It never intercepts cross-origin requests or
stores API responses, authentication headers or private attachments in HTTP cache.

IndexedDB partitions records and outbox by authenticated user and organization.
The outbox is saved before network transmission. UUIDs survive reload/retry.
Concurrent writes merge by operation ID; synchronized operations cannot regress
to pending. Successful media payloads are removed from the local outbox.
Failed/pending media remains for authorized retry. File size is limited to 5 MB.

PENDING, SYNCING, SYNCED, FAILED and CONFLICT are visible. Connectivity retries use
bounded exponential delay (2–30 seconds); authorization/validation conflicts do
not retry automatically. Optimistic version conflicts require explicit user
review and a new correction command, not a blind overwrite.

Automatic session expiry removes authentication and requires sign-in but preserves
the protected queue. Explicit logout clears the device's farm cache and pending
changes, as the page warns. Principal changes invalidate in-flight persistence;
cache-clear failures fail closed on subsequent loading. This is browser
origin-isolated storage, not a claim of hardware-backed encryption. Deploy only
on managed/trusted devices with screen locks, encrypted disks and HTTPS.
Offline data reflects the last authorized synchronization; revocation cannot
remotely erase an already-disconnected device. Reconnect revalidates current
account, membership and farm permission before every operation.

Use the responsive web workflow for field operations. The separate native
application has not been moved to a second, competing offline contract.

## Evidence, deployment and rollback

Evidence bytes are private database data addressed through the authorized API;
knowledge of an attachment ID gives no access. Only permitted image/PDF signatures
are accepted. Downloads are explicit, not embedded as executable content.
History, command receipts and evidence bytes reject ordinary updates/deletes.

Apply the five additive migrations in schema-manifest order before deploying:
install_farm_inventory_bridge, install_farm_operations,
install_farm_task_reminders, install_farm_legacy_retention,
fix_farm_effective_assignment_access.
Use the established migration process; never alter a production database manually.
No new provider secret is required. Confirm existing database encryption, backups,
storage capacity, retention policy, HTTPS and feature approval before rollout.

Rollback: disable farm_erp.operations, preserve reads and queues, roll back the
application deployment if needed, and retain additive tables/audit/journals.
Do not drop operational history to roll back. Diagnose using non-secret operation,
actor, organization and resource identifiers; never export private evidence
payloads into logs. Restore from approved backups only under operations review.

Recovery: retry the exact pending operation ID after transient failure; inspect
FAILED/CONFLICT before resubmission. Investigate journal/stock discrepancies through
the existing authoritative ledgers. Use compensating events, not row edits.
Database errors returned to clients are fixed domain codes or a generic unavailable
response; the reminder job reports only generic success/failure counts.

## Verification

Run backend unit/type/build and full clean-schema gates, frontend unit/type/build,
then `node backend/scripts/verify-farm-e2e.mjs` from the repository root.
The latter starts owned disposable PostgreSQL/PostgREST containers, uses synthetic
local identities, exercises production authentication/tenant/router/gateway code,
builds the real frontend and runs desktop plus mobile Chromium acceptance.
It never consumes hosted database credentials or mutates deployed data.
The separate Farm Operations acceptance CI job makes this journey executable in CI;
the existing mocked browser suite is retained, not substituted for acceptance.

Hosted legacy-upgrade CI is separate evidence. A local disposable success does
not prove the actual hosted schema or production rollout. Release requires all
required CI and product acceptance, including resolution of unrelated baseline
test failures rather than hiding them.
