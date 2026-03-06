-- Add pending_payment status to bookings
-- This allows bookings to be created before payment is completed

-- Drop existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add new constraint with pending_payment status
ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending_payment', 'pending', 'confirmed', 'cancelled', 'completed'));

-- Update any existing pending bookings with unpaid status to pending_payment
UPDATE bookings 
SET status = 'pending_payment' 
WHERE status = 'pending' 
  AND payment_status = 'pending'
  AND created_at > NOW() - INTERVAL '30 minutes';
