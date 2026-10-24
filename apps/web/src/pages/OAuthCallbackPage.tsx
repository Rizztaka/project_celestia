import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { restoreCookieSession } from '../lib/auth-client';
import { useAuthStore } from '../stores/auth.store';

export default function OAuthCallbackPage() {
  const navigate = useNavigate(),
    started = useRef(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (useAuthStore.getState().isAuthenticated) {
      navigate('/workspace', { replace: true });
      return;
    }
    void restoreCookieSession()
      .then(() => navigate('/workspace', { replace: true }))
      .catch(() => setError('Sign-in could not finish. Please try again.'));
  }, [navigate]);
  return (
    <main className="p-8 text-zinc-300">
      {error ? (
        <>
          <p role="alert">{error}</p>
          <Link to="/workspace/login" className="underline">
            Back to sign in
          </Link>
        </>
      ) : (
        <p role="status">Completing sign-in…</p>
      )}
    </main>
  );
}
