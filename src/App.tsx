import { useState } from 'preact/hooks';
import { Character } from './models/Character';
import { TrackedMaterial } from './types/inventory';
import { GameModeId } from './types/game';
import { CUSTOM_STORY_STORAGE_KEY, getInitialStoryPassages, STORY_PASSAGES, validateNarrative } from './data/storyPassages';
import { getModeController } from './controllers';
import {
  HudBar,
  ModeNavBar,
  CombatView,
  ForestView,
  MiningView,
  CraftingView,
  NarrativeView,
  CharacterSheetDrawer,
  OptionsDrawer,
  MaterialSwapModal,
} from './components';
import { Passage } from './types/narrative';
import type { EngineContext } from './types/controller';

const STORAGE_KEY = 'minecraft_multimode_rpg_data';

export function App() {
  const [saveData, setSaveData] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || {};
  });

  const [hero, setHero] = useState<Character>(() => new Character(saveData.character));
  const [game, setGame] = useState(saveData.game);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [targetMobName, setTargetMobName] = useState<string | undefined>(undefined);
  const [combatContext, setCombatContext] = useState<{ victoryPassageId?: string; defeatPassageId?: string } | undefined>(undefined);
  const [pendingMaterial, setPendingMaterial] = useState<TrackedMaterial | null>(null);
  const [storyPassages, setStoryPassages] = useState<Record<string, Passage>>(getInitialStoryPassages);
  const [isCustomStory, setIsCustomStory] = useState(() => localStorage.getItem(CUSTOM_STORY_STORAGE_KEY) !== null);
  const [, setTick] = useState(0);

  const saveState = () => {
    const updated = { version: 2, character: hero.toJSON(), game };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTick((t) => t + 1);
  };

  const controller = getModeController(game.mode);

  const engineContext: EngineContext = {
    hero,
    game,
    passages: storyPassages,
    saveState,
    setActiveView: (v) => {
      game.activeView = v;
      saveState();
    },
    setPendingMaterial,
  };

  const accessibleViews = controller.getAccessibleViews(engineContext);
  const returnBanner = controller.getReturnBanner(engineContext);

  const handleTriggerCombat = (mobName: string, onVictoryPassageId?: string, onDefeatPassageId?: string) => {
    setTargetMobName(mobName);
    setCombatContext({ victoryPassageId: onVictoryPassageId, defeatPassageId: onDefeatPassageId });
    controller.initiateCombat({ mobName, victoryPassageId: onVictoryPassageId, defeatPassageId: onDefeatPassageId }, engineContext);
  };

  return (
    <div class="app-root">
      <HudBar hero={hero} onOpenSheet={() => setSheetOpen(true)} onOpenOptions={() => setOptionsOpen(true)} />
      <ModeNavBar
        activeView={game.activeView}
        onSelectView={(v) => controller.canNavigateToView(v, engineContext) && engineContext.setActiveView(v)}
        accessibleViews={accessibleViews}
      />

      {/* Return Banner Rendered from Plain Data */}
      {returnBanner && (
        <div style={{ maxWidth: '1100px', margin: '12px auto 0 auto', padding: '0 16px' }}>
          <button type="button" class="pixel-btn btn-active" style={{ width: '100%' }} onClick={returnBanner.action}>
            {returnBanner.label}
          </button>
        </div>
      )}

      <main class="arena-container">
        {game.activeView === 'narrative' && (
          <NarrativeView
            hero={hero}
            passages={storyPassages}
            currentPassageId={game.narrative.currentPassageId}
            visitedPassages={game.narrative.visitedPassages}
            forestCleared={game.sandbox.forestCleared}
            mineCleared={game.sandbox.mineCleared}
            onPassageChange={(id) => {
              game.narrative.currentPassageId = id;
              saveState();
            }}
            onUpdate={saveState}
            onNavigateView={engineContext.setActiveView}
            onTriggerCombat={handleTriggerCombat}
            onGainMaterial={(mat, amt) => controller.handleGainMaterial(mat, amt ?? 1, engineContext)}
          />
        )}

        {game.activeView === 'combat' && (
          <CombatView
            hero={hero}
            onUpdate={saveState}
            initialMobName={targetMobName}
            narrativeContext={
              combatContext
                ? {
                    victoryPassageId: combatContext.victoryPassageId,
                    defeatPassageId: combatContext.defeatPassageId,
                    onReturnToNarrative: (targetId) => {
                      controller.resolveCombatExit(
                        targetId === combatContext.victoryPassageId ? 'victory' : 'defeat',
                        engineContext,
                        combatContext
                      );
                    },
                  }
                : undefined
            }
          />
        )}

        {game.activeView === 'forest' && (
          <ForestView
            hero={hero}
            grovesCleared={game.sandbox.forestCleared}
            onUpdate={saveState}
            onGainMaterial={(mat, amt) => controller.handleGainMaterial(mat, amt ?? 1, engineContext)}
            onNavigateCombat={(mob) => handleTriggerCombat(mob)}
            onGroveCleared={() => controller.onActivityCleared?.('forest', engineContext)}
          />
        )}

        {game.activeView === 'mining' && (
          <MiningView
            hero={hero}
            mineCleared={game.sandbox.mineCleared}
            onUpdate={saveState}
            onGainMaterial={(mat, amt) => controller.handleGainMaterial(mat, amt ?? 1, engineContext)}
            onNavigateCombat={(mob) => handleTriggerCombat(mob)}
            onMineCleared={() => controller.onActivityCleared?.('mining', engineContext)}
          />
        )}

        {game.activeView === 'crafting' && <CraftingView hero={hero} onUpdate={saveState} />}
      </main>

      <CharacterSheetDrawer
        hero={hero}
        isOpen={sheetOpen}
        allowInventoryEditing={game.mode === 'sandbox'}
        onClose={() => setSheetOpen(false)}
        onUpdate={saveState}
      />

      <OptionsDrawer
        hero={hero}
        isOpen={optionsOpen}
        currentMode={game.mode}
        onSelectMode={(newMode: GameModeId) => {
          game.mode = newMode;
          game.activeView = getModeController(newMode).defaultView;
          saveState();
        }}
        passages={storyPassages}
        isCustomStory={isCustomStory}
        onClose={() => setOptionsOpen(false)}
        onUpdate={saveState}
        onReset={() => {
          localStorage.removeItem(STORAGE_KEY);
          setHero(new Character(undefined));
          setGame(migrateSaveData(null).game);
          setOptionsOpen(false);
        }}
        onLoad={(raw) => {
          try {
            const loaded = migrateSaveData(JSON.parse(raw));
            setHero(new Character(loaded.character));
            setGame(loaded.game);
            saveState();
            return true;
          } catch {
            return false;
          }
        }}
        onLoadStory={(json) => {
          const validated = validateNarrative(JSON.parse(json));
          if (!validated) return false;
          setStoryPassages(validated);
          setIsCustomStory(true);
          localStorage.setItem(CUSTOM_STORY_STORAGE_KEY, JSON.stringify(validated));
          game.narrative.currentPassageId = validated.start ? 'start' : Object.keys(validated)[0];
          game.narrative.visitedPassages = [];
          saveState();
          return true;
        }}
        onResetStory={() => {
          localStorage.removeItem(CUSTOM_STORY_STORAGE_KEY);
          setStoryPassages(STORY_PASSAGES);
          setIsCustomStory(false);
          game.narrative.currentPassageId = 'start';
          game.narrative.visitedPassages = [];
          saveState();
        }}
      />

      <MaterialSwapModal
        isOpen={pendingMaterial !== null}
        newItemName={pendingMaterial}
        materials={hero.materials}
        onSwap={(discardMat) => {
          hero.adjustMaterial(discardMat, -1);
          hero.adjustMaterial(pendingMaterial!, 1);
          setPendingMaterial(null);
          saveState();
        }}
        onDiscard={() => setPendingMaterial(null)}
      />
    </div>
  );
}