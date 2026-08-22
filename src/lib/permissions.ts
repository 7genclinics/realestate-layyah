import type { AppRole, InstallmentStatus } from "@/lib/database.types";

export function canManageInventory(role: AppRole) {
  return (
    role === "super_admin" ||
    role === "manager" ||
    role === "inventory_manager"
  );
}

export function canViewPropertyCosts(role: AppRole) {
  return canManageInventory(role) || role === "accounts";
}

export function canManageCrm(role: AppRole) {
  return (
    role === "super_admin" ||
    role === "manager" ||
    role === "sales" ||
    role === "accounts"
  );
}

export function canManageAccounts(role: AppRole) {
  return (
    role === "super_admin" ||
    role === "manager" ||
    role === "accounts"
  );
}

export function canManageParties(role: AppRole) {
  return (
    role === "super_admin" ||
    role === "manager" ||
    role === "accounts" ||
    role === "site_manager"
  );
}

export function canManageDocuments(role: AppRole) {
  return (
    role === "super_admin" ||
    role === "manager" ||
    role === "accounts" ||
    role === "sales" ||
    role === "site_manager" ||
    role === "inventory_manager"
  );
}

export function canApproveDocuments(role: AppRole) {
  return canManageAccounts(role);
}

export function canManageLandBank(role: AppRole) {
  return (
    role === "super_admin" ||
    role === "manager" ||
    role === "inventory_manager" ||
    role === "site_manager"
  );
}

export function canApproveLand(role: AppRole) {
  return role === "super_admin" || role === "manager";
}

export function canManageAgents(role: AppRole) {
  return (
    role === "super_admin" ||
    role === "manager" ||
    role === "sales" ||
    role === "accounts"
  );
}

export function canApproveCommissions(role: AppRole) {
  return role === "super_admin" || role === "manager" || role === "accounts";
}

export function canManageStaff(role: AppRole) {
  return role === "super_admin" || role === "manager" || role === "hr";
}

export function canManageDevelopment(role: AppRole) {
  return (
    role === "super_admin" ||
    role === "manager" ||
    role === "site_manager"
  );
}

export function canApproveExpenses(role: AppRole) {
  return role === "super_admin" || role === "manager" || role === "accounts";
}

export function canManageUsers(role: AppRole) {
  return role === "super_admin" || role === "manager";
}

export function canManageSocieties(role: AppRole) {
  return role === "super_admin" || role === "manager";
}

export function canManageSettings(role: AppRole) {
  return role === "super_admin";
}

export function canViewAudit(role: AppRole) {
  return role === "super_admin" || role === "manager" || role === "auditor";
}

export function canManageLeads(role: AppRole) {
  return canManageCrm(role);
}

export function canViewCrmReports(role: AppRole) {
  return canManageCrm(role) || role === "auditor";
}

export function canViewFinancialReports(role: AppRole) {
  return canManageAccounts(role) || role === "auditor" || role === "site_manager";
}

export function deriveInstallmentStatus(
  dueDate: string,
  scheduledAmount: number,
  receivedAmount: number,
  opts?: { statusOverride?: string | null; gracePeriodDays?: number },
): InstallmentStatus {
  // An explicit waive forgives the balance regardless of what was received.
  if (opts?.statusOverride === "waived") {
    return "waived";
  }

  if (receivedAmount >= scheduledAmount && scheduledAmount > 0) {
    return "paid";
  }

  if (receivedAmount > 0) {
    return "partially_paid";
  }

  // A rescheduled row that has not been paid keeps its explicit flag.
  if (opts?.statusOverride === "rescheduled") {
    return "rescheduled";
  }

  const graceDays = opts?.gracePeriodDays ?? 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const graceDue = new Date(due);
  graceDue.setDate(graceDue.getDate() + graceDays);

  // Past the due date AND the grace window → overdue.
  if (graceDue < today) {
    return "overdue";
  }

  // On or after the due date but still inside grace → due.
  if (due <= today) {
    return "due";
  }

  return "upcoming";
}
