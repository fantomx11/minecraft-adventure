import type { CombatLifecycleHooks } from './combat';

export type TrackedMaterial = 
  | 'Wood' 
  | 'Stone' 
  | 'Iron' 
  | 'Coal' 
  | 'Diamond' 
  | 'Leather' 
  | 'String' 
  | 'Wheat' 
  | 'Gunpowder' 
  | 'Slimeball'
  | 'Fish';

export type EquipmentType = 'weapon' | 'armor' | 'pickaxe' | 'key';
export type InventoryRule = 'total' | 'stack';

export interface EquippedSlots {
  weapon: string | null;
  armor: string | null;
  pickaxe: string | null;
  key: string | null;
}

export interface EquipmentConfig {
  name: string;
  type: EquipmentType;
  attack?: number;
  damage?: number;
  armorValue?: number;
  diceBonus?: number;
  description?: string;
  hooks?: CombatLifecycleHooks;
}

export interface CraftingRecipe {
  name: string;
  type: EquipmentType;
  cost: Partial<Record<TrackedMaterial, number>>;
  desc: string;
}