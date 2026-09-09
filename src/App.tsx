import { useState } from 'preact/hooks';
import { Character } from './models/Character';
import { TrackedMaterial } from './types/inventory';
import { CUSTOM_STORY_STORAGE_KEY, getInitialStoryPassages, STORY_PASSAGES, validateNarrative } from './data/storyPassages';
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

export type ActiveView = 'narrative' | 'combat' | 'forest' | 'mining' | 'crafting';

const STORAGE_KEY = 'minecraft_multimode_rpg_data';

export function App() {
  const [hero, setHero] = useState<Character>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return new Character(JSON.parse(raw));
      } catch (err) {
        console.error('Failed to parse save; starting fresh', err);
      }
    }
    return new Character(undefined);
  });

  const [activeView, setActiveView] = useState<ActiveView>(() =>
    hero.narrativeMode ? 'narrative' : 'combat'
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [targetMobName, setTargetMobName] = useState<string | undefined>(undefined);
  const [pendingMaterial, setPendingMaterial] = useState<TrackedMaterial | null>(null);
  const [narrativeVictoryPassageId, setNarrativeVictoryPassageId] = useState<string | undefined>(undefined);
  const [narrativeDefeatPassageId, setNarrativeDefeatPassageId] = useState<string | undefined>(undefined);

  const [storyPassages, setStoryPassages] = useState<Record<string, Passage>>(getInitialStoryPassages);

  const [isCustomStory, setIsCustomStory] = useState<boolean>(() => localStorage.getItem(CUSTOM_STORY_STORAGE_KEY) !== null);

  const handleLoadStory = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      const validated = validateNarrative(parsed);
      if (!validated) return false;

      setStoryPassages(validated);
      setIsCustomStory(true);
      localStorage.setItem(CUSTOM_STORY_STORAGE_KEY, JSON.stringify(validated));

      // Reset story progress to entry passage
      const startKey = validated.start ? 'start' : Object.keys(validated)[0];
      hero.currentPassageId = startKey;
      hero.visitedPassages = [];
      saveState();
      return true;
    } catch (err) {
      console.error('Invalid story JSON', err);
      return false;
    }
  };

  const handleResetStory = () => {
    localStorage.removeItem(CUSTOM_STORY_STORAGE_KEY);
    setStoryPassages(STORY_PASSAGES);
    setIsCustomStory(false);
    hero.currentPassageId = 'start';
    hero.visitedPassages = [];
    saveState();
  };

  const currentPassage =
    storyPassages[hero.currentPassageId] ||
    storyPassages[Object.keys(storyPassages)[0]];
  const accessibleViews = hero.narrativeMode ? currentPassage?.accessibleViews || [] : undefined;

  const [, setTick] = useState(0);

  const saveState = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hero.toJSON()));
    setTick((t) => t + 1);
  };

  const handleTriggerCombat = (
    mobName: string,
    onVictoryPassageId?: string,
    onDefeatPassageId?: string
  ) => {
    setTargetMobName(mobName);
    setNarrativeVictoryPassageId(onVictoryPassageId);
    setNarrativeDefeatPassageId(onDefeatPassageId);
    setActiveView('combat');
  };

  const handleReturnToNarrative = (targetPassageId?: string) => {
    if (hero.isDefeated() || hero.hearts <= 0) {
      hero.respawn();
    }
    if (targetPassageId) {
      hero.currentPassageId = targetPassageId;
    }
    setNarrativeVictoryPassageId(undefined);
    setNarrativeDefeatPassageId(undefined);
    setActiveView('narrative');
    saveState();
  };

  const handleGainMaterial = (mat: TrackedMaterial, amount: number = 1) => {
    const added = hero.adjustMaterial(mat, amount);
    if (added === 0 && hero.materialRule === 'total' && hero.totalMaterialsCount >= 5) {
      setPendingMaterial(mat);
    } else {
      saveState();
    }
  };

  const handleSwapMaterial = (discardMat: TrackedMaterial) => {
    if (pendingMaterial) {
      hero.adjustMaterial(discardMat, -1);
      hero.adjustMaterial(pendingMaterial, 1);
      setPendingMaterial(null);
      saveState();
    }
  };

  const handleResetCharacter = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHero(new Character(undefined));
    setActiveView('combat');
    setOptionsOpen(false);
  };

  const handleLoadCharacter = (rawJson: string): boolean => {
    try {
      const loadedHero = new Character(JSON.parse(rawJson));
      setHero(loadedHero);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedHero.toJSON()));
      setTick((t) => t + 1);
      return true;
    } catch (err) {
      console.error('Invalid save data', err);
      return false;
    }
  };

  return (
    <div class="app-root">
      {/* Top HUD */}
      <HudBar
        hero={hero}
        onOpenSheet={() => setSheetOpen(true)}
        onOpenOptions={() => setOptionsOpen(true)}
      />

      <ModeNavBar
        hero={hero}
        activeView={activeView}
        onSelectView={setActiveView}
        accessibleViews={accessibleViews}
        combatActive={
          narrativeVictoryPassageId !== undefined || narrativeDefeatPassageId !== undefined
        }
      />

      {/* Narrative Mode Return Banner if currently in an unlocked sub-view */}
      {hero.narrativeMode && activeView !== 'narrative' && activeView !== 'combat' && (
        <div style={{ maxWidth: '1100px', margin: '12px auto 0 auto', padding: '0 16px' }}>
          <button
            type="button"
            class="pixel-btn btn-active"
            style={{ width: '100%' }}
            onClick={() => setActiveView('narrative')}
          >
            ← RETURN TO STORY ({currentPassage.title.toUpperCase()})
          </button>
        </div>
      )}

      {/* Active Panel View */}
      <main class="arena-container">
        {activeView === 'narrative' && (
          <NarrativeView
            hero={hero}
            passages={storyPassages}
            onUpdate={saveState}
            onNavigateView={setActiveView}
            onTriggerCombat={handleTriggerCombat}
            onGainMaterial={handleGainMaterial}
          />
        )}
        {activeView === 'combat' && (
          <CombatView
            hero={hero}
            onUpdate={saveState}
            initialMobName={targetMobName}
            narrativeContext={
              hero.narrativeMode
                ? {
                  victoryPassageId: narrativeVictoryPassageId,
                  defeatPassageId: narrativeDefeatPassageId,
                  onReturnToNarrative: handleReturnToNarrative,
                }
                : undefined
            }
          />
        )}
        {activeView === 'forest' && (
          <ForestView
            hero={hero}
            onUpdate={saveState}
            onGainMaterial={handleGainMaterial}
            onNavigateCombat={handleTriggerCombat}
          />
        )}
        {activeView === 'mining' && (
          <MiningView
            hero={hero}
            onUpdate={saveState}
            onGainMaterial={handleGainMaterial}
            onNavigateCombat={handleTriggerCombat}
          />
        )}
        {activeView === 'crafting' && <CraftingView hero={hero} onUpdate={saveState} />}
      </main>

      {/* Drawers & Overlays */}
      <div
        id="drawer-overlay"
        class={sheetOpen || optionsOpen ? 'active' : ''}
        onClick={() => {
          setSheetOpen(false);
          setOptionsOpen(false);
        }}
      />
      <CharacterSheetDrawer
        hero={hero}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onUpdate={saveState}
      />
      <OptionsDrawer
        hero={hero}
        isOpen={optionsOpen}
        passages={storyPassages}
        isCustomStory={isCustomStory}
        onClose={() => setOptionsOpen(false)}
        onUpdate={saveState}
        onReset={handleResetCharacter}
        onLoad={handleLoadCharacter}
        onLoadStory={handleLoadStory}
        onResetStory={handleResetStory}
      />
      <MaterialSwapModal
        isOpen={pendingMaterial !== null}
        newItemName={pendingMaterial}
        materials={hero.materials}
        onSwap={handleSwapMaterial}
        onDiscard={() => setPendingMaterial(null)}
      />
    </div>
  );
}