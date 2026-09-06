import type { Character } from '../models/Character';
import type { Mob } from '../models/Mob';
import type { Entity } from '../models/Entity';
import type { CombatContext, CombatLifecycleHooks, DamageResult } from '../types/combat';

export interface RoundResult {
  status: 'ongoing' | 'victory' | 'defeat';
  heroDmgRes?: DamageResult;
  mobDmgRes?: DamageResult;
}

export class CombatEngine {
  public ctx: CombatContext;

  constructor(hero: Character, mob: Mob) {
    this.ctx = {
      combatState: {
        turn: 0,
        effects: [],
        hero,
        mob,
        ignoreArmor: false,
        heroDmgPenalty: 0,
      },
      roundState: {
        diceCount: 1,
        rolls: [],
        hits: 0,
        misses: 0,
        missRolls: [],
        matchingHits: 0,
        matchingMisses: 0,
        heroDamageInstances: [],
        mobDamageInstances: [],
        messages: [],
        preventDeath: false,
        dyingEntity: null,
      },
    };
  }

  public dispatchHook(hookName: keyof CombatLifecycleHooks): void {
    const listeners: (CombatLifecycleHooks | undefined)[] = [
      this.ctx.combatState.hero,
      this.ctx.combatState.mob,
      ...this.ctx.combatState.effects,
    ];

    for (const listener of listeners) {
      listener?.[hookName]?.(this.ctx);
    }
  }

  public initCombat(): void {
    this.dispatchHook('onCombatStart');
  }

  public executeRound(diceCount: number, targetDef: number): RoundResult {
    this.ctx.combatState.turn++;

    this.ctx.roundState = {
      diceCount: Math.min(this.ctx.combatState.hero.attack, Math.max(1, diceCount)),
      rolls: [],
      hits: 0,
      misses: 0,
      missRolls: [],
      matchingHits: 0,
      matchingMisses: 0,
      heroDamageInstances: [],
      mobDamageInstances: [],
      messages: [],
      preventDeath: false,
      dyingEntity: null,
    };

    // 1. Upkeep
    this.dispatchHook('onRoundStart');
    if (this.ctx.combatState.hero.hearts <= 0 && !this.handleDeath(this.ctx.combatState.hero)) {
      return { status: 'defeat' };
    }

    // 2. Dice evaluation
    this.rollDice(targetDef);
    this.dispatchHook('onRollEvaluated');

    // 3. Base damage population
    this.applyStandardDamages();

    // 4. Outgoing damage modifications (Bow, Trident, Evoker Spells, Pillager)
    this.dispatchHook('onDealDamage');

    // 5. Incoming damage mitigation (Guardian Closing Distance, Villager Armor)
    this.dispatchHook('onReceiveDamage');

    // 6. Application to health pools
    const heroDmgRes = this.ctx.combatState.mob.takeDamage(this.ctx.roundState.heroDamageInstances, this.ctx);
    const mobDmgRes = this.ctx.combatState.hero.takeDamage(this.ctx.roundState.mobDamageInstances, this.ctx);

    // 7. Death resolution
    if (this.ctx.combatState.mob.isDefeated() && !this.handleDeath(this.ctx.combatState.mob)) {
      return { status: 'victory', heroDmgRes, mobDmgRes };
    }
    if (this.ctx.combatState.hero.isDefeated() && !this.handleDeath(this.ctx.combatState.hero)) {
      return { status: 'defeat', heroDmgRes, mobDmgRes };
    }

    // 8. Round cleanup
    this.dispatchHook('onRoundEnd');

    return { status: 'ongoing', heroDmgRes, mobDmgRes };
  }

  public rollDice(targetDef: number): void {
    const counts: Record<number, number> = {};

    for (let i = 0; i < this.ctx.roundState.diceCount; i++) {
      const val = Math.floor(Math.random() * 6) + 1;
      this.ctx.roundState.rolls.push(val);
      counts[val] = (counts[val] || 0) + 1;

      if (val >= targetDef) {
        this.ctx.roundState.hits++;
        if (counts[val] >= 2) this.ctx.roundState.matchingHits = counts[val];
      } else {
        this.ctx.roundState.misses++;
        this.ctx.roundState.missRolls.push(val);
        if (counts[val] >= 2) this.ctx.roundState.matchingMisses = counts[val];
      }
    }
  }

  private applyStandardDamages(): void {
    const bonusHits = this.ctx.roundState.matchingHits >= 2 ? 1 : 0;
    const totalHeroHits = this.ctx.roundState.hits + bonusHits;

    if (totalHeroHits > 0) {
      const dmg = Math.max(0, this.ctx.combatState.hero.damage - (this.ctx.combatState.heroDmgPenalty || 0));
      this.ctx.roundState.heroDamageInstances.push({
        amount: totalHeroHits * dmg,
        source: `Hero Attack (${totalHeroHits} hits)`,
        appliesArmor: false,
      });
    }

    const bonusMisses = this.ctx.roundState.matchingMisses >= 2 ? 1 : 0;
    const totalMobHits = this.ctx.roundState.misses + bonusMisses;

    if (totalMobHits > 0) {
      const mobDmg = this.ctx.combatState.mob.damage;
      this.ctx.roundState.mobDamageInstances.push({
        amount: totalMobHits * mobDmg,
        source: `${this.ctx.combatState.mob.name} Attack (${totalMobHits} hits)`,
        appliesArmor: true,
      });
    }
  }

  private handleDeath(entity: Entity): boolean {
    this.ctx.roundState.dyingEntity = entity;
    this.dispatchHook('onDeath');
    return this.ctx.roundState.preventDeath;
  }
}