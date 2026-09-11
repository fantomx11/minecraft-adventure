import type { GameSaveData, GameProgressionState } from '../types/game';
import type { CharacterConfig } from "./Character";

interface GameSaveBase<T extends string, U> {
  character: CharacterConfig;
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
  counters: Record<string, number>;
  customData: Record<string, any>;
}

export type OpenWorldGameSave = GameSaveBase<"open_world", OpenWorldData>;

export type GameSave = SandboxGameSave | NarrativeGameSave | OpenWorldGameSave;

export function initGameSave<T extends GameSave["type"]>(
  type: T,
  character: CharacterConfig
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
    counters: { travelSteps: 0, trekBonus: 0 },
    customData: {},
  }),
} as const;

export function migrateSaveData(raw: any): GameSaveData {
  const defaultProgression: GameProgressionState = {
    mode: 'open_world',
    activeView: 'world_map',
    sandbox: { forestCleared: 0, mineCleared: 0 },
    narrative: { currentPassageId: 'start', visitedPassages: [] },
    openWorld: {
      currentRegionId: 'plains_settlement',
      currentPoiId: null,
      currentNodeId: null,
      discoveredRegions: ['plains_settlement'],
      discoveredPoiIds: [],
      questFlags: {},
      counters: { travelSteps: 0, trekBonus: 0 },
      customData: {},
    },
  };

  if (!raw || typeof raw !== 'object') {
    return {
      version: 2,
      character: {
        name: 'Steve',
        hearts: 20,
        maxHearts: 20,
        health: 20,
        restarts: 0,
        equipmentInventoryIds: ['Wooden Pickaxe'],
        equipped: { weapon: null, armor: null, pickaxe: 'Wooden Pickaxe', key: null },
        materials: {
          Wood: 0, Stone: 0, Iron: 0, Coal: 0, Diamond: 0,
          Leather: 0, String: 0, Wheat: 0, Gunpowder: 0, Slimeball: 0, Fish: 0,
        },
        materialRule: 'total',
      },
      game: defaultProgression,
    };
  }

  return {
    version: 2,
    character: raw.character || raw,
    game: raw.game
      ? {
          ...defaultProgression,
          ...raw.game,
          openWorld: {
            ...defaultProgression.openWorld,
            ...(raw.game.openWorld || {}),
            counters: {
              ...defaultProgression.openWorld.counters,
              ...(raw.game.openWorld?.counters || {}),
            },
          },
        }
      : defaultProgression,
  };
}