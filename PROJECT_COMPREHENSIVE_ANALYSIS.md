# MicroFams Platform - Comprehensive Analysis & Concerns

**Analysis Date:** March 26, 2026  
**Analyst:** AI Technical Review

---

## Executive Summary

MicroFams is an **Agro Career Management and Investment Platform** that connects farmers with livestock space owners, facilitates group-based farming cooperatives, and provides marketplace functionality for agricultural products. The platform implements a sophisticated wallet system, contribution management, and booking infrastructure.

### Technology Stack
- **Backend:** Node.js/Express + TypeScript
- **Frontend:** React + TypeScript + TailwindCSS
- **Database:** PostgreSQL (via Supabase)
- **Payment:** Paystack + Interswitch
- **Infrastructure:** AWS S3, Cloudinary, Puppeteer (PDF generation)

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  - User Dashboard, Groups, Marketplace, Wallet, Bookings    │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────────┐
│                  Backend (Express/Node)                      │
│  - Auth, Payments, Bookings, Groups, Wallet, Analytics     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│  PostgreSQL  │ │ Paystack │ │Interswitch │
│  (Supabase)  │ │ Payment  │ │  Banking   │
└──────────────┘ └──────────┘ └────────────┘
```

### 1.2 Core Modules

1. **User Management**
   - Authentication (JWT-based)
   - Role-based access (farmer, owner, admin)
   - Profile with NIN verification
   - Referral system

2. **Property & Booking System**
   - Livestock space listings
   - Booking workflow (pending → confirmed → completed)
   - Availability management
   - Payment integration

3. **Group Management**
   - Cooperative group creation
   - Entry fee payment
   - Member management
   - Contribution cycles
   - Group wallet with NUBAN

4. **Wallet System**
   - Individual user wallets
   - Group virtual accounts (Interswitch NUBAN)
   - Transaction ledger
   - Withdrawal requests

5. **Marketplace**
   - Product listings
   - Order management
   - Supplier dashboard

6. **Learning Platform**
   - Course management
   - Video content (YouTube integration)
   - Progress tracking

---

## 2. DATABASE STRUCTURE ANALYSIS

### 2.1 Key Tables & Relationships

#### Core Entities
- **users** (45 columns) - Central user table with NIN verification, referrals, subscriptions
- **properties** (20 columns) - Livestock space listings
- **bookings** (18 columns) - Rental bookings with payment tracking
- **groups** (30 columns) - Cooperative groups with contribution settings
- **group_members** (13 columns) - Group membership with payment status

#### Financial Tables
- **user_wallets** (6 columns) - Individual wallet balances
- **wallet_transactions** (11 columns) - Transaction ledger
- **withdrawal_requests** (15 columns) - Withdrawal processing
- **group_virtual_accounts** (9 columns) - Group NUBAN accounts
- **payment_receipts** (9 columns) - Receipt generation

#### Contribution System
- **contribution_cycles** (11 columns) - Monthly contribution periods
- **member_contributions** (11 columns) - Individual contribution records
- **group_withdrawal_requests** (9 columns) - Group fund withdrawals
- **group_withdrawal_approvals** (4 columns) - Voting mechanism

#### Supporting Tables
- **farm_records** (14 columns) - Livestock tracking
- **marketplace_products** (16 columns) - Product catalog
- **orders** (11 columns) - Order management
- **courses** (9 columns) - Educational content
- **audit_logs** (8 columns) - System audit trail

### 2.2 Database Strengths

✅ **Well-Normalized Structure**
- Proper foreign key relationships
- Minimal data redundancy
- Clear separation of concerns

✅ **Comprehensive Audit Trail**
- `audit_logs` table for system actions
- `booking_status_history` for state transitions
- Timestamp tracking on all major tables

✅ **Financial Integrity**
- Separate ledger for wallet transactions
- Payment reference tracking
- Status-based workflow management

✅ **Scalability Considerations**
- UUID primary keys (distributed-friendly)
- Indexed foreign keys
- JSONB for flexible metadata

---

## 3. CRITICAL CONCERNS & RISKS

### 🔴 HIGH PRIORITY ISSUES

#### 3.1 **Financial Security & Integrity**

**CONCERN:** Wallet balance management lacks atomic transaction guarantees
```typescript
// Current implementation in walletService.ts
async creditWallet(walletId: string, amount: number) {
  // Step 1: Read current balance
  const wallet = await getWallet(walletId);
  
  // Step 2: Calculate new balance (RACE CONDITION RISK)
  const newBalance = wallet.balance + amount;
  
  // Step 3: Update balance
  await updateWallet(walletId, newBalance);
}
```

**RISK:** 
- Concurrent transactions can cause balance corruption
- Lost updates in high-traffic scenarios
- No rollback mechanism for failed multi-step operations

**RECOMMENDATION:**
```sql
-- Use database-level atomic operations
UPDATE user_wallets 
SET balance = balance + $1 
WHERE id = $2 
RETURNING *;

