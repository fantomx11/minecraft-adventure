import { useState } from 'preact/hooks';
import { Character } from '../../models/Character';
import { TrackedMaterial } from '../../types/inventory';
import { PixelFrame } from '../ui/PixelFrame';
import { StatusBar } from '../ui/StatusBar';

interface MiningViewProps {
  hero: Character;
  onUpdate: () => void;
  onGainMaterial: (mat: TrackedMaterial, amount?: number) => void;
  onNavigateCombat: (mobName: string) => void;
}

export function MiningView({ hero, onUpdate, onGainMaterial, onNavigateCombat }: MiningViewProps) {
  const [depthBonus, setDepthBonus] = useState(0);
  const [message, setMessage] = useState('Standing at the cavern entrance.');

  const pickaxe = hero.equippedPickaxe;
  const pickaxeBonus = pickaxe?.diceBonus || 1;

  const handleMineVein = () => {
    const baseRoll = Math.floor(Math.random() * 6) + 1;
    const total = baseRoll + pickaxeBonus + depthBonus;

    if (total <= 3) {
      onGainMaterial('Stone', 1);
      setMessage(`Mined (Roll ${baseRoll} + Bonus ${pickaxeBonus + depthBonus} = ${total}): Chipped 1 Stone.`);
    } else if (total <= 5) {
      onGainMaterial('Stone', 2);
      onGainMaterial('Coal', 1);
      setMessage(`Mined (Total ${total}): Struck coal deposits! (+2 Stone, +1 Coal).`);
    } else if (total <= 7) {
      onGainMaterial('Iron', 2);
      onGainMaterial('Coal', 1);
      setMessage(`Mined (Total ${total}): Struck rich iron ore! (+2 Iron, +1 Coal).`);
    } else {
      onGainMaterial('Diamond', 1);
      onGainMaterial('Iron', 2);
      setMessage(`Mined (Total ${total}): JACKPOT! Discovered Diamond! (+1 Diamond, +2 Iron).`);
    }
    onUpdate();
  };

  const handleExploreShaft = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    if (roll <= 2) {
      const caveMobs = ['Creeper', 'Cave Spider', 'Zombie'];
      const target = caveMobs[Math.floor(Math.random() * caveMobs.length)];
      setMessage(`A skittering hiss echoes in the dark! Encountered a ${target}!`);
      onNavigateCombat(target);
    } else {
      setDepthBonus((d) => d + 1);
      setMessage('Ventured deeper into the lower caverns (+1 Depth Bonus). Richer ore ahead!');
    }
  };

  const handleSurface = () => {
    if (depthBonus > 0) {
      hero.mineCleared += 1;
      setDepthBonus(0);
      setMessage('Returned safely to the surface (+1 Mine Clear). Depth bonus reset.');
      onUpdate();
    } else {
      setMessage('Already resting at the surface entrance.');
    }
  };

  return (
    <section class="view-panel active">
      <PixelFrame title="MINING EXPEDITION" icon="pickaxe">
        <p style={{ fontSize: '13px', lineHeight: '1.8' }}>
          Pickaxe: <strong>{pickaxe?.name || 'Bare Hands'}</strong> | Depth Bonus:{' '}
          <strong>+{depthBonus}</strong> | Mine Expeditions Cleared:{' '}
          <strong>{hero.mineCleared}</strong>
        </p>

        <div class="mode-actions-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <button type="button" class="pixel-btn btn-primary" onClick={handleMineVein}>
            MINE VEIN
          </button>
          <button type="button" class="pixel-btn btn-danger" onClick={handleExploreShaft}>
            EXPLORE SHAFT
          </button>
          <button type="button" class="pixel-btn" onClick={handleSurface}>
            SURFACE
          </button>
        </div>

        <StatusBar marginTop="16px">{message}</StatusBar>
      </PixelFrame>
    </section>
  );
}