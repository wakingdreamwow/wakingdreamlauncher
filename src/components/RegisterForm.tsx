import { useState } from 'react';
import { api } from '../lib/api';

export function RegisterForm({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [todo, setTodo] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    setTodo(null);
    try {
      const res = await api.register({ username, password, email });
      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 1500);
      } else {
        // Backend currently returns ok:false todo:'...' (501) — surface honestly
        if (res.todo) setTodo(res.todo);
        else setError(res.error ?? 'Unknown error');
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-nightmare border border-smaragd/40 rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-xl font-display font-bold text-smaragd-light mb-4">Create Account</h2>

        {success ? (
          <div className="text-center text-smaragd-light py-8">
            ✓ Account created. Welcome to Wakingdream.
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Username (4-16 chars)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-nightmare/70 border border-smaragd/30 rounded text-dawn focus:border-smaragd-light focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-nightmare/70 border border-smaragd/30 rounded text-dawn focus:border-smaragd-light focus:outline-none"
              />
              <input
                type="password"
                placeholder="Password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-nightmare/70 border border-smaragd/30 rounded text-dawn focus:border-smaragd-light focus:outline-none"
              />
            </div>

            {error && (
              <div className="mb-3 px-3 py-2 bg-red-900/40 border border-red-700 rounded text-sm text-red-200">
                {error}
              </div>
            )}
            {todo && (
              <div className="mb-3 px-3 py-2 bg-amber-900/30 border border-amber-700 rounded text-xs text-amber-100">
                Server says: {todo}
                <div className="mt-1 text-amber-200/80">
                  In the meantime, create your account via{' '}
                  <a
                    href="https://wakingdream.cc/register"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    the web register page
                  </a>.
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 border border-smaragd/30 hover:bg-smaragd/10 rounded"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting || !username || !password || !email}
                className="flex-1 py-2 bg-smaragd hover:bg-smaragd-light rounded font-medium disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create'}
              </button>
            </div>

            <div className="mt-4 text-xs text-dawn/40 text-center">
              Already have an account? Just click PLAY to sign in via the WoW client.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
