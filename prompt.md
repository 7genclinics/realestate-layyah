REAL ESTATE SOCIETY
MANAGEMENT SYSTEM
Developer-Ready Functional Requirements & Module Specification
Scope: Society operations, land bank, property inventory, customers, installments, cash book, contractors, agents, staff, approvals and reporting.
Purpose: This document converts the supplied customer-management and daily cash book requirements into one centralized web-based management system that can be handed directly to a software developer for estimation, database design, UI/UX and implementation.

Version 1.0 • August 2026

1. Executive Summary
   The proposed system should become the central operational record for a property society. It should combine sales CRM, customer ledgers, plot and land inventory, installment collection, daily cash flow, contractor/vendor accounts, society development expenses, staff salaries, agent commissions, documents and approvals in one controlled system.
   Every financial entry should be linked, wherever relevant, to a customer, property, party/contractor, project/society, employee, agent or expense category.
   Every property should have a live status so the team can immediately see what is available, on hold, booked, sold, transferred, rented or otherwise unavailable.
   Every installment plan should generate a schedule, show paid/outstanding amounts and automatically identify due and overdue installments.
   Every important agreement or proof should be uploadable and attached to the relevant record.
   The dashboard should provide owners and managers with a real-time view of collections, expenses, cash position, overdue receivables, inventory and payables.
   Role-based access and an audit trail should protect financial and customer records and show who created, edited, approved, received or deleted each transaction.
2. Requirements Consolidated from the Supplied Documents
   The supplied customer-management document defines customer identity, plot details, price calculation, agreement/e-stamp, registry information, installment records and receipts. The supplied cash-book document defines landlord/land purchase records, multiple contractor types, building/material/interior costs, staff salaries, WAPDA/transformer, office/miscellaneous and society expenses. The specification below preserves these requirements and organizes them into reusable software modules rather than disconnected forms.
3. Recommended System Architecture / Main Navigation

# Module Primary Purpose

1 Dashboard Owner/management overview of collections, expenses, cash, installments, inventory, payables and alerts.
2 Societies & Projects Master records for each society/project, blocks, phases, locations and settings.
3 Land Bank & Acquisition Land owned/acquired/exchanged; landlord agreements, payment schedules and ownership documents.
4 Property Inventory / Listings Plots, agricultural land, shops and other properties available for sale/rent; status and agent visibility.
5 Customers & Sales CRM Customer details, bookings, plot assignment, agreements, activity history and transfer/registry status.
6 Installments (EMI) & Receipts Payment plans, due dates, collections, overdue tracking, receipts, payment proof and customer ledger.
7 Daily Cash Book & Accounts Daily income/expense, cash/bank movements, opening/closing balance, vouchers, approvals and evidence.
8 Parties / Contractors / Vendors Landlords, earth filling, road, sewerage, building/labour, material suppliers, WAPDA and other parties.
9 Development & Society Expenses Boundary wall, gates, roads, street lights, plantation, school, transformer, society office and other project costs.
10 Agents / Brokers Local and overseas agents, listing access, leads, deals, commission rules and commission settlements.
11 Staff & Payroll Employees, designations, salary, bonus, advances/deductions and salary payment history.
12 Documents & Approvals Agreements, e-stamps, registry files, payment screenshots, bills, quotations and approval workflow.
13 Reports Financial, customer, installment, inventory, contractor, agent and project-development reports.
14 Users, Roles & Settings Permissions, master data, numbering, units, currency, backups and audit logs.

4. Dashboard
   The dashboard is the management control center. All widgets should support date filtering and, where applicable, society/project filtering.
   Widget / KPI Definition / Action
   Today collections Total customer/other income received today; click to open transactions.
   Today expenses Total approved expenses paid today; click to open transactions.
   Net cash flow today Today collections minus today expenses.
   Cash in hand Current cash account balance based on cash-book entries.
   Bank balance Balance by configured bank account; manual reconciliation can be added.
   Overdue installments Count and PKR value of installments past due.
   Due soon Installments due in next 7 / 15 / 30 days.
   Total receivable Outstanding customer balance from all active sales.
   Total party payable Outstanding amount owed to landowners, contractors and vendors.
   Inventory snapshot Available, hold, booked, sold, rented and transferred units.
   Sales snapshot Bookings/sales this month, value sold and amount collected.
   Agent commission payable Approved but unpaid commission and upcoming commission liabilities.
   Development spend This month and cumulative spend by society/project.
   Salaries due Current payroll due/paid status.

