import type { CombatContext, CombatLifecycleHooks } from '../types/combat';

export class VexEffect implements CombatLifecycleHooks {
  public id: string;
  public name: string = 'Vex';

  constructor() {
    this.id = `vex_${Math.random().toString(36).substring(2, 9)}`;
  }

  public onRollEvaluated(ctx: CombatContext): void {
    if (ctx.roundState.matchingHits >= 2 && !ctx.roundState.vexBanishedThisRound) {
      ctx.roundState.vexBanishedThisRound = true;
      ctx.combatState.effects = ctx.combatState.effects.filter(
        (e) => (e as VexEffect).id !== this.id
      );
      ctx.roundState.messages.push({
        type: 'notice',
        text: '✨ Double hits banished 1 Vex!',
      });
    }
  }

  public onDealDamage(ctx: CombatContext): void {
    ctx.roundState.mobDamageInstances.push({
      amount: 1,
      source: 'Vex Attack',
      appliesArmor: true,
    });
  }
}

export class PoisonEffect implements CombatLifecycleHooks {
  public id: string;
  public amount: number;

  constructor(amount: number = 1) {
    this.id = `poison_${Math.random().toString(36).substring(2, 9)}`;
    this.amount = amount;
  }

  public onRoundStart(ctx: CombatContext): void {
    ctx.combatState.hero.changeHealth(-this.amount);
    ctx.roundState.messages.push({
      type: 'miss',
      text: `☠️ Poison deals ${this.amount} damage directly to your hearts!`,
    });
  }
}