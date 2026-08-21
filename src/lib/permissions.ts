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
): InstallmentStatus {
  if (receivedAmount >= scheduledAmount && scheduledAmount > 0) {
    return "paid";
  }

  if (receivedAmount > 0) {
    return "partially_paid";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);

  if (due < today) {
    return "overdue";
  }

  if (due.getTime() === today.getTime()) {
    return "due";
  }

  return "upcoming";
}