Charts: collections vs expenses by day/month; sales/bookings trend; overdue aging; development cost by category; inventory by status.
Alerts panel: overdue EMI, bounced/failed payment, expiring/unsigned agreement, pending approval, low cash, contractor payment due, salary due, and plot on hold beyond allowed period.
Quick actions: Add customer, book property, receive installment, add expense, add party payment, add property, add agent, generate receipt.
Management filter: Today / Yesterday / This Week / This Month / Custom Range and Society / Project / Block. 5. Society / Project Master Panel
Field Description Priority
Society / Project ID Auto-generated unique ID Required
Society name Official project name Required
Phase / Block Hierarchy under society Optional but recommended
Location Address / city / area Recommended
Status Planning / Active / Completed / Closed Required
Default currency PKR by default Required
Area units Marla, Kanal, Acre, Sq Ft, Sq Yd Required
Financial accounts Cash and bank accounts linked to project Recommended
Authorized approvers Users allowed to approve agreements/expenses Recommended
Notes & documents Master plan, approvals, NOC or internal docs Recommended

6. Land Bank, Landlord & Land Acquisition / Exchange Panel
   This module manages land owned by the society and land acquired from or exchanged with other parties. It should support both cash purchases and land/property exchange scenarios.
   Field / Feature Requirement
   Land Record ID Auto ID; separate from party ID
   Landlord / Seller Linked party record: name, contact, address and identification details
   Land description Location, parcel description and purchased land details
   Area / Raqba Total area plus unit; support Kanal/Marla/Acre
   Rate Rate per Kanal/Marla/Acre
   Total purchase value Calculated or manually approved total
   Down payment / Token Initial payment
   Balance Auto-calculated unpaid amount
   Payment / EMI terms Custom schedule or flexible irregular payments
   Agreement terms Structured notes plus uploaded agreement
   Ownership / registry docs Upload title/registry/transfer supporting documents
   Status Proposed / Under negotiation / Approved / Partially paid / Fully paid / Transferred
   Linked payments Party ledger showing each payment and remaining balance
   Approval Agreement and final value approval by authorized user

6.1 Land Exchange Scenario
Create an Exchange Deal record linking the land/property given by the society and the land/property received from the other party.
Record valuation of both sides, difference payable/receivable, down payment and settlement schedule.
Upload exchange agreement, valuation evidence and ownership/transfer documents.
Require approval before inventory ownership/status is changed.
After completion, automatically add received land to the society land bank and remove/mark transferred the outgoing property.
Recommended addition: For stronger land records, the developer can include optional Khasra/Khewat/Khata/Mouza fields and map coordinates. These were not fully specified in the source notes, so they should remain configurable rather than mandatory.

7. Property Inventory / Listing Panel
   This panel is the source of truth for property availability and the list that can be selectively shared with local or overseas agents.
   Field Requirement
   Property ID Unique system ID / inventory code
   Society / Project / Block Where the property belongs
   Property type Residential plot, commercial plot, agricultural land, shop, house, office or custom type
   Plot / Shop no. Official identifier
   Dimensions Length x width and other measurements
   Total area Marla/Kanal/Acre/Sq Ft etc.
   Facing / location attributes Corner, park-facing, main road, street width, etc. as configurable tags
   Ownership source Society-owned, acquired, exchanged, third-party listing
   Acquisition cost Internal only; restricted permission
   Asking / sale price Current sales price
   Minimum approved price Restricted; supports sales controls
   Rent information Monthly rent/deposit if property is for rent
   Status Available / Hold / Booked / Sold / Rented / Transferred / Blocked
   Hold details Customer/agent, expiry date and reason
   Media / documents Photos, map, layout, title documents where allowed
   Agent visibility Yes/No and which agent groups may see it
   Commission plan Commission % or fixed amount if applicable
   Notes Internal and agent-visible notes kept separately

