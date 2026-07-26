"use client";

import { Button } from "@repo/design-system/components/ui/button";

export const PrintButton = () => (
  <Button onClick={() => window.print()} type="button" variant="outline">
    Print
  </Button>
);
