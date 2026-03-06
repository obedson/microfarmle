| payment_status |
| -------------- |
| paid           |
| pending        |


1. Is there a mobile app using these same APIs?   = Yes
 2. Are there any other systems/integrations depending on current structure?  =  Like what?
 3. Should I create a feature branch or work on main?  =  Work on main
 4. Any specific UI framework preferences (current uses Tailwind)?  =  Use Tailwind

 3. Approve the redesign approach:
   - ✅ Create new reusable components (BookingCard, BookingFilters, etc.)
   - ✅ Update MyBookings.tsx and OwnerBookings.tsx to use new components
   - ✅ Keep all API calls and data structures unchanged
   - ✅ Add new features (cancel, filters, timeline) without breaking existing  = Approved!

   Very Important: Don't change function name to avoid name mismatch in the database


   | column_name       | data_type                | is_nullable |
| ----------------- | ------------------------ | ----------- |
| id                | uuid                     | NO          |
| property_id       | uuid                     | YES         |
| farmer_id         | uuid                     | YES         |
| start_date        | date                     | NO          |
| end_date          | date                     | NO          |
| total_amount      | numeric                  | NO          |
| status            | character varying        | YES         |
| payment_status    | character varying        | YES         |
| created_at        | timestamp with time zone | YES         |
| updated_at        | timestamp with time zone | YES         |
| payment_reference | text                     | YES         |
| notes             | text                     | YES         |
| rejection_reason  | text                     | YES         |
| deleted_at        | timestamp with time zone | YES         |
| cancelled_by      | uuid                     | YES         |
| cancelled_at      | timestamp with time zone | YES         |