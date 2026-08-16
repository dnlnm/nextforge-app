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

export const METHOD_REF_LABELS: Record<
  PaymentMethod,
  { label: string; placeholder: string; showRef: boolean }
> = {
  CASH: { label: "", placeholder: "", showRef: false },
  BANK_TRANSFER: {
    label: "Transaction / Reference No.",
    placeholder: "e.g. MBB2608150012345",
    showRef: true,
  },
  DUITNOW: {
    label: "DuitNow Reference No.",
    placeholder: "e.g. DN2608152209",
    showRef: true,
  },
  FPX: {
    label: "FPX Transaction ID",
    placeholder: "e.g. FPX20260815ABCD1234",
    showRef: true,
  },
  CARD: {
    label: "Approval Code",
    placeholder: "e.g. 012345",
    showRef: true,
  },
  OTHER: {
    label: "Reference / Note",
    placeholder: "Describe payment method or ref",
    showRef: true,
  },
};
