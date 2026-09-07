import { useState } from 'preact/hooks';
import { DiceTray } from './DiceTray';
import { DieItem } from '../../types/dice';

interface DiceRollerProps {
  diceCount?: number;
  maxDice?: number;
  pickCount?: number;
  rollButtonLabel?: string;
  confirmButtonLabel?: string;
  buttonClass?: string;
  disabled?: boolean;
  onRoll: (rawRolls: number[]) => DieItem[];
  onConfirm?: (selectedIndices: number[], rawRolls: number[], currentDice: DieItem[]) => DieItem[] | void;
}

export function DiceRoller({
  diceCount: fixedDiceCount,
  maxDice,
  pickCount,
  rollButtonLabel = 'ROLL DICE',
  confirmButtonLabel = 'USE SELECTED',
  buttonClass = 'btn-primary',
  disabled = false,
  onRoll,
  onConfirm,
}: DiceRollerProps) {
  const [selectableCount, setSelectableCount] = useState<number>(maxDice || 1);
  const [phase, setPhase] = useState<'idle' | 'picking' | 'resolved'>('idle');
  const [rolls, setRolls] = useState<number[]>([]);
  const [diceItems, setDiceItems] = useState<DieItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const totalDiceToRoll = fixedDiceCount ?? selectableCount;
  const neededPicks = Math.min(pickCount ?? totalDiceToRoll, totalDiceToRoll);

  const handleRoll = () => {
    if (disabled) return;

    const newRolls = Array.from({ length: totalDiceToRoll }, () => Math.floor(Math.random() * 6) + 1);
    setRolls(newRolls);

    const labeled = onRoll(newRolls);
    setDiceItems(labeled);

    if (neededPicks >= totalDiceToRoll) {
      const allIndices = newRolls.map((_, i) => i);
      const finalDisplay = onConfirm?.(allIndices, newRolls, labeled);
      if (finalDisplay) setDiceItems(finalDisplay);
      setSelectedIndices([]);
      setPhase('resolved');
      return;
    }

    setSelectedIndices([]);
    setPhase('picking');
  };

  const handleToggleSelect = (index: number) => {
    setSelectedIndices((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= neededPicks) {
        return neededPicks === 1 ? [index] : [...prev.slice(1), index];
      }
      return [...prev, index];
    });
  };

  const handleConfirm = () => {
    if (selectedIndices.length !== neededPicks) return;
    const finalDisplay = onConfirm?.(selectedIndices, rolls, diceItems);
    if (finalDisplay) setDiceItems(finalDisplay);
    setSelectedIndices([]);
    setPhase('resolved');
  };

  return (
    <div class="dice-roller-container">
      <div class="dice-action-area" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
        {phase === 'picking' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <span style={{ fontSize: '12px', color: 'var(--pixel-yellow)' }}>
              PICK {neededPicks} DIE ({selectedIndices.length}/{neededPicks})
            </span>
            <button
              type="button"
              class="pixel-btn btn-success"
              style={{ marginLeft: 'auto' }}
              disabled={selectedIndices.length !== neededPicks}
              onClick={handleConfirm}
            >
              {confirmButtonLabel}
            </button>
          </div>
        ) : (
          <>
            {maxDice && maxDice > 1 && (
              <div class="dice-picker-group">
                <label>DICE (MAX {maxDice}):</label>
                <input
                  class="pixel-input"
                  type="number"
                  min="1"
                  max={maxDice}
                  value={Math.min(selectableCount, maxDice)}
                  onInput={(e) => {
                    const val = parseInt((e.target as HTMLInputElement).value, 10) || 1;
                    setSelectableCount(Math.max(1, Math.min(maxDice, val)));
                  }}
                />
              </div>
            )}
            <button
              type="button"
              class={`pixel-btn ${buttonClass}`}
              disabled={disabled}
              onClick={handleRoll}
            >
              {rollButtonLabel}
            </button>
          </>
        )}
      </div>

      <DiceTray
        dice={diceItems}
        selectable={phase === 'picking'}
        selectedIndices={selectedIndices}
        onToggleSelect={handleToggleSelect}
      />
    </div>
  );
}