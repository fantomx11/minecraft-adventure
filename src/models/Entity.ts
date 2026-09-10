import { Observable } from './Observable';
import type { DamageInstance, DamageResult, CombatContext } from '../types/combat';

export interface EntityData {
  name: string;
  hearts: number;
  maxHearts: number;
  health?: number;
}

export abstract class Entity extends Observable {
  #data: EntityData;

  constructor(name: string, maxHearts: number, hearts?: number) {
    super();
    this.#data = this.createReactiveStore({
      name,
      maxHearts,
      hearts: hearts ?? maxHearts,
    });
  }

  abstract readonly armor: number;

  // --- Core Accessors ---
  public get name(): string {
    return this.#data.name;
  }
  public set name(val: string) {
    this.#data.name = val;
  }

  public get maxHearts(): number {
    return this.#data.maxHearts;
  }
  public set maxHearts(val: number) {
    this.#data.maxHearts = Math.max(1, val);
  }

  public get hearts(): number {
    return this.#data.hearts;
  }
  public set hearts(val: number) {
    this.#data.hearts = Math.max(0, Math.min(this.#data.maxHearts, val));
  }

  public get health(): number {
    return this.hearts;
  }
  public set health(val: number) {
    this.hearts = val;
  }

  public setHealth(val: number): void {
    this.hearts = val;
  }

  public get isDead(): boolean {
    return this.hearts <= 0;
  }

  public get isAlive(): boolean {
    return this.hearts > 0;
  }

  public isDefeated(): boolean {
    return this.isDead;
  }

  // --- Domain Logic ---
  public changeHealth(delta: number): void {
    this.hearts += delta;
  }

  public resetHealth(): void {
    this.hearts = this.maxHearts;
  }

  public takeDamage(instances: DamageInstance[], ctx?: CombatContext): DamageResult {
    let appliedTotal = 0;
    const details: string[] = [];

    for (const inst of instances) {
      let amt = inst.amount;
      if (inst.appliesArmor && this.armor > 0 && !ctx?.combatState?.ignoreArmor) {
        amt = Math.max(0, amt - this.armor);
      }
      this.hearts -= amt;
      appliedTotal += amt;
      details.push(`${inst.source}: ${amt} DMG`);
    }

    return { appliedTotal, details };
  }

  public toJSON(): EntityData {
    return {
      name: this.name,
      hearts: this.hearts,
      maxHearts: this.maxHearts,
      health: this.hearts,
    };
  }
}