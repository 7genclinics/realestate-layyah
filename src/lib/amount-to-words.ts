const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function chunkToWords(value: number): string {
  if (value === 0) {
    return "";
  }

  if (value < 20) {
    return ones[value];
  }

  if (value < 100) {
    return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ""}`.trim();
  }

  if (value < 1000) {
    return `${ones[Math.floor(value / 100)]} Hundred${
      value % 100 ? ` ${chunkToWords(value % 100)}` : ""
    }`.trim();
  }

  return `${chunkToWords(Math.floor(value / 1000))} Thousand${
    value % 1000 ? ` ${chunkToWords(value % 1000)}` : ""
  }`.trim();
}

export function amountToWords(amount: number): string {
  const whole = Math.floor(amount);
  const paisa = Math.round((amount - whole) * 100);

  if (whole === 0 && paisa === 0) {
    return "Zero Rupees Only";
  }

  const crore = Math.floor(whole / 10_000_000);
  const lakh = Math.floor((whole % 10_000_000) / 100_000);
  const thousand = Math.floor((whole % 100_000) / 1000);
  const remainder = whole % 1000;

  const parts = [
    crore ? `${chunkToWords(crore)} Crore` : "",
    lakh ? `${chunkToWords(lakh)} Lakh` : "",
    thousand ? `${chunkToWords(thousand)} Thousand` : "",
    remainder ? chunkToWords(remainder) : "",
  ].filter(Boolean);

  const rupees = parts.join(" ").trim() || "Zero";
  const paisaPart =
    paisa > 0 ? ` and ${chunkToWords(paisa)} Paisa` : "";

  return `${rupees} Rupees${paisaPart} Only`;
}
