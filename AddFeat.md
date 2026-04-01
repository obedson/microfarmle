================================================================
PROJECT SPECIFICATION: GROUP & INDIVIDUAL WALLET SYSTEM
PLATFORM: INTERSWITCH API ECOSYSTEM (2026)
================================================================

1. CORE SYSTEM ARCHITECTURE
----------------------------------------------------------------
The system operates on a "Hybrid Ledger" model. Real-world 
monetary movements are handled by Interswitch, while internal 
payouts (Group to Individual) are handled by your private 
database ledger.

2. KEY FEATURES & WORKFLOWS
----------------------------------------------------------------
A. Group Funding (Inward)
   - Every group is assigned a Unique Virtual NUBAN.
   - Members transfer funds from any bank to this NUBAN.
   - API: Virtual Accounts API (Static/Dynamic).
   - Update: System listens for Webhooks to credit the Group Ledger.

B. Group to Individual Wallet (Internal)
   - User clicks "Withdraw" on the group dashboard.
   - Logic: Backend verifies group balance, debits Group_Table, 
     and credits User_Wallet_Table.
   - API: None (Internal Database Transaction). No fees incurred.

C. Individual Wallet to Bank (Outward)
   - User clicks "Withdraw to Bank" from their personal wallet.
   - Step 1: Name Enquiry API (Validate destination account).
   - Step 2: Transfer/Disbursement API (Move real funds from 
     Merchant Pool to User's Bank).
   - Step 3: Deduct User_Wallet_Table upon 'SUCCESS' notification.

D. P2P Transfers (User to User)
   - Instant transfers between app users.
   - Logic: Internal Database Debit/Credit.

3. REQUIRED INTERSWITCH API ENDPOINTS
----------------------------------------------------------------
- PASSPORT API: 
  For OAuth2 Authentication and Access Token generation.
  
- VIRTUAL ACCOUNTS API: 
  To generate unique account numbers for each group.
  
- NAME ENQUIRY API: 
  To verify bank account details before external withdrawals.
  
- SINGLE TRANSFER API: 
  To process the final payout from your merchant pool to 
  external bank accounts.
  
- TRANSACTION SEARCH / STATUS API: 
  To query the final state of any pending disbursement.

4. DATABASE LEDGER STRATEGY (SQL SUGGESTION)
----------------------------------------------------------------
To maintain integrity, use a 'Transactions' table to log every 
movement:
- transaction_id (UUID)
- source_id (Group_ID or User_ID)
- destination_id (User_ID or Bank_Account)
- amount (Decimal)
- type (COLLECTION, INTERNAL_TRANSFER, WITHDRAWAL)
- status (PENDING, SUCCESS, FAILED)

5. SECURITY & COMPLIANCE
----------------------------------------------------------------
- IP Whitelisting: Ensure your server IP is whitelisted on the 
  Interswitch Developer Console.
- Multi-Sig Logic: Implement backend logic requiring 'X' 
  approvals for group withdrawals.
- Encryption: Use TLS 1.2+ for all API calls and protect your 
  Client Secret.

================================================================
END OF DOCUMENT
================================================================