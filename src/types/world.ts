import type { TrackedMaterial } from './inventory';
import type { MobTableEntry } from './narrative';
import type { Character } from '../models/Character';
import type { OpenWorldProgression } from './game';
import { Action, Expr } from './ast';

// --- Travel Contracts ---
export interface TravelRequest {
  fromRegionId: string;
  toRegionId: string;
  travelMethod?: 'walk' | 'boat' | 'cart' | 'fast_travel';
}

export interface TravelCost {
  materials?: Partial<Record<TrackedMaterial, number>>;
  healthDelta?: number;
  counterDeltas?: Record<string, number>;
}

export interface TravelOutcome {
  success: boolean;
  costApplied?: TravelCost;
  combatMob?: string;
  narrativePassageId?: string;
  logMessages: string[];
}

export interface TravelResolver {
  canTravel(
    hero: Character,
    state: OpenWorldProgression,
    req: TravelRequest,
    regions?: Record<string, Region>
  ): { allowed: boolean; reason?: string };
  resolveTravel(
    hero: Character,
    state: OpenWorldProgression,
    req: TravelRequest,
    regions?: Record<string, Region>
  ): TravelOutcome;
}

// --- POI & World Contracts ---
export interface POINodeExit {
  targetNodeId?: string;
  exitToRegion?: boolean;
  label: string;
  condition?: Expr;
  mutations?: Action[];
  lockedReason?: string;
  behavior?: 'hide' | 'disable';
}

export interface ActionCondition {
  condition?: Expr;
  mutations?: Action[];
  hiddenUntilMet?: boolean;
}

export interface POIRepeatableAction {
  id: string;
  label: string;
  type: 'combat' | 'view' | 'gather' | 'rest';
  mobName?: string;
  view?: 'forest' | 'mining' | 'crafting';
  resourceGain?: { material: TrackedMaterial; count: number };
}

export interface POIQuestHook {
  id: string;
  questId: string;
  label: string;
  passageId: string;
  condition?: Expr;
  mutations?: Action[];
  lockedReason?: string;
  behavior?: 'hide' | 'disable';
}

export interface POINode {
  id: string;
  title: string;
  description: string;
  accessibleViews?: ('forest' | 'mining' | 'crafting')[];
  exits: POINodeExit[];
  actions: POIRepeatableAction[];
  questHooks: POIQuestHook[];
}

export interface PointOfInterest {
  id: string;
  name: string;
  description: string;
  entryNodeId: string;
  nodes: Record<string, POINode>;
  hidden?: boolean;
  minTrekTotal?: number;
  discoveryLog?: string;
}

export interface Region {
  id: string;
  name: string;
  description: string;
  biome: 'forest' | 'plains' | 'mountains' | 'ocean' | 'swamp' | 'desert';
  adjacentRegionIds: string[];
  encounterTable: MobTableEntry[];
  dangerLevel: number;
  pointsOfInterest: PointOfInterest[];
  accessibleViews?: ('forest' | 'mining' | 'crafting')[];
}