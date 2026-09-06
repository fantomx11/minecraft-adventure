import { Entity } from './Entity';
import type { DamageInstance, DamageResult, CombatContext, CombatLifecycleHooks } from '../types/combat';

export interface MobConfig {
  name: string;
  hearts: number;
  damage: number;
  defense: number;
  rules?: string;
  loot?: string;
  hooks?: CombatLifecycleHooks;
}

export class Mob extends Entity implements Required<CombatLifecycleHooks> {
  public damage: number;
  public defense: number;
  public rules: string;
  public loot: string;
  public hooks: CombatLifecycleHooks;
  public state: Record<string, any> = {};

  constructor(config: MobConfig) {
    super(config.name, config.hearts, config.hearts);
    this.damage = config.damage;
    this.defense = config.defense;
    this.rules = config.rules || 'Standard encounter.';
    this.loot = config.loot || 'None.';
    this.hooks = config.hooks || {};
  }

  public onCombatStart(ctx: CombatContext): void { this.hooks.onCombatStart?.(ctx); }
  public onRoundStart(ctx: CombatContext): void { this.hooks.onRoundStart?.(ctx); }
  public onRollEvaluated(ctx: CombatContext): void { this.hooks.onRollEvaluated?.(ctx); }
  public onDealDamage(ctx: CombatContext): void { this.hooks.onDealDamage?.(ctx); }
  public onReceiveDamage(ctx: CombatContext): void { this.hooks.onReceiveDamage?.(ctx); }
  public onRoundEnd(ctx: CombatContext): void { this.hooks.onRoundEnd?.(ctx); }
  public onDeath(ctx: CombatContext): void { this.hooks.onDeath?.(ctx); }
  public onCombatEnd(ctx: CombatContext): void { this.hooks.onCombatEnd?.(ctx); }

  public takeDamage(instances: DamageInstance[], ctx: CombatContext): DamageResult {
    let appliedTotal = 0;
    const details: string[] = [];

    for (const inst of instances) {
      let amt = inst.amount;
      if (inst.appliesArmor && this.armor > 0 && !ctx.combatState.ignoreArmor) {
        amt = Math.max(0, amt - this.armor);
      }
      this.hearts = Math.max(0, this.hearts - amt);
      appliedTotal += amt;
      details.push(`${inst.source}: ${amt} DMG`);
    }

    return { appliedTotal, details };
  }
}