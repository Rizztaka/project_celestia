import { useQuery } from '@tanstack/react-query';

import { fetchApi } from '../lib/api';
import { API_BASE } from '../lib/auth-client';
import { useAuthStore } from '../stores/auth.store';

export default function SocialLogin() {
  const providers = useQuery({
    queryKey: ['auth', 'providers'],
    queryFn: ({ signal }) =>
      fetchApi<{ discord: boolean; google: boolean }>('/auth/oauth/providers', { signal }),
    retry: false,
  });
  if (providers.isPending || (providers.data && !providers.data.discord && !providers.data.google))
    return null;
  return (
    <div className="mt-6 space-y-3">
      <p className="text-center text-xs text-zinc-400">or continue with</p>
      {(['discord', 'google'] as const)
        .filter((provider) => providers.data?.[provider])
        .map((provider) => (
          <button
            key={provider}
            type="button"
            className={`flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-40 ${provider === 'discord' ? 'bg-[#5865F2] text-white hover:bg-[#4752C4]' : 'border border-zinc-600 bg-white text-zinc-900 hover:bg-zinc-100'}`}
            disabled={!providers.data?.[provider]}
            onClick={() => {
              useAuthStore.getState().logout();
              window.location.assign(`${API_BASE}/auth/oauth/${provider}`);
            }}
          >
            {provider === 'discord' ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M20.3 4.4a20 20 0 0 0-4.9-1.5l-.6 1.2a18 18 0 0 0-5.6 0l-.6-1.2a20 20 0 0 0-4.9 1.5C.6 9.1-.2 13.7.2 18.2a20 20 0 0 0 6 3l1.2-2a12 12 0 0 1-1.9-.9l.5-.4a14 14 0 0 0 12 0l.5.4a12 12 0 0 1-1.9.9l1.2 2a20 20 0 0 0 6-3c.5-5.2-.9-9.7-3.5-13.8ZM8.2 15.5c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Zm7.6 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Z" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  fill="#4285F4"
                  d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.3 2.9-7.6Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 5-1 6.7-2.5l-3.3-2.6c-.9.6-2 .9-3.4.9a6 6 0 0 1-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z"
                />
                <path fill="#FBBC05" d="M6.4 13.7a6 6 0 0 1 0-3.4V7.7H3a10 10 0 0 0 0 8.6Z" />
                <path
                  fill="#EA4335"
                  d="M12 6.2c1.5 0 2.8.5 3.8 1.5L18.6 5A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.7l3.4 2.6A6 6 0 0 1 12 6.2Z"
                />
              </svg>
            )}
            Continue with {provider === 'discord' ? 'Discord' : 'Google'}
          </button>
        ))}
      {providers.error && (
        <p className="text-xs text-amber-200">Social sign-in is unavailable right now.</p>
      )}
    </div>
  );
}
