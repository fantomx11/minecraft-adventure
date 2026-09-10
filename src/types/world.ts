import type { TrackedMaterial } from './inventory';
import type { MobTableEntry } from './narrative';
import type { Character } from '../models/Character';
import type { OpenWorldProgression } from './game';

export type FlagComparator = "==" | "!=" | ">" | ">=" | "<=" | "<";

// --- Condition AST ---
export interface FlagCondition {
  type: 'flag';
  flag: string;
  comparator: FlagComparator;
  value: number | boolean | string;
}

export interface InventoryCondition {
  type: 'inventory';
  itemId: string;
  comparator?: FlagComparator; // Defaults to '>='
  count?: number;              // Defaults to 1
}

export interface PlayerCondition {
  type: 'player';
  stat: 'restarts' | 'attack' | 'damage' | 'armor';
  comparator: FlagComparator;
  value: number;
}

export interface ProgressionCondition {
  type: 'progression';
  counter: 'forestCleared' | 'mineCleared' | 'travelSteps' | 'trekBonus';
  comparator: FlagComparator;
  value: number;
}

export interface PassageCondition {
  type: 'passage';
  passageId: string;
  visited?: boolean;           // Defaults to true
}

export interface LocationCondition {
  type: 'location';
  locationId: string;          // Region ID or POI ID
  discovered?: boolean;        // Defaults to true
}

export interface LogicalCondition {
  type: 'and' | 'or';
  conditions: Condition[];
}

export interface NegationCondition {
  type: 'not';
  condition: Condition;
}

export type Condition =
  | FlagCondition
  | InventoryCondition
  | PlayerCondition
  | ProgressionCondition
  | PassageCondition
  | LocationCondition
  | LogicalCondition
  | NegationCondition;

// --- Mutation Types ---
export interface FlagMutation {
  type: 'flag';
  flag: string;
  action: 'set' | 'add' | 'toggle' | 'delete';
  value?: number | boolean | string;
}

export interface InventoryMutation {
  type: 'inventory';
  itemId: string;
  action: 'add' | 'remove';
  count?: number; // Defaults to 1
}

export interface LocationMutation {
  type: 'location';
  locationId: string;
  action: 'discover';
}

export type Mutation = FlagMutation | InventoryMutation | LocationMutation;

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
  condition?: Condition;
  mutations?: Mutation[];
  lockedReason?: string;
  behavior?: 'hide' | 'disable';
}

export interface ActionCondition {
  condition?: Condition;
  mutations?: Mutation[];
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
  condition?: Condition;
  mutations?: Mutation[];
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