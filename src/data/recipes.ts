import { Item } from '../models/Item';
import type { EquipmentConfig, CraftingRecipe, TrackedMaterial } from '../types/inventory';
import type { CombatContext } from '../types/combat';

export const TRACKED_MATERIALS: TrackedMaterial[] = [
  'Wood', 'Stone', 'Iron', 'Coal', 'Diamond',
  'Leather', 'String', 'Wheat', 'Gunpowder', 'Slimeball', 'Fish'
];

export const EQUIPMENT_DEFINITIONS: EquipmentConfig[] = [
  // Weapons
  { name: 'Wooden Sword', type: 'weapon', attack: 1, damage: 2 },
  { name: 'Stone Sword', type: 'weapon', attack: 2, damage: 2 },
  { name: 'Iron Sword', type: 'weapon', attack: 3, damage: 6 },
  { name: 'Diamond Sword', type: 'weapon', attack: 4, damage: 8 },
  { name: 'Enchanted Iron Axe', type: 'weapon', attack: 4, damage: 6 },
  {
    name: 'Bow',
    type: 'weapon',
    attack: 2,
    damage: 1,
    description: 'Deals +2 bonus DMG on Turn 1',
    hooks: {
      onDealDamage: (ctx: CombatContext) => {
        if (ctx.combatState.turn === 1 && ctx.roundState.hits > 0) {
          ctx.roundState.heroDamageInstances.push({
            amount: ctx.roundState.hits * 2,
            source: 'Bow (First Strike)',
            appliesArmor: false,
          });
          ctx.roundState.messages.push({
            type: 'notice',
            text: '🏹 Bow: First attack deals +2 bonus Damage per hit!',
          });
        }
      },
    },
  },
  { name: 'Crossbow', type: 'weapon', attack: 2, damage: 2 },
  {
    name: 'Trident',
    type: 'weapon',
    attack: 2,
    damage: 3,
    description: 'Single-die attack deals +1 bonus DMG',
    hooks: {
      onDealDamage: (ctx: CombatContext) => {
        if (ctx.roundState.diceCount === 1 && ctx.roundState.hits > 0) {
          ctx.roundState.heroDamageInstances.push({
            amount: ctx.roundState.hits * 1,
            source: 'Trident (Single Die Focus)',
            appliesArmor: false,
          });
          ctx.roundState.messages.push({
            type: 'notice',
            text: '🔱 Trident: Single-die thrust deals +1 bonus Damage!',
          });
        }
      },
    },
  },

  // Armor
  { name: 'Leather Armor', type: 'armor', armorValue: 1 },
  { name: 'Iron Armor', type: 'armor', armorValue: 2 },
  { name: 'Diamond Armor', type: 'armor', armorValue: 4 },

  // Pickaxes
  { name: 'Wooden Pickaxe', type: 'pickaxe', diceBonus: 1, description: 'Rolls 1 die on Mining Table' },
  { name: 'Stone Pickaxe', type: 'pickaxe', diceBonus: 2, description: 'Rolls 2 dice, pick one' },
  { name: 'Iron Pickaxe', type: 'pickaxe', diceBonus: 3, description: 'Rolls 3 dice, pick one' },
  { name: 'Diamond Pickaxe', type: 'pickaxe', diceBonus: 4, description: 'Rolls 4 dice, pick one; can mine Obsidian' },

  // Key Items
  {
    name: 'Totem of Undying',
    type: 'key',
    description: 'Heals 20 HP upon fatal defeat',
    hooks: {
      onDeath: (ctx: CombatContext) => {
        if (ctx.roundState.dyingEntity === ctx.combatState.hero) {
          ctx.combatState.hero.resetHealth();
          ctx.roundState.preventDeath = true;
          ctx.combatState.hero.removeEquipment('Totem of Undying');
          ctx.roundState.messages.push({
            type: 'special',
            text: '✨ TOTEM USED! The Totem of Undying shattered, restoring you to full 20 HP!',
          });
        }
      },
    },
  },
  { name: 'Torch', type: 'key', description: 'Explore dark mines and caves' },
  { name: 'Bucket', type: 'key', description: 'Turns lava pools into solid stone' },
  { name: 'Boat', type: 'key', description: 'Traverse rivers and oceans safely' },
  { name: 'TNT', type: 'key', description: 'Excavate sealed pathways' },
];

export const EQUIPMENT_CATALOG: Record<string, Item> = Object.fromEntries(
  EQUIPMENT_DEFINITIONS.map((def) => [def.name, new Item(def)])
);

export function getEquipmentItem(name: string): Item | undefined {
  return EQUIPMENT_CATALOG[name];
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  { name: 'Wooden Sword', type: 'weapon', cost: { Wood: 1 }, desc: '1 ATK | 2 DMG' },
  { name: 'Stone Sword', type: 'weapon', cost: { Wood: 1, Stone: 2 }, desc: '2 ATK | 2 DMG' },
  { name: 'Iron Sword', type: 'weapon', cost: { Wood: 1, Iron: 2 }, desc: '3 ATK | 6 DMG' },
  { name: 'Diamond Sword', type: 'weapon', cost: { Wood: 1, Diamond: 2 }, desc: '4 ATK | 8 DMG' },
  { name: 'Bow', type: 'weapon', cost: { Wood: 1, String: 3 }, desc: '2 ATK | 1 DMG (3 DMG Turn 1)' },
  { name: 'Crossbow', type: 'weapon', cost: { Wood: 1, Iron: 1, String: 1 }, desc: '2 ATK | 2 DMG' },
  { name: 'Leather Armor', type: 'armor', cost: { Leather: 4 }, desc: '1 ARM (Flat absorption)' },
  { name: 'Iron Armor', type: 'armor', cost: { Iron: 4 }, desc: '2 ARM (Flat absorption)' },
  { name: 'Diamond Armor', type: 'armor', cost: { Diamond: 4 }, desc: '4 ARM (Flat absorption)' },
  { name: 'Stone Pickaxe', type: 'pickaxe', cost: { Wood: 1, Stone: 2 }, desc: 'Roll 2 dice on Mining Table' },
  { name: 'Iron Pickaxe', type: 'pickaxe', cost: { Wood: 1, Iron: 2 }, desc: 'Roll 3 dice on Mining Table' },
  { name: 'Diamond Pickaxe', type: 'pickaxe', cost: { Wood: 1, Diamond: 2 }, desc: 'Roll 3 dice & mine Obsidian' },
  { name: 'Torch', type: 'key', cost: { Wood: 1, Coal: 1 }, desc: 'Explore dark mine shafts' },
  { name: 'Bucket', type: 'key', cost: { Iron: 3 }, desc: 'Cool hazardous lava pools' },
  { name: 'Boat', type: 'key', cost: { Wood: 5 }, desc: 'Navigate open waters' },
  { name: 'TNT', type: 'key', cost: { Gunpowder: 3 }, desc: 'Blast away sealed obstacles' },
];