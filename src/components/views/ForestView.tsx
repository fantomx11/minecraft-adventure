import { useState } from 'preact/hooks';
import { Character } from '../../models/Character';
import { TrackedMaterial } from '../../types/inventory';
import { PixelFrame } from '../ui/PixelFrame';
import { StatusBar } from '../ui/StatusBar';

interface ForestViewProps {
  hero: Character;
  onUpdate: () => void;
  onGainMaterial: (mat: TrackedMaterial, amount?: number) => void;
  onNavigateCombat: (mobName: string) => void;
}

export function ForestView({ hero, onUpdate, onGainMaterial, onNavigateCombat }: ForestViewProps) {
  const [message, setMessage] = useState('The canopy is dense. What will you do?');

  const handleForage = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    let woodGain = 1;
    let extraBonus = '';

    if (roll >= 4 && roll <= 5) {
      woodGain = 2;
      onGainMaterial('String', 1);
      extraBonus = ' and 1 String';
    } else if (roll === 6) {
      woodGain = 3;
      onGainMaterial('Leather', 1);
      extraBonus = ' and 1 Leather';
    }

    onGainMaterial('Wood', woodGain);
    setMessage(`Foraged (Roll d6 = ${roll}): Gathered ${woodGain} Wood${extraBonus}.`);
    onUpdate();
  };

  const handleDelveWoods = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    if (roll <= 3) {
      const mobPool = ['Spider', 'Zombie', 'Skeleton'];
      const targetMob = mobPool[Math.floor(Math.random() * mobPool.length)];
      setMessage(`Ambush! A wild ${targetMob} emerges from the shadows!`);
      onNavigateCombat(targetMob);
    } else {
      hero.forestCleared += 1;
      onGainMaterial('Wood', 2);
      setMessage('Carved a path through the deep thickets (+2 Wood, +1 Grove Cleared).');
      onUpdate();
    }
  };

  return (
    <section class="view-panel active">
      <PixelFrame title="DEEP WOODS" icon="tree">
        <p style={{ fontSize: '13px', lineHeight: '1.8' }}>
          Forage for raw wood and crafting components, or delve into the overgrowth to clear groves.
        </p>

        <div class="mode-actions-grid">
          <button type="button" class="pixel-btn btn-success" onClick={handleForage}>
            FORAGE WOODS (d6)
          </button>
          <button type="button" class="pixel-btn btn-danger" onClick={handleDelveWoods}>
            DELVE DEEPER
          </button>
        </div>

        <div style={{ fontSize: '13px', marginTop: '12px' }}>
          Groves Cleared: <strong>{hero.forestCleared}</strong>
        </div>

        <StatusBar marginTop="16px">{message}</StatusBar>
      </PixelFrame>
    </section>
  );
}