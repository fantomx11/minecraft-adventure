import { useState } from 'preact/hooks';
import { Character } from '../../models/Character';
import { TrackedMaterial } from '../../types/inventory';
import { PixelFrame } from '../ui/PixelFrame';
import { StatusBar } from '../ui/StatusBar';
import { DiceRoller } from '../ui/DiceRoller';
import { DieItem } from '../../types/dice';

interface MiningViewProps {
  hero: Character;
  mineCleared: number;
  onUpdate: () => void;
  onGainMaterial: (mat: TrackedMaterial, amount?: number) => void;
  onNavigateCombat: (mobName: string) => void;
  onMineCleared: () => void;
}

export function MiningView({ hero, onUpdate, onGainMaterial, onNavigateCombat, onMineCleared, mineCleared }: MiningViewProps) {
  const [depthBonus, setDepthBonus] = useState(0);
  const [message, setMessage] = useState('Standing at the cavern entrance.');
  const [mineCount, setMineCount] = useState(0);

  const pickaxe = hero.equippedPickaxe;
  const pickaxeDice = pickaxe?.diceBonus || 1;

  const handleSurface = () => {
    if (depthBonus > 0 || mineCount > 0) {
      onMineCleared();
      setDepthBonus(0);
      setMineCount(0);
      setMessage('Returned safely to the surface (+1 Mine Clear). Depth and mining bonus reset.');
      onUpdate();
    } else {
      setMessage('Already resting at the surface entrance.');
    }
  };

  const handleRollPreview = (rolls: number[]): DieItem[] => {
    console.log("New Roll!");
    return rolls.map((roll) => {
      const total = roll + mineCount;

      console.log("Roll total: " + total);

      if (total <= 2) return { value: roll, tag: 'STONE', variant: 'neutral' };
      if (total <= 4) return { value: roll, tag: 'COAL', variant: 'hit' };
      if (total <= 6) return { value: roll, tag: 'IRON', variant: 'bonus' };
      return { value: roll, tag: 'FALL!', variant: 'miss' };
    });
  };

  const handleConfirmPick = (
    selectedIndices: number[],
    rolls: number[],
    labeledDice: DieItem[]
  ): DieItem[] => {
    const chosenIndex = selectedIndices[0];
    const chosenRoll = rolls[chosenIndex];
    const total = chosenRoll + mineCount;

    if (total <= 2) {
      onGainMaterial('Stone', 1);
      setMessage(`Mined (Roll ${chosenRoll} + Bonus ${mineCount} = ${total}): Chipped 1 Stone.`);
    } else if (total <= 4) {
      onGainMaterial('Coal', 1);
      setMessage(`Mined (Roll ${chosenRoll} + Bonus ${mineCount} = ${total}): Found 1 Coal deposit.`);
    } else if (total <= 6) {
      onGainMaterial('Iron', 1);
      setMessage(`Mined (Roll ${chosenRoll} + Bonus ${mineCount} = ${total}): Extracted 1 Iron ore.`);
    } else {
      setDepthBonus((prev) => prev + 1);
      setMessage(`Mined (Roll ${chosenRoll} + Bonus ${mineCount} = ${total}): Ground caved in! Fell deeper into the shaft (+1 Depth).`);
    }

    setMineCount((prev) => prev + 1);
    onUpdate();

    // Return the dice with the chosen one highlighted and unpicked ones marked
    return labeledDice.map((die, i) => ({
      ...die,
      tag: i === chosenIndex ? die.tag : 'IGNORED',
      variant: i === chosenIndex ? die.variant : 'neutral',
    }));
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

  return (
    <section class="view-panel active">
      <PixelFrame title="MINING EXPEDITION" icon="pickaxe">
        <p style={{ fontSize: '13px', lineHeight: '1.8' }}>
          Pickaxe: <strong>{pickaxe?.name || 'Bare Hands'}</strong> | Depth Bonus:{' '}
          <strong>+{depthBonus}</strong> | Mine Expeditions Cleared:{' '}
          <strong>{mineCleared}</strong>
        </p>

        <div class="mode-actions-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <button type="button" class="pixel-btn btn-danger" onClick={handleExploreShaft}>
            EXPLORE SHAFT
          </button>

          <button type="button" class="pixel-btn" onClick={handleSurface}>
            SURFACE
          </button>
        </div>

        <div class="mode-actions-grid">
          <div style={{ marginTop: '16px' }}>
            <DiceRoller
              diceCount={pickaxeDice}
              pickCount={1}
              rollButtonLabel="MINE VEIN"
              confirmButtonLabel="TAKE THIS DIE"
              buttonClass="btn-primary"
              onRoll={handleRollPreview}
              onConfirm={handleConfirmPick}
            />
          </div>
        </div>

        <StatusBar marginTop="16px">{message}</StatusBar>
      </PixelFrame>
    </section>
  );
}