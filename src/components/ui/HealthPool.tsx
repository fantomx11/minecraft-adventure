import { Icon } from './Icon';

interface HealthPoolProps {
  current: number;
  max: number;
  interactive?: boolean;
  onChange?: (hearts: number) => void;
}

export function HealthPool({ current, max, interactive = true, onChange }: HealthPoolProps) {
  return (
    <div class="hearts-drawer-container">
      {Array.from({ length: max }, (_, i) => {
        const isFilled = i < current;
        return (
          <span
            key={i}
            class={interactive ? 'heart-interactive' : ''}
            onClick={() => interactive && onChange?.(i + 1)}
          >
            <Icon name={isFilled ? 'heartFull' : 'heartEmpty'} />
          </span>
        );
      })}
    </div>
  );
}