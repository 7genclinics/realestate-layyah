import type {
  CashAccountType,
  CashTransactionType,
  CashTransferSide,
} from "@/lib/database.types";
import { roundMoney } from "@/lib/installments";

type TransactionLike = {
  transaction_type: CashTransactionType;
  transfer_side: CashTransferSide | null;
  amount: number;
  status?: string;
};

export function transactionSignedAmount(row: TransactionLike) {
  const amount = roundMoney(Number(row.amount));

  if (row.status === "reversed") {
    return 0;
  }

  switch (row.transaction_type) {
    case "income":
      return amount;
    case "expense":
      return -amount;
    case "transfer":
      return row.transfer_side === "in" ? amount : -amount;
    case "adjustment":
      return amount;
    default:
      return 0;
  }
}

export function computeAccountBalance(
  openingBalance: number,
  transactions: TransactionLike[],
) {
  return roundMoney(
    Number(openingBalance) +
      transactions.reduce(
        (sum, row) => sum + transactionSignedAmount(row),
        0,
      ),
  );
}

export function sumBalancesByAccountType(
  accounts: {
    account_type: CashAccountType;
    opening_balance: number;
    id: string;
  }[],
  transactions: (TransactionLike & { cash_account_id: string })[],
) {
  let cashTotal = 0;
  let bankTotal = 0;

  for (const account of accounts) {
    const accountTransactions = transactions.filter(
      (row) => row.cash_account_id === account.id,
    );
    const balance = computeAccountBalance(
      account.opening_balance,
      accountTransactions,
    );

    if (account.account_type === "cash") {
      cashTotal = roundMoney(cashTotal + balance);
    } else {
      bankTotal = roundMoney(bankTotal + balance);
    }
  }

  return { cashTotal, bankTotal };
}

export function summarizeDay(
  date: string,
  transactions: (TransactionLike & { transaction_date: string })[],
) {
  const dayRows = transactions.filter(
    (row) => row.transaction_date === date && row.status !== "reversed",
  );

  let income = 0;
  let expense = 0;

  for (const row of dayRows) {
    const signed = transactionSignedAmount(row);

    if (signed > 0) {
      income = roundMoney(income + signed);
    } else if (signed < 0) {
      expense = roundMoney(expense + Math.abs(signed));
    }
  }

  return { income, expense, net: roundMoney(income - expense) };
}

/**
 * Income / expense / net across an inclusive [from, to] date window.
 * Dates are compared as ISO `yyyy-MM-dd` strings (lexicographically ordered).
 */
export function summarizeRange(
  from: string,
  to: string,
  transactions: (TransactionLike & { transaction_date: string })[],
) {
  const rows = transactions.filter(
    (row) =>
      row.transaction_date >= from &&
      row.transaction_date <= to &&
      row.status !== "reversed",
  );

  let income = 0;
  let expense = 0;

  for (const row of rows) {
    const signed = transactionSignedAmount(row);

    if (signed > 0) {
      income = roundMoney(income + signed);
    } else if (signed < 0) {
      expense = roundMoney(expense + Math.abs(signed));
    }
  }

  return { income, expense, net: roundMoney(income - expense) };
}