7.1 Inventory Controls
Prevent double booking: once a unit is booked/held, it cannot be sold to another customer unless the hold/booking is cancelled by an authorized user.
Maintain full status history with date, user and reason for every status change.
Allow bulk import from Excel and bulk update of prices/statuses for large inventories.
Provide filtered shareable inventory for agents without exposing acquisition cost, internal minimum price, customer details or other confidential data.
Support printable/exportable availability list and a mobile-friendly agent inventory view. 8. Customer Information & Sales CRM Panel
Field Requirement
Customer ID Auto-generated customer number; used across receipts and reports
Name Customer full name
S/O, W/O Relationship field as used in current records
Guardian Guardian name
Caste Optional field preserved from supplied requirement
CNIC / ID CNIC; support passport/other ID for overseas customers
Contact Primary mobile/WhatsApp; allow secondary number
Address Current postal address
Source Walk-in, referral, agent, campaign, other
Assigned sales person / agent Person responsible for customer
Society name Linked project
Plot type Residential/commercial/agricultural/shop/etc.
Plot / shop number Linked inventory record
Size / measurements Pulled from inventory but stored in sale snapshot
Raqba / total area Area and unit
Rate per Marla / unit Sale rate
Total amount Calculated sale value
Token / down payment Initial receipt
Remaining amount Calculated balance
Payment type Net cash / EMI / conditional payment
Payment term 3, 6, 12 months or custom schedule
Agreement date Date of signed agreement
Agreement terms Text plus document upload
E-Stamp Uploaded e-stamp / agreement document
Registry no. Registry identifier
Registry document Uploaded registry scan
Khata no. Property record field from supplied requirement
Property seller / purchaser Registry parties
Customer stage Lead / Negotiation / Booked / Agreement / Active EMI / Fully Paid / Registry / Closed / Cancelled
Notes / activity Calls, meetings, promises, changes and internal notes

8.1 Customer Record Tabs
Profile: identity, contact and source.
Property / Booking: linked inventory and price details.
Installment Plan: full EMI schedule, due/paid/overdue status.
Ledger: every debit/credit/payment/refund/adjustment.
Receipts: printable receipts and payment proofs.
Agreements & Registry: e-stamp, agreement, registry and transfer documents.
Activity Timeline: calls, visits, notes, status changes, approvals and user actions.
Documents: CNIC/passport, nominee/authorization and other KYC documents where required. 9. Installment (EMI), Collections & Receipt Panel
Field Requirement
Installment no. Auto sequence or custom installment identifier
Customer / Sale ID Linked customer and booking
Due date Scheduled due date
Month / period Display month/term
Scheduled amount Amount expected
Received amount Amount actually received
Received date Payment date
Balance Remaining amount for installment/sale
Payment source Cash / bank transfer / cheque / other
Account Which cash/bank account received the amount
Transaction reference Bank reference / cheque no. / receipt reference
Payment proof Upload screenshot/image/PDF
Status Upcoming / Due / Partially Paid / Paid / Overdue / Waived / Rescheduled
Late note / reason Optional note
Received by User who entered/received payment
Approved by Optional accounts approval

9.1 Payment Plan Logic
Support 3, 6, 12 month plans plus fully custom schedules.
Support irregular/flexible payments for parties/contractors where payment dates are not fixed.
Allow partial payment and automatically carry the unpaid portion forward without losing the original due amount.
Allow authorized rescheduling while preserving the original schedule in audit history.
Generate overdue status automatically based on current date and outstanding amount.
Allow one payment to be allocated across multiple overdue installments, with allocation visible in the ledger.
9.2 Receipt
Receipt Field Requirement
Receipt no. Auto-numbered and unique
Date Payment date
Customer ID / name Auto-linked
S/O, W/O Pulled from customer record
Address Pulled from customer record
Plot / Shop no. Linked property
EMI no. / period Installment reference
Receiving amount Numeric amount
Amount in words Automatically generated
Payment mode / reference Cash/bank/cheque and transaction reference
Received by User / cashier
Print / PDF Branded printable receipt with optional signature/QR/reference code

10. Daily Cash Book / Daily Income & Expense Panel
    The daily cash book should not be a standalone note sheet. It should be the financial transaction layer connecting customer receipts, party payments, salaries and society expenses.
    Field Requirement
    Transaction ID / Voucher no. Unique voucher number
    Date & time Transaction date/time
    Type Income / Expense / Transfer / Adjustment
    Category Customer collection, land purchase, contractor, salary, office, society expense, etc.
    Subcategory Configurable finer category
    Society / Project Which project bears the transaction
    Linked record Customer, party, contractor, employee, agent, property or land record
    Description Transaction purpose
    Amount Transaction amount
    Payment mode Cash / bank transfer / cheque / other
    Cash / Bank account Account affected
    Reference no. Bank/cheque/reference number
    Attachment Screenshot, invoice, bill, receipt or voucher
    Entered by User
    Approved by Approver when required
    Status Draft / Pending Approval / Approved / Paid / Rejected / Reversed
    Notes Internal notes

