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
}

export interface CombatState {
  turn: number;
  effects: CombatLifecycleHooks[];
  hero: Character;
  mob: Mob;
  ignoreArmor: boolean;
  heroDmgPenalty: number;
}

export interface CombatContext {
  combatState: CombatState;
  roundState: RoundState;
}

export interface CombatLifecycleHooks {
  onCombatStart?(ctx: CombatContext): void;
  onRoundStart?(ctx: CombatContext): void;
  onRollEvaluated?(ctx: CombatContext): void;
  onDealDamage?(ctx: CombatContext): void;
  onReceiveDamage?(ctx: CombatContext): void;
  onRoundEnd?(ctx: CombatContext): void;
  onDeath?(ctx: CombatContext): void;
  onCombatEnd?(ctx: CombatContext): void;
}