# Customer Details — Knowledge Base

## Overview
This category covers all customer profile/data update requests: name, phone number, email, address, ID/passport, signature, and periodic KYC renewal (Re-KYC). Processing delays in this category directly impact customers' ability to use services — an outdated phone number blocks OTPs; an outdated address causes card/statement delivery failures.

## Types of Updates
- **Phone Number**: Must match the number used for OTP and mobile banking. Can be updated at branch or ATM; NOT via mBanking (requires verification).
- **Email**: Can be updated via mBanking (Requests → Change Email ID) or branch.
- **Mailing Address**: Branch update with supporting documents.
- **Customer Name**: Branch update with legal name change documentation.
- **ID / Passport / Civil ID**: Branch update with original documents. Critical for KYC compliance.
- **Signature**: Must be captured correctly in the system. Used for document/cheque verification.
- **Power of Attorney**: Requires specific legal documentation; inter-branch coordination may be needed.
- **Re-KYC**: Periodic identity document renewal mandated by Central Bank of Oman. All customers must renew KYC documents periodically.

## Common Issues & Root Causes

### Phone Number Not Updated
- **Root Cause**: Customer Request (standard update), Operational Issue (update not propagated across systems), Staff Delay (branch didn't process promptly).
- **Impact**: Customer cannot receive OTP → cannot use mBanking or internet banking → high impact.
- **Resolution path**: Check Additional Services Application → Contact Customer If Necessary.
- **SLA**: Should be same-day for routine updates. Delays of 2+ days are unacceptable.

### Email Not Updated
- **Root Cause**: Customer Request, Operational Issue, Staff Delay.
- **Resolution path**: Check Additional Services Application → Contact Customer If Necessary.
- **Note**: Email updates can be self-served via mBanking for routine changes.

### Address Not Updated
- **Root Cause**: Customer Request, Operational Issue, Staff Delay.
- **Resolution path**: Check Additional Services Application → Contact Customer If Necessary.

### Customer Name Not Updated
- **Root Cause**: Customer Request (legal name change), Operational Issue, Staff Delay.
- **Resolution**: Update Customer Details.

### Customer ID / Passport Number Not Updated
- **Root Cause**: Customer Request, Operational Issue, Staff Delay.
- **Resolution path**: Check Additional Services Application → Contact Customer If Necessary.

### Signature Not Captured / Signature Captured Singly Instead of Jointly
- **What it is**: Customer's signature was not recorded in the system, or a joint account signature was recorded as single (only one signatory recorded when two are required).
- **Root Cause**: Signature Issue (missing/incorrect), Human Error (single vs joint error), System Error.
- **Resolution**: Check Additional Services Application → Contact Customer If Necessary.

### Delay in Updating Customer Details (Re-KYC)
- **What it is**: Customer submitted Re-KYC documents but the update hasn't been processed. Account may be restricted pending KYC renewal.
- **Root Cause**: Customer Request, Operational Issue, Staff Delay.
- **Known pattern**: Two-day processing time for routine Re-KYC updates is too slow. Mobile number updates during Re-KYC can cascade — if not updated before the OTP-requiring system update, customer gets locked out.
- **Resolution path**: Check Additional Services Application → Contact Customer If Necessary → expedite processing.

### Customer Detail Not Updated in CBO (Central Bank Register)
- **What it is**: Customer's details were updated at Bank Muscat but not propagated to the Central Bank of Oman's reporting systems (e.g., T24 & Prime).
- **Root Cause**: Operational Issue or System Error.
- **Resolution**: Ask Customer To Submit Application; Check The Systems T24 & Prime.

## Key Operational Facts
- **Additional Services Application**: The internal portal where branch staff process and track customer detail update requests. Always check this first for status.
- **Processing SLA**: Routine updates should be completed same-day. Re-KYC updates causing access restrictions should be expedited.
- **Inter-branch coordination**: Power of attorney and joint account updates often require coordination between multiple branches, adding delay risk.
- **Mobile number is the most critical field**: It gates OTP receipt, mBanking access, and SMS notifications. Delays here have cascading service impact.
- Phone number change cannot be done via mBanking — requires branch visit or ATM update.
