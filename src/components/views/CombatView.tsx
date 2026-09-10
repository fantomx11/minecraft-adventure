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
import { useObservable } from '../../hooks/useObservable';

interface CombatViewProps {
  hero: Character;
  onUpdate?: () => void;
  initialMobName?: string;
  onExitCombat?: (outcome: 'victory' | 'defeat') => void;
  narrativeContext?: {
    victoryPassageId?: string;
    defeatPassageId?: string;
    onReturnToNarrative?: (targetPassageId?: string) => void;
  };
}

export function CombatView({
  hero,
  onUpdate,
  initialMobName,
  onExitCombat,
  narrativeContext,
}: CombatViewProps) {
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
  const [combatStatus, setCombatStatus] = useState<'ongoing' | 'victory' | 'defeat'>('ongoing');
  const [logs, setLogs] = useState<CombatMessage[]>([
    { type: 'notice', text: 'Encounter initialized. Choose dice & roll!' },
  ]);
  const [lootClaimed, setLootClaimed] = useState(false);

  // Active mob from the engine instance
  const activeMob = engine.ctx.combatState.mob;

  // Reactively track mutations on both hero and mob
  useObservable(hero, activeMob);

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
    setLootClaimed(false);
    setCombatStatus('ongoing');
    setLogs([{ type: 'notice', text: `Approached a wild ${createdMob.name}!` }]);
  };

  const isVictorious = combatStatus === 'victory' || activeMob.isDefeated();
  const isDefeated = combatStatus === 'defeat' || (!isVictorious && hero.isDefeated());
  const maxAllowedDice = Math.max(1, hero.attack);
  const isPendingCritPick = Boolean(engine.ctx.roundState.pendingCritHitPick);

  const handleCombatRoll = (rolls: number[]): DieItem[] => {
    if (isVictorious) {
      setLogs((prev) => [{ type: 'notice', text: `${activeMob.name} is defeated! Claim loot or continue.` }, ...prev]);
      return rolls.map((r) => ({ value: r, tag: 'INACTIVE', variant: 'neutral' }));
    }
    if (isDefeated) {
      setLogs((prev) => [{ type: 'special', text: 'You are defeated! Proceed to your fate.' }, ...prev]);
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
    engine.ctx.roundState.messages = [];

    if (roundRes.heroDmgRes && roundRes.heroDmgRes.appliedTotal > 0) {
      newMsgs.push({ type: 'hit', text: `Hero dealt ${roundRes.heroDmgRes.appliedTotal} DMG to ${activeMob.name}.` });
    }
    if (roundRes.mobDmgRes && roundRes.mobDmgRes.appliedTotal > 0) {
      newMsgs.push({ type: 'miss', text: `${activeMob.name} hit Hero for ${roundRes.mobDmgRes.appliedTotal} DMG.` });
    }

    if (roundRes.status === 'victory') {
      setCombatStatus('victory');
      if (engine.ctx.combatState.pendingDiamondReward) {
        hero.adjustMaterial('Diamond', engine.ctx.combatState.pendingDiamondReward);
        newMsgs.push({
          type: 'special',
          text: `💎 Looted +${engine.ctx.combatState.pendingDiamondReward} Diamond(s) earned from Critical Hits!`,
        });
        engine.ctx.combatState.pendingDiamondReward = 0;
      }
      newMsgs.push({ type: 'special', text: `VICTORY! ${activeMob.name} defeated!` });
    } else if (roundRes.status === 'defeat') {
      setCombatStatus('defeat');
      newMsgs.push({ type: 'special', text: 'DEFEAT! Hero has fallen.' });
    }

    setLogs((prev) => [...newMsgs, ...prev].slice(0, 40));
    onUpdate?.();
    return rolls.map((roll) => ({
      value: roll,
      tag: roll >= activeMob.defense ? 'HIT' : 'MISS',
      variant: roll >= activeMob.defense ? 'hit' : 'miss',
    }));
  };

  const handleCritHitChoice = (option: number) => {
    engine.applyCritHitEffect(option);
    engine.ctx.roundState.pendingCritHitPick = false;

    const newMsgs: CombatMessage[] = [...engine.ctx.roundState.messages];
    engine.ctx.roundState.messages = [];

    const isNowVictorious = combatStatus === 'victory' || activeMob.isDefeated();

    if (isNowVictorious) {
      if (combatStatus !== 'victory') {
        setCombatStatus('victory');
        engine.dispatchHook('onCombatEnd');
        newMsgs.push({ type: 'special', text: `VICTORY! ${activeMob.name} defeated!` });
      }
      if (engine.ctx.combatState.pendingDiamondReward) {
        hero.adjustMaterial('Diamond', engine.ctx.combatState.pendingDiamondReward);
        newMsgs.push({
          type: 'special',
          text: `💎 Looted +${engine.ctx.combatState.pendingDiamondReward} Diamond(s) earned from Critical Hits!`,
        });
        engine.ctx.combatState.pendingDiamondReward = 0;
      }
    }

    setLogs((prev) => [...newMsgs, ...prev].slice(0, 40));
    onUpdate?.();
  };

  const handleLootRoll = (rolls: number[]): DieItem[] => {
    const roll = engine.ctx.combatState.guaranteedLootRoll || rolls[0];
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
    onUpdate?.();
    return [
      {
        value: roll,
        tag: result.won ? result.reward.toUpperCase() : 'NO LOOT',
        variant: result.won ? 'bonus' : 'neutral',
      },
    ];
  };

  return (
    <section class="view-panel active">
      {/* Top Banner: Story Navigation */}
      {narrativeContext && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button
            type="button"
            class="pixel-btn"
            onClick={() => narrativeContext.onReturnToNarrative?.()}
          >
            RETREAT TO STORY
          </button>
          {isVictorious && narrativeContext.victoryPassageId && (
            <button
              type="button"
              class="pixel-btn btn-success"
              onClick={() => narrativeContext.onReturnToNarrative?.(narrativeContext.victoryPassageId)}
            >
              CONTINUE STORY (VICTORY)
            </button>
          )}
          {isDefeated && (
            <button
              type="button"
              class="pixel-btn btn-danger"
              onClick={() =>
                narrativeContext.onReturnToNarrative?.(
                  narrativeContext.defeatPassageId || 'combat_defeat'
                )
              }
            >
              CONTINUE STORY (DEFEAT)
            </button>
          )}
        </div>
      )}

      {/* Top Banner: Open World Navigation */}
      {!narrativeContext && onExitCombat && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          {!isVictorious && !isDefeated && (
            <button
              type="button"
              class="pixel-btn"
              onClick={() => onExitCombat('defeat')}
            >
              FLEE BATTLE
            </button>
          )}
          {isVictorious && (
            <button
              type="button"
              class="pixel-btn btn-success"
              style={{ marginLeft: 'auto' }}
              onClick={() => onExitCombat('victory')}
            >
              LEAVE BATTLE (VICTORY)
            </button>
          )}
          {isDefeated && (
            <button
              type="button"
              class="pixel-btn btn-danger"
              style={{ marginLeft: 'auto' }}
              onClick={() => onExitCombat('defeat')}
            >
              RESPAWN AT CAMP (DEFEAT)
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
            disabled={isVictorious || isDefeated}
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
          <StatField icon="heartFull" label="HEARTS" value={`${activeMob.hearts}/${activeMob.maxHearts}`} />
          <StatField icon="chestplate" label="DEFENSE" value={activeMob.defense} />
          <StatField icon="tnt" label="DAMAGE" value={activeMob.damage} />
        </div>
        <StatusBar>
          Status:{' '}
          {engine.ctx.combatState.effects.length > 0
            ? `[ ${engine.ctx.combatState.effects.map((e) => (e as any).name || 'Effect').join(' | ')} ]`
            : isVictorious
            ? 'Encounter Won'
            : isDefeated
            ? 'Encounter Lost'
            : 'Active Combat'}
        </StatusBar>
      </PixelFrame>

      {/* Middle Grid: Dice Roller & Mob Rules */}
      <div class="combat-middle-grid">
        <PixelFrame
          title={
            isDefeated
              ? 'DEFEAT'
              : isPendingCritPick
              ? 'CRITICAL HIT'
              : isVictorious
              ? 'LOOT DROP'
              : 'ACTION ROLLER'
          }
          icon={isDefeated ? 'tnt' : isPendingCritPick || isVictorious ? 'spark' : 'target'}
        >
          {isDefeated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: 'var(--pixel-red)', margin: 0, fontWeight: 'bold' }}>
                YOU HAVE FALLEN IN BATTLE!
              </p>
              <p style={{ fontSize: '13px', margin: 0 }}>
                {activeMob.name} has overwhelmed you. Continue to discover your fate.
              </p>
              {narrativeContext ? (
                <button
                  type="button"
                  class="pixel-btn btn-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() =>
                    narrativeContext.onReturnToNarrative?.(
                      narrativeContext.defeatPassageId || 'combat_defeat'
                    )
                  }
                >
                  CONTINUE STORY (FAILURE)
                </button>
              ) : onExitCombat ? (
                <button
                  type="button"
                  class="pixel-btn btn-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => onExitCombat('defeat')}
                >
                  ACCEPT DEFEAT & RESPAWN
                </button>
              ) : (
                <button type="button" class="pixel-btn" onClick={() => initMobEncounter(activeMob.name)}>
                  TRY AGAIN
                </button>
              )}
            </div>
          ) : isPendingCritPick ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: 'var(--pixel-yellow)', fontSize: '12px', margin: '0 0 4px 0' }}>
                ⭐ QUADRUPLE HIT! Pick your Critical Hit reward:
              </p>
              <button
                type="button"
                class="pixel-btn btn-success"
                onClick={() => handleCritHitChoice(1)}
              >
                1: INSTANT WIN
              </button>
              <button
                type="button"
                class="pixel-btn"
                onClick={() => handleCritHitChoice(2)}
              >
                2-3: GUARANTEE 6 ON LOOT
              </button>
              <button
                type="button"
                class="pixel-btn"
                onClick={() => handleCritHitChoice(4)}
              >
                4-5: GAIN 1 DIAMOND
              </button>
              <button
                type="button"
                class="pixel-btn btn-primary"
                onClick={() => handleCritHitChoice(6)}
              >
                6: GAIN 2 DIAMONDS
              </button>
            </div>
          ) : isVictorious ? (
            <div>
              <p style={{ fontSize: '12px', margin: '0 0 12px 0' }}>
                <strong>{activeMob.name}</strong> was defeated! Roll on the loot table:
              </p>
              <DiceRoller
                diceCount={1}
                rollButtonLabel={lootClaimed ? 'LOOT CLAIMED' : 'ROLL FOR LOOT (d6)'}
                buttonClass="btn-success"
                disabled={lootClaimed}
                onRoll={handleLootRoll}
              />
              {narrativeContext?.victoryPassageId ? (
                <button
                  type="button"
                  class={`pixel-btn ${lootClaimed ? 'btn-success' : 'btn-active'}`}
                  style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
                  onClick={() => narrativeContext.onReturnToNarrative?.(narrativeContext.victoryPassageId)}
                >
                  {lootClaimed ? 'CONTINUE STORY (VICTORY)' : 'SKIP LOOT & CONTINUE'}
                </button>
              ) : onExitCombat ? (
                <button
                  type="button"
                  class={`pixel-btn ${lootClaimed ? 'btn-success' : 'btn-active'}`}
                  style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
                  onClick={() => onExitCombat('victory')}
                >
                  {lootClaimed ? 'LEAVE BATTLE' : 'SKIP LOOT & LEAVE'}
                </button>
              ) : null}
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
            <span class="rules-body-text">{activeMob.rules}</span>
            <span class="rules-header-tag">LOOT DROP</span>
            <span class="rules-body-text">{activeMob.loot}</span>
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