10.1 Daily Cash Controls
Opening cash balance, cash received, cash paid and closing cash balance for each day.
Separate balances for each cash box and bank account.
Cash-to-bank and bank-to-cash transfers recorded as linked double-sided transfer entries, not as income/expense.
Daily closing option: once a day is closed, edits require manager permission and are logged.
Cashbook filters by date, account, project, category, party and user.
Export daily/monthly cash book to Excel/PDF and print a daily closing sheet. 11. Parties, Contractors & Vendors Panel
Use one Party master record and separate Contract/Work Order records. This avoids duplicate data when the same contractor performs multiple jobs.
Party Field Requirement
Party ID Auto-generated
Party type Landlord, contractor, subcontractor, supplier/vendor, utility, other
Name Person/company name
Contact number Primary/secondary contact
Address Address
CNIC/NTN/ID Optional identification/tax fields
Bank/payment details Optional, permission-restricted
Opening balance If migrating existing ledger
Active contracts Linked work orders/agreements
Total contract value Aggregated
Paid Aggregated payments
Balance payable Aggregated outstanding
Documents Agreements, quotations, bills, identification
Status Active / Inactive / Blacklisted / Completed

12. Contractor / Work Order Types and Required Details
    Contract / Work Type Required Data
    Earth Filling Rate per foot / trailer / dumper; total area (length, width, height); quantity/measurement; total amount; paid; balance; flexible installments; agreement upload.
    Road Contractor Rate per foot or configured unit; total area (length, width, height); work measurement; total amount; paid; balance; flexible installments; agreement upload.
    Sewerage Labour Contractor Rate per foot; total area/measurement; total amount; paid; balance; flexible installments; agreement upload.
    Sewerage Pipe / Material Contractor Pipe specification; rate per pipe; ordered quantity; received quantity; sewerage material lines including cement, stone, sand, manhole cover pair, bricks; total; paid; balance.
    Building / Labour Contractor Rate per foot / daily basis; total area (length, height or configurable measurements); total; paid; balance; credit amount; flexible installments.
    Building Material Supplier Material line items: cement, bricks, sand, stones, iron rod/TR-girder and custom items; quantity, unit, rate, amount; total/paid/balance.
    Interior Supplier / Contractor Washroom accessories, tiles, washbasin, shower, seat, cupboard, almirah, doors, locks, ceiling, paint, electrical wiring/labour, lights/fans and custom items.
    WAPDA Pole / Transformer Agreement/work order, units, milestones, total amount, payments, balance and supporting invoices/documents.
    Other / Custom Contractor User-configurable work category, unit, quantities, milestones, value and payment terms.

12.1 Recommended Contractor Controls
Work Order / Contract ID for each job, linked to party and project.
Measurement Book entries: date, work item, length/width/height/quantity, unit, measured by, approved quantity and amount.
Milestones and completion percentage for large jobs.
Retention / security amount if the business uses it.
Material received vs ordered quantity to identify shortages or pending supplies.
Bills/invoices submitted, approved amount, deductions, paid amount and balance.
Party ledger combining contract value, bills, payments, advances and balance. 13. Development, Society, Office & Miscellaneous Expense Panel
Expense Group Examples / Scope
Site Development Earth filling, roads, sewerage, water, electricity, transformer/poles
Society Infrastructure Boundary wall, main gate, street lights, plantation, school, parks, society office, other civil works
Building Material Cement, bricks, sand, stone, steel/iron and custom materials
Interior Tiles, washroom accessories, cupboards/almirah, doors/locks, ceiling, paint, electrical wiring/labour, lights/fans and other interiors
Office Rent, utilities, stationery, internet, repairs, furniture, refreshments and other office costs
Miscellaneous Configurable expense categories
Staff / Payroll Salary, bonus, advance, deduction and payroll-related payments
Marketing / Sales Optional category for commissions, advertising or promotional expenses if management wants a complete cash picture

