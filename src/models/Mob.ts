import { Entity, EntityConfig } from './Entity';
import type { CombatContext, CombatLifecycleHooks } from '../types/combat';
import { Action, CombatBehaviorAst } from '../types/ast';
import { AstInterpreter } from '../engine/astInterpreter';

interface MobData {
  id: string;
  damage: number;
  defense: number;
  rulesText?: string;
  lootText?: string;
  behavior?: CombatBehaviorAst;
  loot?: Action[];
  state?: Record<string, boolean | number | string>;
}

export type MobConfig = EntityConfig & MobData

export class Mob extends Entity implements Required<CombatLifecycleHooks> {
  #data: MobData;
  #hooks: CombatLifecycleHooks;

  constructor({ id, damage, defense, rulesText, lootText, behavior, loot, state, ...config }: MobConfig) {
    // 1. Initialize Entity vitals
    super(config);

    // 2. Reactive store for mutable combat state
    this.#data = this.createReactiveStore({
      id,
      damage,
      defense,
      rulesText,
      lootText,
      behavior,
      loot,
      state
    });

    this.#hooks = this.#compileHooks(behavior);
  }

  #createHookHandler(ast: Action[]) {
    return (ctx: CombatContext) => {
      const scope = {
        self: this,
        mob: this,
        hero: ctx.combatState?.hero,
        round: ctx.roundState,
        combat: ctx.combatState,
      };

      return AstInterpreter.execute(ast, scope);
    }
  }

  #compileHooks(behavior: CombatBehaviorAst): CombatLifecycleHooks {
    const entries = Object.entries(behavior) as [keyof CombatLifecycleHooks, Action[]][];

    return entries.reduce<CombatLifecycleHooks>((acc, [hookName, astTree]) => {
      if (Array.isArray(astTree) && astTree.length > 0) {
        acc[hookName] = this.#createHookHandler(astTree);
      }
      return acc;
    }, {});
  }

  // --- Entity Abstract Implementation ---
  public override get armor(): number { return this.#data.defense; }

  // --- Accessors ---
  public get damage(): number { return this.#data.damage; }
  public set damage(val: number) { this.#data.damage = val; }

  public get defense(): number { return this.#data.defense; }
  public set defense(val: number) { this.#data.defense = Math.max(0, val); }

  public get rulesText(): string { return this.#data.rulesText || 'Standard encounter.'; }
  public set rulesText(val: string) { this.#data.rulesText = val; }

  public get lootText(): string { return this.#data.lootText || 'None.'; }
  public set lootText(val: string) { this.#data.lootText = val; }

  public get behavior(): CombatBehaviorAst | undefined { return this.#data.behavior; }
  public set behavior(val: CombatBehaviorAst | undefined) { this.#data.behavior = val; }

  public get state(): Record<string, any> { return this.#data.state || {}; }

  // --- Loot Handler ---
  public onLootRoll(roll: number): string {
    if (this.#data.loot) {
      const {reward} = AstInterpreter.execute(this.#data.loot, { roll });

      if(reward) {
        return reward
      }
    }
    return 'No loot';
  }

  // --- Combat Lifecycle Hooks ---
  public onCombatStart(ctx: CombatContext): void { this.#hooks.onCombatStart?.(ctx); }
  public onRoundStart(ctx: CombatContext): void { this.#hooks.onRoundStart?.(ctx); }
  public onRollEvaluated(ctx: CombatContext): void { this.#hooks.onRollEvaluated?.(ctx); }
  public onDealDamage(ctx: CombatContext): void { this.#hooks.onDealDamage?.(ctx); }
  public onReceiveDamage(ctx: CombatContext): void { this.#hooks.onReceiveDamage?.(ctx); }
  public onRoundEnd(ctx: CombatContext): void { this.#hooks.onRoundEnd?.(ctx); }
  public onDeath(ctx: CombatContext): void { this.#hooks.onDeath?.(ctx); }
  public onCombatEnd(ctx: CombatContext): void { this.#hooks.onCombatEnd?.(ctx); }

  // --- Serialization ---
  public override toJSON(): MobConfig {
    const { id, damage, defense, rulesText, lootText, behavior, loot, state } = this.#data


    return {
      ...super.toJSON(),
      id,
      damage,
      defense,
      rulesText,
      loot,
      state,
      lootText,
      behavior
    };
  }
}