import type { DamageInstance, DamageResult, CombatContext } from '../types/combat';

export abstract class Entity {
  public name: string;
  public maxHearts: number;
  public hearts: number;
  public armor: number = 0;

  constructor(name: string, maxHearts: number, hearts?: number) {
    this.name = name;
    this.maxHearts = maxHearts;
    this.hearts = hearts ?? maxHearts;
  }

  public setHealth(val: number): void {
    this.hearts = Math.min(this.maxHearts, Math.max(0, val));
  }

  public changeHealth(delta: number): void {
    this.setHealth(this.hearts + delta);
  }

  public resetHealth(): void {
    this.hearts = this.maxHearts;
  }

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

  public isDefeated(): boolean {
    return this.hearts <= 0;
  }
}