Every expense must have date, category, project, amount, payment mode, payee/party, narration and optional bill/receipt attachment.
High-value expenses should support approval limits (for example, accounts can enter but owner/manager must approve).
Recurring expenses can be duplicated or scheduled to reduce repetitive entry.
Budgets can be configured by project/category and dashboard can show actual vs budget. 14. Staff & Salary Panel
Field Requirement
Employee ID Unique ID
Name Employee name
Designation Job title
Department / Site Accounts, sales, site, office, etc.
Contact Phone
Monthly salary Base salary
Month Payroll period
Bonus Bonus amount
Advance Salary advance
Deduction Approved deductions
Net payable Salary + bonus - deduction/advance adjustment
Paid amount/date Payment history
Payment mode Cash/bank
Status Due / Partially Paid / Paid
Documents Optional CNIC/contract
Notes Payroll notes

15. Agent / Broker Panel (Local & Overseas)
    Agents should have their own controlled records and, if desired, a limited login/portal that only exposes approved property inventory and their own leads/deals/commission statements.
    Field Requirement
    Agent ID Unique agent code
    Name / Company Agent or agency name
    Country / City Supports overseas agents
    CNIC / Passport / ID Optional/required based on policy
    Phone / WhatsApp Primary communication
    Email Login/notifications
    Address Postal address
    Territory / Market Country/region/market handled
    Agreement Uploaded agent agreement and start/end dates
    Commission type Percentage, fixed amount, tiered or property-specific
    Default commission Default rate/amount
    Payout details Bank/account details, permission-restricted
    Listing access Which projects/property types the agent may view
    Leads Prospects submitted by agent
    Bookings / Sales Deals attributed to agent
    Commission earned Calculated after configured trigger
    Commission payable Approved and unpaid
    Commission paid Payment history and statement
    Status Active / Suspended / Inactive

15.1 Agent Portal - Recommended Features
View only inventory explicitly marked Agent Visible; no access to internal acquisition cost, minimum price or unrelated customer records.
Search/filter available listings by society, type, size, price and status.
Share/download a clean property sheet or selected listing PDF/WhatsApp-friendly link.
Register a lead before bringing the customer; system records lead ownership and timestamp.
View only their own lead status, bookings, sold properties and commission statement.
Commission becomes earned only after a configurable business event (e.g., booking approved, minimum payment received, agreement signed or full payment).
Admin can override commission with reason; all changes remain in audit history. 16. Documents, Agreement & Approval Panel
Feature Requirement
Document types Agreement, e-stamp, registry, CNIC/passport, payment screenshot, invoice, receipt, quotation, work order, title/ownership record, agent agreement and custom types
Metadata Document type, linked record, date, description, uploaded by, version, status
Approval status Draft / Submitted / Approved / Rejected / Replaced
Approvers Configurable by document/transaction type and amount
Version history Do not overwrite important agreements; retain previous version
Access Role-based confidential document access
Search Search by customer, property, party, agent, document type and date

16.1 Approval Examples
Land acquisition/exchange agreement: site/land manager enters -> authorized owner approves -> payments become executable.
Expense: staff enters -> accounts verifies -> manager/owner approves based on amount threshold -> payment recorded.
Property price discount below standard price: sales requests -> manager approves -> booking can proceed.
Agent commission: system calculates -> sales/accounts verifies -> management approves -> accounts pays. 17. Reports & Management Statements
Report Key Content
Customer Ledger Opening, sale value, receipts, adjustments, balance, overdue amount.
Installment Due Report Due today, next 7/15/30 days, overdue; filter by project/customer/agent.
Installment Aging 1-30, 31-60, 61-90, 90+ days overdue.
Daily Cash Book Opening, income, expense, transfers, closing by cash/bank account.
Income & Expense Summary By day/month/project/category; net cash flow.
Inventory Availability Available/hold/booked/sold/rented by project, block, property type and size.
Sales Report Bookings, cancellations, sales value, collections, outstanding; by salesperson/agent.
Landowner / Land Acquisition Ledger Total acquisition value, payments, balance, schedule.
Contractor / Vendor Ledger Contract/bill value, advances, payments, deductions and payable.
Development Cost Report Cost by society, work type/category, contractor and period.
Material Report Ordered/received quantities and spend by material/supplier.
Agent Commission Statement Deals, commission rate, earned, approved, paid, pending.
Payroll Report Salary, bonus, advance/deduction and payment status.
Document / Approval Report Pending agreements, missing documents, approvals and rejected items.
Audit Report User actions and record changes for selected period/module.

