# Apple Pay — Knowledge Base

## Overview
Bank Muscat supports Apple Pay for its debit and credit cards, allowing customers to add cards to Apple Wallet for contactless payments. This category covers provisioning failures, inability to add cards, and related Apple Pay service issues.

## How Apple Pay Works with Bank Muscat Cards
1. Customer opens Apple Wallet on their iPhone.
2. Customer adds their Bank Muscat card (debit or credit).
3. Bank Muscat's system receives a tokenisation request via Apple's payment network.
4. Bank Muscat authenticates the card and provisions a device-specific token.
5. The card appears in Wallet and is ready for contactless payments.

## Supported Cards
- Bank Muscat debit cards
- Bank Muscat credit cards (including Lulu Titanium Mastercard)
- Note: Credit card Apple Pay availability has been a customer inquiry point — some cards may not yet be enabled.

## Common Issues & Root Causes

### Unable to Add Card to Apple Wallet / Provisioning Failure
- **What it is**: Customer tries to add their Bank Muscat card to Apple Wallet but the process fails or the option is unavailable.
- **Root Cause**: Human Error (provisioning configuration error on Bank Muscat's backend), System Error (tokenisation failure).
- **Known pattern**: Customer publicly complained that Bank Muscat credit cards could not be added to Apple Wallet — this was identified as a human error in the provisioning setup process, not a customer-side issue.
- **Resolution path**: Check the Card has been added in Apple Wallet → Check the Device is compatible → Verify the card status is active → Rectify Technical Issue.

### Device Compatibility
- Requires an iPhone with Face ID or Touch ID (iPhone 6 or later for Touch ID; iPhone X or later for Face ID).
- Must be running a compatible iOS version.

### Card Status Verification
- The card must be active (not blocked or cancelled) for provisioning to succeed.
- "Verify the card status is active" = check in T24/Prime that the card is in active status.

## Key Operational Facts
- Apple Pay provisioning is a bank-side configuration. Failures are almost always on Bank Muscat's end, not the customer's Apple device.
- Resolution requires Bank Muscat to engage with Apple's technical support team to resolve certificate/API configuration issues.
- Customer inquiry via social media ("why can't I add my credit card to Apple Wallet?") suggests the issue may affect multiple customers, not just one.
- End-to-end testing of Apple Pay provisioning should be conducted after any backend changes to card systems.
- Post-resolution: proactively notify all affected customers, not just those who complained.
