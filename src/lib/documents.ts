export function entityRecordHref(
  entityType:
    | "customer"
    | "sale"
    | "property"
    | "party"
    | "contract"
    | "receipt"
    | "cash_transaction"
    | "society"
    | "land_parcel"
    | "land_exchange",
  entityId: string,
) {
  switch (entityType) {
    case "customer":
      return `/customers/${entityId}`;
    case "property":
      return `/inventory/${entityId}`;
    case "party":
      return `/parties/${entityId}`;
    case "receipt":
      return `/receipts/${entityId}`;
    case "cash_transaction":
      return `/cash-book/${entityId}`;
    case "society":
      return "/societies";
    case "sale":
      return `/customers`;
    case "contract":
      return `/parties`;
    case "land_parcel":
      return `/land-bank/${entityId}`;
    case "land_exchange":
      return `/land-bank/exchanges/${entityId}`;
    default:
      return "/documents";
  }
}

export const ALLOWED_DOCUMENT_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
