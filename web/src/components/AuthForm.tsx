import { useState, type FormEvent } from 'react';
import { api, ApiError, session } from '../api.ts';

const messages: Record<string, string> = {
  invalid_credentials: 'Email ou senha incorretos.',
  email_taken: 'Esse email já está cadastrado.',
  validation_error: 'Confira os campos: a senha precisa de pelo menos 8 caracteres.',
};

export function AuthForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register(name, email, password);
      session.set(res.token);
      onDone();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      setError(messages[code] ?? 'Não deu certo, tente de novo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <h1>Caixa MEI</h1>
      <p className="muted">Entradas, saídas e quanto falta para o limite de faturamento do ano.</p>

      <form onSubmit={submit}>
        {mode === 'register' && (
          <label>
            Nome
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === 'register' ? 8 : 1}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
      </form>

      <button className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
      </button>
    </main>
  );
}
