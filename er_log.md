[nodemon] starting `tsx src/index.ts`
2026-03-15 12:12:34 [info]: Cache service initialized with in-memory fallback
🧹 Booking cleanup service started
2026-03-15 12:12:38 [warn]: ⚠️  Cron jobs disabled (development mode)
2026-03-15 12:12:38 [info]:    Set NODE_ENV=production to enable cron jobs
2026-03-15 12:12:38 [info]: Server running on port 3001
2026-03-15 12:12:38 [info]: Environment: development
✅ Email sent to: obedsonfield@gmail.com - New Booking Request
Payment request: {
  bookingId: undefined,
  booking_id: '270c1c40-eacd-4e9b-8daf-cb1dc24cac73',
  actualBookingId: '270c1c40-eacd-4e9b-8daf-cb1dc24cac73',
  userId: 'dcabedcc-bfd8-4f97-8dce-e093603e72d7'
}
Found booking: {
  id: '270c1c40-eacd-4e9b-8daf-cb1dc24cac73',
  property_id: '438af0d2-e8e9-482f-8efa-cdc8239ed619',
  farmer_id: 'dcabedcc-bfd8-4f97-8dce-e093603e72d7',
  start_date: '2026-12-15',
  end_date: '2027-01-14',
  total_amount: 50000,
  status: 'pending_payment',
  payment_status: 'pending',
  created_at: '2026-03-15T11:21:45.398009+00:00',
  updated_at: '2026-03-15T11:21:45.398009+00:00',
  payment_reference: null,
  notes: null,
  rejection_reason: null,
  deleted_at: null,
  cancelled_by: null,
  cancelled_at: null,
  payment_retry_count: 0,
  payment_timeout_at: null
}
✅ Email sent to: iobedson@gmail.com - Payment Receipt - RCP-20260315-0003
2026-03-15 12:22:53 [info]: Receipt email sent to iobedson@gmail.com
2026-03-15 12:23:46 [info]: Receipt download started {"requestId":"download_1773573826487_2g82mrgov","bookingId":"270c1c40-eacd-4e9b-8daf-cb1dc24cac73","userId":"dcabedcc-bfd8-4f97-8dce-e093603e72d7","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0","ip":"::1"}
2026-03-15 12:23:49 [info]: Receipt PDF download successful {"requestId":"download_1773573826487_2g82mrgov","receiptId":"70d7237c-4be1-4fa1-aaea-d77f15af4f2d","receipt_number":"RCP-20260315-0003","pdf_url":"https://microfarmas-uploads.s3.us-east-2.amazonaws.com/receipts/RCP-20260315-0003.pdf","processingTime":2680}
