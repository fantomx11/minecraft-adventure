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

  public executeRound(diceCount: number, targetDef: number, customRolls?: number[]): RoundResult {
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

    this.dispatchHook('onRoundStart');
    if (this.ctx.combatState.hero.hearts <= 0 && !this.handleDeath(this.ctx.combatState.hero)) {
      return { status: 'defeat' };
    }

    // Pass custom rolls to dice evaluation
    this.rollDice(targetDef, customRolls);
    this.dispatchHook('onRollEvaluated');

    if (this.ctx.roundState.matchingMisses >= 4) {
      this.ctx.combatState.hero.setHealth(0);
      this.ctx.roundState.messages.push({
        type: 'special',
        text: '💀 CRITICAL MISS (QUADRUPLE): Complete failure! Instant Loss!',
      });
      this.dispatchHook('onCombatEnd');
      return { status: 'defeat' };
    }

    if (this.ctx.roundState.matchingHits === 3) {
      const roll = Math.floor(Math.random() * 6) + 1;
      this.applyCritHitEffect(roll);
    } else if (this.ctx.roundState.matchingHits >= 4) {
      this.ctx.roundState.pendingCritHitPick = true;
    }

    if (this.ctx.roundState.matchingMisses === 3) {
      const roll = Math.floor(Math.random() * 6) + 1;
      this.applyCritMissEffect(roll);
    }

    this.applyStandardDamages();
    this.dispatchHook('onDealDamage');
    this.dispatchHook('onReceiveDamage');

    const heroDmgRes = this.ctx.combatState.mob.takeDamage(this.ctx.roundState.heroDamageInstances, this.ctx);
    const mobDmgRes = this.ctx.combatState.hero.takeDamage(this.ctx.roundState.mobDamageInstances, this.ctx);

    if (this.ctx.combatState.mob.isDefeated() && !this.handleDeath(this.ctx.combatState.mob)) {
      this.dispatchHook('onCombatEnd');
      return { status: 'victory', heroDmgRes, mobDmgRes };
    }
    if (this.ctx.combatState.hero.isDefeated() && !this.handleDeath(this.ctx.combatState.hero)) {
      this.dispatchHook('onCombatEnd');
      return { status: 'defeat', heroDmgRes, mobDmgRes };
    }

    this.dispatchHook('onRoundEnd');
    return { status: 'ongoing', heroDmgRes, mobDmgRes };
  }

  public rollDice(targetDef: number, customRolls?: number[]): void {
    const hitCounts: Record<number, number> = {};
    const missCounts: Record<number, number> = {};

    for (let i = 0; i < this.ctx.roundState.diceCount; i++) {
      const val = customRolls?.[i] ?? Math.floor(Math.random() * 6) + 1;
      this.ctx.roundState.rolls.push(val);

      if (val >= targetDef) {
        this.ctx.roundState.hits++;
        hitCounts[val] = (hitCounts[val] || 0) + 1;
      } else {
        this.ctx.roundState.misses++;
        this.ctx.roundState.missRolls.push(val);
        missCounts[val] = (missCounts[val] || 0) + 1;
      }
    }

    this.ctx.roundState.matchingHits = Object.values(hitCounts).length > 0
      ? Math.max(...Object.values(hitCounts))
      : 0;
    this.ctx.roundState.matchingMisses = Object.values(missCounts).length > 0
      ? Math.max(...Object.values(missCounts))
      : 0;
  }

  public applyCritHitEffect(option: number): void {
    if (option === 1) {
      this.ctx.combatState.mob.setHealth(0);
      this.ctx.roundState.messages.push({
        type: 'special',
        text: '⭐ CRITICAL HIT [1]: Instant Win! The monster collapses immediately!',
      });
    } else if (option === 2 || option === 3) {
      this.ctx.combatState.guaranteedLootRoll = 6;
      this.ctx.roundState.messages.push({
        type: 'special',
        text: '⭐ CRITICAL HIT [2-3]: Lucky Spoils! Victory will guarantee a roll of 6 on loot!',
      });
    } else if (option === 4 || option === 5) {
      this.ctx.combatState.pendingDiamondReward = (this.ctx.combatState.pendingDiamondReward || 0) + 1;
      this.ctx.roundState.messages.push({
        type: 'special',
        text: '⭐ CRITICAL HIT [4-5]: Diamond Bounty! Victory will award +1 Diamond!',
      });
    } else if (option === 6) {
      this.ctx.combatState.pendingDiamondReward = (this.ctx.combatState.pendingDiamondReward || 0) + 2;
      this.ctx.roundState.messages.push({
        type: 'special',
        text: '⭐ CRITICAL HIT [6]: Massive Hoard! Victory will award +2 Diamonds!',
      });
    }
  }

  public applyCritMissEffect(roll: number): void {
    if (roll === 1) {
      if (!this.ctx.combatState.friendlyMobJoined) {
        this.ctx.combatState.friendlyMobJoined = true;
        this.ctx.combatState.heroDmgMultiplier = 2;
        this.ctx.roundState.messages.push({
          type: 'notice',
          text: '🐾 CRITICAL MISS [1]: A friendly mob rushes to your aid! Hero damage is doubled!',
        });
      } else {
        this.ctx.roundState.messages.push({
          type: 'notice',
          text: '🐾 CRITICAL MISS [1]: A friendly mob is already assisting you!',
        });
      }
    } else if (roll === 2) {
      this.ctx.combatState.mob.resetHealth();
      this.ctx.roundState.messages.push({
        type: 'special',
        text: `⚠️ CRITICAL MISS [2]: ${this.ctx.combatState.mob.name} rallied back to maximum health!`,
      });
    } else if (roll === 3) {
      const w = this.ctx.combatState.hero.equipped.weapon;
      if (w) {
        this.ctx.combatState.hero.removeEquipment(w);
        this.ctx.roundState.messages.push({
          type: 'special',
          text: `⚠️ CRITICAL MISS [3]: Your weapon (${w}) shattered!`,
        });
      }
    } else if (roll === 4) {
      const a = this.ctx.combatState.hero.equipped.armor;
      if (a) {
        this.ctx.combatState.hero.removeEquipment(a);
        this.ctx.roundState.messages.push({
          type: 'special',
          text: `⚠️ CRITICAL MISS [4]: Your armor (${a}) was destroyed!`,
        });
      }
    } else if (roll === 5) {
      const w = this.ctx.combatState.hero.equipped.weapon;
      const a = this.ctx.combatState.hero.equipped.armor;
      if (w) this.ctx.combatState.hero.removeEquipment(w);
      if (a) this.ctx.combatState.hero.removeEquipment(a);
      this.ctx.roundState.messages.push({
        type: 'special',
        text: '⚠️ CRITICAL MISS [5]: Catastrophic blunder! Both weapon and armor shattered!',
      });
    } else if (roll === 6) {
      this.ctx.combatState.hero.setHealth(0);
      this.ctx.roundState.messages.push({
        type: 'special',
        text: '🔥 CRITICAL MISS [6]: You slipped into molten lava and died!',
      });
    }
  }

  private applyStandardDamages(): void {
    let bonusHits = 0;
    if (this.ctx.roundState.matchingHits === 2) bonusHits = 2;
    else if (this.ctx.roundState.matchingHits === 3) bonusHits = 3;
    else if (this.ctx.roundState.matchingHits >= 4) bonusHits = 4;

    const totalHeroHits = this.ctx.roundState.hits + bonusHits;
    if (totalHeroHits > 0) {
      const baseDmg = Math.max(0, this.ctx.combatState.hero.damage - (this.ctx.combatState.heroDmgPenalty || 0));
      const mult = this.ctx.combatState.heroDmgMultiplier || 1;
      const dmg = baseDmg * mult;

      this.ctx.roundState.heroDamageInstances.push({
        amount: totalHeroHits * dmg,
        source: `Hero Attack (${totalHeroHits} hits${mult > 1 ? ' x2 Friendly Mob' : ''})`,
        appliesArmor: false,
      });
    }

    let bonusMisses = 0;
    if (this.ctx.roundState.matchingMisses === 2) bonusMisses = 2;
    else if (this.ctx.roundState.matchingMisses === 3) bonusMisses = 3;

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