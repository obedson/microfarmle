-- Create a test receipt for the booking
INSERT INTO payment_receipts (
    booking_id,
    payment_reference,
    amount,
    currency,
    qr_code
) VALUES (
    '1fcef125-9646-4ea6-8524-d54de20e6afd',
    'manual_test_payment_ref_' || extract(epoch from now()),
    180000,
    'NGN',
    'MICROFAMS-RECEIPT:manual_test_payment_ref_' || extract(epoch from now()) || ':1fcef125-9646-4ea6-8524-d54de20e6afd'
);
