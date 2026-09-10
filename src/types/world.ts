import { TrackedMaterial } from './inventory';
import { MobTableEntry } from './narrative';
import type { Character } from '../models/Character';
import type { OpenWorldProgression } from './game';

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
  canTravel(hero: Character, state: OpenWorldProgression, req: TravelRequest): {
    allowed: boolean;
    reason?: string;
  };
  resolveTravel(
    hero: Character,
    state: OpenWorldProgression,
    req: TravelRequest
  ): TravelOutcome;
}

export interface POINodeExit {
  targetNodeId?: string;
  exitToRegion?: boolean;
  label: string;
  requiresItem?: string;
  requiresFlags?: Record<string, any>;
}

export interface ActionCondition {
  requiresItem?: string;
  requiresMaterial?: { material: TrackedMaterial; count: number };
  requiresFlags?: Record<string, any>;
  prohibitedFlags?: string[];
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
  requiredFlags?: Record<string, any>;
  prohibitedFlags?: string[];
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