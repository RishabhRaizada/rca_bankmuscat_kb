# Own Accounts (Transfers Between Own Accounts) — Knowledge Base

## Overview
This category covers fund transfers between a customer's own Bank Muscat accounts (e.g., from savings to current, or between multiple accounts held by the same customer). Also covers outgoing transfers to third parties within Bank Muscat and to other Oman banks, standing orders, and transfer-related disputes.

## Transfer Types & Charges
- **Transfer between own accounts**: Free, instant (up to RO 10,000/day, 5 transactions/day via mBanking).
- **Transfer within Bank Muscat to third party**: Free, instant (up to RO 5,000/day, 10 transactions/day).
- **Other bank within Oman (< RO 3,000)**: RO 1.0, same day before 11:44 AM.
- **Other bank within Oman (> RO 3,000)**: RO 4.250, same day before 11:44 AM.
- **Standing instructions (recurring)**: RO 0.500 bz per transaction charge.

## Common Issues & Root Causes

### Transfer Request Not Done
- **What it is**: Customer submitted a transfer request but the funds were not transferred.
- **Root Cause**: Customer Request (inquiry), Human Error (processing error), Operational Issue (system not updated), Signature Issue (mismatch blocking transfer), System Error.
- **Resolution path**: Check The Details And Inform The Customer About Wrong Details Or Insufficient Funds → Inform Customer And Reprocess. If human/system error: Check The Details And Rectify.

### "Bank Is Closed" Error During Transfer
- **What it is**: Customer receives a "bank is closed" error message when attempting to transfer, even during normal business hours. Transfer was unavailable since noon of the affected day.
- **Root Cause**: System Error — signature validation failure within the transfer processing system. The system defaults to fail-safe state (showing "bank is closed") when signature validation fails.
- **Known pattern**: This error persisted for multiple days, indicating a sustained technical or configuration problem not identified through standard monitoring. Customers were unable to fulfil downstream payment commitments to third parties, causing cascading financial impact.
- **Resolution**: Immediately investigate signature validation system; conduct emergency review of system changes and certificate renewals; manually process all pending transfers; contact affected customers proactively.

### Debit from Wrong Account / Wrong Account Debited
- **What it is**: Customer's transfer was debited from the wrong account (e.g., from savings instead of current).
- **Root Cause**: Human Error (wrong source account selected or processed) or Customer Request (customer made the error).
- **Resolution**: Check The Details And Rectify; Inform Customer And Reprocess.

### Amount Credited to Wrong Account
- **Root Cause**: Human Error (wrong account number provided), Operational Issue.
- **Resolution path**: Check Customer Details → Initiate Recall Or Ask Customer To Initiate Recall Depending On Source Of Error → Send Beneficiary Correction Request To Other Bank (if external) → Inform Customer And Reprocess.

### Duplicate Payments / Duplicate Amount Transferred
- **Root Cause**: Human Error (double submission), System Error (duplicate processing).
- **Resolution**: Check Customer Account Statement; Check T24; initiate recall for duplicate.

### Wrong Amount Posted / Credited / Debited
- **Root Cause**: Human Error or System Error.
- **Resolution**: Check Customer Account Statement → Check Details And Rectify → Inform Customer And Reprocess.

### Stopped Cheque Paid
- **What it is**: A cheque the customer requested to be stopped was still processed and paid.
- **Root Cause**: Human Error (stop order not entered in T24) or System Error (stop order overridden).
- **Resolution**: Check Customer Account Statement; investigate and rectify.

## Key Operational Facts
- Own-account transfers: instant and free up to daily limits.
- Signature validation errors manifest as misleading "bank is closed" messages — always suspect technical authentication issues when this error appears.
- Recall process: Bank Muscat can initiate a recall of a wrong transfer. Success depends on whether the receiving bank/account has been credited. Customer may need to contact their recipient directly if funds already disbursed.
- For outgoing transfers that need correction: "Inform Customer And Reprocess" means cancel the failed/wrong transaction and resubmit with correct details.
