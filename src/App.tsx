import { useEffect, useState, useCallback } from 'preact/hooks';
import { Character } from './models/Character';
import type { TrackedMaterial } from './types/inventory';
import type { GameModeId, GameSaveData } from './types/game';
import { CUSTOM_STORY_STORAGE_KEY, getInitialStoryPassages, STORY_PASSAGES, validateNarrative } from './data/storyPassages';
import { getModeController } from './controllers';
import { migrateSaveData } from './models/GameSave';
import {
  HudBar,
  ModeNavBar,
  CombatView,
  ForestView,
  MiningView,
  CraftingView,
  NarrativeView,
  WorldMapView,
  PoiNodeView,
  CharacterSheetDrawer,
  OptionsDrawer,
  MaterialSwapModal,
} from './components';
import type { Passage } from './types/narrative';
import type { EngineContext } from './types/controller';
import { CUSTOM_WORLD_STORAGE_KEY, getInitialWorldPackage, REGIONS, validateWorldPackage } from './data/regions';
import type { Region } from './types/world';
import { GameStore } from './models/GameStore';

const STORAGE_KEY = 'minecraft_multimode_rpg_data';

export function App() {
  const [saveData] = useState<GameSaveData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return migrateSaveData(raw ? JSON.parse(raw) : null);
    } catch {
      return migrateSaveData(null);
    }
  });

  const [hero, setHero] = useState<Character>(() => new Character(saveData.character));
  const [game, setGame] = useState<GameStore>(() => new GameStore(saveData.game));

  const [sheetOpen, setSheetOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [targetMobName, setTargetMobName] = useState<string | undefined>(undefined);
  const [combatContext, setCombatContext] = useState<{ victoryPassageId?: string; defeatPassageId?: string } | undefined>(undefined);
  const [pendingMaterial, setPendingMaterial] = useState<TrackedMaterial | null>(null);
  const [isCustomStory, setIsCustomStory] = useState(() => localStorage.getItem(CUSTOM_STORY_STORAGE_KEY) !== null);
  const [isCustomWorld, setIsCustomWorld] = useState(() => localStorage.getItem(CUSTOM_WORLD_STORAGE_KEY) !== null);
  const [, setTick] = useState(0);

  const [regions, setRegions] = useState<Record<string, Region>>(() => getInitialWorldPackage().regions);
  const [storyPassages, setStoryPassages] = useState<Record<string, Passage>>(() => {
    return saveData.game.mode === 'open_world' ? getInitialWorldPackage().passages : getInitialStoryPassages();
  });

const saveState = useCallback(() => {
    const updated = {
      version: 2,
      character: hero.toJSON(),
      game: game.toJSON(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTick((t) => t + 1);
  }, [hero, game]);

  useEffect(() => {
    const unsubHero = hero.subscribe(saveState);
    const unsubGame = game.subscribe(saveState);
    return () => {
      unsubHero();
      unsubGame();
    };
  }, [hero, game, saveState]);

  const controller = getModeController(game.mode);

  const engineContext: EngineContext = {
    hero,
    game,
    passages: storyPassages,
    regions,
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

      {returnBanner && (
        <div style={{ maxWidth: '1100px', margin: '12px auto 0 auto', padding: '0 16px' }}>
          <button type="button" class="pixel-btn btn-active" style={{ width: '100%' }} onClick={returnBanner.action}>
            {returnBanner.label}
          </button>
        </div>
      )}

      <main class="arena-container">
        {game.activeView === 'world_map' && (
          <WorldMapView
            hero={hero}
            state={game.openWorld}
            onUpdate={saveState}
            onNavigateCombat={(mob) => handleTriggerCombat(mob)}
            onEnterPoi={(poiId, entryNodeId) => {
              game.openWorld.currentPoiId = poiId;
              game.openWorld.currentNodeId = entryNodeId;
              game.openWorld.counters.trekBonus = 0;
              engineContext.setActiveView('poi_node');
            }}
            onGainMaterial={(mat, amt) => controller.handleGainMaterial(mat, amt ?? 1, engineContext)}
            regions={regions}
          />
        )}

        {game.activeView === 'poi_node' && (
          <PoiNodeView
            hero={hero}
            game={game}
            state={game.openWorld}
            onUpdate={saveState}
            onNavigateView={engineContext.setActiveView}
            onTriggerCombat={(mob) => handleTriggerCombat(mob)}
            onTriggerPassage={(passageId) => {
              game.narrative.currentPassageId = passageId;
              engineContext.setActiveView('narrative');
            }}
            onGainMaterial={(mat, amt) => controller.handleGainMaterial(mat, amt ?? 1, engineContext)}
            onExitToMap={() => {
              game.openWorld.currentPoiId = null;
              game.openWorld.currentNodeId = null;
              engineContext.setActiveView('world_map');
            }}
            regions={regions}
          />
        )}

        {game.activeView === 'narrative' && (
          <NarrativeView
            hero={hero}
            game={game}
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
            onExitCombat={(outcome) => controller.resolveCombatExit(outcome, engineContext, combatContext)}
            narrativeContext={
              combatContext?.victoryPassageId || combatContext?.defeatPassageId
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
            const fresh = migrateSaveData(null);
            setHero(new Character(fresh.character));
            setGame(new GameStore(fresh.game));
            setOptionsOpen(false);
          }}
          onLoad={(raw) => {
            try {
              const loaded = migrateSaveData(JSON.parse(raw));
              const newHero = new Character(loaded.character);
              const newGame = new GameStore(loaded.game);
              setHero(newHero);
              setGame(newGame);
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ version: 2, character: newHero.toJSON(), game: newGame.toJSON() })
              );
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
        regions={regions}
        isCustomWorld={isCustomWorld}
        onLoadWorld={(json) => {
          const validated = validateWorldPackage(JSON.parse(json));
          if (!validated) return false;
          setRegions(validated.regions);
          setStoryPassages(validated.passages);
          setIsCustomWorld(true);
          localStorage.setItem(CUSTOM_WORLD_STORAGE_KEY, JSON.stringify(validated));
          const firstReg = Object.keys(validated.regions)[0];
          game.openWorld.currentRegionId = firstReg;
          game.openWorld.currentPoiId = null;
          game.openWorld.currentNodeId = null;
          game.openWorld.discoveredRegions = [firstReg];
          saveState();
          return true;
        }}
        onResetWorld={() => {
          localStorage.removeItem(CUSTOM_WORLD_STORAGE_KEY);
          setRegions(JSON.parse(JSON.stringify(REGIONS)));
          setIsCustomWorld(false);
          game.openWorld.currentRegionId = 'plains_settlement';
          game.openWorld.currentPoiId = null;
          game.openWorld.currentNodeId = null;
          game.openWorld.discoveredRegions = ['plains_settlement'];
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