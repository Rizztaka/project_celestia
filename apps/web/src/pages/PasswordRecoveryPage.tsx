import { newPasswordSchema } from '@celestia/api-contracts';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthFrame } from '../components/Ui';
import { fetchApi } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

const field = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-white';
export default function PasswordRecoveryPage({ mode }: { mode: 'forgot' | 'reset' | 'verify' }) {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [confirmation, setConfirmation] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    document.title = `${mode === 'forgot' ? 'Password recovery' : mode === 'reset' ? 'Reset password' : 'Verify email'} · Celestia`;
    if (mode !== 'forgot')
      window.history.replaceState(window.history.state, '', window.location.pathname);
  }, [mode]);
  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === 'reset') {
        if (password !== confirmation) throw new Error('Your passwords do not match.');
        const parsed = newPasswordSchema.safeParse(password);
        if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);
      }
      return fetchApi(
        mode === 'forgot'
          ? '/auth/forgot-password'
          : mode === 'reset'
            ? '/auth/reset-password'
            : '/auth/verify-email',
        {
          method: 'POST',
          body: JSON.stringify(
            mode === 'forgot'
              ? { email }
              : mode === 'reset'
                ? { token, newPassword: password }
                : { token },
          ),
        },
      );
    },
    onSuccess: () => {
      if (mode === 'reset') useAuthStore.getState().logout();
    },
  });
  useEffect(() => {
    if (!mutation.isSuccess || mode !== 'reset') return;
    const timer = setTimeout(
      () =>
        navigate('/workspace/login', {
          replace: true,
          state: { message: 'Password reset. Sign in with your new password.' },
        }),
      1800,
    );
    return () => clearTimeout(timer);
  }, [mutation.isSuccess, mode, navigate]);
  const heading =
    mode === 'forgot'
      ? 'Forgot your password?'
      : mode === 'reset'
        ? 'Choose a new password'
        : 'Verify your email';
  return (
    <AuthFrame
      title={heading}
      description={
        mode === 'forgot'
          ? 'Enter your account email. We’ll send a link that works for 15 minutes.'
          : mode === 'reset'
            ? 'Resetting your password signs out all existing sessions.'
            : 'Confirm that this email belongs to your Celestia account.'
      }
    >
      <meta name="referrer" content="no-referrer" />
      <div className="space-y-5">
        {mode !== 'forgot' && !/^[a-f0-9]{64}$/.test(token) ? (
          <p role="alert" className="text-amber-200">
            This link is incomplete. Request a new email.
          </p>
        ) : mutation.isSuccess ? (
          <p role="status" className="text-emerald-200">
            {mode === 'forgot'
              ? 'If an account exists, a reset email has been sent. Check your inbox and spam folder.'
              : mode === 'reset'
                ? 'Password reset. Returning to sign in…'
                : 'Your email is verified.'}
          </p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            {mode === 'forgot' && (
              <label className="block space-y-2 text-sm text-zinc-300">
                Email
                <input
                  className={field}
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
            )}
            {mode === 'reset' && (
              <>
                <label className="block space-y-2 text-sm text-zinc-300">
                  New password
                  <input
                    className={field}
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                <label className="block space-y-2 text-sm text-zinc-300">
                  Confirm new password
                  <input
                    className={field}
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                  />
                </label>
              </>
            )}
            {mutation.error && (
              <p role="alert" className="text-sm text-amber-200">
                {mutation.error.message}
              </p>
            )}
            <button
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? 'Working…'
                : mode === 'forgot'
                  ? 'Send reset link'
                  : mode === 'reset'
                    ? 'Reset password'
                    : 'Verify email'}
            </button>
          </form>
        )}
        <Link
          className="inline-block text-sm text-indigo-200 underline"
          to={mode === 'verify' ? '/profile' : '/workspace/login'}
        >
          {mode === 'verify' ? 'Back to profile' : 'Back to sign in'}
        </Link>
        {mode === 'reset' && (
          <Link className="ml-4 text-sm text-indigo-200 underline" to="/forgot-password">
            Request a new link
          </Link>
        )}
      </div>
    </AuthFrame>
  );
}
