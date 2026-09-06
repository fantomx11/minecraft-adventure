import { useState } from 'preact/hooks';
import { Character } from './models/Character';
import { TrackedMaterial } from './types/inventory';
import {
  HudBar,
  ModeNavBar,
  CombatView,
  ForestView,
  MiningView,
  CraftingView,
  CharacterSheetDrawer,
  OptionsDrawer,
  MaterialSwapModal,
} from './components';

export type ActiveView = 'combat' | 'forest' | 'mining' | 'crafting';
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

  const [activeView, setActiveView] = useState<ActiveView>('combat');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [targetMobName, setTargetMobName] = useState<string | undefined>(undefined);
  const [pendingMaterial, setPendingMaterial] = useState<TrackedMaterial | null>(null);
  const [, setTick] = useState(0);

  const saveState = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hero.toJSON()));
    setTick((t) => t + 1);
  };

  const handleResetCharacter = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHero(new Character(undefined));
    setOptionsOpen(false);
  };

  const handleTriggerCombat = (mobName: string) => {
    setTargetMobName(mobName);
    setActiveView('combat');
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

  return (
    <div class="app-root">
      {/* Top HUD */}
      <HudBar
        hero={hero}
        onOpenSheet={() => setSheetOpen(true)}
        onOpenOptions={() => setOptionsOpen(true)}
      />

      {/* Navigation */}
      <ModeNavBar activeView={activeView} onSelectView={setActiveView} />

      {/* Active Panel View */}
      <main class="arena-container">
        {activeView === 'combat' && (
          <CombatView hero={hero} onUpdate={saveState} initialMobName={targetMobName} />
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
        onClose={() => setOptionsOpen(false)}
        onUpdate={saveState}
        onReset={handleResetCharacter}
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