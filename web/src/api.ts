export interface Entry {
  id: number;
  kind: 'income' | 'expense';
  description: string;
  category: string;
  amountCents: number;
  date: string;
}

export interface Summary {
  year: number;
  months: { month: number; income: number; expense: number }[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  limit: {
    limitCents: number;
    usedCents: number;
    usedPct: number;
    remainingCents: number;
    status: 'ok' | 'attention' | 'over' | 'disqualified';
  };
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const TOKEN_KEY = 'caixa-mei:token';

export const session = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = session.get();
  if (token) headers.authorization = `Bearer ${token}`;
  if (init.body !== undefined) headers['content-type'] = 'application/json';

  const res = await fetch(path, {
    method: init.method,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error ?? 'unknown_error');
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { name: string } }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: { name: string } }>('/api/auth/register', {
      method: 'POST',
      body: { name, email, password },
    }),
  entries: (month: string) => request<Entry[]>(`/api/entries?month=${month}`),
  addEntry: (e: Omit<Entry, 'id'>) => request<Entry>('/api/entries', { method: 'POST', body: e }),
  deleteEntry: (id: number) => request<void>(`/api/entries/${id}`, { method: 'DELETE' }),
  summary: (year: number) => request<Summary>(`/api/summary?year=${year}`),
};
