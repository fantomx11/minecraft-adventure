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
  counterDeltas?: Record<string, number>; // e.g. { timeHours: 4, exhaustion: 1 }
}

export interface TravelOutcome {
  success: boolean;
  costApplied?: TravelCost;
  combatMob?: string;              // If an encounter interrupts travel
  narrativePassageId?: string;     // If a random roadside event occurs
  logMessages: string[];
}

export interface TravelResolver {
  canTravel(hero: Character, state: OpenWorldProgression, req: TravelRequest): {
    allowed: boolean;
    reason?: string
  };
  resolveTravel(
    hero: Character,
    state: OpenWorldProgression,
    req: TravelRequest
  ): TravelOutcome;
}

export interface POINodeExit {
  targetNodeId?: string;       // Next room/node in the POI
  exitToRegion?: boolean;      // Leaves the POI back to the region map
  label: string;               // e.g., "Descend to Crypts", "Exit to Forest"
  requiresItem?: string;       // e.g., "Iron Key"
  requiresFlags?: Record<string, any>;
}

export interface ActionCondition {
  requiresItem?: string;                         // e.g. "Torch", "Skeleton Key"
  requiresMaterial?: { material: TrackedMaterial; count: number }; //
  requiresFlags?: Record<string, any>;           // World / quest state
  prohibitedFlags?: string[];                    // Hides or locks if completed
  hiddenUntilMet?: boolean;                      // True = invisible until met; False = visible but grayed out
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
  passageId: string;           // Fires up the narrative engine
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
}

export interface Region {
  id: string;
  name: string;
  description: string;
  biome: 'forest' | 'plains' | 'mountains' | 'ocean' | 'swamp' | 'desert';
  adjacentRegionIds: string[];  // Graph edges for walking
  encounterTable: MobTableEntry[]; // Random encounters on travel/explore
  dangerLevel: number;          // Modifies encounter odds / mob tier
  pointsOfInterest: PointOfInterest[];
  accessibleViews?: ('forest' | 'mining' | 'crafting')[];
}