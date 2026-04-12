-- Migration: Add Group Consensus Capabilities

-- Rename tables
ALTER TABLE group_withdrawal_requests RENAME TO group_consensus_requests;
ALTER TABLE group_withdrawal_approvals RENAME TO group_consensus_approvals;

-- Expand status check first before renaming constraints
ALTER TABLE group_consensus_requests DROP CONSTRAINT IF EXISTS group_withdrawal_requests_status_check;
ALTER TABLE group_consensus_requests ADD CONSTRAINT group_consensus_requests_status_check CHECK (status IN ('PENDING','APPROVED','FAILED','EXECUTED', 'REJECTED'));

-- Relax amount constraint to allow 0 amount for admin changes
ALTER TABLE group_consensus_requests DROP CONSTRAINT IF EXISTS group_withdrawal_requests_amount_check;
ALTER TABLE group_consensus_requests ADD CONSTRAINT group_consensus_requests_amount_check CHECK (amount >= 0);

-- Add new columns
ALTER TABLE group_consensus_requests ADD COLUMN IF NOT EXISTS request_type VARCHAR(30) DEFAULT 'WITHDRAWAL' CHECK (request_type IN ('WITHDRAWAL', 'BOOKING_PAYMENT', 'ADMIN_CHANGE'));
ALTER TABLE group_consensus_requests ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE group_consensus_requests ADD COLUMN IF NOT EXISTS proposed_admin_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Target User is now optional for admin change type requests and booking payments
ALTER TABLE group_consensus_requests ALTER COLUMN target_user_id DROP NOT NULL;

-- Rename indexes for clarity
ALTER INDEX IF EXISTS idx_gwr_group_id RENAME TO idx_gcr_group_id;
ALTER INDEX IF EXISTS idx_gwr_status RENAME TO idx_gcr_status;
ALTER INDEX IF EXISTS idx_gwa_request_id RENAME TO idx_gca_request_id;

-- Make sure the fkey inside approvals points correctly without causing a name conflict on delete cascade drops
ALTER TABLE group_consensus_approvals DROP CONSTRAINT IF EXISTS group_withdrawal_approvals_approval_request_id_fkey;
ALTER TABLE group_consensus_approvals ADD CONSTRAINT group_consensus_approvals_request_id_fkey FOREIGN KEY (approval_request_id) REFERENCES group_consensus_requests(id) ON DELETE CASCADE;

-- RPC for booking payment
CREATE OR REPLACE FUNCTION process_group_fund_payment(
  p_booking_id UUID,
  p_group_id UUID,
  p_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_group_balance NUMERIC;
BEGIN
  -- Check group balance
  SELECT group_fund_balance INTO v_group_balance FROM groups WHERE id = p_group_id FOR UPDATE;
  
  IF v_group_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient group funds: balance is %, requested %', v_group_balance, p_amount;
  END IF;

  -- Update group balance
  UPDATE groups
  SET group_fund_balance = group_fund_balance - p_amount,
      updated_at = NOW()
  WHERE id = p_group_id;

  -- Update booking status to paid
  UPDATE bookings
  SET payment_status = 'paid',
      status = 'confirmed',
      updated_at = NOW()
  WHERE id = p_booking_id;

  -- Hypothetically, we should insert a wallet transaction for the platform to trace this, but keeping it simple for now.

  RETURN jsonb_build_object(
    'booking_id', p_booking_id,
    'group_id', p_group_id,
    'amount', p_amount,
    'status', 'EXECUTED'
  );
END;
$$ LANGUAGE plpgsql;


