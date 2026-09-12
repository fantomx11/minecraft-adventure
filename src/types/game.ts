import type { CharacterConfig } from '../models/Character';

export type GameModeId = 'sandbox' | 'narrative' | 'open_world';

export type ActiveView = 
  | 'narrative' 
  | 'combat' 
  | 'forest' 
  | 'mining' 
  | 'crafting'
  | 'world_map'
  | 'poi_node';

export interface SandboxProgression {
  forestCleared: number;
  mineCleared: number;
}

export interface NarrativeProgression {
  currentPassageId: string;
  visitedPassages: string[];
}

export interface OpenWorldProgression {
  currentRegionId: string;
  currentPoiId: string | null;
  currentNodeId: string | null;
  discoveredRegions: string[];
  discoveredPoiIds: string[];
  questFlags: Record<string, boolean | number | string>;
  counters: Record<string, number>;
  customData: Record<string, any>;
}

export interface GameProgressionState {
  mode: GameModeId;
  activeView: ActiveView;
  sandbox: SandboxProgression;
  narrative: NarrativeProgression;
  openWorld: OpenWorldProgression;
}

export interface GameSaveData {
  version: number;
  character: CharacterConfig;
  game: GameProgressionState;
}