import { Infinity, ShieldCheck } from 'lucide-react';
import { useI18n } from './i18n';

/** The app's two selling points, shown on the login and home screens. */
export function FeatureList({ compact = false }: { compact?: boolean }) {
  const { m } = useI18n();
  const size = compact ? 16 : 20;
  return (
    <ul className={`feature-list ${compact ? 'compact' : ''}`}>
      <li>
        <Infinity size={size} />
        <span>
          <strong>{m.featureEndlessTitle}</strong>: {m.featureEndlessText}
        </span>
      </li>
      <li>
        <ShieldCheck size={size} />
        <span>
          <strong>{m.featureNoRepeatTitle}</strong>: {m.featureNoRepeatText}
        </span>
      </li>
    </ul>
  );
}
