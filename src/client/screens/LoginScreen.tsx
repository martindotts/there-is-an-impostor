import { useEffect, useState } from 'react';
import type { Providers } from '../../shared/types';
import { api } from '../api';
import { LocaleSwitcher, useI18n } from '../i18n';

export function LoginScreen() {
  const { m } = useI18n();
  const [providers, setProviders] = useState<Providers | null>(null);

  useEffect(() => {
    api.providers().then(setProviders).catch(() => setProviders(null));
  }, []);

  return (
    <div className="centered login">
      <div className="login-locale">
        <LocaleSwitcher />
      </div>
      <div className="logo">🕵️</div>
      <h1>There Is an Impostor</h1>
      <p className="muted">{m.tagline}</p>

      <div className="login-buttons">
        <a
          className={`button provider-button ${providers && !providers.google ? 'disabled' : ''}`}
          href="/auth/google"
          aria-disabled={providers ? !providers.google : false}
          onClick={(e) => providers && !providers.google && e.preventDefault()}
        >
          <GoogleIcon /> {m.continueWithGoogle}
        </a>
        <a
          className={`button provider-button ${providers && !providers.apple ? 'disabled' : ''}`}
          href="/auth/apple"
          aria-disabled={providers ? !providers.apple : false}
          onClick={(e) => providers && !providers.apple && e.preventDefault()}
        >
          <AppleIcon /> {m.continueWithApple}
        </a>
        {providers?.dev && (
          <a className="button provider-button dev" href="/auth/dev">
            {m.devLogin}
          </a>
        )}
      </div>

      {providers && !providers.google && !providers.apple && (
        <p className="muted small">{m.noProviders}</p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2 3.5-5 3.5-8.6z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.7-4.9l-.14.01-3.6 2.8-.05.13C3.4 21.4 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.5c-.3-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3l-.01-.16-3.7-2.8-.12.06C.5 8.6 0 10.3 0 12.2s.5 3.6 1.4 5.2l3.9-2.9z"
      />
      <path
        fill="#EB4335"
        d="M12 4.8c2.2 0 3.7 1 4.6 1.8l3.3-3.2C17.9 1.3 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.5l3.9 3C6.2 6.9 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.4 12.9c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.9C6.4 7.3 4.9 8.3 4.1 9.8c-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.4-1-2.4-3.9zM14 5.6c.7-.8 1.1-1.9 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"
      />
    </svg>
  );
}
