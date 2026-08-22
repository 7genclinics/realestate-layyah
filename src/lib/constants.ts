import type {
  AppRole,
  AreaUnit,
  OwnershipSource,
  PropertyStatus,
  PropertyType,
  SocietyStatus,
} from "@/lib/database.types";

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Owner",
  manager: "Manager",
  accounts: "Accounts",
  sales: "Sales",
  site_manager: "Site Manager",
  inventory_manager: "Inventory Manager",
  hr: "HR / Payroll",
  agent: "Agent",
  auditor: "Auditor",
};

export const SOCIETY_STATUS_LABELS: Record<SocietyStatus, string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  closed: "Closed",
};

export const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
  marla: "Marla",
  kanal: "Kanal",
  acre: "Acre",
  sq_ft: "Sq Ft",
  sq_yd: "Sq Yd",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  residential_plot: "Residential plot",
  commercial_plot: "Commercial plot",
  agricultural_land: "Agricultural land",
  shop: "Shop",
  house: "House",
  office: "Office",
  other: "Other",
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  available: "Available",
  hold: "Hold",
  booked: "Booked",
  sold: "Sold",
  rented: "Rented",
  transferred: "Transferred",
  blocked: "Blocked",
};

export const OWNERSHIP_SOURCE_LABELS: Record<OwnershipSource, string> = {
  society_owned: "Society-owned",
  acquired: "Acquired",
  exchanged: "Exchanged",
  third_party_listing: "Third-party listing",
};

export const PROPERTY_STATUS_TRANSITIONS: Record<
  PropertyStatus,
  PropertyStatus[]
> = {
  available: ["hold", "booked", "sold", "rented", "blocked", "transferred"],
  hold: ["available", "booked", "blocked", "transferred"],
  booked: ["available", "sold", "transferred", "blocked"],
  sold: ["transferred"],
  rented: ["available", "transferred"],
  blocked: ["available"],
  transferred: [],
};

export const CUSTOMER_RELATION_LABELS = {
  s_o: "S/O",
  w_o: "W/O",
  d_o: "D/O",
  c_o: "C/O",
  other: "Other",
} as const;

export const ID_TYPE_LABELS = {
  cnic: "CNIC",
  passport: "Passport",
  other: "Other ID",
} as const;

export const CUSTOMER_SOURCE_LABELS = {
  walk_in: "Walk-in",
  referral: "Referral",
  agent: "Agent",
  campaign: "Campaign",
  other: "Other",
} as const;

export const CUSTOMER_STAGE_LABELS = {
  lead: "Lead",
  negotiation: "Negotiation",
  booked: "Booked",
  agreement_pending: "Agreement pending",
  active_emi: "Active EMI",
  fully_paid: "Fully paid",
  registry_pending: "Registry pending",
  closed: "Closed",
  cancelled: "Cancelled",
} as const;

export const PAYMENT_TYPE_LABELS = {
  cash: "Net cash",
  emi: "EMI",
  conditional: "Conditional",
} as const;

export const SALE_STATUS_LABELS = {
  hold: "Hold",
  booked: "Booked",
  agreement_pending: "Agreement pending",
  active_emi: "Active EMI",
  fully_paid: "Fully paid",
  registry_pending: "Registry pending",
  closed: "Closed",
  cancelled: "Cancelled",
} as const;

export const INSTALLMENT_STATUS_LABELS = {
  upcoming: "Upcoming",
  due: "Due",
  partially_paid: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
  waived: "Waived",
  rescheduled: "Rescheduled",
} as const;

export const PAYMENT_MODE_LABELS = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  other: "Other",
} as const;

export const CASH_ACCOUNT_TYPE_LABELS = {
  cash: "Cash box",
  bank: "Bank account",
} as const;

export const CASH_TRANSACTION_TYPE_LABELS = {
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
  adjustment: "Adjustment",
} as const;

export const PARTY_TYPE_LABELS = {
  landlord: "Landlord",
  contractor: "Contractor",
  subcontractor: "Subcontractor",
  supplier: "Supplier / vendor",
  utility: "Utility",
  other: "Other",
} as const;

export const PARTY_STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
  blacklisted: "Blacklisted",
  completed: "Completed",
} as const;

export const CONTRACT_TYPE_LABELS = {
  earth_filling: "Earth filling",
  road: "Road contractor",
  sewerage_labour: "Sewerage labour",
  sewerage_material: "Sewerage material",
  building_labour: "Building / labour",
  building_material: "Building material",
  interior: "Interior",
  wapda: "WAPDA / transformer",
  other: "Other / custom",
} as const;

export const CONTRACT_STATUS_LABELS = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export const CONTRACT_UNIT_LABELS = {
  foot: "Per foot",
  sq_ft: "Sq ft",
  trailer: "Trailer",
  dumper: "Dumper",
  daily: "Daily",
  pipe: "Pipe",
  lump_sum: "Lump sum",
  other: "Other",
} as const;

