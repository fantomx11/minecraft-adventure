import type { MobConfig } from '../models/Mob';

export const BESTIARY: MobConfig[] = [
  {
    id: 'zombie',
    name: 'Zombie',
    maxHearts: 10,
    damage: 3,
    defense: 4,
    rulesText: 'Bite: Rolling 2+ misses causes the zombie to bite you, dealing a 2nd hit (+1 Mob Hit).',
    lootText: 'Roll d6: On a 6, gain 1 Iron.',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '==',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 6 },
        },
        then: [
          { type: 'inventory', action: 'add', itemId: 'Iron', isMaterial: true },
          { type: 'loot_action', reward: { type: 'literal', value: '1 Iron' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: '>=',
            left: { type: 'get', path: 'round.matchingMisses' },
            right: { type: 'literal', value: 2 },
          },
          then: [
            {
              type: 'deal_damage',
              target: 'hero',
              amount: { type: 'get', path: 'mob.damage' },
              source: 'Zombie Bite (Extra Hit)',
              appliesArmor: true,
            },
            {
              type: 'message',
              messageType: 'special',
              text: { type: 'literal', value: '⚡ Zombie bite lands an extra attack!' },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'zombie_villager',
    name: 'Zombie Villager',
    maxHearts: 10,
    damage: 3,
    defense: 5,
    rulesText: 'Armored: Rolling 2+ misses causes the Zombie Villager to equip armor, reducing incoming damage by 1.',
    lootText: 'None.',
    loot: [
      { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
    ],
    behavior: {
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: 'and',
            left: {
              type: 'binary',
              op: '>=',
              left: { type: 'get', path: 'round.matchingMisses' },
              right: { type: 'literal', value: 2 },
            },
            right: {
              type: 'unary',
              op: 'not',
              operand: { type: 'get', path: 'mob.state.villagerArmor' },
            },
          },
          then: [
            { type: 'set', target: 'mob.state.villagerArmor', value: { type: 'literal', value: true } },
            {
              type: 'message',
              messageType: 'special',
              text: { type: 'literal', value: '⚡ Zombie Villager equips armor!' },
            },
          ],
        },
      ],
      onReceiveDamage: [
        {
          type: 'if',
          condition: { type: 'get', path: 'mob.state.villagerArmor' },
          then: [
            {
              type: 'modify_damage_instances',
              target: 'hero_damage',
              delta: { type: 'literal', value: -1 },
              min: 0,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    maxHearts: 8,
    damage: 2,
    defense: 4,
    rulesText: 'Retreat: Rolling 2+ misses causes the skeleton to reposition, permanently raising its Defense to 5.',
    lootText: 'Roll d6: On a 6, gain a Bow (2 Attack, 1 Damage; 3 Damage on 1st attack).',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '==',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 6 },
        },
        then: [
          { type: 'inventory', action: 'add', itemId: 'Bow' },
          { type: 'loot_action', reward: { type: 'literal', value: 'Bow' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: 'and',
            left: {
              type: 'binary',
              op: '>=',
              left: { type: 'get', path: 'round.matchingMisses' },
              right: { type: 'literal', value: 2 },
            },
            right: {
              type: 'binary',
              op: '<',
              left: { type: 'get', path: 'mob.defense' },
              right: { type: 'literal', value: 5 },
            },
          },
          then: [
            { type: 'set', target: 'mob.defense', value: { type: 'literal', value: 5 } },
            {
              type: 'message',
              messageType: 'special',
              text: { type: 'literal', value: '⚡ Skeleton retreats! Defense is permanently raised to 5!' },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'spider',
    name: 'Spider',
    maxHearts: 8,
    damage: 2,
    defense: 4,
    rulesText: 'Webs: Rolling 2+ misses traps you in webs, causing spider attacks to completely ignore your Armor.',
    lootText: 'Roll d6: On a 5 or 6, gain 1 String.',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '>=',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 5 },
        },
        then: [
          { type: 'inventory', action: 'add', itemId: 'String', isMaterial: true },
          { type: 'loot_action', reward: { type: 'literal', value: '1 String' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: 'and',
            left: {
              type: 'binary',
              op: '>=',
              left: { type: 'get', path: 'round.matchingMisses' },
              right: { type: 'literal', value: 2 },
            },
            right: {
              type: 'unary',
              op: 'not',
              operand: { type: 'get', path: 'combat.ignoreArmor' },
            },
          },
          then: [
            { type: 'set', target: 'combat.ignoreArmor', value: { type: 'literal', value: true } },
            {
              type: 'message',
              messageType: 'special',
              text: { type: 'literal', value: '⚡ Caught in webs! Attacks ignore Armor for the rest of battle!' },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'cave_spider',
    name: 'Cave Spider',
    maxHearts: 8,
    damage: 2,
    defense: 4,
    rulesText: 'Poison Bite: Rolling 2+ misses poisons you, dealing 1 unblockable damage every turn until battle ends.',
    lootText: 'Roll d6: On a 5 or 6, gain 1 String.',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '>=',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 5 },
        },
        then: [
          { type: 'inventory', action: 'add', itemId: 'String', isMaterial: true },
          { type: 'loot_action', reward: { type: 'literal', value: '1 String' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: 'and',
            left: {
              type: 'binary',
              op: '>=',
              left: { type: 'get', path: 'round.matchingMisses' },
              right: { type: 'literal', value: 2 },
            },
            right: {
              type: 'unary',
              op: 'not',
              operand: { type: 'has_item', itemId: 'PoisonImmune' },
            },
          },
          then: [
            { type: 'add_effect', effect: 'poison', amount: { type: 'literal', value: 1 } },
            {
              type: 'message',
              messageType: 'special',
              text: { type: 'literal', value: '⚡ Poison bite! You are poisoned for 1 damage every turn!' },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'slime',
    name: 'Slime',
    maxHearts: 16,
    damage: 2,
    defense: 4,
    rulesText: 'Divide: Rolling 2+ misses causes the slime to split, doubling its current damage value.',
    lootText: 'Roll d6: On 3 or higher, gain 1 Slimeball.',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '>=',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 3 },
        },
        then: [
          { type: 'inventory', action: 'add', itemId: 'Slimeball', isMaterial: true },
          { type: 'loot_action', reward: { type: 'literal', value: '1 Slimeball' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: '>=',
            left: { type: 'get', path: 'round.matchingMisses' },
            right: { type: 'literal', value: 2 },
          },
          then: [
            { type: 'modify', target: 'mob.damage', op: 'multiply', value: { type: 'literal', value: 2 } },
            {
              type: 'message',
              messageType: 'special',
              text: {
                type: 'template',
                template: '⚡ The slime splits! Damage doubled to ${mob.damage}!',
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'creeper',
    name: 'Creeper',
    maxHearts: 10,
    damage: 0,
    defense: 3,
    rulesText: 'Fuse: Explodes for 20 DMG on Turn 8.\nHiss: Rolling 2+ misses hisses. Triggering a 2nd hiss causes an instant 20-damage explosion!',
    lootText: 'If defeated without exploding, roll d6: On 6, gain 2 Gunpowder.',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '==',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 6 },
        },
        then: [
          { type: 'inventory', action: 'add', itemId: 'Gunpowder', count: { type: 'literal', value: 2 }, isMaterial: true },
          { type: 'loot_action', reward: { type: 'literal', value: '2 Gunpowder' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onCombatStart: [
        { type: 'set', target: 'mob.state.fuse', value: { type: 'literal', value: 0 } },
        { type: 'set', target: 'mob.state.hissCount', value: { type: 'literal', value: 0 } },
      ],
      onRoundStart: [
        { type: 'modify', target: 'mob.state.fuse', op: 'add', value: { type: 'literal', value: 1 } },
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: '>=',
            left: { type: 'get', path: 'mob.state.fuse' },
            right: { type: 'literal', value: 8 },
          },
          then: [
            { type: 'change_health', target: 'hero', amount: { type: 'literal', value: -20 } },
            {
              type: 'message',
              messageType: 'special',
              text: { type: 'literal', value: '💥 KABOOM! Fuse reached 8! Creeper detonated for 20 Damage!' },
            },
          ],
        },
      ],
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: '>=',
            left: { type: 'get', path: 'round.matchingMisses' },
            right: { type: 'literal', value: 2 },
          },
          then: [
            { type: 'modify', target: 'mob.state.hissCount', op: 'add', value: { type: 'literal', value: 1 } },
            {
              type: 'if',
              condition: {
                type: 'binary',
                op: '>=',
                left: { type: 'get', path: 'mob.state.hissCount' },
                right: { type: 'literal', value: 2 },
              },
              then: [
                { type: 'change_health', target: 'hero', amount: { type: 'literal', value: -20 } },
                {
                  type: 'message',
                  messageType: 'special',
                  text: { type: 'literal', value: '💥 KABOOM! Creeper hissed twice and detonated instantly for 20 Damage!' },
                },
              ],
              else: [
                {
                  type: 'message',
                  messageType: 'special',
                  text: { type: 'literal', value: '⚡ Creeper hisses loudly! A 2nd hiss causes an instant explosion!' },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'pillager',
    name: 'Pillager',
    maxHearts: 6,
    damage: 2,
    defense: 3,
    rulesText: 'Zero In: Rolling 2+ misses causes the pillager to dial in its crossbow, dealing 4 damage next turn.',
    lootText: 'Roll d6: On a 6, gain a Crossbow (2 Attack, 2 Damage).',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '==',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 6 },
        },
        then: [
          { type: 'inventory', action: 'add', itemId: 'Crossbow' },
          { type: 'loot_action', reward: { type: 'literal', value: 'Crossbow' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: '>=',
            left: { type: 'get', path: 'round.matchingMisses' },
            right: { type: 'literal', value: 2 },
          },
          then: [
            { type: 'set', target: 'mob.state.nextTurnDmg', value: { type: 'literal', value: 4 } },
            {
              type: 'message',
              messageType: 'special',
              text: { type: 'literal', value: "⚡ Pillager zeroes in! Next turn's damage will be 4!" },
            },
          ],
        },
      ],
      onDealDamage: [
        {
          type: 'if',
          condition: { type: 'get', path: 'mob.state.nextTurnDmg' },
          then: [
            {
              type: 'modify_damage_instances',
              target: 'mob_damage',
              amount: { type: 'get', path: 'mob.state.nextTurnDmg' },
              source: 'Pillager Zeroed-In Crossbow',
            },
          ],
        },
      ],
      onRoundEnd: [
        {
          type: 'if',
          condition: { type: 'get', path: 'mob.state.nextTurnDmg' },
          then: [
            { type: 'set', target: 'mob.state.nextTurnDmg', value: { type: 'literal', value: 0 } },
          ],
        },
      ],
    },
  },
  {
    id: 'vindicator',
    name: 'Vindicator',
    maxHearts: 14,
    damage: 6,
    defense: 4,
    rulesText: 'Cleave: Rolling 2+ misses shatters your armor, completely destroying it (Armor set to 0).',
    lootText: 'Roll d6: On 5 or 6, gain an Enchanted Iron Axe (4 Attack, 6 Damage).',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '>=',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 5 },
        },
        then: [
          { type: 'inventory', action: 'add', itemId: 'Enchanted Iron Axe' },
          { type: 'loot_action', reward: { type: 'literal', value: 'Enchanted Iron Axe' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: 'and',
            left: {
              type: 'binary',
              op: '>=',
              left: { type: 'get', path: 'round.matchingMisses' },
              right: { type: 'literal', value: 2 },
            },
            right: {
              type: 'binary',
              op: '>',
              left: { type: 'get', path: 'hero.armor' },
              right: { type: 'literal', value: 0 },
            },
          },
          then: [
            { type: 'inventory', action: 'remove', slot: 'armor' },
            {
              type: 'message',
              messageType: 'special',
              text: {
                type: 'literal',
                value: '⚡ Vindicator cleaves through your armor, completely destroying it (Armor = 0)!',
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'drowned',
    name: 'Drowned',
    maxHearts: 30,
    damage: 6,
    defense: 4,
    rulesText: 'Underwater Drag: Rolling 2+ misses slows your swings, subtracting 1 from your attack Damage for this fight.',
    lootText: 'Roll d6: On a 6, gain a Trident (2 Attack, 3 Damage; 4 Damage on 1 die).',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '==',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 6 },
        },
        then: [
          { type: 'inventory', action: 'add', itemId: 'Trident' },
          { type: 'loot_action', reward: { type: 'literal', value: 'Trident' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: '>=',
            left: { type: 'get', path: 'round.matchingMisses' },
            right: { type: 'literal', value: 2 },
          },
          then: [
            { type: 'modify', target: 'combat.heroDmgPenalty', op: 'add', value: { type: 'literal', value: 1 } },
            {
              type: 'message',
              messageType: 'special',
              text: {
                type: 'template',
                template: '⚡ Underwater drag slows your blows (-1 Damage, Total penalty: -${combat.heroDmgPenalty})!',
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'witch',
    name: 'Witch',
    maxHearts: 13,
    damage: 3,
    defense: 5,
    rulesText: 'Splash Potions: Rolling 2+ misses rolls on Witch Potion Table (1=Fumble, 2-3=6 DMG, 4=-1 Hero DMG, 5=Poison 1/turn, 6=Heals 4 HP).',
    lootText: 'Roll d6: On 5 or 6, gain 1 Healing Potion.',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '>=',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 5 },
        },
        then: [
          { type: 'change_health', target: 'hero', amount: { type: 'literal', value: 4 } },
          { type: 'loot_action', reward: { type: 'literal', value: 'Healing Potion (+4 HP)' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: '>=',
            left: { type: 'get', path: 'round.matchingMisses' },
            right: { type: 'literal', value: 2 },
          },
          then: [
            {
              type: 'set',
              target: 'mob.state.potionRoll',
              value: { type: 'dice', count: 1, sides: 6 },
            },
            {
              type: 'if',
              condition: {
                type: 'binary',
                op: '==',
                left: { type: 'get', path: 'mob.state.potionRoll' },
                right: { type: 'literal', value: 1 },
              },
              then: [
                {
                  type: 'message',
                  messageType: 'special',
                  text: { type: 'literal', value: '⚡ Witch throws a splash potion (d6 = 1): Fumble! No effect.' },
                },
              ],
              else: [
                {
                  type: 'if',
                  condition: {
                    type: 'binary',
                    op: '<=',
                    left: { type: 'get', path: 'mob.state.potionRoll' },
                    right: { type: 'literal', value: 3 },
                  },
                  then: [
                    { type: 'change_health', target: 'hero', amount: { type: 'literal', value: -6 } },
                    {
                      type: 'message',
                      messageType: 'special',
                      text: {
                        type: 'template',
                        template: '⚡ Witch throws a splash potion (d6 = ${mob.state.potionRoll}): Potion of Harming deals 6 Damage!',
                      },
                    },
                  ],
                  else: [
                    {
                      type: 'if',
                      condition: {
                        type: 'binary',
                        op: '==',
                        left: { type: 'get', path: 'mob.state.potionRoll' },
                        right: { type: 'literal', value: 4 },
                      },
                      then: [
                        { type: 'modify', target: 'combat.heroDmgPenalty', op: 'add', value: { type: 'literal', value: 1 } },
                        {
                          type: 'message',
                          messageType: 'special',
                          text: {
                            type: 'literal',
                            value: '⚡ Witch throws a splash potion (d6 = 4): Potion of Weakness reduces hero damage by 1!',
                          },
                        },
                      ],
                      else: [
                        {
                          type: 'if',
                          condition: {
                            type: 'binary',
                            op: '==',
                            left: { type: 'get', path: 'mob.state.potionRoll' },
                            right: { type: 'literal', value: 5 },
                          },
                          then: [
                            { type: 'add_effect', effect: 'poison', amount: { type: 'literal', value: 1 } },
                            {
                              type: 'message',
                              messageType: 'special',
                              text: {
                                type: 'literal',
                                value: '⚡ Witch throws a splash potion (d6 = 5): Potion of Poison! 1 damage every turn!',
                              },
                            },
                          ],
                          else: [
                            { type: 'change_health', target: 'mob', amount: { type: 'literal', value: 4 } },
                            {
                              type: 'message',
                              messageType: 'special',
                              text: {
                                type: 'literal',
                                value: '⚡ Witch throws a splash potion (d6 = 6): Potion of Healing! Witch regains 4 Hearts!',
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'evoker',
    name: 'Evoker',
    maxHearts: 24,
    damage: 0,
    defense: 4,
    rulesText: 'Spellcasting: Hits taken depend on miss dice:\n• Odd Miss Die: Evoker Fang (1d6 DMG).\n• Even Miss Die: Vex (1d6 DMG + adds +1 DMG to all future hits).\n• Doubles on Hits banishes 1 Vex.\n• Miss Doubles: Lightning helmet strike deals 1d6 bonus DMG!',
    lootText: 'Roll d6: On 5 or 6, gain an Undamaged Totem of Undying (prevents fatal defeat and fully heals 20 HP).',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '>=',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 5 },
        },
        then: [
          { type: 'inventory', action: 'add', itemId: 'Totem of Undying' },
          { type: 'loot_action', reward: { type: 'literal', value: 'Totem of Undying' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: '>=',
            left: { type: 'get', path: 'round.matchingMisses' },
            right: { type: 'literal', value: 2 },
          },
          then: [
            {
              type: 'set',
              target: 'mob.state.lightningDmg',
              value: { type: 'dice', count: 1, sides: 6 },
            },
            {
              type: 'change_health',
              target: 'hero',
              amount: {
                type: 'unary',
                op: '-',
                operand: { type: 'get', path: 'mob.state.lightningDmg' },
              },
            },
            {
              type: 'message',
              messageType: 'special',
              text: {
                type: 'template',
                template: '⚡ Lightning helmet strike! Took ${mob.state.lightningDmg} unblockable lightning damage!',
              },
            },
          ],
        },
      ],
      onDealDamage: [
        { type: 'clear_mob_damage' },
        {
          type: 'for_each',
          list: { type: 'get', path: 'round.missRolls' },
          as: 'die',
          actions: [
            {
              type: 'if',
              condition: {
                type: 'binary',
                op: '==',
                left: {
                  type: 'binary',
                  op: '%',
                  left: { type: 'get', path: 'die' },
                  right: { type: 'literal', value: 2 },
                },
                right: { type: 'literal', value: 1 },
              },
              then: [
                {
                  type: 'deal_damage',
                  target: 'hero',
                  amount: { type: 'dice', count: 1, sides: 6 },
                  source: 'Evoker Fang',
                  appliesArmor: true,
                },
              ],
              else: [
                { type: 'add_effect', effect: 'vex' },
                {
                  type: 'deal_damage',
                  target: 'hero',
                  amount: { type: 'dice', count: 1, sides: 6 },
                  source: 'Summoned Vex Strike',
                  appliesArmor: true,
                },
                {
                  type: 'message',
                  messageType: 'special',
                  text: { type: 'literal', value: '👻 Evoker summoned a Vex! (+1 ongoing DMG to all future hits)' },
                },
              ],
            },
          ],
        },
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: '>=',
            left: { type: 'get', path: 'round.matchingMisses' },
            right: { type: 'literal', value: 2 },
          },
          then: [
            {
              type: 'set',
              target: 'mob.state.bonusSpellDie',
              value: { type: 'dice', count: 1, sides: 6 },
            },
            {
              type: 'if',
              condition: {
                type: 'binary',
                op: '==',
                left: {
                  type: 'binary',
                  op: '%',
                  left: { type: 'get', path: 'mob.state.bonusSpellDie' },
                  right: { type: 'literal', value: 2 },
                },
                right: { type: 'literal', value: 1 },
              },
              then: [
                {
                  type: 'deal_damage',
                  target: 'hero',
                  amount: { type: 'dice', count: 1, sides: 6 },
                  source: 'Evoker Fang (Bonus Miss Strike)',
                  appliesArmor: true,
                },
              ],
              else: [
                { type: 'add_effect', effect: 'vex' },
                {
                  type: 'deal_damage',
                  target: 'hero',
                  amount: { type: 'dice', count: 1, sides: 6 },
                  source: 'Summoned Vex Strike (Bonus Miss Strike)',
                  appliesArmor: true,
                },
                {
                  type: 'message',
                  messageType: 'special',
                  text: { type: 'literal', value: '👻 Evoker summoned a Vex! (+1 ongoing DMG to all future hits)' },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'guardian',
    name: 'Guardian',
    maxHearts: 15,
    damage: 4,
    defense: 4,
    rulesText: 'Closing Distance: At the start of battle, you must close the distance. Your hits deal 0 DMG until you roll at least 1 hit.',
    lootText: 'Roll d6: On 5 or 6, gain 1 Fish.',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '>=',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 5 },
        },
        then: [
          { type: 'inventory', action: 'add', itemId: 'Fish', isMaterial: true },
          { type: 'loot_action', reward: { type: 'literal', value: '1 Fish' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onCombatStart: [
        { type: 'set', target: 'mob.state.isClosingDistance', value: { type: 'literal', value: true } },
        { type: 'set', target: 'mob.state.closingThisRound', value: { type: 'literal', value: true } },
        {
          type: 'message',
          messageType: 'notice',
          text: { type: 'literal', value: '  Guardian is far away! Roll at least 1 hit to close the distance!' },
        },
      ],
      onRoundStart: [
        {
          type: 'set',
          target: 'mob.state.closingThisRound',
          value: { type: 'get', path: 'mob.state.isClosingDistance' },
        },
      ],
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: 'and',
            left: {
              type: 'binary',
              op: '>',
              left: { type: 'get', path: 'round.hits' },
              right: { type: 'literal', value: 0 },
            },
            right: { type: 'get', path: 'mob.state.isClosingDistance' },
          },
          then: [
            { type: 'set', target: 'mob.state.isClosingDistance', value: { type: 'literal', value: false } },
            {
              type: 'message',
              messageType: 'notice',
              text: { type: 'literal', value: '  You swam close! Distance overcome for next turn.' },
            },
          ],
        },
      ],
      onReceiveDamage: [
        {
          type: 'if',
          condition: { type: 'get', path: 'mob.state.closingThisRound' },
          then: [
            { type: 'clear_damage', target: 'hero' },
            {
              type: 'message',
              messageType: 'notice',
              text: { type: 'literal', value: '  Closing Distance: Hero attacks deal 0 DMG this turn!' },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'elder_guardian',
    name: 'Elder Guardian',
    maxHearts: 30,
    damage: 6,
    defense: 3,
    rulesText: 'Closing Distance: At the start of battle (and when it swims away), you must close the distance. Your hits deal 0 DMG and Elder Guardian attacks ignore Armor until you roll at least 1 hit.\nSwim Away: Rolling 2+ misses causes the Elder Guardian to swim away, forcing you to close distance again next round.',
    lootText: 'Roll d6: On 5 or 6, gain 3 Fish.',
    loot: [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '>=',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 5 },
        },
        then: [
          { type: 'inventory', action: 'add', itemId: 'Fish', count: { type: 'literal', value: 3 }, isMaterial: true },
          { type: 'loot_action', reward: { type: 'literal', value: '3 Fish' } },
        ],
        else: [
          { type: 'loot_action', reward: { type: 'literal', value: 'No loot' } },
        ],
      },
    ],
    behavior: {
      onCombatStart: [
        { type: 'set', target: 'mob.state.isClosingDistance', value: { type: 'literal', value: true } },
        { type: 'set', target: 'mob.state.swamAway', value: { type: 'literal', value: false } },
        { type: 'set', target: 'mob.state.closingThisRound', value: { type: 'literal', value: true } },
        {
          type: 'message',
          messageType: 'notice',
          text: { type: 'literal', value: '  Elder Guardian is far away! Roll at least 1 hit to close the distance!' },
        },
      ],
      onRoundStart: [
        {
          type: 'if',
          condition: { type: 'get', path: 'mob.state.swamAway' },
          then: [
            { type: 'set', target: 'mob.state.isClosingDistance', value: { type: 'literal', value: true } },
            { type: 'set', target: 'mob.state.swamAway', value: { type: 'literal', value: false } },
            {
              type: 'message',
              messageType: 'special',
              text: { type: 'literal', value: '  Elder Guardian swam into the deep! You must close the distance again!' },
            },
          ],
        },
        {
          type: 'set',
          target: 'mob.state.closingThisRound',
          value: { type: 'get', path: 'mob.state.isClosingDistance' },
        },
      ],
      onRollEvaluated: [
        {
          type: 'if',
          condition: {
            type: 'binary',
            op: '>=',
            left: { type: 'get', path: 'round.matchingMisses' },
            right: { type: 'literal', value: 2 },
          },
          then: [
            { type: 'set', target: 'mob.state.swamAway', value: { type: 'literal', value: true } },
            {
              type: 'message',
              messageType: 'special',
              text: { type: 'literal', value: '  Double misses! Elder Guardian swims away (distance resets next turn)!' },
            },
          ],
        },
        {
          type: 'if',
          condition: { type: 'get', path: 'mob.state.closingThisRound' },
          then: [
            {
              type: 'if',
              condition: {
                type: 'binary',
                op: '>',
                left: { type: 'get', path: 'round.hits' },
                right: { type: 'literal', value: 0 },
              },
              then: [
                { type: 'set', target: 'mob.state.isClosingDistance', value: { type: 'literal', value: false } },
                {
                  type: 'message',
                  messageType: 'notice',
                  text: { type: 'literal', value: '  You swam close! Distance overcome for subsequent attacks.' },
                },
              ],
              else: [
                {
                  type: 'message',
                  messageType: 'notice',
                  text: { type: 'literal', value: '  Failed to close distance! Elder Guardian remains out of reach.' },
                },
              ],
            },
          ],
        },
      ],
      onDealDamage: [
        {
          type: 'if',
          condition: { type: 'get', path: 'mob.state.closingThisRound' },
          then: [
            {
              type: 'modify_damage_instances',
              target: 'mob_damage',
              appliesArmor: false,
              source: 'Elder Guardian Unblockable Beam',
            },
          ],
        },
      ],
      onReceiveDamage: [
        {
          type: 'if',
          condition: { type: 'get', path: 'mob.state.closingThisRound' },
          then: [
            { type: 'clear_damage', target: 'hero' },
            {
              type: 'message',
              messageType: 'notice',
              text: { type: 'literal', value: '  Closing Distance: Hero attacks deal 0 DMG this turn!' },
            },
          ],
        },
      ],
    },
  },
];