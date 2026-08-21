"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintReceiptButton() {
  return (
    <Button onClick={() => window.print()}>
      <Printer className="size-4" />
      Print
    </Button>
  );
}
