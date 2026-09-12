import { useState } from 'preact/hooks';
import { Character } from '../../models/Character';
import { TrackedMaterial } from '../../types/inventory';
import { PixelFrame } from '../ui/PixelFrame';
import { StatusBar } from '../ui/StatusBar';
import { DiceRoller } from '../ui/DiceRoller';
import { DieItem } from '../../types/dice';

interface ForestViewProps {
  hero: Character;
  grovesCleared: number;
  onUpdate: () => void;
  onGainMaterial: (mat: TrackedMaterial, amount?: number) => void;
  onNavigateCombat: (mobName: string) => void;
  onGroveCleared: () => void;
}

export function ForestView({ onUpdate, onGainMaterial, onNavigateCombat, onGroveCleared, grovesCleared }: ForestViewProps) {
  const [message, setMessage] = useState('The canopy is dense. What will you do?');

  const handleForageRoll = (rolls: number[]): DieItem[] => {
    const roll = rolls[0];

    if (roll <= 2) {
      onGainMaterial('Wood', 1);
      setMessage(`Foraged (Roll d6 = ${roll}): Gathered 1 Wood.`);
      onUpdate();
      return [{ value: roll, tag: '1 WOOD', variant: 'neutral' }];
    }
    if (roll <= 4) {
      onGainMaterial('Wheat', 1);
      setMessage(`Foraged (Roll d6 = ${roll}): Gathered 1 Wheat.`);
      onUpdate();
      return [{ value: roll, tag: '1 WHEAT', variant: 'neutral' }];
    }
    if (roll === 5) {
      onGainMaterial('Leather', 1);
      setMessage(`Foraged (Roll d6 = ${roll}): Gathered 1 Leather.`);
      onUpdate();
      return [{ value: roll, tag: '1 LEATHER', variant: 'bonus' }];
    }

    setMessage(`Ambush (Roll d6 = ${roll})! A wild Slime emerges!`);
    onNavigateCombat('Slime');
    return [{ value: roll, tag: 'AMBUSH!', variant: 'miss' }];
  };

  const handleDelveWoods = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    if (roll <= 3) {
      const mobPool = ['Spider', 'Zombie', 'Skeleton'];
      const targetMob = mobPool[Math.floor(Math.random() * mobPool.length)];
      setMessage(`Ambush! A wild ${targetMob} emerges from the shadows!`);
      onNavigateCombat(targetMob);
    } else {
      onGroveCleared();
      onGainMaterial('Wood', 2);
      setMessage('Carved a path through the deep thickets (+2 Wood, +1 Grove Cleared).');
      onUpdate();
    }
  };

  return (
    <section class="view-panel active">
      <PixelFrame title="DEEP WOODS" icon="tree">
        <p style={{ fontSize: '13px', lineHeight: '1.8' }}>
          Forage for raw resources, or delve deeper to clear groves.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <DiceRoller
            diceCount={1}
            rollButtonLabel="FORAGE WOODS (d6)"
            buttonClass="btn-success"
            onRoll={handleForageRoll}
          />
        </div>

        <div class="mode-actions-grid" style={{ marginTop: '12px' }}>
          <button type="button" class="pixel-btn btn-danger" onClick={handleDelveWoods}>
            DELVE DEEPER
          </button>
        </div>

        <div style={{ fontSize: '13px', marginTop: '12px' }}>
          Groves Cleared: <strong>{grovesCleared}</strong>
        </div>

        <StatusBar marginTop="16px">{message}</StatusBar>
      </PixelFrame>
    </section>
  );
}