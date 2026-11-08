import { useState } from 'react';
import { session } from './api.ts';
import { AuthForm } from './components/AuthForm.tsx';
import { Dashboard } from './components/Dashboard.tsx';

export function App() {
  const [authed, setAuthed] = useState(() => session.get() !== null);

  if (!authed) {
    return <AuthForm onDone={() => setAuthed(true)} />;
  }

  return (
    <Dashboard
      onLogout={() => {
        session.clear();
        setAuthed(false);
      }}
    />
  );
}
