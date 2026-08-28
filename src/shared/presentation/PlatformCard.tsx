import { STATUS_LABELS, type PlatformConnectionStatus, type PlatformDefinition } from '../domain/platform';

interface Props {
  platform: PlatformDefinition;
  status?: PlatformConnectionStatus;
  children?: React.ReactNode;
}

export function PlatformCard({ platform, status, children }: Props) {
  return (
    <article className="platform-card">
      <div className="platform-heading">
        <span className={`platform-icon platform-${platform.code}`} aria-hidden="true">{platform.icon}</span>
        <div>
          <h3>{platform.name}</h3>
          <p>{platform.description}</p>
        </div>
      </div>
      {status && <span className={`status status-${status}`}><span aria-hidden="true">●</span> {STATUS_LABELS[status]}</span>}
      {children}
    </article>
  );
}