-- Or implement optimistic locking
UPDATE user_wallets 
SET balance = $1, version = version + 1 
WHERE id = $2 AND version = $3;
```

#### 3.2 **Payment Verification Gaps**

**CONCERN:** Development mode bypasses payment verification
```typescript
// From GroupModel.ts
if (!isDevelopmentMode()) {
  const verification = await verifyPaystackPayment(paymentRef);
} else {
  console.log('⚠️  DEV MODE: Skipping payment verification');
}
```

**RISK:**
- Accidental deployment with dev mode enabled
- No clear environment separation
- Potential for payment fraud

**RECOMMENDATION:**
- Remove dev mode bypass entirely
- Use test payment gateway in development
- Implement strict environment validation on startup

#### 3.3 **Insufficient Transaction Isolation**

**CONCERN:** Group payment confirmation uses multiple database calls
```typescript
// From GroupModel.ts
static async confirmPayment(memberId: string) {
  const { data, error } = await supabase
    .rpc('confirm_group_payment_transaction', { p_member_id: memberId });
}
```

**RISK:**
- Partial state updates if RPC fails mid-execution
- No clear rollback strategy
- Inconsistent group member counts

**RECOMMENDATION:**
- Wrap all financial operations in database transactions
- Implement saga pattern for distributed transactions
- Add idempotency keys to prevent duplicate processing

#### 3.4 **Weak Authentication Security**

**CONCERN:** JWT tokens lack refresh mechanism
```typescript
// From jwt.ts (only 330 bytes - likely minimal implementation)
export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};
```

**RISK:**
- Long-lived tokens increase attack surface
- No token revocation mechanism
- Session hijacking vulnerability

**RECOMMENDATION:**
```typescript
// Implement refresh token pattern
interface TokenPair {
  accessToken: string;  // Short-lived (15 min)
  refreshToken: string; // Long-lived (7 days)
}

// Store refresh tokens in database with revocation support
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 🟡 MEDIUM PRIORITY ISSUES

#### 3.5 **Data Consistency Concerns**

**CONCERN:** Denormalized data without update triggers
- `groups.member_count` manually updated
- `booking_analytics` view without refresh mechanism
- `group_fund_balance` calculated separately

**RISK:**
- Stale data in analytics
- Incorrect member counts
- Balance mismatches

**RECOMMENDATION:**
```sql
-- Add database triggers for automatic updates
CREATE TRIGGER update_group_member_count
AFTER INSERT OR DELETE ON group_members
FOR EACH ROW EXECUTE FUNCTION update_member_count();

-- Or use materialized views with scheduled refresh
CREATE MATERIALIZED VIEW booking_analytics_mv AS
SELECT ... FROM bookings ...;

-- Refresh via cron job
REFRESH MATERIALIZED VIEW CONCURRENTLY booking_analytics_mv;
```

#### 3.6 **Missing Rate Limiting**

