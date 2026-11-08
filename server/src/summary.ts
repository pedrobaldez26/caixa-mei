// Limite anual de receita bruta do MEI: R$ 81.000,00.
// Passou disso em até 20% (R$ 97.200,00) paga-se a diferença do DAS;
// acima de 20% o desenquadramento vale desde o início do ano.
export const MEI_ANNUAL_LIMIT_CENTS = 81_000_00;

export type LimitStatus = 'ok' | 'attention' | 'over' | 'disqualified';

export interface EntryRow {
  kind: 'income' | 'expense';
  amount_cents: number;
  date: string; // YYYY-MM-DD
}

export interface MonthTotals {
  month: number; // 1..12
  income: number;
  expense: number;
}

export interface Summary {
  year: number;
  months: MonthTotals[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  limit: {
    limitCents: number;
    usedCents: number;
    usedPct: number;
    remainingCents: number;
    status: LimitStatus;
  };
}

export function limitStatus(usedCents: number, limitCents = MEI_ANNUAL_LIMIT_CENTS): LimitStatus {
  const ratio = usedCents / limitCents;
  if (ratio < 0.8) return 'ok';
  if (ratio <= 1) return 'attention';
  if (ratio <= 1.2) return 'over';
  return 'disqualified';
}

export function computeSummary(rows: EntryRow[], year: number): Summary {
  const months: MonthTotals[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expense: 0,
  }));

  for (const row of rows) {
    if (Number(row.date.slice(0, 4)) !== year) continue;
    const m = months[Number(row.date.slice(5, 7)) - 1];
    if (!m) continue;
    if (row.kind === 'income') m.income += row.amount_cents;
    else m.expense += row.amount_cents;
  }

  const totalIncome = months.reduce((acc, m) => acc + m.income, 0);
  const totalExpense = months.reduce((acc, m) => acc + m.expense, 0);

  return {
    year,
    months,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    limit: {
      limitCents: MEI_ANNUAL_LIMIT_CENTS,
      usedCents: totalIncome,
      usedPct: Math.round((totalIncome / MEI_ANNUAL_LIMIT_CENTS) * 1000) / 10,
      remainingCents: Math.max(MEI_ANNUAL_LIMIT_CENTS - totalIncome, 0),
      status: limitStatus(totalIncome),
    },
  };
}
