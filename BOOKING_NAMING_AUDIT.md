# Booking System Naming Convention Audit

## 📋 CURRENT IMPLEMENTATION AUDIT

### Database Tables
```
✅ bookings (main table)
✅ booking_status_history (audit trail)
✅ properties (referenced)
✅ users (referenced)
```

### Database Columns - `bookings` table
```sql
✅ id (uuid)
✅ property_id (uuid) → FK to properties(id)
✅ farmer_id (uuid) → FK to users(id)
✅ start_date (date)
✅ end_date (date)
✅ total_amount (numeric)
✅ status (varchar) - CHECK constraint
✅ payment_status (varchar) - CHECK constraint
✅ payment_reference (text)
✅ notes (text)
✅ rejection_reason (text)
✅ created_at (timestamp)
✅ updated_at (timestamp)
✅ cancelled_at (timestamp) - NEW
✅ cancelled_by (uuid) - NEW
✅ deleted_at (timestamp) - NEW
```

### Status Values (MUST MATCH)
```typescript
status: 'pending_payment' | 'pending' | 'confirmed' | 'cancelled' | 'completed'
payment_status: 'pending' | 'paid' | 'failed'
```

### API Endpoints (DO NOT CHANGE)
```
POST   /api/bookings                           → createBooking
GET    /api/bookings/my-bookings               → getMyBookings
GET    /api/bookings/owner/bookings            → getOwnerBookings
GET    /api/bookings/owner/stats               → getBookingStats
GET    /api/bookings/property/:id/booked-dates → getBookedDates
GET    /api/bookings/:id                       → getBookingById
PUT    /api/bookings/:id/status                → updateBookingStatus
PUT    /api/bookings/:id/cancel                → cancelBooking
```

### Frontend Routes (DO NOT CHANGE)
```
/my-bookings      → MyBookings component
/owner/bookings   → OwnerBookings component
```

### Frontend API Client (DO NOT CHANGE)
```typescript
bookingAPI.create(data)
bookingAPI.getMyBookings()
bookingAPI.getBookedDates(propertyId)
```

### TypeScript Interface (MUST MATCH DATABASE)
```typescript
export interface Booking {
  id: string;
  property_id: string;        // NOT propertyId
  farmer_id: string;          // NOT farmerId
  start_date: string;         // NOT startDate
  end_date: string;           // NOT endDate
  total_amount: number;       // NOT totalAmount
  status: 'pending_payment' | 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_reference?: string; // NOT paymentReference
  notes?: string;
  rejection_reason?: string;  // NOT rejectionReason
  created_at: string;         // NOT createdAt
  updated_at: string;         // NOT updatedAt
}
```

---

## ⚠️ CRITICAL NAMING RULES

### 1. Database Uses Snake_Case
```
✅ property_id
✅ farmer_id
✅ start_date
✅ payment_status
✅ created_at

❌ propertyId
❌ farmerId
❌ startDate
❌ paymentStatus
❌ createdAt
```

### 2. API Responses Use Snake_Case (from database)
```json
{
  "id": "uuid",
  "property_id": "uuid",
  "farmer_id": "uuid",
  "start_date": "2026-01-01",
  "payment_status": "paid"
}
```

### 3. Frontend Receives Snake_Case
```typescript
// ✅ CORRECT - Access as received from API
booking.property_id
booking.start_date
booking.payment_status

// ❌ WRONG - Don't convert to camelCase
booking.propertyId
booking.startDate
booking.paymentStatus
```

### 4. Supabase Queries Use Snake_Case
```typescript
// ✅ CORRECT
.select('property_id, farmer_id, start_date')
.eq('payment_status', 'paid')

// ❌ WRONG
.select('propertyId, farmerId, startDate')
.eq('paymentStatus', 'paid')
```

---

## 🔍 CURRENT QUERY PATTERNS

### Owner Bookings Query
```typescript
// From OwnerBookings.tsx
axios.get(`${API_URL}/bookings/owner/bookings`, {
  headers: { Authorization: `Bearer ${token}` },
  params: { status: statusFilter } // if not 'all'
})

// Returns:
{
  success: true,
  data: [
    {
      id: "uuid",
      property_id: "uuid",
      farmer_id: "uuid",
      start_date: "2026-01-01",
      end_date: "2026-01-31",
      total_amount: 50000,
      status: "pending",
      payment_status: "paid",
      properties: {
        title: "Farm Name",
        city: "Lagos"
      },
      users: {
        name: "John Doe",
        email: "john@example.com",
        phone: "08012345678"
      }
    }
  ]
}
```

### My Bookings Query
```typescript
// From MyBookings.tsx
bookingAPI.getMyBookings()

// Returns same structure with nested properties and users
```

---

## 📝 REDESIGN CONSTRAINTS