**CONCERN:** Rate limiter exists but configuration unclear
```typescript
// From rateLimiter.ts (only 885 bytes)
import rateLimit from 'express-rate-limit';
```

**RISK:**
- API abuse potential
- DDoS vulnerability
- Resource exhaustion

**RECOMMENDATION:**
```typescript
// Implement tiered rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts'
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});

// Apply per-route
app.use('/api/auth/login', authLimiter);
app.use('/api/', apiLimiter);
```

#### 3.7 **Inadequate Error Handling**

**CONCERN:** Generic error responses leak implementation details
```typescript
// From errorHandler.ts
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Logs full stack trace
  res.status(500).json({ error: err.message }); // Exposes error details
};
```

**RISK:**
- Information disclosure
- Security vulnerability exposure
- Poor user experience

**RECOMMENDATION:**
```typescript
export const errorHandler = (err, req, res, next) => {
  // Log full details internally
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  });

  // Return sanitized error to client
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    error: message,
    requestId: req.id // For support tracking
  });
};
```

#### 3.8 **Booking Cancellation Logic**

**CONCERN:** Complex cancellation workflow with potential edge cases
```typescript
// From bookingCancellationService.ts (8218 bytes)
// Multiple status transitions without clear state machine
```

**RISK:**
- Inconsistent refund calculations
- Race conditions in status updates
- Orphaned payment records

**RECOMMENDATION:**
- Implement formal state machine pattern
- Add database constraints for valid transitions
- Use event sourcing for audit trail

### 🟢 LOW PRIORITY ISSUES

#### 3.9 **Code Organization**

**CONCERN:** Mixed patterns and inconsistent structure
- Some routes use controllers, others inline handlers
- Service layer not consistently applied
- Model classes vs. utility functions

**RECOMMENDATION:**
- Standardize on layered architecture (Route → Controller → Service → Model)
- Extract business logic from controllers
- Create clear interface boundaries

#### 3.10 **Testing Coverage**

**CONCERN:** Limited test files (13 test files for 40+ source files)
- No integration tests for payment flows
- Missing wallet transaction tests
- No end-to-end booking tests

**RECOMMENDATION:**
```typescript
// Add comprehensive test suites
describe('Wallet Service', () => {
  describe('Credit Operations', () => {
    it('should handle concurrent credits atomically', async () => {
      // Test race conditions
    });
    
    it('should rollback on failure', async () => {
      // Test transaction rollback
    });
  });
});
```

---

## 4. SECURITY ANALYSIS

### 4.1 Current Security Measures

✅ **Implemented:**
- Helmet.js for HTTP headers
- CORS configuration
- JWT authentication
- Password hashing (bcrypt)
- Input validation (Joi)
- Audit logging

❌ **Missing:**
- CSRF protection (middleware exists but not applied)
- SQL injection prevention (using Supabase client, but raw queries exist)
- XSS sanitization
- File upload validation
- API key rotation
- Secrets management (using .env files)

### 4.2 Vulnerability Assessment

| Vulnerability | Severity | Status | Mitigation |
|--------------|----------|--------|------------|
| Payment bypass in dev mode | HIGH | ⚠️ Present | Remove dev mode checks |
| Race conditions in wallet | HIGH | ⚠️ Present | Implement atomic operations |
| Long-lived JWT tokens | MEDIUM | ⚠️ Present | Add refresh token pattern |
| Missing CSRF protection | MEDIUM | ⚠️ Present | Enable CSRF middleware |
| Exposed error details | MEDIUM | ⚠️ Present | Sanitize error responses |
| No rate limiting on auth | MEDIUM | ⚠️ Present | Add auth-specific limits |

---

## 5. PERFORMANCE CONCERNS

### 5.1 Database Query Optimization

**CONCERN:** N+1 query problems in group listings
```typescript
// Likely fetches groups, then members separately
const groups = await getGroups();
for (const group of groups) {
  group.members = await getGroupMembers(group.id); // N+1 problem
}
```

