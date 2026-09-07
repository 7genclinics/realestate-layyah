import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { BookingForm } from "@/components/features/booking-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string; property?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;
  const t = await getTranslations("pages.bookings");
  const tCommon = await getTranslations("common");

  if (!canManageCrm(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("newTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noPermission")}
        </p>
        <Button render={<Link href="/customers" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: customers }, { data: properties }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, code, full_name")
      .order("full_name"),
    supabase
      .from("properties")
      .select(
        "id, code, plot_no, property_type, area, area_unit, asking_price, status",
      )
      .in("status", ["available", "hold"])
      .order("plot_no"),
  ]);

  if (!customers?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("newTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("needCustomer")}
        </p>
        <Button render={<Link href="/customers/new" />}>{t("addCustomer")}</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("newTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("newSubtitle")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("saleDetails")}</CardTitle>
          <CardDescription>
            {t("saleHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingForm
            customerId={params.customer}
            defaultPropertyId={params.property}
            customers={customers}
            properties={properties ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
