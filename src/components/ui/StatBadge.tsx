import type { ComponentChildren } from 'preact';
import { Icon } from './Icon';
import { IconName } from '../../data/icons';

interface StatBadgeProps {
  icon: IconName;
  label?: string;
  value: ComponentChildren
}

export function StatBadge({ icon, label, value }: StatBadgeProps) {
  return (
    <div class="hud-badge">
      <Icon name={icon} />
      <span>
        {label ? `${label} ` : ''}
        {value}
      </span>
    </div>
  );
}