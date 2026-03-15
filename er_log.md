S C:\Users\NITDA\Desktop\microfarm\backend> npm run dev

> Farmle backend@1.0.0 dev
> nodemon --exec tsx src/index.ts

[nodemon] 3.1.10
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: ts,json
[nodemon] starting `tsx src/index.ts`
2026-03-15 13:24:51 [info]: Cache service initialized with in-memory fallback
🧹 Booking cleanup service started
2026-03-15 13:24:52 [warn]: ⚠️  Cron jobs disabled (development mode)
2026-03-15 13:24:52 [info]:    Set NODE_ENV=production to enable cron jobs
2026-03-15 13:24:52 [info]: Server running on port 3001
2026-03-15 13:24:52 [info]: Environment: development
✅ Email sent to: obedsonfield@gmail.com - New Booking Request
Payment request: {
  bookingId: undefined,
  booking_id: '5341224e-22f6-4f6d-9bc5-ef5243f94799',
  actualBookingId: '5341224e-22f6-4f6d-9bc5-ef5243f94799',
  userId: 'dcabedcc-bfd8-4f97-8dce-e093603e72d7'
}
Found booking: {
  id: '5341224e-22f6-4f6d-9bc5-ef5243f94799',
  property_id: '438af0d2-e8e9-482f-8efa-cdc8239ed619',
  farmer_id: 'dcabedcc-bfd8-4f97-8dce-e093603e72d7',
  start_date: '2027-01-15',
  end_date: '2027-02-14',
  total_amount: 50000,
  status: 'pending_payment',
  payment_status: 'pending',
  created_at: '2026-03-15T12:30:50.623779+00:00',
  updated_at: '2026-03-15T12:30:50.623779+00:00',
  payment_reference: null,
  notes: null,
  rejection_reason: null,
  deleted_at: null,
  cancelled_by: null,
  cancelled_at: null,
  payment_retry_count: 0,
  payment_timeout_at: null
}
✅ Email sent to: iobedson@gmail.com - Payment Receipt - RCP-20260315-0005
2026-03-15 13:31:36 [info]: Receipt email sent to iobedson@gmail.com
2026-03-15 13:35:26 [info]: Receipt download started {"requestId":"download_1773578126921_f3dwk6b1m","bookingId":"5341224e-22f6-4f6d-9bc5-ef5243f94799","userId":"dcabedcc-bfd8-4f97-8dce-e093603e72d7","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0","ip":"::1"}
2026-03-15 13:35:27 [info]: Receipt PDF download successful {"requestId":"download_1773578126921_f3dwk6b1m","receiptId":"092eee38-0738-41a0-b87c-69c0f3dda49e","receipt_number":"RCP-20260315-0005","pdf_url":"https://microfarmas-uploads.s3.us-east-2.amazonaws.com/receipts/RCP-20260315-0005.pdf","processingTime":808}




