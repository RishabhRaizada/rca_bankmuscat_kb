# Root Cause Definitions — Bank Muscat Operational Context

## System Error
A technical failure in Bank Muscat's infrastructure (T24, Prime, ATM/CDM network, mobile app, internet banking, SMS gateway). The system did not behave as expected — transactions failed, data wasn't saved, machines didn't dispense cash, apps crashed.
- **Indicators**: Multiple customers affected simultaneously, machine/app unavailability, transaction processed in one system but not another.
- **Resolution path**: Escalate to IT team, log incident, verify fix before closing, proactively notify affected customers.
- **Severity**: High — can affect many customers at once.

## Operational Issue
A process or workflow gap. Not a system failure and not a single person's error — instead, a procedure is missing, inadequate, or not followed as designed. Information not published where customers expect it, processes not standardised across branches.
- **Indicators**: Customer couldn't find information, service not available through expected channel, inconsistent outcomes across branches.
- **Resolution path**: Review and update SOPs, inform customer through correct channel, improve digital information availability.
- **Severity**: Medium — often affects a class of customers, not just one.

## Human Error
A specific staff member or customer made an incorrect entry, missed a required step, or processed something incorrectly. A discrete, identifiable mistake.
- **Indicators**: One customer affected, specific transaction has wrong details, document not processed correctly.
- **Resolution path**: Identify the error, correct it, check whether other customers were similarly affected.
- **Severity**: Low to medium — typically isolated.

## Staff Delay
A staff member took longer than acceptable to complete a task. The work was eventually or not yet done, but the timing caused customer impact.
- **Indicators**: Customer waited days for a routine update, request was acknowledged but not completed within SLA.
- **Resolution path**: Expedite processing immediately, contact customer with status update and apology, investigate cause of delay.
- **Severity**: Low to medium — affects individual customer experience.

## Branch Delay
The branch as a unit delayed processing — may be due to resource constraints, high queue volume, or inter-branch coordination issues.
- **Indicators**: Multiple requests pending at same branch, inter-branch handoffs not completed.
- **Resolution path**: Escalate to branch manager, expedite processing, coordinate with receiving branch.
- **Severity**: Medium — may affect multiple customers at that branch.

## Back Office Delay
The internal operations/back office team delayed processing a loan, finance, or document request. Specifically affects loan settlement, NOC, CLC, title deed release, and contractor agreement requests.
- **Indicators**: Customer has submitted all documents correctly but processing is pending beyond SLA (e.g., NOC beyond 5 working days).
- **Resolution path**: Escalate to concerned stakeholder in Back Office, follow up, initiate contact with customer.
- **Severity**: Medium to high — delays are often legally or financially significant for customers.

## Customer Request
The issue arose from a customer-initiated action. Not a bank error — the bank is processing a legitimate customer request that has operational complexity (e.g., inter-branch card transfer, beneficiary details change, power of attorney).
- **Indicators**: Customer explicitly asked for something; the bank is in process of fulfilling it.
- **Resolution path**: Verify and process the request, contact customer with status.
- **Severity**: Low — customer should be informed of expected timelines.

## Customer Retraction
Customer changed their mind or withdrew a finance/loan application after it had already advanced in the processing pipeline.
- **Indicators**: Finance/loan application was in progress or disbursed; cancellation now requested.
- **Resolution path**: Contact customer, clarify cancellation fees and process, initiate cancellation workflow.
- **Severity**: Medium — complex to unwind depending on disbursement status.

## Incomplete Documents
Required documents were not fully provided by the customer. Processing cannot proceed until all documents are received.
- **Indicators**: Specific documents missing from application packet.
- **Resolution path**: Request missing documents from customer, inform them of what is outstanding.
- **Severity**: Low — straightforward once customer provides documents.

## Invalid Documents
Documents provided are expired, forged, in wrong format, or otherwise unacceptable.
- **Indicators**: Documents exist but fail verification (expired ID, unacceptable proof).
- **Resolution path**: Inform customer which documents are invalid and what is required, request valid replacements.
- **Severity**: Low to medium.

## Signature Issue
Customer's signature on file doesn't match submitted documents, or signature was not captured correctly in the system.
- **Indicators**: Transaction rejected due to signature mismatch; signature missing in system.
- **Resolution path**: Check system signature records, contact customer for re-signing if needed.
- **Severity**: Medium — can block multiple transactions until resolved.

## Payment Pending
A required fee or payment for processing has not yet been received.
- **Indicators**: Processing is on hold pending payment confirmation.
- **Resolution path**: Inform customer of outstanding payment, confirm receipt before proceeding.
- **Severity**: Low — straightforward once payment clears.

## Cancellation Fees Not Paid
Fees required to cancel a finance or loan application have not been paid. Processing cannot complete without this payment.
- **Resolution path**: Inform customer of the fees due, confirm payment, then process cancellation.

## Disbursement Completed
The finance/loan amount has already been disbursed to the customer, making cancellation significantly more complex than a pre-disbursement cancellation.
- **Resolution path**: Contact customer, explain implications of post-disbursement cancellation, escalate to Back Office for guided cancellation process.
