import { IconName } from '../../data/icons';
import { Icon } from './Icon';

interface StatFieldProps {
  icon: IconName;
  label: string;
  value: string | number;
}

export function StatField({ icon, label, value }: StatFieldProps) {
  return (
    <div class="stat-field">
      <label>
        <Icon name={icon} /> {label}
      </label>
      <input class="pixel-input" type="text" readOnly value={value} />
    </div>
  );
}