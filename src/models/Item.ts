import type { EquipmentConfig, EquipmentType } from '../types/inventory';
import type { CombatLifecycleHooks } from '../types/combat';

export class Item {
  public name: string;
  public type: EquipmentType;
  public attack: number;
  public damage: number;
  public armorValue: number;
  public diceBonus: number;
  public description: string;
  public hooks?: CombatLifecycleHooks;

  constructor(config: EquipmentConfig) {
    this.name = config.name;
    this.type = config.type;
    this.attack = config.attack ?? 1;
    this.damage = config.damage ?? 1;
    this.armorValue = config.armorValue ?? 0;
    this.diceBonus = config.diceBonus ?? 1;
    this.description = config.description ?? '';
    this.hooks = config.hooks;
  }
}