**RECOMMENDATION:**
```sql
-- Use JOIN to fetch in single query
SELECT g.*, 
       json_agg(gm.*) as members
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
GROUP BY g.id;
```

### 5.2 Caching Strategy

**CONCERN:** Analytics cache exists but implementation unclear
```sql
-- analytics_cache table exists with 5 columns
-- But no clear cache invalidation strategy
```

**RECOMMENDATION:**
- Implement Redis for session and query caching
- Add cache invalidation on data mutations
- Use stale-while-revalidate pattern

### 5.3 File Upload Handling

**CONCERN:** Multiple file upload services (S3, Cloudinary)
- No clear strategy for which to use
- Potential for orphaned files
- No file size limits enforced

**RECOMMENDATION:**
```typescript
// Standardize on single provider with fallback
const uploadService = {
  primary: new S3Service(),
  fallback: new CloudinaryService(),
  
  async upload(file: File) {
    try {
      return await this.primary.upload(file);
    } catch (error) {
      logger.warn('Primary upload failed, using fallback');
      return await this.fallback.upload(file);
    }
  }
};
```

---

## 6. SCALABILITY ASSESSMENT

### 6.1 Current Limitations

1. **Single Database Instance**
   - No read replicas
   - No connection pooling configuration
   - Potential bottleneck for analytics queries

2. **Synchronous Payment Processing**
   - Blocking API calls to payment providers
   - No queue system for retries
   - Timeout risks

3. **Cron Job Architecture**
   - Jobs run on single server instance
   - No distributed job scheduling
   - Potential for duplicate execution

### 6.2 Scalability Recommendations

```typescript
// 1. Implement job queue
import Bull from 'bull';

const paymentQueue = new Bull('payments', {
  redis: { host: 'redis', port: 6379 }
});

paymentQueue.process(async (job) => {
  await processPayment(job.data);
});

// 2. Add database connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// 3. Implement read replicas
const readPool = new Pool({
  host: 'read-replica.db.com',
  max: 10
});
```

---

## 7. BUSINESS LOGIC CONCERNS

### 7.1 Contribution System

**CONCERN:** Complex contribution cycle management
- Manual cycle creation required
- No automatic penalty calculation
- Unclear handling of missed payments

**RECOMMENDATION:**
- Automate cycle creation via cron job
- Implement grace period logic in database
- Add notification system for upcoming deadlines

### 7.2 Group Withdrawal Voting

**CONCERN:** Voting mechanism lacks quorum rules
```sql
-- group_withdrawal_approvals table exists
-- But no clear voting threshold logic
```

**RECOMMENDATION:**
```typescript
interface VotingRules {
  quorumPercentage: number; // e.g., 51%
  approvalThreshold: number; // e.g., 66%
  votingPeriodHours: number; // e.g., 48
}

async function processWithdrawal(requestId: string) {
  const votes = await getVotes(requestId);
  const members = await getGroupMembers(groupId);
  
  const quorum = (votes.length / members.length) * 100;
  const approval = (votes.filter(v => v.approved).length / votes.length) * 100;
  
  if (quorum >= rules.quorumPercentage && approval >= rules.approvalThreshold) {
    await executeWithdrawal(requestId);
  }
}
```

### 7.3 Booking Availability

**CONCERN:** No clear overbooking prevention
- Availability checked at booking time
- No locking mechanism
- Potential for double bookings

**RECOMMENDATION:**
```sql
-- Add database constraint
CREATE UNIQUE INDEX idx_no_overlap ON bookings (
  property_id,
  daterange(start_date, end_date, '[]')
) WHERE status IN ('confirmed', 'pending');

-- Or use pessimistic locking
SELECT * FROM properties 
WHERE id = $1 
FOR UPDATE;
```

---

## 8. COMPLIANCE & REGULATORY CONCERNS

### 8.1 Data Privacy (NDPR/GDPR)

