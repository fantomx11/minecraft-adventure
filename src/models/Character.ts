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
  forestCleared: number;
  mineCleared: number;
}

export class Character extends Entity implements Required<CombatLifecycleHooks> {
  public attack: number = 1;
  public damage: number = 1;
  public restarts: number = 0;
  public equipmentInventoryIds: string[] = [];
  public equipped: EquippedSlots;
  public materials: Record<TrackedMaterial, number>;
  public materialRule: InventoryRule;
  public forestCleared: number = 0;
  public mineCleared: number = 0;

  constructor(data?: Partial<SerializedCharacter>) {
    super(data?.name || 'Steve', 20, data?.health ?? 20);
    this.restarts = Math.max(0, data?.restarts ?? 0);
    this.materialRule = data?.materialRule || 'total';
    this.forestCleared = data?.forestCleared ?? 0;
    this.mineCleared = data?.mineCleared ?? 0;

    this.equipmentInventoryIds = data?.equipmentInventoryIds ?? ['Wooden Pickaxe'];
    this.equipped = {
      weapon: data?.equipped?.weapon ?? null,
      armor: data?.equipped?.armor ?? null,
      pickaxe: data?.equipped?.pickaxe ?? 'Wooden Pickaxe',
      key: data?.equipped?.key ?? null,
    };

    const trackedList: TrackedMaterial[] = [
      'Wood', 'Stone', 'Iron', 'Coal', 'Diamond',
      'Leather', 'String', 'Wheat', 'Gunpowder', 'Slimeball'
    ];
    this.materials = {} as Record<TrackedMaterial, number>;
    for (const mat of trackedList) {
      this.materials[mat] = Math.max(0, data?.materials?.[mat] ?? 0);
    }

    this.recalculateStats();
  }

  // --- Flyweight Helper Accessors ---

  public get equipmentInventory(): Item[] {
    return this.equipmentInventoryIds.map(id => getEquipmentItem(id)).filter((i): i is Item => i !== undefined);
  }

  public get equippedWeapon(): Item | undefined {
    return this.equipped.weapon ? getEquipmentItem(this.equipped.weapon) : undefined;
  }

  public get equippedArmor(): Item | undefined {
    return this.equipped.armor ? getEquipmentItem(this.equipped.armor) : undefined;
  }

  public get totalMaterialsCount(): number {
    return Object.values(this.materials).reduce((total, value) => total + value, 0)
  }

  public get equippedPickaxe(): Item | undefined {
    return this.equipped.pickaxe ? getEquipmentItem(this.equipped.pickaxe) : undefined;
  }

  public get equippedKey(): Item | undefined {
    return this.equipped.key ? getEquipmentItem(this.equipped.key) : undefined;
  }

  public get equippedItems(): Item[] {
    const slots = [this.equippedWeapon, this.equippedArmor, this.equippedPickaxe, this.equippedKey];
    return slots.filter((item): item is Item => item !== undefined);
  }

  public get inventoryItems(): Item[] {
    return this.equipmentInventoryIds
      .map((name) => getEquipmentItem(name))
      .filter((item): item is Item => item !== undefined);
  }

  // --- Hook Delegation ---

  private dispatchToEquipped(hookName: keyof CombatLifecycleHooks, ctx: CombatContext): void {
    for (const item of this.equippedItems) {
      item.hooks?.[hookName]?.(ctx);
    }
  }

  public onCombatStart(ctx: CombatContext): void { this.dispatchToEquipped('onCombatStart', ctx); }
  public onRoundStart(ctx: CombatContext): void { this.dispatchToEquipped('onRoundStart', ctx); }
  public onRollEvaluated(ctx: CombatContext): void { this.dispatchToEquipped('onRollEvaluated', ctx); }
  public onDealDamage(ctx: CombatContext): void { this.dispatchToEquipped('onDealDamage', ctx); }
  public onReceiveDamage(ctx: CombatContext): void { this.dispatchToEquipped('onReceiveDamage', ctx); }
  public onRoundEnd(ctx: CombatContext): void { this.dispatchToEquipped('onRoundEnd', ctx); }
  public onDeath(ctx: CombatContext): void { this.dispatchToEquipped('onDeath', ctx); }
  public onCombatEnd(ctx: CombatContext): void { this.dispatchToEquipped('onCombatEnd', ctx); }

  // --- Stat Recalculation & State Management ---

  public recalculateStats(): void {
    const weapon = this.equippedWeapon;
    this.attack = weapon?.attack ?? 1;
    this.damage = weapon?.damage ?? 1;

    const armor = this.equippedArmor;
    this.armor = armor?.armorValue ?? 0;
  }

  public equip(slot: keyof EquippedSlots, itemName: string): boolean {
    if (!this.hasItem(itemName)) return false;
    this.equipped[slot] = itemName;
    this.recalculateStats();
    return true;
  }

  public unequip(slot: keyof EquippedSlots): void {
    this.equipped[slot] = null;
    this.recalculateStats();
  }

  public hasItem(name: string): boolean {
    return this.equipmentInventoryIds.some((i) => i.toLowerCase() === name.toLowerCase());
  }

  public addEquipment(name: string): void {
    this.equipmentInventoryIds.push(name);
  }

  public removeEquipment(name: string): void {
    const idx = this.equipmentInventoryIds.findIndex((i) => i.toLowerCase() === name.toLowerCase());
    if (idx !== -1) {
      this.equipmentInventoryIds.splice(idx, 1);
      (Object.keys(this.equipped) as (keyof EquippedSlots)[]).forEach((slot) => {
        if (this.equipped[slot]?.toLowerCase() === name.toLowerCase()) {
          this.equipped[slot] = null;
        }
      });
      this.recalculateStats();
    }
  }

  public canCraft(cost: Partial<Record<TrackedMaterial, number>>): boolean {
    for (const [mat, required] of Object.entries(cost) as [TrackedMaterial, number][]) {
      if ((this.materials[mat] || 0) < required) {
        return false;
      }
    }
    return true;
  }

  public adjustMaterial(mat: TrackedMaterial, delta: number): number {
    if (this.materials[mat] === undefined) return 0;
    const oldVal = this.materials[mat];

    if (this.materialRule === 'total') {
      const currentTotal = this.totalMaterialsCount;
      if (delta > 0) {
        if (currentTotal >= 5) return 0;
        const allowed = Math.min(delta, 5 - currentTotal);
        this.materials[mat] += allowed;
      } else {
        this.materials[mat] = Math.max(0, this.materials[mat] + delta);
      }
    } else {
      // 'stack' rule: up to 5 per material type
      this.materials[mat] = Math.min(5, Math.max(0, this.materials[mat] + delta));
    }

    return this.materials[mat] - oldVal;
  }

  public respawn(): void {
    this.restarts += 1;
    this.resetHealth();
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
      forestCleared: this.forestCleared,
      mineCleared: this.mineCleared,
    };
  }
}