All major reports should support filters, on-screen totals, Excel export and PDF/print output.
Management reports should show both count and monetary value where meaningful. 18. Alerts & Notifications
Customer installment due reminder: configurable days before due date.
Overdue installment alert to assigned sales/accounts user and dashboard.
Plot hold expiry alert.
Pending expense/agreement/commission approval alert.
Landowner/contractor scheduled payment reminder.
Salary due reminder.
Missing critical documents on a booking/sale.
Optional WhatsApp/SMS/email integration can be Phase 2; the core system should first support in-app notifications and printable/exportable reminder lists. 19. Users, Roles & Permissions
Role Recommended Access
Super Admin / Owner Full system access, settings, approvals, financial visibility, user management.
Manager Dashboard, customers, inventory, parties, approvals, reports; restrictions configurable.
Accounts / Cashier Receipts, installment collections, cash book, party payments, payroll, ledgers, financial reports.
Sales / CRM Customers, leads, bookings, inventory view, follow-ups; limited financial fields as configured.
Site Manager Land records, contractors, measurements, development expenses, work progress and attachments.
Inventory / Land Manager Land bank, property records, availability and status controls.
HR / Payroll Employees and payroll; no unrelated customer/land financials unless granted.
External Agent Approved inventory and own leads/deals/commission only.
Auditor / Read Only Read/export selected modules; no editing.

Security rule: Permissions should be action-based (View, Create, Edit, Delete, Approve, Export, View Financial Cost, View Documents) rather than only module-based. Sensitive cost, bank and ID fields should be separately permissioned.

20. Core Business Workflows
    20.1 Property Sale / EMI Workflow
    1.Create/select customer and verify contact/identity information.
    2.Select an Available inventory unit; system temporarily marks it Hold or Booked based on workflow.
    3.Enter approved sale rate, token/down payment and payment plan.
    4.System calculates total, remaining balance and installment schedule.
    5.Upload/approve agreement and e-stamp; booking becomes active.
    6.Receive payments through EMI/receipt screen; system posts to customer ledger and cash/bank account.
    7.System tracks upcoming/overdue installments and sends dashboard alerts.
    8.When fully paid or management conditions are met, process registry/transfer and upload documents.
    9.Mark property Sold/Transferred and sale Closed.
    20.2 Expense / Contractor Payment Workflow
    10.Create/select party and contract/work order.
    11.Record measurement, bill, material receipt or expense line.
    12.Attach invoice/measurement/agreement evidence.
    13.Submit for approval if required.
    14.Approved payment is entered from a cash/bank account and appears in daily cash book.
    15.Party/contract ledger updates paid amount and balance automatically.
    20.3 Agent Deal Workflow
    16.Admin approves agent and commission arrangement.
    17.Agent views approved available inventory.
    18.Agent registers lead or admin attributes a customer to agent.
    19.Customer booking/sale follows normal workflow.
    20.When commission trigger is reached, system calculates commission.
    21.Commission is verified/approved and paid through cash book, with agent statement updated.
21. Key Data Relationships for Database Design
    Entity Relationship Related Entity / Notes
    Society/Project has many Blocks, Properties, Land Records, Customers/Sales, Cash Transactions, Contracts, Expenses
    Property belongs to Society/Block; may be linked to one active Booking/Sale at a time
    Customer has many Sales/Bookings, Installments, Receipts, Documents, Activities
    Sale/Booking belongs to Customer + Property; has one pricing snapshot and one payment plan
    Payment Plan has many Installments
    Receipt/Payment belongs to Customer/Sale and Cash/Bank Account; may allocate to multiple installments
    Party has many Contracts, Bills/Measurements, Payments, Documents
    Contract belongs to Party + Project; has many line items/measurements/payments
    Agent has many Leads, attributed sales, commission entries
    Employee has many Payroll entries
    Cash/Bank Account has many Transactions
    Document polymorphic link Customer, Sale, Property, Land, Party, Contract, Agent, Expense or other record
    Approval links to Expense, Agreement, Price Change, Commission, Land Deal or other controlled action

