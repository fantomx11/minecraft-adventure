import { Entity } from './Entity';
import { getEquipmentItem } from '../data/recipes';
import type { Item } from './Item';
import type { TrackedMaterial, EquippedSlots, InventoryRule } from '../types/inventory';
import type { CombatContext, CombatLifecycleHooks } from '../types/combat';

export interface SerializedCharacter {
  name: string;
  health: number;
  restarts: number;
  equipmentInventoryIds: string[];
  equipped: EquippedSlots;
  materials: Record<TrackedMaterial, number>;
  materialRule: InventoryRule;
}

export class Character extends Entity implements Required<CombatLifecycleHooks> {
  public attack: number = 1;
  public damage: number = 1;
  public restarts: number = 0;
  public equipmentInventoryIds: string[] = [];
  public equipped: EquippedSlots;
  public materials: Record<TrackedMaterial, number>;
  public materialRule: InventoryRule;

  constructor(data?: Partial<SerializedCharacter>) {
    super(data?.name || 'Steve', 20, data?.health ?? 20); //
    this.restarts = Math.max(0, data?.restarts ?? 0); //[cite: 1]
    this.materialRule = data?.materialRule || 'total'; //[cite: 1]
    this.equipmentInventoryIds = data?.equipmentInventoryIds ?? ['Wooden Pickaxe']; //[cite: 1]
    this.equipped = {
      weapon: data?.equipped?.weapon ?? null, //[cite: 1]
      armor: data?.equipped?.armor ?? null, //[cite: 1]
      pickaxe: data?.equipped?.pickaxe ?? 'Wooden Pickaxe', //[cite: 1]
      key: data?.equipped?.key ?? null, //[cite: 1]
    };

    const trackedList: TrackedMaterial[] = [
      'Wood', 'Stone', 'Iron', 'Coal', 'Diamond',
      'Leather', 'String', 'Wheat', 'Gunpowder', 'Slimeball', 'Fish'
    ]; //[cite: 1]
    this.materials = {} as Record<TrackedMaterial, number>;
    for (const mat of trackedList) {
      this.materials[mat] = Math.max(0, data?.materials?.[mat] ?? 0); //[cite: 1]
    }
    this.recalculateStats(); //[cite: 1]
  }

  // --- Flyweight Accessors ---
  public get equipmentInventory(): Item[] {
    return this.equipmentInventoryIds
      .map(id => getEquipmentItem(id))
      .filter((i): i is Item => i !== undefined); //[cite: 1]
  }

  public get equippedWeapon(): Item | undefined {
    return this.equipped.weapon ? getEquipmentItem(this.equipped.weapon) : undefined; //[cite: 1]
  }

  public get equippedArmor(): Item | undefined {
    return this.equipped.armor ? getEquipmentItem(this.equipped.armor) : undefined; //[cite: 1]
  }

  public get equippedPickaxe(): Item | undefined {
    return this.equipped.pickaxe ? getEquipmentItem(this.equipped.pickaxe) : undefined; //[cite: 1]
  }

  public get equippedKey(): Item | undefined {
    return this.equipped.key ? getEquipmentItem(this.equipped.key) : undefined; //[cite: 1]
  }

  public get totalMaterialsCount(): number {
    return Object.values(this.materials).reduce((total, value) => total + value, 0); //[cite: 1]
  }

  public get equippedItems(): Item[] {
    return [
      this.equippedWeapon,
      this.equippedArmor,
      this.equippedPickaxe,
      this.equippedKey
    ].filter((item): item is Item => item !== undefined); //[cite: 1]
  }

  private dispatchToEquipped(hookName: keyof CombatLifecycleHooks, ctx: CombatContext): void {
    for (const item of this.equippedItems) {
      item.hooks?.[hookName]?.(ctx); //[cite: 1]
    }
  }

