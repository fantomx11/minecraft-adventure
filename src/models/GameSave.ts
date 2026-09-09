import { SerializedCharacter } from "./Character";

interface GameSaveBase<T extends string, U> {
  character: SerializedCharacter;
  type: T;
  data: U;
}

export interface SandboxData {
  forestCleared: number;
  mineCleared: number;
}

export type SandboxGameSave = GameSaveBase<"sandbox", SandboxData>;

export interface NarrativeData {
  currentPassageId: string;
  visitedPassages: string[];
}

export type NarrativeGameSave = GameSaveBase<"narrative", NarrativeData>;

export interface OpenWorldData {
  currentRegionId: string;
  currentPoiId: string | null;
  currentNodeId: string | null;
  discoveredRegions: string[];
  discoveredPoiIds: string[];
  questFlags: Record<string, any>;
}

export type OpenWorldGameSave = GameSaveBase<"open_world", OpenWorldData>;

export type GameSave = SandboxGameSave | NarrativeGameSave | OpenWorldGameSave

export function initGameSave<T extends GameSave["type"]>(
  type: T,
  character: SerializedCharacter
): Extract<GameSave, { type: T }> {
  return {
    type,
    character,
    data: DATA_FACTORIES[type](),
  } as Extract<GameSave, { type: T }>;
}

const DATA_FACTORIES = {
  sandbox: (): SandboxData => ({
    forestCleared: 0,
    mineCleared: 0,
  }),
  narrative: (): NarrativeData => ({
    currentPassageId: "start",
    visitedPassages: [],
  }),
  open_world: (): OpenWorldData => ({
    currentRegionId: "plains_settlement",
    currentPoiId: null,
    currentNodeId: null,
    discoveredRegions: ["plains_settlement"],
    discoveredPoiIds: [],
    questFlags: {},
  }),
} as const;