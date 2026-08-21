import { addMonths, format } from "date-fns";

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export type InstallmentPlanInput = {
  saleAmount: number;
  tokenAmount: number;
  paymentType: "cash" | "emi" | "conditional";
  termMonths: number;
  bookingDate: string;
  balloonMode?: "none" | "every_3_months" | "every_6_months" | "every_12_months" | "custom";
  balloonInterval?: number; // 3, 6, 12, or custom
  balloonAmount?: number; // additional payment amount per interval
  customBalloonMonths?: number[]; // [3, 6, 9] or [6, 12, 18]
  possessionAmount?: number; // optional lump sum on possession
};

export type InstallmentRow = {
  installment_no: number;
  period_label: string;
  due_date: string;
  regular_amount: number;
  additional_amount: number;
  scheduled_amount: number;
  is_balloon?: boolean;
};

export function buildInstallmentPlan(input: InstallmentPlanInput): InstallmentRow[] {
  const rows: InstallmentRow[] = [];

  let number = 1;
  const token = roundMoney(Math.max(0, input.tokenAmount));
  const remaining = roundMoney(Math.max(0, input.saleAmount - token));
  const start = new Date(`${input.bookingDate}T00:00:00`);

  if (token > 0) {
    rows.push({
      installment_no: number,
      period_label: "Token / Down Payment",
      due_date: input.bookingDate,
      regular_amount: token,
      additional_amount: 0,
      scheduled_amount: token,
      is_balloon: false,
    });
    number += 1;
  }

  if (remaining <= 0) {
    return rows;
  }

  if (input.paymentType !== "emi" || input.termMonths <= 1) {
    rows.push({
      installment_no: number,
      period_label: "Remaining Full Balance",
      due_date: input.bookingDate,
      regular_amount: remaining,
      additional_amount: 0,
      scheduled_amount: remaining,
      is_balloon: false,
    });
    return rows;
  }

  const months = input.termMonths;

  // Determine balloon/additional payment milestone months
  const balloonMonthsSet = new Set<number>();
  let interval = 0;
  if (input.balloonMode === "every_3_months") interval = 3;
  else if (input.balloonMode === "every_6_months") interval = 6;
  else if (input.balloonMode === "every_12_months") interval = 12;
  else if (input.balloonInterval && input.balloonInterval > 0) interval = input.balloonInterval;

  if (interval > 0) {
    for (let m = interval; m <= months; m += interval) {
      balloonMonthsSet.add(m);
    }
  }

  if (input.customBalloonMonths && input.customBalloonMonths.length > 0) {
    for (const m of input.customBalloonMonths) {
      if (m >= 1 && m <= months) {
        balloonMonthsSet.add(m);
      }
    }
  }

  const rawBalloonAmount = roundMoney(Math.max(0, input.balloonAmount || 0));
  const totalBalloonCount = balloonMonthsSet.size;
  const totalPossession = roundMoney(Math.max(0, input.possessionAmount || 0));

  // Validate that balloon + possession does not exceed remaining balance
  const maxAllowedBalloonTotal = roundMoney(Math.max(0, remaining - totalPossession));
  let actualBalloonPerMilestone = rawBalloonAmount;
  if (totalBalloonCount > 0 && actualBalloonPerMilestone * totalBalloonCount > maxAllowedBalloonTotal) {
    actualBalloonPerMilestone = roundMoney(maxAllowedBalloonTotal / totalBalloonCount);
  }

  const totalBalloonAll = totalBalloonCount > 0 ? roundMoney(actualBalloonPerMilestone * totalBalloonCount) : 0;
  const emiRemaining = roundMoney(Math.max(0, remaining - totalBalloonAll - totalPossession));

  const baseEmi = roundMoney(Math.floor((emiRemaining / months) * 100) / 100);
  let allocatedEmi = 0;

  for (let index = 1; index <= months; index += 1) {
    const isLastMonth = index === months;
    const isBalloonMonth = balloonMonthsSet.has(index);

    // Regular monthly installment
    const regular = isLastMonth ? roundMoney(emiRemaining - allocatedEmi) : baseEmi;
    allocatedEmi = roundMoney(allocatedEmi + regular);

    // Additional periodic payment
    let additional = isBalloonMonth ? actualBalloonPerMilestone : 0;
    if (isLastMonth && totalPossession > 0) {
      additional = roundMoney(additional + totalPossession);
    }

    const scheduled = roundMoney(regular + additional);

    let periodLabel = `EMI ${index} of ${months}`;
    if (isBalloonMonth && totalPossession > 0 && isLastMonth) {
      periodLabel = `EMI ${index} of ${months} (Monthly: ${regular} + Balloon: ${actualBalloonPerMilestone} + Possession: ${totalPossession})`;
    } else if (isBalloonMonth) {
      const freqLabel = interval === 3 ? "Quarterly" : interval === 6 ? "Semi-Annual" : interval === 12 ? "Annual" : "Periodic";
      periodLabel = `EMI ${index} of ${months} (Monthly: ${regular} + ${freqLabel}: ${actualBalloonPerMilestone})`;
    } else if (isLastMonth && totalPossession > 0) {
      periodLabel = `EMI ${index} of ${months} (Monthly: ${regular} + Possession: ${totalPossession})`;
    }

    rows.push({
      installment_no: number,
      period_label: periodLabel,
      due_date: format(addMonths(start, index), "yyyy-MM-dd"),
      regular_amount: regular,
      additional_amount: additional,
      scheduled_amount: scheduled,
      is_balloon: isBalloonMonth || (isLastMonth && totalPossession > 0),
    });
    number += 1;
  }

  return rows;
}
