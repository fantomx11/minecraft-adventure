import type { MobConfig } from '../models/Mob';
import type { CombatContext } from '../types/combat';
import { PoisonEffect, VexEffect } from '../models/Effects';

export const BESTIARY: MobConfig[] = [
  {
    name: 'Zombie',
    hearts: 10,
    damage: 3,
    defense: 4,
    rules: 'Bite: Rolling 2+ misses causes the zombie to bite you, dealing a 2nd hit (+1 Mob Hit).',
    loot: 'Roll d6: On a 6, gain 1 Iron.',
    hooks: {
      onRollEvaluated: (ctx: CombatContext) => {
        if (ctx.roundState.matchingMisses >= 2) {
          ctx.roundState.mobDamageInstances.push({
            amount: ctx.combatState.mob.damage,
            source: 'Zombie Bite (Extra Hit)',
            appliesArmor: true,
          });
          ctx.roundState.messages.push({
            type: 'special',
            text: '⚡ Zombie bite lands an extra attack!',
          });
        }
      },
    },
  },
  {
    name: 'Zombie Villager',
    hearts: 10,
    damage: 3,
    defense: 5,
    hooks: {
      onRollEvaluated: (ctx) => {
        if (ctx.roundState.matchingMisses >= 2 && !ctx.combatState.mob.state.villagerArmor) {
          ctx.combatState.mob.state.villagerArmor = true;
          ctx.roundState.messages.push({ type: 'special', text: '⚡ Zombie Villager equips armor!' });
        }
      },
      onReceiveDamage: (ctx) => {
        if (ctx.combatState.mob.state.villagerArmor) {
          ctx.roundState.heroDamageInstances.forEach(inst => {
            inst.amount = Math.max(0, inst.amount - 1);
          });
        }
      }
    }
  },
  {
    name: 'Skeleton',
    hearts: 8,
    damage: 2,
    defense: 4,
    rules: 'Retreat: Rolling 2+ misses causes the skeleton to reposition, permanently raising its Defense to 5.',
    loot: 'Roll d6: On a 6, gain a Bow (2 Attack, 1 Damage; 3 Damage on 1st attack).',
    hooks: {
      onRollEvaluated: (ctx: CombatContext) => {
        if (ctx.roundState.matchingMisses >= 2 && ctx.combatState.mob.defense < 5) {
          ctx.combatState.mob.defense = 5;
          ctx.roundState.messages.push({
            type: 'special',
            text: '⚡ Skeleton retreats! Defense is permanently raised to 5!',
          });
        }
      },
    },
  },
  {
    name: 'Spider',
    hearts: 8,
    damage: 2,
    defense: 4,
    rules: 'Webs: Rolling 2+ misses traps you in webs, causing spider attacks to completely ignore your Armor.',
    loot: 'Roll d6: On a 5 or 6, gain 1 String.',
    hooks: {
      onRollEvaluated: (ctx: CombatContext) => {
        if (ctx.roundState.matchingMisses >= 2 && !ctx.combatState.ignoreArmor) {
          ctx.combatState.ignoreArmor = true;
          ctx.roundState.messages.push({
            type: 'special',
            text: '⚡ Caught in webs! Attacks ignore Armor for the rest of battle!',
          });
        }
      },
    },
  },
  {
    name: 'Cave Spider',
    hearts: 8,
    damage: 2,
    defense: 4,
    rules: 'Poison Bite: Rolling 2+ misses poisons you, dealing 1 unblockable damage every turn until battle ends.',
    loot: 'Roll d6: On a 5 or 6, gain 1 String.',
    hooks: {
      onRollEvaluated: (ctx: CombatContext) => {
        if (ctx.roundState.matchingMisses >= 2 && !ctx.combatState.hero.hasItem('PoisonImmune')) {
          ctx.combatState.effects.push(new PoisonEffect(1));
          ctx.roundState.messages.push({
            type: 'special',
            text: '⚡ Poison bite! You are poisoned for 1 damage every turn!',
          });
        }
      },
    },
  },
  {
    name: 'Slime',
    hearts: 16,
    damage: 2,
    defense: 4,
    rules: 'Divide: Rolling 2+ misses causes the slime to split, doubling its current damage value.',
    loot: 'Roll d6: On 3 or higher, gain 1 Slimeball.',
    hooks: {
      onRollEvaluated: (ctx: CombatContext) => {
        if (ctx.roundState.matchingMisses >= 2) {
          ctx.combatState.mob.damage *= 2;
          ctx.roundState.messages.push({
            type: 'special',
            text: `⚡ The slime splits! Damage doubled to ${ctx.combatState.mob.damage}!`,
          });
        }
      },
    },
  },
  {
    name: 'Creeper',
    hearts: 10,
    damage: 0,
    defense: 3,
    rules: 'Fuse: Explodes for 20 DMG on Turn 8.\nHiss: Rolling 2+ misses hisses. Triggering a 2nd hiss causes an instant 20-damage explosion!',
    loot: 'If defeated without exploding, roll d6: On 6, gain 2 Gunpowder.',
    hooks: {
      onCombatStart: (ctx: CombatContext) => {
        ctx.combatState.mob.state.fuse = 0;
        ctx.combatState.mob.state.hissCount = 0;
      },
      onRoundStart: (ctx: CombatContext) => {
        ctx.combatState.mob.state.fuse++;
        if (ctx.combatState.mob.state.fuse >= 8) {
          ctx.combatState.hero.changeHealth(-20);
          ctx.roundState.messages.push({
            type: 'special',
            text: '💥 KABOOM! Fuse reached 8! Creeper detonated for 20 Damage!',
          });
        }
      },
      onRollEvaluated: (ctx: CombatContext) => {
        if (ctx.roundState.matchingMisses >= 2) {
          ctx.combatState.mob.state.hissCount = (ctx.combatState.mob.state.hissCount || 0) + 1;
          if (ctx.combatState.mob.state.hissCount >= 2) {
            ctx.combatState.hero.changeHealth(-20);
            ctx.roundState.messages.push({
              type: 'special',
              text: '💥 KABOOM! Creeper hissed twice and detonated instantly for 20 Damage!',
            });
          } else {
            ctx.roundState.messages.push({
              type: 'special',
              text: '⚡ Creeper hisses loudly! A 2nd hiss causes an instant explosion!',
            });
          }
        }
      },
    },
  },
  {
    name: 'Pillager',
    hearts: 6,
    damage: 2,
    defense: 3,
    rules: 'Zero In: Rolling 2+ misses causes the pillager to dial in its crossbow, dealing 4 damage next turn.',
    loot: 'Roll d6: On a 6, gain a Crossbow (2 Attack, 2 Damage).',
    hooks: {
      onRollEvaluated: (ctx: CombatContext) => {
        if (ctx.roundState.matchingMisses >= 2) {
          ctx.combatState.mob.state.nextTurnDmg = 4;
          ctx.roundState.messages.push({
            type: 'special',
            text: "⚡ Pillager zeroes in! Next turn's damage will be 4!",
          });
        }
      },
      onDealDamage: (ctx) => {
        if (ctx.combatState.mob.state.nextTurnDmg) {
          for (const inst of ctx.roundState.mobDamageInstances) {
            inst.amount = ctx.combatState.mob.state.nextTurnDmg;
            inst.source = 'Pillager Zeroed-In Crossbow';
          }
        }
      },
      onRoundEnd: (ctx: CombatContext) => {
        if (ctx.combatState.mob.state.nextTurnDmg) {
          delete ctx.combatState.mob.state.nextTurnDmg;
        }
      },
    },
  },
  {
    name: 'Vindicator',
    hearts: 14,
    damage: 6,
    defense: 4,
    rules: 'Cleave: Rolling 2+ misses shatters your armor, completely destroying it (Armor set to 0).',
    loot: 'Roll d6: On 5 or 6, gain an Enchanted Iron Axe (4 Attack, 6 Damage).',
    hooks: {
      onRollEvaluated: (ctx: CombatContext) => {
        if (ctx.roundState.matchingMisses >= 2 && ctx.combatState.hero.armor > 0) {
          ctx.combatState.hero.armor = 0;
          ctx.combatState.hero.equipped.armor = null;
          ctx.roundState.messages.push({
            type: 'special',
            text: '⚡ Vindicator cleaves through your armor, completely destroying it (Armor = 0)!',
          });
        }
      },
    },
  },
  {
    name: 'Drowned',
    hearts: 30,
    damage: 6,
    defense: 4,
    rules: 'Underwater Drag: Rolling 2+ misses slows your swings, subtracting 1 from your attack Damage for this fight.',
    loot: 'Roll d6: On a 6, gain a Trident (2 Attack, 3 Damage; 4 Damage on 1 die).',
    hooks: {
      onRollEvaluated: (ctx: CombatContext) => {
        if (ctx.roundState.matchingMisses >= 2) {
          ctx.combatState.heroDmgPenalty = (ctx.combatState.heroDmgPenalty || 0) + 1;
          ctx.roundState.messages.push({
            type: 'special',
            text: `⚡ Underwater drag slows your blows (-1 Damage, Total penalty: -${ctx.combatState.heroDmgPenalty})!`,
          });
        }
      },
    },
  },
  {
    name: 'Witch',
    hearts: 13,
    damage: 3,
    defense: 5,
    rules: 'Splash Potions: Rolling 2+ misses rolls on Witch Potion Table (1=Fumble, 2-3=6 DMG, 4=-1 Hero DMG, 5=Poison 1/turn, 6=Heals 4 HP).',
    loot: 'Roll d6: On 5 or 6, gain 1 Healing Potion.',
    hooks: {
      onRollEvaluated: (ctx: CombatContext) => {
        if (ctx.roundState.matchingMisses >= 2) {
          const roll = Math.floor(Math.random() * 6) + 1;
          let msg = `⚡ Witch throws a splash potion (d6 = ${roll}): `;
          if (roll === 1) {
            msg += 'Fumble! No effect.';
          } else if (roll <= 3) {
            ctx.combatState.hero.changeHealth(-6);
            msg += 'Potion of Harming deals 6 Damage!';
          } else if (roll === 4) {
            ctx.combatState.heroDmgPenalty = (ctx.combatState.heroDmgPenalty || 0) + 1;
            msg += 'Potion of Weakness reduces hero damage by 1!';
          } else if (roll === 5) {
            ctx.combatState.effects.push(new PoisonEffect(1));
            msg += 'Potion of Poison! 1 damage every turn!';
          } else {
            ctx.combatState.mob.hearts = Math.min(ctx.combatState.mob.maxHearts, ctx.combatState.mob.hearts + 4);
            msg += 'Potion of Healing! Witch regains 4 Hearts!';
          }
          ctx.roundState.messages.push({ type: 'special', text: msg });
        }
      },
    },
  },
  {
    name: 'Evoker',
    hearts: 24,
    damage: 0,
    defense: 4,
    rules: 'Spellcasting: Hits taken depend on miss dice:\n• Odd Miss Die: Evoker Fang (1d6 DMG).\n• Even Miss Die: Vex (1d6 DMG + adds +1 DMG to all future hits).\n• Doubles on Hits banishes 1 Vex.\n• Miss Doubles: Lightning helmet strike deals 1d6 bonus DMG!',
    loot: 'Roll d6: On 5 or 6, gain an Undamaged Totem of Undying (prevents fatal defeat and fully heals 20 HP).',
    hooks: {
      onRollEvaluated: (ctx) => {
        if (ctx.roundState.matchingMisses >= 2) {
          const lightningDmg = Math.floor(Math.random() * 6) + 1;
          ctx.combatState.hero.changeHealth(-lightningDmg);
          ctx.roundState.messages.push({
            type: 'special',
            text: `⚡ Lightning helmet strike! Took ${lightningDmg} unblockable lightning damage!`,
          });
        }
      },
      onDealDamage: (ctx) => {
        // Clear the default 0-damage attack instances
        ctx.roundState.mobDamageInstances = [];

        const misses = ctx.roundState.missRolls;
        const bonusMisses = ctx.roundState.matchingMisses >= 2 ? 1 : 0;
        const totalSpells = misses.length + bonusMisses;

        for (let i = 0; i < totalSpells; i++) {
          const val = i < misses.length ? misses[i] : Math.floor(Math.random() * 6) + 1;
          const isOdd = val % 2 !== 0;
          const spellDmg = Math.floor(Math.random() * 6) + 1;

          if (isOdd) {
            ctx.roundState.mobDamageInstances.push({
              amount: spellDmg,
              source: `Evoker Fang [Die ${val}]`,
              appliesArmor: true,
            });
          } else {
            ctx.combatState.effects.push(new VexEffect());
            ctx.roundState.mobDamageInstances.push({
              amount: spellDmg,
              source: `Summoned Vex Strike [Die ${val}]`,
              appliesArmor: true,
            });
            ctx.roundState.messages.push({
              type: 'special',
              text: `👻 Evoker summoned a Vex! (+1 ongoing DMG to all future hits)`,
            });
          }
        }
      },
    },
  },
  {
    name: 'Guardian',
    hearts: 15,
    damage: 4,
    defense: 4,
    hooks: {
      onCombatStart: (ctx) => {
        ctx.combatState.mob.state.isClosingDistance = true;
        ctx.combatState.mob.state.oxygen = 6;
      },
      onRollEvaluated: (ctx) => {
        if (ctx.roundState.hits > 0 && ctx.combatState.mob.state.isClosingDistance) {
          ctx.combatState.mob.state.isClosingDistance = false;
          ctx.roundState.messages.push({ type: 'notice', text: '🎯 You swam close! Closing Distance overcome!' });
        }
      },
      onReceiveDamage: (ctx) => {
        if (ctx.combatState.mob.state.isClosingDistance) {
          // Nullify all incoming hero damage instances
          ctx.roundState.heroDamageInstances = [];
          ctx.roundState.messages.push({ type: 'notice', text: '🌊 Closing Distance: Hero attacks deal 0 DMG!' });
        }
      }
    }
  },
];