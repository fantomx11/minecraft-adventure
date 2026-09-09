export interface SandboxState {
  forestCleared: number;
  mineCleared: number;
}

export interface NarrativeState {
  currentPassageId: string;
  visitedPassages: string[];
}

export interface OpenWorldState {
  currentRegionId: string;
  currentPoiId: string | null;
  currentNodeId: string | null;
  discoveredRegions: string[];
  discoveredPoiIds: string[];
  questFlags: Record<string, boolean | number | string>;
  counters: Record<string, number>;
}