import { useState, useEffect } from 'preact/hooks';
import { Mob } from '../../models/Mob';
import { BESTIARY } from '../../data/bestiary';
import { CombatEngine } from '../../engine/CombatEngine';
import { CombatMessage } from '../../types/combat';
import { PixelFrame } from '../ui/PixelFrame';
import { StatField } from '../ui/StatField';
import { StatusBar } from '../ui/StatusBar';
import { CombatLogStream } from '../ui/CombatLogStream';
import { Character } from '../../models/Character';
import { DiceRoller } from '../ui/DiceRoller';
import { DieItem } from '../../types/dice';

interface CombatViewProps {
  hero: Character;
  onUpdate: () => void;
  initialMobName?: string;
  narrativeContext?: {
    victoryPassageId?: string;
    onReturnToNarrative?: (targetPassageId?: string) => void;
  };
}

export function CombatView({ hero, onUpdate, initialMobName, narrativeContext }: CombatViewProps) {
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

  const [, setLastRolls] = useState<number[]>([]);
  const [logs, setLogs] = useState<CombatMessage[]>([
    { type: 'notice', text: 'Encounter initialized. Choose dice & roll!' },
  ]);
  const [lootClaimed, setLootClaimed] = useState(false);

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
    setLootClaimed(false);
    setLogs([{ type: 'notice', text: `Approached a wild ${createdMob.name}!` }]);
  };

  const handleCombatRoll = (rolls: number[]): DieItem[] => {
    const activeMob = engine.ctx.combatState.mob;
    if (activeMob.isDefeated()) {
      setLogs((prev) => [{ type: 'notice', text: `${activeMob.name} is defeated! Pick another target.` }, ...prev]);
      return rolls.map((r) => ({ value: r, tag: 'INACTIVE', variant: 'neutral' }));
    }
    if (hero.isDefeated()) {
      setLogs((prev) => [{ type: 'special', text: 'You are defeated! Rest or restore HP on your character sheet.' }, ...prev]);
      return rolls.map((r) => ({ value: r, tag: 'DEFEAT', variant: 'miss' }));
    }

    const roundRes = engine.executeRound(rolls.length, activeMob.defense, rolls);

    const newMsgs: CombatMessage[] = [
      {
        type: 'notice',
        text: `--- Turn ${engine.ctx.combatState.turn} --- (Rolls: [${rolls.join(', ')}])`,
      },
      ...engine.ctx.roundState.messages,
    ];

    if (roundRes.heroDmgRes && roundRes.heroDmgRes.appliedTotal > 0) {
      newMsgs.push({ type: 'hit', text: `Hero dealt ${roundRes.heroDmgRes.appliedTotal} DMG to ${activeMob.name}.` });
    }
    if (roundRes.mobDmgRes && roundRes.mobDmgRes.appliedTotal > 0) {
      newMsgs.push({ type: 'miss', text: `${activeMob.name} hit Hero for ${roundRes.mobDmgRes.appliedTotal} DMG.` });
    }
    if (roundRes.status === 'victory') {
      newMsgs.push({ type: 'special', text: `VICTORY! ${activeMob.name} defeated!` });
    } else if (roundRes.status === 'defeat') {
      newMsgs.push({ type: 'special', text: 'DEFEAT! Hero has fallen.' });
    }

    setLogs((prev) => [...newMsgs, ...prev].slice(0, 40));
    onUpdate();

    return rolls.map((roll) => ({
      value: roll,
      tag: roll >= activeMob.defense ? 'HIT' : 'MISS',
      variant: roll >= activeMob.defense ? 'hit' : 'miss',
    }));
  };

  const handleLootRoll = (rolls: number[]): DieItem[] => {
    const roll = rolls[0];
    const activeMob = engine.ctx.combatState.mob;
    const result = activeMob.onLootRoll(roll);

    if (result.won) {
      result.apply?.(hero);
      setLogs((prev) => [
        { type: 'special', text: `Loot Roll (${roll}): Success! Acquired ${result.reward}!` },
        ...prev,
      ]);
    } else {
      setLogs((prev) => [
        { type: 'notice', text: `Loot Roll (${roll}): No loot dropped.` },
        ...prev,
      ]);
    }

    setLootClaimed(true);
    onUpdate();

    return [
      {
        value: roll,
        tag: result.won ? result.reward.toUpperCase() : 'NO LOOT',
        variant: result.won ? 'bonus' : 'neutral',
      },
    ];
  };

  const mob = engine.ctx.combatState.mob;
  const maxAllowedDice = Math.max(1, hero.attack);

  return (
    <section class="view-panel active">
      {narrativeContext && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button
            type="button"
            class="pixel-btn"
            onClick={() => narrativeContext.onReturnToNarrative?.()}
          >
            ← RETREAT TO STORY
          </button>
          {mob.isDefeated() && narrativeContext.victoryPassageId && (
            <button
              type="button"
              class="pixel-btn btn-success"
              onClick={() =>
                narrativeContext.onReturnToNarrative?.(narrativeContext.victoryPassageId)
              }
            >
              CONTINUE STORY →
            </button>
          )}
        </div>
      )}

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
        {/* Swaps between Action Roller and Loot Drop based on mob defeat */}
        <PixelFrame
          title={mob.isDefeated() ? 'LOOT DROP' : 'ACTION ROLLER'}
          icon={mob.isDefeated() ? 'spark' : 'target'}
        >
          {mob.isDefeated() ? (
            <div>
              <p style={{ fontSize: '12px', margin: '0 0 12px 0' }}>
                <strong>{mob.name}</strong> was defeated! Roll on the loot table:
              </p>
              <DiceRoller
                diceCount={1}
                rollButtonLabel={lootClaimed ? 'LOOT CLAIMED' : 'ROLL FOR LOOT (d6)'}
                buttonClass="btn-success"
                disabled={lootClaimed}
                onRoll={handleLootRoll}
              />
            </div>
          ) : (
            <DiceRoller
              maxDice={maxAllowedDice}
              rollButtonLabel="ROLL ATTACK"
              buttonClass="btn-primary"
              disabled={hero.isDefeated()}
              onRoll={handleCombatRoll}
            />
          )}
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