### What CAN Be Changed:
✅ UI layout and styling
✅ Component structure (as long as props match)
✅ Add new UI elements (buttons, cards, filters)
✅ Add new state management
✅ Improve error handling
✅ Add loading states
✅ Add animations

### What CANNOT Be Changed:
❌ API endpoint URLs
❌ Database column names
❌ Status value strings
❌ Query parameter names
❌ Response data structure
❌ Route paths (/my-bookings, /owner/bookings)
❌ API client method names

---

## 🎯 SAFE REDESIGN APPROACH

### Step 1: Create New Components (Don't Touch Existing)
```
frontend/src/components/bookings/
├── BookingCard.tsx          (NEW - display single booking)
├── BookingList.tsx          (NEW - list of bookings)
├── BookingFilters.tsx       (NEW - filter controls)
├── BookingStats.tsx         (NEW - stats display)
└── BookingTimeline.tsx      (NEW - status timeline)
```

### Step 2: Update Pages to Use New Components
```typescript
// MyBookings.tsx - ONLY change JSX, keep API calls
const { data, isLoading } = useQuery({
  queryKey: ['my-bookings'],
  queryFn: bookingAPI.getMyBookings  // ✅ DON'T CHANGE
});

const bookings = data?.data?.data || [];  // ✅ DON'T CHANGE

// ✅ ONLY change this part:
return (
  <BookingList 
    bookings={bookings}
    type="farmer"
    onCancel={handleCancel}
  />
);
```

### Step 3: Add New API Methods (Don't Modify Existing)
```typescript
// frontend/src/api/client.ts
export const bookingAPI = {
  create: (data: any) => apiClient.post('/bookings', data),  // ✅ KEEP
  getMyBookings: () => apiClient.get('/bookings/my-bookings'), // ✅ KEEP
  getBookedDates: (propertyId: string) => 
    apiClient.get(`/bookings/property/${propertyId}/booked-dates`), // ✅ KEEP
  
  // ✅ ADD NEW (if needed)
  cancelBooking: (id: string, reason: string) =>
    apiClient.put(`/bookings/${id}/cancel`, { reason }),
  getBookingHistory: (id: string) =>
    apiClient.get(`/bookings/${id}/history`),
};
```

---

## 🚨 BEFORE IMPLEMENTATION CHECKLIST

Before making ANY changes, verify:

1. [ ] Run database audit query (provided above)
2. [ ] Confirm exact column names match
3. [ ] Confirm status values in use
4. [ ] Test current API endpoints work
5. [ ] Document any discrepancies found
6. [ ] Get approval for naming changes (if any needed)
7. [ ] Create backup branch
8. [ ] Test in development first

---

## 📊 REQUIRED: Run This Query First

```sql
-- Save results to db.md before proceeding
-- This confirms exact naming in production

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

SELECT DISTINCT status FROM bookings;
SELECT DISTINCT payment_status FROM bookings;

-- Check foreign key names
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'bookings' 
  AND tc.constraint_type = 'FOREIGN KEY';
```

---

## 🎨 PROPOSED REDESIGN PLAN (PENDING APPROVAL)

### Phase 1: UI Components Only (No API Changes)
- Create BookingCard component
- Create BookingFilters component
- Create BookingTimeline component
- Update MyBookings.tsx to use new components
- Update OwnerBookings.tsx to use new components

### Phase 2: Add Missing Features (New API Endpoints)
- Add cancel booking functionality
- Add booking history modal
- Add receipt generation
- Add property filter

### Phase 3: Enhanced Features
- Add calendar view
- Add analytics
- Add messaging

---

## ✅ APPROVAL NEEDED

Before proceeding with redesign, please confirm:

1. [ ] Database audit results reviewed
2. [ ] Naming conventions confirmed
3. [ ] No breaking changes to existing APIs
4. [ ] Component-only changes approved
5. [ ] New API endpoints (if any) approved
6. [ ] Timeline approved

---

## 📞 QUESTIONS TO ANSWER

1. **Are there any other booking-related tables I missed?**
2. **Are there any custom views or materialized views for bookings?**
3. **Are there any stored procedures that use specific column names?**
4. **Is there a mobile app that also uses these APIs?**
5. **Are there any third-party integrations that depend on current structure?**
6. **What's the rollback plan if redesign causes issues?**

---

## 🔐 SAFETY MEASURES

1. **Create feature branch:** `feature/booking-dashboard-redesign`
2. **No direct changes to:** API routes, database schema, existing endpoints
3. **All changes:** Additive only (new components, new features)
4. **Testing:** Full regression testing before merge
5. **Rollback:** Keep old components as backup
6. **Documentation:** Update API docs if new endpoints added

---

**STATUS:** ⏸️ AWAITING APPROVAL TO PROCEED

**NEXT STEP:** Run database audit query and share results