22. Recommended Status Lists
    Area Statuses
    Property Available, Hold, Booked, Sold, Rented, Transferred, Blocked
    Customer/Sale Lead, Negotiation, Booked, Agreement Pending, Active EMI, Fully Paid, Registry Pending, Closed, Cancelled
    Installment Upcoming, Due, Partially Paid, Paid, Overdue, Rescheduled, Waived
    Expense/Transaction Draft, Pending Approval, Approved, Paid/Posted, Rejected, Reversed
    Contract Draft, Active, On Hold, Completed, Closed, Cancelled
    Land Acquisition Proposed, Negotiation, Approved, Partially Paid, Fully Paid, Transfer Pending, Completed, Cancelled
    Agent Pending, Active, Suspended, Inactive
    Commission Calculated, Pending Verification, Approved, Paid, Rejected
    Document Draft, Submitted, Approved, Rejected, Replaced

23. System-Wide Functional Requirements
    Responsive web application optimized for desktop and mobile/tablet use at office and site.
    Global search across customer name/ID, CNIC, phone, property number, receipt, party and agent.
    Advanced filters, sorting and pagination on all large lists.
    Auto-generated unique IDs and configurable receipt/voucher numbering.
    Attachments: JPG/PNG/PDF; configurable file-size limits; secure private storage.
    Excel import for initial customer, inventory and party migration; validation report before final import.
    Excel/PDF export for reports and ledgers.
    PKR as default currency, with architecture able to support additional currencies for overseas agent reporting if required later.
    Area-unit support and conversion where configured: Marla, Kanal, Acre, Sq Ft, Sq Yd.
    Soft delete for important records; no permanent deletion by normal users.
    Full audit log: old value, new value, user, timestamp, IP/session where practical.
    Data backup and restore plan; automatic daily backup recommended.
    Session security, strong passwords and optional two-factor authentication for owners/admins.
    Time zone set to Pakistan Standard Time for business records unless project setting specifies otherwise.
    API-ready architecture so WhatsApp/SMS, accounting, payment gateway or mobile app integrations can be added later.
24. Critical Business Rules / Validation
    A property cannot have more than one active confirmed booking/sale at the same time.
    Remaining customer balance = approved sale amount - valid posted receipts +/− approved adjustments/refunds.
    Party balance = approved bill/contract liability - valid payments +/− approved adjustments.
    Cash/bank balance is changed only by posted transactions; draft/pending/rejected entries do not affect balances.
    Reversals must create a reversal record; posted financial transactions should not simply disappear.
    Any manual change to sale price, payment schedule, commission or approved transaction must record reason and user.
    Receipt and voucher numbers must be unique.
    Sensitive record deletion/cancellation requires reason and permission.
    Agent cannot see customer records belonging to other agents or confidential internal property costs.
    Agreement/registry/payment proof files should remain attached to historical records even after sale closure.
25. Recommended Development Phases
    Phase Scope
    Phase 1 - Core MVP Login/roles, societies/projects, inventory, customers, bookings, installment plans, receipts, daily cash book, parties/contracts, documents, basic dashboard and core reports.
    Phase 2 - Operations Land acquisition/exchange, contractor measurements/material receiving, development budgets, payroll, approvals, agent module/portal, richer alerts and reporting.
    Phase 3 - Automation & Integrations WhatsApp/SMS reminders, accounting/payment integrations, advanced analytics, digital signatures, customer/agent self-service, mobile app if justified.

26. Developer Acceptance Checklist
    ☐ Owner can see today collections, today expenses, net cash flow, cash/bank balances, overdue installments and inventory status from dashboard.
    ☐ User can create a customer, assign an available property, calculate total/down payment/balance and generate a custom EMI schedule.
    ☐ User can receive partial/full installments, upload payment proof, print a receipt and see the customer ledger update.
    ☐ Overdue installments are automatically identified and reportable.
    ☐ User can record income/expenses with category, project, account, linked party/customer and attachment; daily closing balance is correct.
    ☐ User can create landlord/contractor/vendor records, contracts, bills/measurements and payments, and see outstanding balances.
    ☐ User can record society development expenses by category and compare totals by project and period.
    ☐ User can manage property listing status with double-booking prevention.
    ☐ Agent can see only approved inventory and their own leads/deals/commissions.
    ☐ Important agreements and evidence can be uploaded, versioned and approved.
    ☐ Reports can be filtered and exported.
    ☐ Role permissions prevent unauthorized viewing/editing/approval of sensitive information.
    ☐ All important edits and financial changes are auditable.