**CONCERN:** No clear data retention policy
- User data stored indefinitely
- No data export functionality
- Soft delete not consistently implemented

**RECOMMENDATION:**
```typescript
// Implement data retention policy
interface RetentionPolicy {
  auditLogs: '7 years',
  transactions: '7 years',
  userProfiles: 'until account deletion',
  bookingHistory: '3 years'
}

// Add GDPR compliance endpoints
app.get('/api/user/data-export', async (req, res) => {
  const userData = await exportUserData(req.user.id);
  res.json(userData);
});

app.delete('/api/user/account', async (req, res) => {
  await anonymizeUserData(req.user.id);
  res.json({ message: 'Account deleted' });
});
```

### 8.2 Financial Regulations

**CONCERN:** Wallet system may require licensing
- Acting as payment intermediary
- Holding customer funds
- Facilitating withdrawals

**RECOMMENDATION:**
- Consult with financial regulatory authority
- Consider using licensed payment processor
- Implement proper KYC/AML procedures

### 8.3 NIN Verification

**CONCERN:** NIN data storage and handling
```sql
-- users table stores NIN data
nin_number VARCHAR(11),
nin_full_name VARCHAR(255),
nin_date_of_birth DATE,
nin_address TEXT
```

**RISK:**
- Sensitive PII storage
- Potential data breach impact
- Regulatory compliance requirements

**RECOMMENDATION:**
- Encrypt NIN data at rest
- Implement field-level encryption
- Add access logging for NIN queries
- Consider tokenization service

---

## 9. OPERATIONAL CONCERNS

### 9.1 Monitoring & Observability

**CONCERN:** Limited monitoring infrastructure
- Winston logger for file logging
- Sentry for error tracking
- No metrics collection
- No performance monitoring

**RECOMMENDATION:**
```typescript
// Add comprehensive monitoring
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/metrics';

const meterProvider = new MeterProvider({
  exporter: new PrometheusExporter({ port: 9464 })
});

// Track key metrics
const walletTransactionCounter = meter.createCounter('wallet_transactions_total');
const bookingDurationHistogram = meter.createHistogram('booking_duration_seconds');
const paymentSuccessRate = meter.createCounter('payment_success_rate');
```

### 9.2 Backup & Disaster Recovery

**CONCERN:** No documented backup strategy
- Relying on Supabase backups
- No tested recovery procedures
- No backup verification

**RECOMMENDATION:**
- Implement automated daily backups
- Test recovery procedures monthly
- Document RTO/RPO requirements
- Add point-in-time recovery capability

### 9.3 Deployment Strategy

**CONCERN:** No clear CI/CD pipeline
- Manual deployment process
- No staging environment mentioned
- No rollback strategy

**RECOMMENDATION:**
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: ./deploy.sh staging
      
      - name: Run smoke tests
        run: npm run test:e2e
      
      - name: Deploy to production
        run: ./deploy.sh production
