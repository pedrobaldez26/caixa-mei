const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

// Aceita "1.234,56", "1234,56", "1234.56" e "50". Devolve centavos ou null se não der.
export function parseBRL(input: string): number | null {
  const raw = input.trim().replace(/^R\$\s*/, '');
  if (!raw) return null;

  let normalized = raw;
  if (raw.includes(',')) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const cents = Math.round(Number(normalized) * 100);
  return cents > 0 ? cents : null;
}
