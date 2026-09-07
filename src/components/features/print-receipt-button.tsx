"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function PrintReceiptButton() {
  const t = useTranslations("common");
  return (
    <Button onClick={() => window.print()}>
      <Printer className="size-4" />
      {t("print")}
    </Button>
  );
}