27. Minimum Screen / Page List for UI/UX Design
    Screen Purpose
    Dashboard Management KPIs, charts, alerts, quick actions
    Society List + Detail Projects, blocks, settings and summary
    Land Bank List + Detail Owned/acquired/exchanged land and landlord ledger
    Inventory List Filterable available properties with status controls
    Property Detail Pricing, dimensions, documents, history, sale/hold info
    Customer List Search/filter customers and balances
    Customer Detail Profile, property, ledger, EMI, receipts, documents, timeline
    New Booking / Sale Property selection, pricing, token and payment-plan builder
    Installment Calendar/List Due/overdue collections and batch filtering
    Receive Payment Customer lookup, amount, allocation, mode, proof, receipt
    Daily Cash Book Transactions, opening/closing and account balances
    New Expense / Income Voucher form with categories/linking/attachments
    Party List + Detail Landlords/contractors/vendors and ledgers
    Contract / Work Order Scope, rates, measurements, bills, payments
    Development Expense Project/category expense entry and summary
    Employee + Payroll Employee record and monthly salary processing
    Agent List + Detail Agreement, access, leads, deals and commissions
    Agent Portal Approved listings, lead submission, own deals and statements
    Approvals Inbox Pending expense/agreement/price/commission approvals
    Documents Searchable document repository by linked record
    Reports Center All reports with filters/export
    Users/Roles/Settings Permissions, master categories, accounts and numbering
    Audit Log User actions and financial change history

28. Final Recommendations to the Developer
    22.Build the database around reusable entities (Customer, Property, Sale, Payment Plan, Payment, Party, Contract, Cash Transaction, Agent, Employee, Document and Approval) rather than creating isolated forms for each contractor type.
    23.Keep operational status and financial status separate where possible. Example: a contract can be Active while a bill is Partially Paid.
    24.Make categories and units configurable so the business can add new expense types, property types, contractors or materials without code changes.
    25.Treat every payment as a ledger transaction. Dashboards and balances should be calculated from posted ledger entries, not manually typed summary fields.
    26.Use approval rules and audit logs for financial integrity. Avoid allowing users to overwrite posted payments or signed agreements without trace.
    27.Design mobile-friendly data entry for site manager and cashier workflows, but use desktop-optimized tables/reports for management and accounts.
    28.Before development begins, create clickable UI wireframes for the Dashboard, Customer Detail, Inventory, Receive Payment, Cash Book, Party/Contract and Agent Portal and approve them with management.
    Scope note: This specification is intended to define the operational management system requested. Formal accounting features such as double-entry general ledger, taxation and audited financial statements can be integrated later if required; the current cash book and ledgers should nevertheless be designed cleanly enough to support that expansion.

Appendix A - Source Requirement Coverage
Source Requirement Where Covered
Customer identity Customer panel: Customer ID, Name, S/O/W/O, Guardian, Caste, CNIC, Contact, Address
Plot details Inventory + booking: Society, Plot type/no., size/measurement, Raqba
Calculator Sale pricing: rate per Marla/unit, total size, total amount, token/down payment, remaining, payment terms, cash/EMI
Agreement Agreement date/terms + e-stamp upload + approval/versioning
Registry Registry no/document, Khata no., seller/purchaser
EMI Installment number, date/month, received, balance, source, screenshot, notes + automated status
Receipt Receipt no/date, customer, relationship/address, plot/shop, EMI no/month, amount and amount in words
Landlord Land details, area, rate/Kanal, total, down payment, balance, EMI terms, agreement
Earth/Road/Sewerage/Building Contractors Party + work order with rates, measurements, amount, paid, balance and flexible installments
Sewerage materials Pipe specs/qty/received + cement, stone, sand, manhole cover, bricks
Building materials/interior Configured material/item lines covering supplied lists
Staff salaries Name, designation, salary, month, bonus + payroll extensions
WAPDA/Transformer Utility contractor/work-order type
Office/Miscellaneous Expense categories
Society expense Development categories incl. boundary wall, gates, street lights, plantation, school, transformer and office
