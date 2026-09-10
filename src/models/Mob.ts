import { Entity, EntityData } from './Entity';
import type { Character } from './Character';
import type { CombatContext, CombatLifecycleHooks } from '../types/combat';

export interface LootResult {
  won: boolean;
  reward: string;
  apply?: (hero: Character) => void;
}

export interface MobConfig {
  name: string;
  hearts: number;
  damage: number;
  defense: number;
  rules?: string;
  loot?: string;
  hooks?: CombatLifecycleHooks;
  onLootRoll?: (roll: number) => LootResult;
}

export interface SerializedMob extends EntityData {
  damage: number;
  defense: number;
  rules: string;
  loot: string;
  state: Record<string, any>;
}

interface MobData {
  damage: number;
  defense: number;
  rules: string;
  loot: string;
  state: Record<string, any>;
}

export class Mob extends Entity implements Required<CombatLifecycleHooks> {
  #data: MobData;
  #hooks: CombatLifecycleHooks;
  #lootHandler?: (roll: number) => LootResult;

  constructor(config: MobConfig) {
    // 1. Initialize Entity vitals
    super(config.name, config.hearts, config.hearts);

    // 2. Reactive store for mutable combat state
    this.#data = this.createReactiveStore({
      damage: config.damage,
      defense: config.defense,
      rules: config.rules || 'Standard encounter.',
      loot: config.loot || 'None.',
      state: {},
    });

    // 3. Callback handlers kept outside reactive data
    this.#hooks = config.hooks || {};
    this.#lootHandler = config.onLootRoll;
  }

  // --- Entity Abstract Implementation ---
  public override get armor(): number {
    return this.#data.defense;
  }

  // --- Accessors ---
  public get damage(): number {
    return this.#data.damage;
  }
  public set damage(val: number) {
    this.#data.damage = val;
  }

  public get defense(): number {
    return this.#data.defense;
  }
  public set defense(val: number) {
    this.#data.defense = Math.max(0, val);
  }

  public get rules(): string {
    return this.#data.rules;
  }
  public set rules(val: string) {
    this.#data.rules = val;
  }

  public get loot(): string {
    return this.#data.loot;
  }
  public set loot(val: string) {
    this.#data.loot = val;
  }

  public get state(): Record<string, any> {
    return this.#data.state;
  }

  public get hooks(): CombatLifecycleHooks {
    return this.#hooks;
  }

  // --- Loot Handler ---
  public onLootRoll(roll: number): LootResult {
    if (this.#lootHandler) {
      return this.#lootHandler(roll);
    }
    return { won: false, reward: 'No loot' };
  }

  // --- Combat Lifecycle Hooks ---
  public onCombatStart(ctx: CombatContext): void {
    this.#hooks.onCombatStart?.(ctx);
  }

  public onRoundStart(ctx: CombatContext): void {
    this.#hooks.onRoundStart?.(ctx);
  }

  public onRollEvaluated(ctx: CombatContext): void {
    this.#hooks.onRollEvaluated?.(ctx);
  }

  public onDealDamage(ctx: CombatContext): void {
    this.#hooks.onDealDamage?.(ctx);
  }

  public onReceiveDamage(ctx: CombatContext): void {
    this.#hooks.onReceiveDamage?.(ctx);
  }

  public onRoundEnd(ctx: CombatContext): void {
    this.#hooks.onRoundEnd?.(ctx);
  }

  public onDeath(ctx: CombatContext): void {
    this.#hooks.onDeath?.(ctx);
  }

  public onCombatEnd(ctx: CombatContext): void {
    this.#hooks.onCombatEnd?.(ctx);
  }

  // --- Serialization ---
  public override toJSON(): SerializedMob {
    return {
      ...super.toJSON(),
      damage: this.#data.damage,
      defense: this.#data.defense,
      rules: this.#data.rules,
      loot: this.#data.loot,
      state: { ...this.#data.state },
    };
  }
}