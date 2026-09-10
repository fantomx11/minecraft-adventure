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
    onLootRoll: (roll) =>
      roll === 6
        ? { won: true, reward: '1 Iron', apply: (hero) => hero.adjustMaterial('Iron', 1) }
        : { won: false, reward: 'No loot' },
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
    onLootRoll: (roll) =>
      roll === 6
        ? { won: true, reward: 'Bow', apply: (hero) => hero.addEquipment('Bow') }
        : { won: false, reward: 'No loot' },
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
    onLootRoll: (roll) =>
      roll >= 5
        ? { won: true, reward: '1 String', apply: (hero) => hero.adjustMaterial('String', 1) }
        : { won: false, reward: 'No loot' },
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
    onLootRoll: (roll) =>
      roll >= 5
        ? { won: true, reward: '1 String', apply: (hero) => hero.adjustMaterial('String', 1) }
        : { won: false, reward: 'No loot' },
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
    onLootRoll: (roll) =>
      roll >= 3
        ? { won: true, reward: '1 Slimeball', apply: (hero) => hero.adjustMaterial('Slimeball', 1) }
        : { won: false, reward: 'No loot' },
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
    onLootRoll: (roll) =>
      roll === 6
        ? { won: true, reward: '2 Gunpowder', apply: (hero) => hero.adjustMaterial('Gunpowder', 2) }
        : { won: false, reward: 'No loot' },
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
    onLootRoll: (roll) =>
      roll === 6
        ? { won: true, reward: 'Crossbow', apply: (hero) => hero.addEquipment('Crossbow') }
        : { won: false, reward: 'No loot' },
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
    onLootRoll: (roll) =>
      roll >= 5
        ? { won: true, reward: 'Enchanted Iron Axe', apply: (hero) => hero.addEquipment('Enchanted Iron Axe') }
        : { won: false, reward: 'No loot' },
    hooks: {
      onRollEvaluated: (ctx: CombatContext) => {
        if (ctx.roundState.matchingMisses >= 2 && ctx.combatState.hero.armor > 0) {
          const brokenItem = ctx.combatState.hero.equipped.armor;
          ctx.combatState.hero.removeEquipment(brokenItem || "");
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
    onLootRoll: (roll) =>
      roll === 6
        ? { won: true, reward: 'Trident', apply: (hero) => hero.addEquipment('Trident') }
        : { won: false, reward: 'No loot' },
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
    onLootRoll: (roll) =>
      roll >= 5
        ? { won: true, reward: 'Healing Potion (+4 HP)', apply: (hero) => hero.changeHealth(4) }
        : { won: false, reward: 'No loot' },
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
    onLootRoll: (roll) =>
      roll >= 5
        ? { won: true, reward: 'Totem of Undying', apply: (hero) => hero.addEquipment('Totem of Undying') }
        : { won: false, reward: 'No loot' },
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
    rules: 'Closing Distance: At the start of battle, you must close the distance. Your hits deal 0 DMG until you roll at least 1 hit.',
    loot: 'Roll d6: On 5 or 6, gain 1 Fish.',
    onLootRoll: (roll) =>
      roll >= 5
        ? { won: true, reward: '1 Fish', apply: (hero) => hero.adjustMaterial('Fish', 1) }
        : { won: false, reward: 'No loot' },
    hooks: {
      onCombatStart: (ctx) => {
        ctx.combatState.mob.state.isClosingDistance = true;
        ctx.combatState.mob.state.closingThisRound = true;
        ctx.roundState.messages.push({
          type: 'notice',
          text: '  Guardian is far away! Roll at least 1 hit to close the distance!',
        });
      },
      onRoundStart: (ctx) => {
        ctx.combatState.mob.state.closingThisRound = !!ctx.combatState.mob.state.isClosingDistance;
      },
      onRollEvaluated: (ctx) => {
        if (ctx.roundState.hits > 0 && ctx.combatState.mob.state.isClosingDistance) {
          ctx.combatState.mob.state.isClosingDistance = false;
          ctx.roundState.messages.push({ type: 'notice', text: '  You swam close! Distance overcome for next turn.' });
        }
      },
      onReceiveDamage: (ctx) => {
        if (ctx.combatState.mob.state.closingThisRound) {
          ctx.roundState.heroDamageInstances = [];
          ctx.roundState.messages.push({ type: 'notice', text: '  Closing Distance: Hero attacks deal 0 DMG this turn!' });
        }
      }
    }
  },
  {
    name: 'Elder Guardian',
    hearts: 30,
    damage: 6,
    defense: 3,
    rules: 'Closing Distance: At the start of battle (and when it swims away), you must close the distance. Your hits deal 0 DMG and Elder Guardian attacks ignore Armor until you roll at least 1 hit.\nSwim Away: Rolling 2+ misses causes the Elder Guardian to swim away, forcing you to close distance again next round.',
    loot: 'Roll d6: On 5 or 6, gain 3 Fish.',
    onLootRoll: (roll) =>
      roll >= 5
        ? {
          won: true,
          reward: '3 Fish',
          apply: (hero) => hero.adjustMaterial('Fish', 3),
        }
        : { won: false, reward: 'No loot' },
    hooks: {
      onCombatStart: (ctx) => {
        ctx.combatState.mob.state.isClosingDistance = true;
        ctx.combatState.mob.state.swamAway = false;
        ctx.combatState.mob.state.closingThisRound = true;
        ctx.roundState.messages.push({
          type: 'notice',
          text: '  Elder Guardian is far away! Roll at least 1 hit to close the distance!',
        });
      },

      onRoundStart: (ctx) => {
        // Check if it swam away last round
        if (ctx.combatState.mob.state.swamAway) {
          ctx.combatState.mob.state.isClosingDistance = true;
          ctx.combatState.mob.state.swamAway = false;
          ctx.roundState.messages.push({
            type: 'special',
            text: '  Elder Guardian swam into the deep! You must close the distance again!',
          });
        }
        // Lock round status so subsequent hook phases share the same state
        ctx.combatState.mob.state.closingThisRound = !!ctx.combatState.mob.state.isClosingDistance;
      },

      onRollEvaluated: (ctx) => {
        // 1. Double misses trigger Swim Away for the next turn
        if (ctx.roundState.matchingMisses >= 2) {
          ctx.combatState.mob.state.swamAway = true;
          ctx.roundState.messages.push({
            type: 'special',
            text: '  Double misses! Elder Guardian swims away (distance resets next turn)!',
          });
        }

        // 2. Resolve current closing distance attempt
        if (ctx.combatState.mob.state.closingThisRound) {
          if (ctx.roundState.hits > 0) {
            ctx.combatState.mob.state.isClosingDistance = false;
            ctx.roundState.messages.push({
              type: 'notice',
              text: '  You swam close! Distance overcome for subsequent attacks.',
            });
          } else {
            ctx.roundState.messages.push({
              type: 'notice',
              text: '  Failed to close distance! Elder Guardian remains out of reach.',
            });
          }
        }
      },

      onDealDamage: (ctx) => {
        // While closing distance, Elder Guardian hits ignore hero armor
        if (ctx.combatState.mob.state.closingThisRound) {
          for (const inst of ctx.roundState.mobDamageInstances) {
            inst.appliesArmor = false;
            inst.source = 'Elder Guardian Unblockable Beam';
          }
        }
      },

      onReceiveDamage: (ctx) => {
        // While closing distance, all hero hits deal 0 damage
        if (ctx.combatState.mob.state.closingThisRound) {
          ctx.roundState.heroDamageInstances = [];
          ctx.roundState.messages.push({
            type: 'notice',
            text: '  Closing Distance: Hero attacks deal 0 DMG this turn!',
          });
        }
      },
    },
  },
];