  public onCombatStart(ctx: CombatContext): void { this.dispatchToEquipped('onCombatStart', ctx); } //[cite: 1]
  public onRoundStart(ctx: CombatContext): void { this.dispatchToEquipped('onRoundStart', ctx); } //[cite: 1]
  public onRollEvaluated(ctx: CombatContext): void { this.dispatchToEquipped('onRollEvaluated', ctx); } //[cite: 1]
  public onDealDamage(ctx: CombatContext): void { this.dispatchToEquipped('onDealDamage', ctx); } //[cite: 1]
  public onReceiveDamage(ctx: CombatContext): void { this.dispatchToEquipped('onReceiveDamage', ctx); } //[cite: 1]
  public onRoundEnd(ctx: CombatContext): void { this.dispatchToEquipped('onRoundEnd', ctx); } //[cite: 1]
  public onDeath(ctx: CombatContext): void { this.dispatchToEquipped('onDeath', ctx); } //[cite: 1]
  public onCombatEnd(ctx: CombatContext): void {
    this.resetHealth(); //[cite: 1]
    this.dispatchToEquipped('onCombatEnd', ctx); //[cite: 1]
  }

  public recalculateStats(): void {
    this.attack = this.equippedWeapon?.attack ?? 1; //[cite: 1]
    this.damage = this.equippedWeapon?.damage ?? 1; //[cite: 1]
    this.armor = this.equippedArmor?.armorValue ?? 0; //[cite: 1]
  }

  public equip(slot: keyof EquippedSlots, itemName: string): boolean {
    if (!this.hasItem(itemName)) return false; //[cite: 1]
    this.equipped[slot] = itemName; //[cite: 1]
    this.recalculateStats(); //[cite: 1]
    return true; //[cite: 1]
  }

  public unequip(slot: keyof EquippedSlots): void {
    this.equipped[slot] = null; //[cite: 1]
    this.recalculateStats(); //[cite: 1]
  }

  public hasItem(name: string): boolean {
    return this.equipmentInventoryIds.some((i) => i.toLowerCase() === name.toLowerCase()); //[cite: 1]
  }

  public addEquipment(name: string): void {
    this.equipmentInventoryIds.push(name); //[cite: 1]
  }

  public removeEquipment(name: string): void {
    const idx = this.equipmentInventoryIds.findIndex((i) => i.toLowerCase() === name.toLowerCase()); //[cite: 1]
    if (idx !== -1) {
      this.equipmentInventoryIds.splice(idx, 1); //[cite: 1]
      (Object.keys(this.equipped) as (keyof EquippedSlots)[]).forEach((slot) => {
        if (this.equipped[slot]?.toLowerCase() === name.toLowerCase()) {
          this.equipped[slot] = null; //[cite: 1]
        }
      });
      this.recalculateStats(); //[cite: 1]
    }
  }

  public canCraft(cost: Partial<Record<TrackedMaterial, number>>): boolean {
    for (const [mat, required] of Object.entries(cost) as [TrackedMaterial, number][]) {
      if ((this.materials[mat] || 0) < required) return false; //[cite: 1]
    }
    return true; //[cite: 1]
  }

  public adjustMaterial(mat: TrackedMaterial, delta: number): number {
    if (this.materials[mat] === undefined) return 0; //[cite: 1]
    const oldVal = this.materials[mat]; //[cite: 1]
    if (this.materialRule === 'total') { //[cite: 1]
      const currentTotal = this.totalMaterialsCount; //[cite: 1]
      if (delta > 0) {
        if (currentTotal >= 5) return 0; //[cite: 1]
        const allowed = Math.min(delta, 5 - currentTotal); //[cite: 1]
        this.materials[mat] += allowed; //[cite: 1]
      } else {
        this.materials[mat] = Math.max(0, this.materials[mat] + delta); //[cite: 1]
      }
    } else {
      this.materials[mat] = Math.min(5, Math.max(0, this.materials[mat] + delta)); //[cite: 1]
    }
    return this.materials[mat] - oldVal; //[cite: 1]
  }

  public respawn(): void {
    this.restarts += 1; //[cite: 1]
    this.resetHealth(); //[cite: 1]
  }

  public toJSON(): SerializedCharacter {
    return {
      name: this.name,
      health: this.hearts,
      restarts: this.restarts,
      equipmentInventoryIds: [...this.equipmentInventoryIds],
      equipped: { ...this.equipped },
      materials: { ...this.materials },
      materialRule: this.materialRule,
    };
  }
}