import { useState } from 'react';
import type { SessionUser } from '../../shared/types';
import { LocaleSwitcher, useI18n } from '../i18n';

interface Props {
  user: SessionUser;
  onNewGame: () => void;
  onLogout: () => void;
}

export function HomeScreen({ user, onNewGame, onLogout }: Props) {
  const { m } = useI18n();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <button className="profile-button" onClick={() => setProfileOpen(true)}>
          <Avatar user={user} />
          <span className="profile-name">{user.name}</span>
        </button>
      </header>

      <div className="centered home">
        <div className="logo">🕵️</div>
        <h1>There Is an Impostor</h1>
        <p className="muted">{m.tagline}</p>
        <button className="button primary big" onClick={onNewGame}>
          {m.newGame}
        </button>
      </div>

      {profileOpen && (
        <ProfileModal user={user} onClose={() => setProfileOpen(false)} onLogout={onLogout} />
      )}
    </>
  );
}

function Avatar({ user }: { user: SessionUser }) {
  if (user.picture) {
    return <img className="avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />;
  }
  return (
    <span className="avatar avatar-default" aria-hidden="true">
      {user.name.charAt(0).toUpperCase() || '🕵️'}
    </span>
  );
}

function ProfileModal({
  user,
  onClose,
  onLogout,
}: {
  user: SessionUser;
  onClose: () => void;
  onLogout: () => void;
}) {
  const { m } = useI18n();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label={m.close} onClick={onClose}>
          ✕
        </button>
        <div className="modal-profile">
          <Avatar user={user} />
          <div>
            <div className="modal-name">{user.name}</div>
            {user.email && <div className="muted small">{user.email}</div>}
          </div>
        </div>

        <div className="modal-row">
          <span>{m.language}</span>
          <LocaleSwitcher />
        </div>

        <button className="button big" onClick={onLogout}>
          {m.signOut}
        </button>
      </div>
    </div>
  );
}
