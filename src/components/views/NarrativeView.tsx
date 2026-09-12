import { useState, useEffect } from 'preact/hooks';
import type { Character } from '../../models/Character';
import type { TrackedMaterial } from '../../types/inventory';
import type { ActiveView, GameProgressionState } from '../../types/game';
import type { Passage, PassageChoice } from '../../types/narrative';
import { rollOnMobTable } from '../../data/storyPassages';
import { PixelFrame } from '../ui/PixelFrame';
import { StatusBar } from '../ui/StatusBar';
import { Icon } from '../ui/Icon';
import type { IconName } from '../../data/icons';
import { evaluateCondition, applyMutations, EvaluationContext } from '../../engine/evaluator';

interface NarrativeViewProps {
  hero: Character;
  passages: Record<string, Passage>;
  currentPassageId: string;
  visitedPassages: string[];
  forestCleared: number;
  mineCleared: number;
  onPassageChange: (id: string) => void;
  onUpdate: () => void;
  onNavigateView: (view: ActiveView) => void;
  onTriggerCombat: (
    mobName: string,
    onVictoryPassageId?: string,
    onDefeatPassageId?: string
  ) => void;
  onGainMaterial: (mat: TrackedMaterial, amount?: number) => void;
  game?: GameProgressionState;
}

export function NarrativeView({
  hero,
  passages,
  currentPassageId,
  visitedPassages,
  forestCleared,
  mineCleared,
  onPassageChange,
  onUpdate,
  onNavigateView,
  onTriggerCombat,
  onGainMaterial,
  game,
}: NarrativeViewProps) {
  const firstPassageId = Object.keys(passages)[0] || 'start';
  const passage = passages[currentPassageId] || passages[firstPassageId];
  const [diceCheckResult, setDiceCheckResult] = useState<{
    roll: number;
    target: number;
    passed: boolean;
    text: string;
    nextPassageId: string;
  } | null>(null);
  const [tableRollResult, setTableRollResult] = useState<{
    roll: number;
    mob: string;
  } | null>(null);

  const evalCtx: EvaluationContext = {
    hero,
    game: game || ({
      sandbox: { forestCleared, mineCleared },
      narrative: { visitedPassages, currentPassageId },
      openWorld: { questFlags: {}, discoveredRegions: [], discoveredPoiIds: [], counters: {} },
    } as any),
    onGainMaterial,
  };

  useEffect(() => {
    setDiceCheckResult(null);
    setTableRollResult(null);

    if (!visitedPassages.includes(passage.id)) {
      visitedPassages.push(passage.id);
      if (passage.onEnterMutations?.length) {
        applyMutations(passage.onEnterMutations, evalCtx);
      }
      onUpdate();
    }
  }, [currentPassageId]);

  const checkRequirement = (choice: PassageChoice): { allowed: boolean; reason?: string } => {
    if (choice.condition && !evaluateCondition(choice.condition, evalCtx)) {
      return { allowed: false, reason: choice.lockedReason || 'Locked' };
    }
    return { allowed: true };
  };

  const handleExecuteChoice = (choice: PassageChoice) => {
    const { allowed } = checkRequirement(choice);
    if (!allowed) return;

    if (choice.mutations) {
      applyMutations(choice.mutations, evalCtx);
      onUpdate();
    }

    if (choice.type === 'dice_check' && choice.diceCheck) {
      const roll = Math.floor(Math.random() * 6) + 1;
      const passed = roll >= choice.diceCheck.target;
      const text = passed
        ? choice.diceCheck.successText || `Success! Rolled a ${roll}.`
        : choice.diceCheck.failureText || `Failed! Rolled a ${roll}.`;
      setDiceCheckResult({
        roll,
        target: choice.diceCheck.target,
        passed,
        text,
        nextPassageId: passed
          ? choice.diceCheck.successPassageId
          : choice.diceCheck.failurePassageId,
      });
      return;
    }

    if (choice.type === 'combat') {
      const victoryId = choice.onVictoryPassageId || choice.targetPassageId;
      const defeatId = choice.onDefeatPassageId || 'combat_defeat';
      if (choice.mobTable) {
        const picked = rollOnMobTable(choice.mobTable);
        onTriggerCombat(picked.mob, victoryId, defeatId);
      } else if (choice.mob) {
        onTriggerCombat(choice.mob, victoryId, defeatId);
      }
      return;
    }

    if (choice.type === 'view' && choice.targetView) {
      onNavigateView(choice.targetView);
      return;
    }

    if (choice.targetPassageId) {
      onPassageChange(choice.targetPassageId);
    }
  };

  const handleFightTriggeredMob = (mobName: string) => {
    if (passage.triggerCombat) {
      onTriggerCombat(
        mobName,
        passage.triggerCombat.onVictoryPassageId,
        passage.triggerCombat.onDefeatPassageId || 'combat_defeat'
      );
    }
  };

  const renderedChoices = passage.choices.filter((choice) => {
    const { allowed } = checkRequirement(choice);
    const behavior = choice.behavior || 'disable';
    return allowed || behavior !== 'hide';
  });

  return (
    <section class="view-panel active">
      <PixelFrame
        title={passage.title.toUpperCase()}
        icon={passage.icon ? (passage.icon as IconName) : undefined}
      >
        <p class="narrative-prose">{passage.text}</p>

        {passage.triggerCombat && (
          <div class="narrative-combat-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Icon name="sword" />
              <strong>THREAT DETECTED</strong>
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px' }}>
              {passage.triggerCombat.introText || 'A hostile mob stands in your path!'}
            </p>
            {passage.triggerCombat.mob && (
              <button
                type="button"
                class="pixel-btn btn-danger"
                onClick={() => handleFightTriggeredMob(passage.triggerCombat!.mob!)}
              >
                FIGHT {passage.triggerCombat.mob.toUpperCase()}
              </button>
            )}
            {passage.triggerCombat.mobTable && (
              <div>
                <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                  Encounter Table:
                  <ul style={{ margin: '4px 0 8px 16px', padding: 0 }}>
                    {passage.triggerCombat.mobTable.map((m) => (
                      <li key={m.mob}>
                        d6 ({m.rollRange[0]}-{m.rollRange[1]}): {m.label || m.mob}
                      </li>
                    ))}
                  </ul>
                </div>
                {tableRollResult ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--pixel-yellow)' }}>
                      Rolled {tableRollResult.roll}! Encountered a {tableRollResult.mob}!
                    </span>
                    <button
                      type="button"
                      class="pixel-btn btn-danger"
                      onClick={() => handleFightTriggeredMob(tableRollResult.mob)}
                    >
                      ENGAGE {tableRollResult.mob.toUpperCase()}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    class="pixel-btn btn-primary"
                    onClick={() => setTableRollResult(rollOnMobTable(passage.triggerCombat!.mobTable!))}
                  >
                    ROLL ENCOUNTER (d6)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {passage.accessibleViews && passage.accessibleViews.length > 0 && (
          <div class="narrative-locations-box">
            <span class="narrative-section-tag">UNLOCKED LOCATIONS</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {passage.accessibleViews.includes('forest') && (
                <button type="button" class="pixel-btn btn-success" onClick={() => onNavigateView('forest')}>
                  <Icon name="tree" /> EXPLORE FOREST
                </button>
              )}
              {passage.accessibleViews.includes('mining') && (
                <button type="button" class="pixel-btn btn-primary" onClick={() => onNavigateView('mining')}>
                  <Icon name="pickaxe" /> ENTER MINES
                </button>
              )}
              {passage.accessibleViews.includes('crafting') && (
                <button type="button" class="pixel-btn btn-active" onClick={() => onNavigateView('crafting')}>
                  <Icon name="crafting" /> CRAFTING BENCH
                </button>
              )}
            </div>
          </div>
        )}

        {diceCheckResult && (
          <div class={`narrative-banner ${diceCheckResult.passed ? 'check-success' : 'check-failure'}`}>
            <div>
              <strong>
                {diceCheckResult.passed ? 'CHECK SUCCEEDED' : 'CHECK FAILED'} (Rolled{' '}
                {diceCheckResult.roll} vs Target {diceCheckResult.target}):
              </strong>{' '}
              {diceCheckResult.text}
            </div>
            <button
              type="button"
              class="pixel-btn btn-active"
              style={{ marginTop: '8px' }}
              onClick={() => {
                onPassageChange(diceCheckResult.nextPassageId);
                setDiceCheckResult(null);
              }}
            >
              CONTINUE
            </button>
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          <span class="narrative-section-tag">WHAT WILL YOU DO?</span>
          <div class="narrative-choices-grid">
            {renderedChoices.map((choice, idx) => {
              const { allowed, reason } = checkRequirement(choice);
              return (
                <button
                  key={idx}
                  type="button"
                  class={`pixel-btn narrative-choice-btn ${!allowed ? 'choice-locked' : ''}`}
                  disabled={!allowed || diceCheckResult !== null}
                  onClick={() => handleExecuteChoice(choice)}
                >
                  <span class="choice-text">
                    {choice.type === 'combat' && <Icon name="sword" />}
                    {choice.type === 'view' && <Icon name="spark" />}
                    {choice.text}
                  </span>
                  {!allowed && reason && <span class="choice-badge badge-locked">[{reason}]</span>}
                </button>
              );
            })}
          </div>
        </div>

        <StatusBar marginTop="20px">
          Narrative Mode Active | Current Passage: <strong>{passage.title}</strong>
        </StatusBar>
      </PixelFrame>
    </section>
  );
}