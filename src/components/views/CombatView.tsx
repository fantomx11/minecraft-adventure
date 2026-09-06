import { useState, useEffect } from 'preact/hooks';
import { Mob } from '../../models/Mob';
import { BESTIARY } from '../../data/bestiary';
import { CombatEngine } from '../../engine/CombatEngine';
import { CombatMessage } from '../../types/combat';
import { PixelFrame } from '../ui/PixelFrame';
import { StatField } from '../ui/StatField';
import { StatusBar } from '../ui/StatusBar';
import { PixelDie } from '../ui/PixelDie';
import { CombatLogStream } from '../ui/CombatLogStream';
import { Character } from '../../models/Character';
import { DiceTray } from '../ui/DiceTray';

interface CombatViewProps {
  hero: Character;
  onUpdate: () => void;
  initialMobName?: string;
}

export function CombatView({ hero, onUpdate, initialMobName }: CombatViewProps) {
  const [selectedMobName, setSelectedMobName] = useState<string>(
    initialMobName || BESTIARY[0].name
  );
  const [engine, setEngine] = useState<CombatEngine>(() => {
    const config = BESTIARY.find((m) => m.name === (initialMobName || BESTIARY[0].name)) || BESTIARY[0];
    const createdMob = new Mob(config);
    const eng = new CombatEngine(hero, createdMob);
    eng.initCombat();
    return eng;
  });

  const [diceCount, setDiceCount] = useState<number>(hero.attack);
  const [lastRolls, setLastRolls] = useState<number[]>([]);
  const [logs, setLogs] = useState<CombatMessage[]>([
    { type: 'notice', text: 'Encounter initialized. Choose dice & roll!' },
  ]);

  useEffect(() => {
    if (initialMobName && initialMobName !== selectedMobName) {
      initMobEncounter(initialMobName);
    }
  }, [initialMobName]);

  const initMobEncounter = (mobName: string) => {
    setSelectedMobName(mobName);
    const config = BESTIARY.find((m) => m.name === mobName) || BESTIARY[0];
    const createdMob = new Mob(config);
    const eng = new CombatEngine(hero, createdMob);
    eng.initCombat();
    setEngine(eng);
    setLastRolls([]);
    setLogs([{ type: 'notice', text: `Approached a wild ${createdMob.name}!` }]);
  };

  const handleRollCombat = () => {
    const activeMob = engine.ctx.combatState.mob;
    if (activeMob.isDefeated()) {
      setLogs((prev) => [
        { type: 'notice', text: `${activeMob.name} is defeated! Pick another target.` },
        ...prev,
      ]);
      return;
    }
    if (hero.isDefeated()) {
      setLogs((prev) => [
        { type: 'special', text: 'You are defeated! Rest or restore HP on your character sheet.' },
        ...prev,
      ]);
      return;
    }

    const roundRes = engine.executeRound(diceCount, activeMob.defense);
    setLastRolls([...engine.ctx.roundState.rolls]);

    const newMsgs: CombatMessage[] = [
      {
        type: 'notice',
        text: `--- Turn ${engine.ctx.combatState.turn} --- (Rolls: [${engine.ctx.roundState.rolls.join(', ')}])`,
      },
      ...engine.ctx.roundState.messages,
    ];

    if (roundRes.heroDmgRes && roundRes.heroDmgRes.appliedTotal > 0) {
      newMsgs.push({
        type: 'hit',
        text: `Hero dealt ${roundRes.heroDmgRes.appliedTotal} DMG to ${activeMob.name}.`,
      });
    }

    if (roundRes.mobDmgRes && roundRes.mobDmgRes.appliedTotal > 0) {
      newMsgs.push({
        type: 'miss',
        text: `${activeMob.name} hit Hero for ${roundRes.mobDmgRes.appliedTotal} DMG.`,
      });
    }

    if (roundRes.status === 'victory') {
      newMsgs.push({ type: 'special', text: `VICTORY! ${activeMob.name} defeated!` });
    } else if (roundRes.status === 'defeat') {
      newMsgs.push({ type: 'special', text: 'DEFEAT! Hero has fallen.' });
    }

    setLogs((prev) => [...newMsgs, ...prev].slice(0, 40));
    onUpdate();
  };

  const mob = engine.ctx.combatState.mob;
  const maxAllowedDice = Math.max(1, hero.attack);

  return (
    <section class="view-panel active">
      {/* Target Selector & Mob Stats */}
      <PixelFrame title="ENCOUNTER TARGET" icon="sword">
        <div style={{ marginBottom: '16px' }}>
          <select
            class="pixel-select"
            value={selectedMobName}
            onChange={(e) => initMobEncounter((e.target as HTMLSelectElement).value)}
          >
            {BESTIARY.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div class="mob-stats-grid">
          <StatField icon="heartFull" label="HEARTS" value={`${mob.hearts}/${mob.maxHearts}`} />
          <StatField icon="chestplate" label="DEFENSE" value={mob.defense} />
          <StatField icon="tnt" label="DAMAGE" value={mob.damage} />
        </div>

        <StatusBar>
          Status: {engine.ctx.combatState.effects.length > 0
            ? `[ ${engine.ctx.combatState.effects.map((e) => (e as any).name || 'Effect').join(' | ')} ]`
            : 'Normal Encounter'}
        </StatusBar>
      </PixelFrame>

      {/* Middle Grid: Dice Roller & Mob Rules */}
      <div class="combat-middle-grid">
        {/* Dice Roller */}
        <PixelFrame title="ACTION ROLLER" icon="target">
          <div class="dice-action-area">
            <div class="dice-picker-group">
              <label for="dice-count-input">DICE (MAX {maxAllowedDice}):</label>
              <input
                id="dice-count-input"
                class="pixel-input"
                type="number"
                min="1"
                max={maxAllowedDice}
                value={Math.min(diceCount, maxAllowedDice)}
                onInput={(e) => {
                  const val = parseInt((e.target as HTMLInputElement).value, 10) || 1;
                  setDiceCount(Math.max(1, Math.min(maxAllowedDice, val)));
                }}
              />
            </div>
            <button type="button" class="pixel-btn btn-primary" onClick={handleRollCombat}>
              ROLL ATTACK
            </button>
          </div>

          <DiceTray rolls={lastRolls} targetDef={mob.defense} />
        </PixelFrame>

        {/* Mob Rules */}
        <PixelFrame title="MOB RULES" icon="spark">
          <div id="mob-rules-stream">
            <span class="rules-header-tag">SPECIAL ABILITY</span>
            <span class="rules-body-text">{mob.rules}</span>
            <span class="rules-header-tag">LOOT DROP</span>
            <span class="rules-body-text">{mob.loot}</span>
          </div>
        </PixelFrame>
      </div>

      {/* Adventure Log */}
      <PixelFrame title="ADVENTURE LOG" icon="book">
        <CombatLogStream logs={logs} />
      </PixelFrame>
    </section>
  );
}