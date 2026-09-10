import { Entity, EntityData } from './Entity';
import { getEquipmentItem } from '../data/recipes';
import type { Item } from './Item';
import type { TrackedMaterial, EquippedSlots, InventoryRule } from '../types/inventory';

export interface SerializedCharacter extends EntityData {
  restarts: number;
  equipmentInventoryIds: string[];
  equipped: EquippedSlots;
  materials: Record<TrackedMaterial, number>;
  materialRule: InventoryRule;
}

interface CharacterData {
  restarts: number;
  materialRule: InventoryRule;
  equipmentInventoryIds: string[];
  equipped: EquippedSlots;
  materials: Record<TrackedMaterial, number>;
}

const DEFAULT_MATERIALS: Record<TrackedMaterial, number> = {
  Wood: 0,
  Stone: 0,
  Iron: 0,
  Coal: 0,
  Diamond: 0,
  Leather: 0,
  String: 0,
  Wheat: 0,
  Gunpowder: 0,
  Slimeball: 0,
  Fish: 0,
};

export class Character extends Entity {
  #data: CharacterData;

  constructor(initialData?: Partial<SerializedCharacter>) {
    // 1. Initialize Entity vitals
    super(
      initialData?.name || 'Steve',
      20,
      initialData?.hearts ?? 20
    );

    // 2. Initialize Character-specific state in its own disjoint #data store
    this.#data = this.createReactiveStore({
      restarts: Math.max(0, initialData?.restarts ?? 0),
      materialRule: initialData?.materialRule || 'total',
      equipmentInventoryIds: initialData?.equipmentInventoryIds
        ? [...initialData.equipmentInventoryIds]
        : ['Wooden Pickaxe'],
      equipped: {
        weapon: initialData?.equipped?.weapon ?? null,
        armor: initialData?.equipped?.armor ?? null,
        pickaxe: initialData?.equipped?.pickaxe ?? 'Wooden Pickaxe',
        key: initialData?.equipped?.key ?? null,
      },
      materials: {
        ...DEFAULT_MATERIALS,
        ...(initialData?.materials || {}),
      },
    });
  }

  // --- Subclass Accessors ---
  public get restarts(): number {
    return this.#data.restarts;
  }
  public set restarts(val: number) {
    this.#data.restarts = Math.max(0, val);
  }

  public get materialRule(): InventoryRule {
    return this.#data.materialRule;
  }
  public set materialRule(val: InventoryRule) {
    this.#data.materialRule = val;
  }

  public get equipmentInventoryIds(): string[] {
    return this.#data.equipmentInventoryIds;
  }

  public get equipped(): EquippedSlots {
    return this.#data.equipped;
  }

  public get materials(): Record<TrackedMaterial, number> {
    return this.#data.materials;
  }

  // --- Computed Equipment & Stats ---
  public get equippedWeapon(): Item | undefined {
    return this.#data.equipped.weapon ? getEquipmentItem(this.#data.equipped.weapon) : undefined;
  }

  public get equippedArmor(): Item | undefined {
    return this.#data.equipped.armor ? getEquipmentItem(this.#data.equipped.armor) : undefined;
  }

  public get equippedPickaxe(): Item | undefined {
    return this.#data.equipped.pickaxe ? getEquipmentItem(this.#data.equipped.pickaxe) : undefined;
  }

  public get attack(): number {
    return this.equippedWeapon?.attack ?? 1;
  }

  public get damage(): number {
    return this.equippedWeapon?.damage ?? 0;
  }

  public override get armor(): number {
    return this.equippedArmor?.armorValue ?? 0;
  }

  public get totalMaterialsCount(): number {
    return Object.values(this.#data.materials).reduce((sum, qty) => sum + qty, 0);
  }

  // --- Inventory Management ---
  public hasItem(itemName: string): boolean {
    return (
      this.#data.equipmentInventoryIds.includes(itemName) ||
      Object.values(this.#data.equipped).includes(itemName)
    );
  }

  public addEquipment(itemName: string): void {
    this.#data.equipmentInventoryIds.push(itemName);
  }

  public removeEquipment(itemName: string): boolean {
    const idx = this.#data.equipmentInventoryIds.indexOf(itemName);
    if (idx !== -1) {
      this.#data.equipmentInventoryIds.splice(idx, 1);
      return true;
    }

    // Check equipped slots if not in loose inventory
    for (const [slot, name] of Object.entries(this.#data.equipped)) {
      if (name === itemName) {
        this.#data.equipped[slot as keyof EquippedSlots] = null;
        return true;
      }
    }
    return false;
  }

  public equip(slot: keyof EquippedSlots, itemName: string): boolean {
    if (!this.#data.equipmentInventoryIds.includes(itemName)) return false;

    // Unequip existing item to inventory
    const current = this.#data.equipped[slot];
    if (current) {
      this.#data.equipmentInventoryIds.push(current);
    }

    // Remove from inventory and place into slot
    const itemIdx = this.#data.equipmentInventoryIds.indexOf(itemName);
    this.#data.equipmentInventoryIds.splice(itemIdx, 1);
    this.#data.equipped[slot] = itemName;

    return true;
  }

  public unequip(slot: keyof EquippedSlots): void {
    const current = this.#data.equipped[slot];
    if (current) {
      this.#data.equipped[slot] = null;
      this.#data.equipmentInventoryIds.push(current);
    }
  }

  public adjustMaterial(mat: TrackedMaterial, delta: number): number {
    const current = this.#data.materials[mat] || 0;
    const next = Math.max(0, current + delta);
    this.#data.materials[mat] = next;
    return next - current;
  }

  // --- Serialization ---
  public override toJSON(): SerializedCharacter {
    return {
      ...super.toJSON(),
      restarts: this.restarts,
      equipmentInventoryIds: [...this.#data.equipmentInventoryIds],
      equipped: { ...this.#data.equipped },
      materials: { ...this.#data.materials },
      materialRule: this.materialRule,
    };
  }
}