```

---

## 10. RECOMMENDATIONS SUMMARY

### Immediate Actions (Week 1)

1. **Fix payment verification bypass** - Remove dev mode checks
2. **Implement atomic wallet operations** - Use database-level updates
3. **Add refresh token mechanism** - Improve auth security
4. **Enable CSRF protection** - Apply existing middleware
5. **Sanitize error responses** - Prevent information disclosure

### Short-term (Month 1)

6. **Add comprehensive rate limiting** - Protect all endpoints
7. **Implement transaction isolation** - Wrap financial operations
8. **Add database constraints** - Prevent invalid states
9. **Improve error handling** - Standardize error responses
10. **Add monitoring** - Implement metrics collection

### Medium-term (Quarter 1)

11. **Implement job queue** - Async payment processing
12. **Add caching layer** - Redis for performance
13. **Improve test coverage** - 80%+ code coverage
14. **Add read replicas** - Scale database reads
15. **Implement data retention** - GDPR compliance

### Long-term (Year 1)

16. **Microservices architecture** - Separate payment service
17. **Event sourcing** - Audit trail and replay capability
18. **Multi-region deployment** - High availability
19. **Advanced analytics** - Real-time dashboards
20. **Mobile app optimization** - Native performance

---

## 11. RISK MATRIX

| Risk | Likelihood | Impact | Priority | Mitigation Status |
|------|-----------|--------|----------|-------------------|
| Wallet balance corruption | HIGH | CRITICAL | P0 | ⚠️ Not addressed |
| Payment fraud | MEDIUM | CRITICAL | P0 | ⚠️ Partially addressed |
| Data breach | MEDIUM | HIGH | P1 | ⚠️ Partially addressed |
| Service downtime | MEDIUM | HIGH | P1 | ⚠️ Not addressed |
| Regulatory non-compliance | LOW | HIGH | P1 | ⚠️ Not addressed |
| Performance degradation | MEDIUM | MEDIUM | P2 | ⚠️ Not addressed |
| Code maintainability | HIGH | MEDIUM | P2 | ⚠️ Not addressed |

---

## 12. CONCLUSION

MicroFams is a **well-architected platform** with solid foundations, but it has **critical financial security gaps** that must be addressed before production deployment. The database structure is comprehensive and well-normalized, but the application layer lacks proper transaction management and atomic operations.

### Key Strengths
- ✅ Comprehensive feature set
- ✅ Well-structured database
- ✅ Modern tech stack
- ✅ Audit trail implementation
- ✅ Multi-payment provider support

### Critical Weaknesses
- ❌ Wallet transaction race conditions
- ❌ Payment verification bypasses
- ❌ Weak authentication security
- ❌ Missing transaction isolation
- ❌ Inadequate error handling

### Overall Assessment
**Risk Level:** 🔴 **HIGH**  
**Production Readiness:** ⚠️ **NOT READY**  
**Recommended Action:** **Address P0 issues before launch**

---

## APPENDIX A: Database Schema Diagram

```
users (45 cols)
  ├─→ user_wallets (1:1)
  │     └─→ wallet_transactions (1:N)
  │           └─→ withdrawal_requests (1:N)
  ├─→ properties (1:N)
  │     └─→ bookings (1:N)
  │           ├─→ payment_receipts (1:1)
  │           ├─→ booking_communications (1:N)
  │           └─→ booking_status_history (1:N)
  ├─→ groups (creator, 1:N)
  │     ├─→ group_members (N:N)
  │     │     └─→ member_contributions (1:N)
  │     ├─→ contribution_cycles (1:N)
  │     ├─→ group_virtual_accounts (1:1)
  │     └─→ group_withdrawal_requests (1:N)
  │           └─→ group_withdrawal_approvals (1:N)
  ├─→ marketplace_products (1:N)
  │     └─→ orders (1:N)
  ├─→ farm_records (1:N)
  └─→ user_progress (1:N)
        └─→ courses (N:1)
              └─→ course_videos (1:N)
```

---

## APPENDIX B: API Endpoint Inventory

### Authentication
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password`

### Properties & Bookings
- GET/POST `/api/properties`
- GET/PUT/DELETE `/api/properties/:id`
- GET/POST `/api/bookings`
- PUT `/api/bookings/:id/status`

### Groups
- GET/POST `/api/groups`
- GET `/api/groups/:id`
- POST `/api/groups/:id/join`
- GET `/api/groups/:id/members`

### Wallet
- GET `/api/wallet`
- POST `/api/wallet/withdraw`
- GET `/api/wallet/transactions`

### Marketplace
- GET/POST `/api/products`
- GET/POST `/api/orders`
- GET `/api/orders/:id`

### Admin
- GET `/api/admin/users`
- GET `/api/admin/analytics`
- GET `/api/admin/audit-logs`

---

**Document Version:** 1.0  
**Last Updated:** March 26, 2026  
**Next Review:** April 26, 2026