export const DOCUMENT_TYPE_LABELS = {
  agreement: "Agreement",
  e_stamp: "E-stamp",
  registry: "Registry",
  identity: "CNIC / passport",
  payment_proof: "Payment screenshot",
  invoice: "Invoice / bill",
  receipt: "Receipt copy",
  quotation: "Quotation",
  work_order: "Work order",
  title: "Title / ownership",
  agent_agreement: "Agent agreement",
  other: "Other",
} as const;

export const DOCUMENT_STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  replaced: "Replaced",
} as const;

export const DOCUMENT_ENTITY_LABELS = {
  customer: "Customer",
  sale: "Sale / booking",
  property: "Property",
  party: "Party",
  contract: "Work order",
  receipt: "Receipt",
  cash_transaction: "Cash voucher",
  society: "Society",
  land_parcel: "Land parcel",
  land_exchange: "Land exchange",
} as const;

export const LAND_STATUS_LABELS = {
  proposed: "Proposed",
  under_negotiation: "Under negotiation",
  approved: "Approved",
  partially_paid: "Partially paid",
  fully_paid: "Fully paid",
  transferred: "Transferred",
} as const;

export const LAND_ACQUISITION_LABELS = {
  purchase: "Cash purchase",
  exchange_in: "Received in exchange",
  society_owned: "Society-owned",
} as const;

export const LAND_EXCHANGE_STATUS_LABELS = {
  draft: "Draft",
  pending_approval: "Pending approval",
  approved: "Approved",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export const DEVELOPMENT_CATEGORY_LABELS = {
  boundary_wall: "Boundary Wall",
  roads: "Roads & Paving",
  street_lights: "Street Lights & Electrification",
  plantation: "Plantation & Horticulture",
  school: "School & Community",
  transformer: "WAPDA / Transformer",
  society_office: "Society Office & Admin",
  other: "Other Development",
} as const;

export const DEVELOPMENT_STATUS_LABELS = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  on_hold: "On Hold",
} as const;

export const AGENT_TYPE_LABELS = {
  local: "Local Agent",
  overseas: "Overseas Agent",
} as const;

export const AGENT_STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
} as const;

export const AGENT_COMMISSION_STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  cancelled: "Cancelled",
} as const;

export const STAFF_DEPARTMENT_LABELS = {
  management: "Management",
  operations: "Operations",
  sales: "Sales & Marketing",
  accounts: "Accounts & Finance",
  site: "Site & Development",
  hr: "Human Resources",
} as const;

export const STAFF_STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
  terminated: "Terminated",
} as const;

export const PAYROLL_STATUS_LABELS = {
  pending: "Pending",
  paid: "Paid",
} as const;

export const LEAD_STATUS_LABELS = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
} as const;

export const LEAD_STATUS_TONE = {
  new: "info",
  contacted: "info",
  interested: "warning",
  negotiation: "warning",
  won: "success",
  lost: "danger",
} as const;

export const ACTIVITY_TYPE_LABELS = {
  note: "Note",
  call: "Phone call",
  visit: "Site visit",
  whatsapp: "WhatsApp",
  email: "Email",
  status_change: "Status change",
} as const;

export const CONTRACTOR_BILL_STATUS_LABELS = {
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
} as const;

export const EXPENSE_APPROVAL_STATUS_LABELS = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
} as const;

export const NOTIFICATION_TYPE_LABELS = {
  installment_due: "Installment due",
  overdue: "Overdue installment",
  approval_pending: "Awaiting approval",
  low_cash: "Low cash balance",
  salary_due: "Salary due",
  general: "Notice",
} as const;

export const AUDIT_ACTION_LABELS = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  approve: "Approved",
  reject: "Rejected",
  status_change: "Status changed",
  payment: "Payment",
  login: "Signed in",
} as const;

export const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  { title: "Societies", href: "/societies", icon: "building-2" },
  { title: "Land Bank", href: "/land-bank", icon: "land-plot" },
  { title: "Inventory", href: "/inventory", icon: "map" },
  { title: "Leads", href: "/leads", icon: "target" },
  { title: "Customers", href: "/customers", icon: "users" },
  { title: "Bookings", href: "/bookings", icon: "file-signature" },
  { title: "Installments", href: "/installments", icon: "calendar-clock" },
  { title: "Receipts", href: "/receipts", icon: "receipt" },
  { title: "Cash Book", href: "/cash-book", icon: "book-open" },
  { title: "Parties", href: "/parties", icon: "handshake" },
  { title: "Development", href: "/development", icon: "hammer" },
  { title: "Agents", href: "/agents", icon: "briefcase" },
  { title: "Staff", href: "/staff", icon: "id-card" },
  { title: "Approvals", href: "/approvals", icon: "clipboard-check" },
  { title: "Documents", href: "/documents", icon: "file-stack" },
  { title: "Reports", href: "/reports", icon: "chart-column" },
  { title: "Audit Log", href: "/audit", icon: "history" },
  { title: "Settings", href: "/settings", icon: "settings" },
] as const;
