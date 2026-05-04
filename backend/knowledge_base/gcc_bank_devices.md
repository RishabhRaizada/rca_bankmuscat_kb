# GCC Bank Devices — Knowledge Base

## Overview
This category covers failures when Bank Muscat customers use their debit or credit cards at ATMs operated by other GCC banks (Saudi Arabia, UAE, Kuwait, Bahrain, Qatar). These are cross-border, multi-party transactions involving at least three systems: Bank Muscat's card system (Prime/T24), the international card network (Visa or Mastercard), and the acquiring bank's ATM system.

## Common Issues & Root Causes

### Cash Not Received (GCC ATM)
- **What it is**: Customer withdrew from a GCC ATM (e.g., Jeddah, Saudi Arabia), account was debited, but cash was not dispensed.
- **Root Cause**: System Error — breakdown in two-phase commit protocol. The debit authorisation was approved and processed, but the ATM dispensing mechanism failed. The ATM did not send a reversal message back to Bank Muscat.
- **Known pattern**: Cross-border settlement adds latency and failure points — the acquiring bank's system, the card network switch, and Bank Muscat's issuing system must all align. When communication breaks down, the customer is debited without receiving cash.
- **Resolution path**:
  1. Check the transaction in Prime (card system) — verify authorisation and settlement status.
  2. Contact the customer for additional information if needed.
  3. Contact the other bank (acquiring bank) for transaction confirmation.
  4. Raise a dispute on behalf of the customer through the card network (Visa/Mastercard dispute process).

### Transaction Debited but Not Completed
- **Root Cause**: System Error — transaction timeout during processing. The authorisation was approved but confirmation was not received before timeout.
- **Resolution**: Same dispute process as above.

## Internal Systems & Parties Involved
- **Prime**: Bank Muscat's card management system — check authorisation and settlement records here first.
- **T24**: Cross-reference if needed for account debit verification.
- **International Card Network (Visa/Mastercard)**: Intermediary — disputes are filed through the network's dispute resolution system.
- **Acquiring Bank**: The GCC bank operating the ATM. Bank Muscat must contact them to retrieve ATM transaction logs.
- **FT Number**: Funds Transfer reference — critical for dispute tracking.

## Key Operational Facts
- GCC ATM dispute resolution involves multiple parties and typically takes 7–45 business days through the card network.
- The customer should be credited provisionally while the dispute is investigated.
- Always check Prime first (not T24) for card transactions.
- Jeddah, Saudi Arabia is a documented location for this type of complaint (one recorded case).
- Cross-border disputes require formal documentation: transaction date, amount, currency, ATM location, and customer's FT number.
