import type { Character } from '../models/Character';
import type { ActiveView, GameModeId } from './game';
import type { Passage } from './narrative';
import type { TrackedMaterial } from './inventory';
import type { Region } from './world';
import { GameStore } from '../models/GameStore';

export interface ReturnBannerDescriptor {
  label: string;
  action: () => void;
}

export interface CombatTriggerPayload {
  mobName: string;
  victoryPassageId?: string;
  defeatPassageId?: string;
}

export interface EngineContext {
  hero: Character;
  game: GameStore;
  passages: Record<string, Passage>;
  regions: Record<string, Region>;
  saveState: () => void;
  setActiveView: (view: ActiveView) => void;
  setPendingMaterial: (mat: TrackedMaterial | null) => void;
}

export interface GameModeController {
  readonly id: GameModeId;
  readonly label: string;
  readonly defaultView: ActiveView;
  readonly allowInventoryEditing: boolean;

  getAccessibleViews(ctx: EngineContext): ActiveView[];
  canNavigateToView(targetView: ActiveView, ctx: EngineContext): boolean;
  getReturnBanner(ctx: EngineContext): ReturnBannerDescriptor | null;

  onActivityCleared?(type: 'forest' | 'mining', ctx: EngineContext): void;
  initiateCombat(payload: CombatTriggerPayload, ctx: EngineContext): void;
  resolveCombatExit(
    outcome: 'victory' | 'defeat',
    ctx: EngineContext,
    runtimeContext?: Record<string, any>
  ): void;

  handleGainMaterial(mat: TrackedMaterial, amount: number, ctx: EngineContext): void;
  handleHeroDefeated(ctx: EngineContext): void;
}