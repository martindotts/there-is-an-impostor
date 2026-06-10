import { useState } from 'react';
import { Settings, UserRound, X } from 'lucide-react';
import type { SessionUser, UserSettings } from '../../shared/types';
import { FeatureList } from '../FeatureList';
import { LocaleSwitcher, useI18n } from '../i18n';

type SettingsPatch = Partial<Pick<UserSettings, 'showHint' | 'showCategory'>>;

interface Props {
  user: SessionUser;
  settings: UserSettings;
  onUpdateSetting: (patch: SettingsPatch) => void;
  onNewGame: () => void;
  onLogout: () => void;
}

export function HomeScreen({ user, settings, onUpdateSetting, onNewGame, onLogout }: Props) {
  const { m } = useI18n();
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <button className="profile-button" onClick={() => setProfileOpen(true)}>
          <Avatar user={user} />
          <span className="profile-name">{user.name}</span>
        </button>
        <button
          className="profile-button icon"
          aria-label={m.settings}
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={22} />
        </button>
      </header>

      <div className="centered home">
        <div className="logo">🕵️</div>
        <h1>There Is an Impostor</h1>
        <p className="muted">{m.tagline}</p>
        <button className="button primary big" onClick={onNewGame}>
          {m.newGame}
        </button>
        <FeatureList compact />
      </div>

      {profileOpen && (
        <ProfileModal user={user} onClose={() => setProfileOpen(false)} onLogout={onLogout} />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSetting={onUpdateSetting}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}

function Avatar({ user }: { user: SessionUser }) {
  if (user.picture) {
    return <img className="avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />;
  }
  const initial = user.name.charAt(0).toUpperCase();
  return (
    <span className="avatar avatar-default" aria-hidden="true">
      {initial || <UserRound size={18} />}
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
          <X size={20} />
        </button>
        <div className="modal-profile">
          <Avatar user={user} />
          <div>
            <div className="modal-name">{user.name}</div>
            {user.email && <div className="muted small">{user.email}</div>}
          </div>
        </div>

        <button className="button big" onClick={onLogout}>
          {m.signOut}
        </button>
      </div>
    </div>
  );
}

function SettingsModal({
  settings,
  onUpdateSetting,
  onClose,
}: {
  settings: UserSettings;
  onUpdateSetting: (patch: SettingsPatch) => void;
  onClose: () => void;
}) {
  const { m } = useI18n();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label={m.close} onClick={onClose}>
          <X size={20} />
        </button>
        <h2 className="modal-title">{m.settings}</h2>

        <div className="modal-row">
          <span>{m.language}</span>
          <LocaleSwitcher />
        </div>

        <div className="modal-row">
          <span>{m.showHintSetting}</span>
          <Switch
            checked={settings.showHint}
            label={m.showHintSetting}
            onChange={(showHint) => onUpdateSetting({ showHint })}
          />
        </div>

        <div className="modal-row">
          <span>{m.showCategorySetting}</span>
          <Switch
            checked={settings.showCategory}
            label={m.showCategorySetting}
            onChange={(showCategory) => onUpdateSetting({ showCategory })}
          />
        </div>
      </div>
    </div>
  );
}

function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-thumb" />
    </button>
  );
}
