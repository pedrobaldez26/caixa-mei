import type { Summary } from '../api.ts';
import { formatBRL } from '../money.ts';

const texts: Record<Summary['limit']['status'], string> = {
  ok: 'Dentro do limite.',
  attention: 'Você passou de 80% do limite anual. Vale começar a planejar o resto do ano.',
  over: 'Limite ultrapassado em até 20%: a diferença paga DAS adicional. Fale com seu contador.',
  disqualified: 'Mais de 20% acima do limite: o desenquadramento do MEI vale desde janeiro. Fale com seu contador.',
};

export function LimitMeter({ limit }: { limit: Summary['limit'] }) {
  const width = Math.min(limit.usedPct, 100);

  return (
    <section className={`meter ${limit.status}`}>
      <div className="row between">
        <h2>Limite anual do MEI</h2>
        <span>
          {formatBRL(limit.usedCents)} de {formatBRL(limit.limitCents)} ({limit.usedPct.toLocaleString('pt-BR')}%)
        </span>
      </div>
      <div className="bar" role="progressbar" aria-valuenow={Math.round(limit.usedPct)} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${width}%` }} />
      </div>
      <p className="muted">
        {texts[limit.status]} Ainda cabem {formatBRL(limit.remainingCents)}.
      </p>
    </section>
  );
}
