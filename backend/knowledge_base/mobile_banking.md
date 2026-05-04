# Mobile Banking (mBanking) — Knowledge Base

## Overview
Bank Muscat's mobile banking application (mBanking) is available on iOS (App Store), Android (Google Play), and Huawei (App Gallery). It provides 24/7 banking access. This category covers complaints and inquiries about the mBanking app and the BM Apps suite. The app also handles Meethaq Islamic banking accounts.

## What the App Offers
- Account balances and 3-month transaction history; mini-statement (last 25 transactions)
- Fund transfers: own accounts (free), within Bank Muscat (free), other Oman banks (RO 1.0 / RO 4.250), SWIFT international, Speed Transfer (India, Sri Lanka, Philippines, Bangladesh, Pakistan, Egypt at RO 1.5)
- Bill payments: Omantel, Ooredoo, Awasr, Renna, Water/Electricity (OIFC, ONEIC), PASI, school fees, credit card payments
- Requests: cheque book, new FD, savings account opening, debit/credit/prepaid card PIN generation, card blocking, email update, international access enable/disable for cards
- Mobile Payment (bm wallet): P2P transfers via mobile number, alias, or QR; merchant payments
- Scheduled/recurring transfers and standing instructions
- Personal Finance Management (PFM): budget tracking, income/expense analysis, transaction categorisation

## Registration & Access
- Registration requires: ATM/Debit card number + bank-registered mobile number + OTP
- One device per mobile number (no multi-user on one device)
- Forgot User ID: enter mobile number + ATM card → OTP → User ID sent to mobile
- Forgot Password: enter User ID + ATM card → OTP → create new password
- Lost phone: call 24795555 to deactivate; then reactivate with "New Phone" option + OTP
- Mobile number change: must visit branch or update at ATM (cannot be done in-app)

## Common Issues & Root Causes

### App Opening With Black Screen / Freezing
- **What it is**: App loads to a black screen and hangs; requires force-close and reopen.
- **Root Cause**: Application usability issue — frontend rendering failure, often during high-load periods or after app updates.
- **Known pattern**: Occurred significantly during January 2025 salary disbursement period due to insufficient load balancing under peak transaction volume.
- **Resolution**: Check Application Outage, forward feedback to support/development team.

### App Completely Unavailable
- **Root Cause**: System Error — backend service unavailability or planned maintenance without adequate customer communication.
- **Resolution**: Check if outage is known; advise alternative channels (branch, ATM, call centre 24795555); escalate to IT.

### OTP Not Received
- **Root Cause**: Operational Issue (wrong phone number in system) or System Error (SMS gateway failure).
- **Resolution**: Verify and update customer's registered mobile number; Rectify Technical Issue if gateway is at fault.

### Fund Transfer Failures / Amount Reversed
- **What it is**: Transfer submitted but funds reversed, sometimes with a different amount than originally sent.
- **Root Cause**: System Error — backend transaction processing failure, database synchronisation issue between mobile platform and core banking (T24).
- **Known pattern**: Fund reversals with amount discrepancies occurred during January 2025 salary period — reconciliation was needed for all affected transactions.
- **Resolution**: Inform Customer And Reprocess; check T24 for transaction status; escalate if amount discrepancy.

### Registration / Login Issues
- **Root Cause**: Operational Issue (system configuration) or System Error.
- **Resolution**: Contact Customer And Inform Accordingly; Rectify Technical Error.

### Beneficiary Information Lost
- **Root Cause**: System Error — data integrity failure during high-load period.
- **Resolution**: Restore from backup; advise customer to re-add beneficiaries.

## Internal Systems Involved
- **T24**: Core banking — source of truth for account balances and transaction records.
- **Prime**: Card transactions and payments verification.
- **Mobile Banking Backend**: Separate layer connecting the app to T24/Prime.

## SLAs & Key Facts
- Within-Oman transfers: same day if before 11:44 AM; next working day after.
- International SWIFT: same day before 14:00 (non-Eastern); next day (Eastern currencies).
- App is free — customer only pays telecom data charges.
- Call Centre: 24795555 (24/7).

## Critical Operational Context
- **January 2025 incident**: System experienced widespread mobile banking failures coinciding with the first salary disbursement cycle of 2025. Multiple concurrent issues: app crashes (black screen), fund transfer reversals with amount shortages, loss of beneficiary information. Full reconciliation of reversed transactions was required. This is a known incident that may be referenced in historical complaints.
- The bank markets itself as "Number 1" in Oman — service failures on mobile banking carry high reputational risk.
