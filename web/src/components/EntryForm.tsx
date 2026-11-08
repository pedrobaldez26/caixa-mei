import { useState, type FormEvent } from 'react';
import { api } from '../api.ts';
import { parseBRL } from '../money.ts';

const incomeCategories = ['Serviços', 'Vendas', 'Outros'];
const expenseCategories = ['Impostos (DAS)', 'Infra', 'Material', 'Transporte', 'Outros'];

export function EntryForm({ defaultMonth, onSaved }: { defaultMonth: string; onSaved: () => void }) {
  const [kind, setKind] = useState<'income' | 'expense'>('income');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(incomeCategories[0]!);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(`${defaultMonth}-01`);
  const [error, setError] = useState('');

  const categories = kind === 'income' ? incomeCategories : expenseCategories;

  function changeKind(next: 'income' | 'expense') {
    setKind(next);
    setCategory((next === 'income' ? incomeCategories : expenseCategories)[0]!);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const amountCents = parseBRL(amount);
    if (amountCents === null) {
      setError('Valor inválido. Exemplo: 1.250,00');
      return;
    }
    try {
      await api.addEntry({ kind, description, category, amountCents, date });
      setDescription('');
      setAmount('');
      setError('');
      onSaved();
    } catch {
      setError('Não consegui salvar.');
    }
  }

  return (
    <form className="entry-form" onSubmit={submit}>
      <select value={kind} onChange={(e) => changeKind(e.target.value as 'income' | 'expense')}>
        <option value="income">Receita</option>
        <option value="expense">Despesa</option>
      </select>
      <input
        placeholder="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        maxLength={120}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <input placeholder="Valor (R$)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <button>Adicionar</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
