# Bank Muscat Devices (ATM / CDM) — Knowledge Base

## Overview
This category covers Bank Muscat's ATM and Cash Deposit Machine (CDM/BCDM) network within Oman. These machines form a critical part of Bank Muscat's self-service infrastructure. Bank Muscat markets itself as "Number 1" in Oman — prolonged device failures directly challenge this positioning and cause high reputational risk.

## Device Types
- **ATM**: Cash withdrawal, balance inquiry, mini-statement, PIN change, mobile banking registration.
- **CDM / BCDM (Bank Cash Deposit Machine)**: Cash deposits that should credit the customer's account immediately or by end of business day.
- **Deposit machines** and **ATMs** may be referenced interchangeably in customer complaints.

## Common Issues & Root Causes

### Out of Service / Machine Under Maintenance
- **What it is**: Machine displays "under maintenance" or is otherwise unavailable for extended periods. Customers report 5+ hour maintenance windows without resolution.
- **Root Cause**: System Error — ATM network connectivity or transaction processing failure. Simultaneous failures across multiple locations suggest centralised system malfunction, not isolated hardware fault.
- **Known pattern**: Multiple devices simultaneously failing suggests architectural single point of failure in the ATM network. Extended resolution times (5+ hours) indicate either insufficient technical support capacity or complex system integration issues.
- **Resolution**: Check The Machine → dispatch E-Channels technical team immediately; proactively communicate to customers via branch/social media about expected resolution time.

### Cash Not Received from Bank Muscat ATM
- **What it is**: Customer attempted withdrawal, amount was debited from account, but cash was not dispensed.
- **Root Cause**: System Error — failure in two-phase commit (debit succeeded, dispensing failed); ATM hardware malfunction.
- **Resolution path**: ATM Details → Check Customer Details FT Number → Machine Roll. Verify transaction in T24; initiate reversal if cash was not dispensed; contact customer.

### Cash Not Credited Within Own Account (CDM Deposit)
- **What it is**: Customer deposited cash in a CDM but the amount was not credited to their account.
- **Root Cause**: Human Error (deposit form error), Operational Issue, System Error (CDM processing failure).
- **Resolution path**: BCDM Location → CDM Details → Check Customer Details → Machine Roll → Contact Customer If Necessary.

### Partial Cash Credited / Partial Cash Received
- **What it is**: Less cash than deposited/expected was credited or dispensed.
- **Root Cause**: Human Error or System Error — partial processing or cash jamming during deposit/dispensing.
- **Resolution path**: Same as above — CDM Details, Machine Roll to verify physical cash vs. credited amount.

### Amount Retracted but Not Reversed
- **What it is**: ATM retracted the cash (pulled back into machine) but the account was still debited.
- **Root Cause**: System Error — machine retracted cash after dispensing due to timeout, but reversal didn't process.
- **Resolution path**: ATM Details → Check Customer Details FT Number → Machine Roll.

### Cash Debited More Than Once
- **Root Cause**: System Error — duplicate transaction processing at ATM.
- **Resolution path**: ATM Details → Machine Roll → verify in T24 → initiate reversal for duplicate.

### Receipt Not Available
- **Root Cause**: System Error — printer malfunction or paper roll empty.
- **Resolution**: Check The Machine.

### Unable to Insert Card
- **Root Cause**: System Error — card reader malfunction.
- **Resolution**: Check The Machine.

### Requested Denomination Not Available
- **Root Cause**: System Error — denomination selection failure or machine loaded with limited notes.
- **Resolution**: Check ATM.

## Internal Systems & Teams
- **E-Channels Team**: Responsible for ATM/CDM network monitoring and technical maintenance. Primary escalation for device issues.
- **Machine Roll**: Physical cassette log inside the machine — used for reconciliation of cash discrepancies.
- **FT Number (Funds Transfer Number)**: Transaction reference from ATM — critical for dispute investigation.
- **T24**: Verify transaction was debited/credited in core banking system.

## Key Operational Facts
- Extended downtime (5+ hours) = critical failure. Requires immediate escalation and customer communication.
- Simultaneous failures across multiple locations = network-level issue, not isolated hardware.
- Customer impact: inability to access cash for essential needs (fuel, meals) is a genuine hardship — treat with urgency.
- "Machine Roll" check is the definitive way to reconcile physical cash vs. digital transaction records.
- Barka branch incident: Deposit machine under maintenance for 5+ hours — representative of the type of issue in this category.
