
✦ To test the new Group & Individual Wallet System, follow these steps in your browser:

  1. Initial Setup & Wallet Check
   1. Register or Login: Log in to your Microfams account.
   2. Access Wallet:
       * Click "Wallet" in the top navigation bar, OR
       * Navigate to your "Dashboard" and click the "My Wallet" card.
   3. Verify Balance: You should see a balance of ₦0.00. (The system automatically creates a wallet for you if you didn't have one).

  2. Test P2P Transfer (Internal)
  Note: You need two users for this test. Open a second browser or Incognito window.
   1. Get Recipient ID: From the second user's profile or account settings, copy their User ID (UUID).
   2. Initiate Transfer: In User 1's wallet, paste the ID into the "Recipient ID" field and enter an amount (e.g., 1000).
   3. Confirm: Click "Send Money".
   4. Verification:
       * User 1's balance should decrease.
       * User 2's balance should increase instantly.
       * Both users should see a new "P2P_TRANSFER" entry in their Transaction History.

  3. Test Individual Withdrawal (To Bank)
   1. Enter Details: In the "Withdraw to Bank" section, enter a test account number (e.g., 0123456789), select a bank, and enter an amount (min 1000).
   2. Preview: Click "Preview Withdrawal". The system calls Interswitch to verify the account name and calculate the ₦50 fee.
   3. Confirm: Review the name and total (Amount + Fee) and click "Confirm".
   4. Transaction Status (Sandbox Specific):
       * The transaction will appear as "PENDING" in your history.
       * Because webhooks are disabled in Sandbox, click the "Sync Status (Sandbox)" button next to the pending transaction.
       * The system will query Interswitch and update the status to "SUCCESS".

  4. Test Group Wallet & NUBAN
   1. Create a Group: Go to "Groups" and click "Create Group".
   2. Verify NUBAN: Once created, go to the Group Details page. You should see a "Group Virtual Account" number assigned.
   3. Fund Group (Simulated):
       * In a real scenario, you'd transfer to this NUBAN.
       * For testing, funds will be automatically credited to the group_fund_balance when Interswitch sends a collection notification (or via the manual
         sync/background retry jobs).

  5. Test Group Multi-sig Withdrawal
   1. Initiate: Inside a Group page, initiate a withdrawal to your personal wallet.
   2. Vote:
       * At least 2/3 of members (and the Group Admin) must approve.
       * Other members should log in, go to the group withdrawal request, and click "Approve".
   3. Auto-Execution: Once the threshold is met, the funds will automatically move from the Group Fund to your Individual Wallet. Check your wallet balance
      to verify.

  6. Verification of Security
   * Rate Limiting: Try to initiate 11 transfers within 1 minute; the system should block you.
   * Daily Limits: Try to withdraw more than ₦100,000; the system should reject it.
   * Immutability: Try to delete a transaction from the database (if you have DB access); the RLS policies will block the action.
                                                                                                                                        