import type { CombatLifecycleHooks } from './combat';

// --- Expressions ---

export type BinaryOperator =
  | '==' | '!=' | '>' | '>=' | '<' | '<='
  | '+' | '-' | '*' | '/' | '%'
  | 'and' | 'or';

export type UnaryOperator = 'not' | '-';

export interface LiteralExpr {
  type: 'literal';
  value: string | number | boolean;
}

export interface GetExpr {
  type: 'get';
  path: string; // e.g., "round.matchingMisses", "mob.defense", "mob.state.fuse"
}

export interface BinaryExpr {
  type: 'binary';
  op: BinaryOperator;
  left: Expr;
  right: Expr;
}

export interface UnaryExpr {
  type: 'unary';
  op: UnaryOperator;
  operand: Expr;
}

export interface DiceExpr {
  type: 'dice';
  count: number;
  sides: number;
}

export interface HasItemExpr {
  type: 'has_item';
  itemId: string;
}

export interface TemplateExpr {
  type: 'template';
  template: string; // e.g. "Damage doubled to ${mob.damage}!"
}

export type Expr =
  | LiteralExpr
  | GetExpr
  | BinaryExpr
  | UnaryExpr
  | DiceExpr
  | HasItemExpr
  | TemplateExpr;

// --- Actions / Statements ---

export interface IfAction {
  type: 'if';
  condition: Expr;
  then: Action[];
  else?: Action[];
}

export interface ForEachAction {
  type: 'for_each';
  list: Expr; // Expression resolving to an array (e.g. { type: 'get', path: 'round.missRolls' })
  as: string; // Loop variable name injected into child scope
  actions: Action[];
}

export interface SetAction {
  type: 'set';
  target: string; // e.g. "mob.defense", "combat.ignoreArmor", "mob.state.fuse"
  value: Expr;
}

export interface ModifyAction {
  type: 'modify';
  target: string;
  op: 'add' | 'multiply';
  value: Expr;
}

export interface DealDamageAction {
  type: 'deal_damage';
  target: 'hero' | 'mob';
  amount: Expr;
  source: string;
  appliesArmor?: boolean;
}

export interface ModifyDamageInstancesAction {
  type: 'modify_damage_instances';
  target: 'hero_damage' | 'mob_damage';
  delta?: Expr;
  amount?: Expr;
  min?: number;
  appliesArmor?: boolean;
  source?: string;
}

export interface ChangeHealthAction {
  type: 'change_health';
  target: 'hero' | 'mob';
  amount: Expr; // Negative for damage, positive for healing
}

export interface InventoryAction {
  type: 'inventory';
  action: 'add' | 'remove';
  itemId?: string | Expr;
  slot?: 'weapon' | 'armor' | 'pickaxe' | 'key';
  count?: Expr;
  isMaterial?: boolean;
}

export interface FlagAction {
  type: 'flag';
  flag: string;
  action: 'set' | 'add' | 'toggle' | 'delete';
  value?: Expr;
}

export interface MessageAction {
  type: 'message';
  messageType: 'hit' | 'miss' | 'special' | 'notice';
  text: Expr;
}

export interface AddEffectAction {
  type: 'add_effect';
  effect: 'poison' | 'vex';
  amount?: Expr;
}

export interface ClearDamageAction {
  type: 'clear_damage' | 'clear_mob_damage';
  target?: 'hero' | 'mob';
}

export interface ClearMobDamageAction {
  type: 'clear_mob_damage';
}

export interface PreventDeathAction {
  type: 'prevent_death';
}

export interface ReturnAction {
  type: 'return';
  key: string;
  value: Expr;
}

export interface LootAction {
  type: 'loot_action';
  reward: Expr; // Macro: sets returnScope.reward and returnScope.won = true
}

export type Action =
  | IfAction
  | ForEachAction
  | SetAction
  | ModifyAction
  | DealDamageAction
  | ModifyDamageInstancesAction
  | ChangeHealthAction
  | InventoryAction
  | FlagAction
  | MessageAction
  | AddEffectAction
  | ClearDamageAction
  | ClearMobDamageAction
  | PreventDeathAction
  | ReturnAction
  | LootAction;

// --- Mob & Hook Declarations ---

export type CombatHookEvent = keyof CombatLifecycleHooks;

export type CombatBehaviorAst = Partial<Record<CombatHookEvent, Action[]>>;