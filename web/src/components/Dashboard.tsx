import { useCallback, useEffect, useState } from 'react';
import { api, type Entry, type Summary } from '../api.ts';
import { formatBRL } from '../money.ts';
import { EntryForm } from './EntryForm.tsx';
import { LimitMeter } from './LimitMeter.tsx';
import { MonthlyChart } from './MonthlyChart.tsx';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState('');

  const year = Number(month.slice(0, 4));

  const load = useCallback(async () => {
    try {
      const [s, e] = await Promise.all([api.summary(year), api.entries(month)]);
      setSummary(s);
      setEntries(e);
      setError('');
    } catch (err) {
      // token vencido ou inválido: volta para o login
      if (err instanceof Error && err.message === 'unauthorized') onLogout();
      else setError('Não consegui carregar os dados.');
    }
  }, [year, month, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    await api.deleteEntry(id);
    load();
  }

  return (
    <div className="page">
      <header>
        <h1>Caixa MEI</h1>
        <div className="row">
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          <button className="link" onClick={onLogout}>
            Sair
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {summary && (
        <>
          <section className="cards">
            <div className="card">
              <span className="muted">Receita em {summary.year}</span>
              <strong>{formatBRL(summary.totalIncome)}</strong>
            </div>
            <div className="card">
              <span className="muted">Despesas em {summary.year}</span>
              <strong>{formatBRL(summary.totalExpense)}</strong>
            </div>
            <div className="card">
              <span className="muted">Saldo</span>
              <strong className={summary.balance < 0 ? 'neg' : ''}>{formatBRL(summary.balance)}</strong>
            </div>
          </section>

          <LimitMeter limit={summary.limit} />
          <MonthlyChart months={summary.months} />
        </>
      )}

      <section>
        <h2>Novo lançamento</h2>
        <EntryForm defaultMonth={month} onSaved={load} />
      </section>

      <section>
        <h2>Lançamentos de {month.split('-').reverse().join('/')}</h2>
        {entries.length === 0 ? (
          <p className="muted">Nada lançado nesse mês.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Dia</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th className="num">Valor</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.date.slice(8)}</td>
                  <td>{e.description}</td>
                  <td>{e.category}</td>
                  <td className={`num ${e.kind}`}>
                    {e.kind === 'expense' ? '− ' : ''}
                    {formatBRL(e.amountCents)}
                  </td>
                  <td>
                    <button className="link" onClick={() => remove(e.id)} aria-label={`Apagar ${e.description}`}>
                      apagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
