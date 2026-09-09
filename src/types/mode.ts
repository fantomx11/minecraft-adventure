import type { GameProgressionState, ActiveView, GameModeId } from './game';
import type { Character } from '../models/Character';
import type { Passage } from './narrative';

export interface CombatExitResolution {
  view: ActiveView;
  targetPassageId?: string;
  poiNodeId?: string;
}

export interface GameModeStrategy {
  id: GameModeId;
  label: string;
  defaultView: ActiveView;
  getAllowedViews: (game: GameProgressionState, passages: Record<string, Passage>) => ActiveView[];
  handleCombatFinished: (
    outcome: 'victory' | 'defeat',
    game: GameProgressionState,
    hero: Character,
    context?: { passageVictoryId?: string; passageDefeatId?: string }
  ) => CombatExitResolution;
}