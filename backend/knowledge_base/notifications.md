# Notifications — Knowledge Base

## Overview
Bank Muscat sends customers SMS and email notifications for transactions, account events, and security alerts. OTPs (One-Time Passwords) are also delivered via SMS. This category covers failures in SMS alerts, email notifications, and OTP delivery.

## Notification Types
- **SMS Notifications**: Transaction alerts (debits, credits), account event alerts, marketing messages. Sent to registered mobile number.
- **Email Notifications**: E-statements, marketing emails, VAT invoices, digital alerts. Sent to registered email address.
- **OTP (One-Time Password)**: Security code for mBanking transactions and internet banking authentication. Sent via SMS to registered mobile number. Critical for transaction authorisation.

## Common Issues & Root Causes

### SMS Notifications Not Received
- **Root Cause**: Operational Issue (wrong/outdated mobile number in system) or System Error (SMS gateway failure, service outage).
- **Known pattern**: "How long do you need?" — indicates an extended ongoing issue, suggesting either a persistent technical fault or failure in monitoring systems to detect notification delivery failures.
- **Resolution path**: Verify customer's registered mobile number in system → Update Customer Details if wrong → Technical Issue Rectified if gateway is at fault → escalate to SMS gateway provider if systemic.

### Email Notifications Not Received
- **Root Cause**: Operational Issue (wrong/outdated email in system) or System Error (email delivery failure).
- **Resolution path**: Update Customer Details (update email address) → Technical Issue Rectified if system-side.

### OTP Not Received (see also Internet Banking Services)
- **Root Cause**: Operational Issue (wrong phone number registered) or System Error (SMS gateway failure).
- **Impact**: High — customer cannot complete transactions or access internet banking without OTP.
- **Resolution**: Contact Customer And Inform Accordingly → Rectify Technical Issue → verify registered mobile number.

### Wrong Language Set for Notification
- **What it is**: Customer receiving notifications in wrong language (Arabic vs English).
- **Root Cause**: Branch Delay (language preference not set correctly), Customer Request (change needed), Operational Issue.
- **Resolution path**: Branch needs to check Customer Application → Check Customer AOF Form → Check T24 → Rectify The Error.

## Key Operational Facts
- **Registered mobile number is the single most important field** for notification delivery. An outdated number silently blocks all SMS notifications and OTPs.
- SMS gateway failures affect all customers simultaneously — check if this is a single-customer issue or systemic.
- Email notifications require a valid, correctly spelled email address in the system.
- Language preference for notifications is set at account opening (AOF) and can be updated at branch.
- If SMS is failing for a single customer: most likely wrong phone number on file.
- If SMS is failing for multiple customers simultaneously: most likely SMS gateway/system issue — escalate to IT.
- VAT invoices are sent via email (see also VAT Invoice issues under Internet Banking Services).
