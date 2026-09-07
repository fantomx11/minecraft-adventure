import { PixelDie } from './PixelDie';
import { DieItem } from '../../types/dice';

interface DiceTrayProps {
  dice: DieItem[];
  selectable?: boolean;
  selectedIndices?: number[];
  onToggleSelect?: (index: number) => void;
  emptyMessage?: string;
}

export function DiceTray({
  dice,
  selectable = false,
  selectedIndices = [],
  onToggleSelect,
  emptyMessage = 'Dice tray empty',
}: DiceTrayProps) {
  return (
    <div class="dice-tray">
      {dice.map((die, idx) => {
        const isSelected = selectedIndices.includes(idx);
        const isDimmed = selectable && selectedIndices.length > 0 && !isSelected;

        return (
          <div
            key={idx}
            class={`die-wrapper ${selectable ? 'is-selectable' : ''} ${isSelected ? 'is-selected' : ''} ${
              isDimmed ? 'is-dimmed' : ''
            }`}
            onClick={() => selectable && onToggleSelect?.(idx)}
            style={{
              cursor: selectable ? 'pointer' : 'default',
              transition: 'transform 0.1s ease, opacity 0.15s ease',
              transform: isSelected ? 'scale(1.1)' : 'scale(1)',
              opacity: isDimmed ? 0.45 : 1,
            }}
          >
            <PixelDie value={die.value} variant={die.variant} />
            {die.tag && (
              <span class={`die-tag tag-${die.variant || 'neutral'}`}>
                {die.tag}
              </span>
            )}
          </div>
        );
      })}
      {dice.length === 0 && (
        <div style={{ color: '#666', fontSize: '11px', alignSelf: 'center' }}>
          {emptyMessage}
        </div>
      )}
    </div>
  );
}