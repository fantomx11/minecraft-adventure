import type { Entity } from '../models/Entity';
import type { Character } from '../models/Character';
import type { Mob } from '../models/Mob';

export interface DamageInstance {
  amount: number;
  source: string;
  appliesArmor: boolean;
}

export interface DamageResult {
  appliedTotal: number;
  details: string[];
}

export interface CombatMessage {
  type: 'hit' | 'miss' | 'special' | 'notice';
  text: string;
}

export interface RoundState {
  diceCount: number;
  rolls: number[];
  hits: number;
  misses: number;
  missRolls: number[];
  matchingHits: number;
  matchingMisses: number;
  heroDamageInstances: DamageInstance[];
  mobDamageInstances: DamageInstance[];
  messages: CombatMessage[];
  preventDeath: boolean;
  dyingEntity: Entity | null;
  vexBanishedThisRound?: boolean;
  pendingCritHitPick?: boolean; // True when quadruples occur on hits
}

export interface CombatState {
  turn: number;
  effects: CombatLifecycleHooks[];
  hero: Character;
  mob: Mob;
  ignoreArmor: boolean;
  heroDmgPenalty: number;
  heroDmgMultiplier?: number;
  friendlyMobJoined?: boolean;
  guaranteedLootRoll?: number;
  pendingDiamondReward?: number;
}

export interface CombatContext {
  combatState: CombatState;
  roundState: RoundState;
}

export type CombatHook = (ctx: CombatContext) => void;

export interface CombatLifecycleHooks {
  onCombatStart?: CombatHook;
  onRoundStart?: CombatHook;
  onRollEvaluated?: CombatHook;
  onDealDamage?: CombatHook;
  onReceiveDamage?: CombatHook;
  onRoundEnd?: CombatHook;
  onDeath?: CombatHook;
  onCombatEnd?: CombatHook;
}