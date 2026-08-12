import { parseError } from "@repo/observability/error";
import { toastManager } from "@repo/design-system/components/ui/toast";

export const handleError = (error: unknown): void => {
  const message = parseError(error);

  toastManager.add({
    title: message,
    type: "error",
  });
};
