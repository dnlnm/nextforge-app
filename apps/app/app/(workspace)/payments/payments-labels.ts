import type { PaymentMethod, PaymentStatus } from "@repo/schemas/enums";

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  DUITNOW: "DuitNow",
  FPX: "FPX",
  CARD: "Card",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<PaymentStatus, string> = {
  RECORDED: "Recorded",
  VERIFIED: "Verified",
  REVERSED: "Reversed",
};
