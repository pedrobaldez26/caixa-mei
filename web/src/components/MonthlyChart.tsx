import type { Summary } from '../api.ts';
import { formatBRL } from '../money.ts';

const labels = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function MonthlyChart({ months }: { months: Summary['months'] }) {
  const W = 720;
  const H = 180;
  const pad = { top: 8, bottom: 22 };
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const slot = W / 12;
  const barW = slot * 0.3;
  const plotH = H - pad.top - pad.bottom;

  return (
    <section>
      <h2>Por mês</h2>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Receitas e despesas por mês" className="chart">
        {months.map((m, i) => {
          const x = i * slot + slot * 0.2;
          const hi = (m.income / max) * plotH;
          const he = (m.expense / max) * plotH;
          return (
            <g key={m.month}>
              <rect x={x} y={pad.top + plotH - hi} width={barW} height={hi} className="income">
                <title>{`${labels[i]}: receita ${formatBRL(m.income)}`}</title>
              </rect>
              <rect x={x + barW + 2} y={pad.top + plotH - he} width={barW} height={he} className="expense">
                <title>{`${labels[i]}: despesa ${formatBRL(m.expense)}`}</title>
              </rect>
              <text x={i * slot + slot / 2} y={H - 6} textAnchor="middle">
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="legend">
        <span className="income">receita</span>
        <span className="expense">despesa</span>
      </div>
    </section>
  );
}
