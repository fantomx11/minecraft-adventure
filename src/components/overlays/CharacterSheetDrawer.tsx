import type { Character } from '../../models/Character';
import type { EquipmentType, TrackedMaterial } from '../../types/inventory';
import { HealthPool } from '../ui/HealthPool';
import { Icon } from '../ui/Icon';
import { MaterialCard } from '../ui/MaterialCard';
import { StatBadge } from '../ui/StatBadge';
import { useState } from 'preact/hooks';
import { TRACKED_MATERIALS, EQUIPMENT_DEFINITIONS, getEquipmentItem } from '../../data/recipes'; //
import { useObservable } from '../../hooks/useObservable';

interface CharacterSheetProps {
  hero: Character;
  isOpen: boolean;
  allowInventoryEditing?: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function CharacterSheetDrawer({ hero, isOpen, allowInventoryEditing = false, onClose, onUpdate }: CharacterSheetProps) {
  const [selectedGearToAdd, setSelectedGearToAdd] = useState(EQUIPMENT_DEFINITIONS[0].name);

  useObservable(hero);

  const adjustHp = (delta: number) => {
    hero.changeHealth(delta);
    onUpdate();
  };

  const restoreFullHp = () => {
    hero.resetHealth();
    onUpdate();
  };

  const handleNameChange = (e: Event) => {
    hero.name = (e.target as HTMLInputElement).value;
    onUpdate();
  };

  const handleEquipSlot = (slot: EquipmentType, itemName: string) => {
    if (!itemName) {
      hero.unequip(slot);
    } else {
      hero.equip(slot, itemName);
    }
    onUpdate();
  };

  const handleDropEquipment = (itemName: string) => {
    hero.removeEquipment(itemName);
    onUpdate();
  };

  const getSlotOptions = (slotType: EquipmentType) => {
    return hero.equipmentInventory.filter((item) => item.type === slotType);
  };

  const handleAdjustMaterial = (mat: TrackedMaterial, delta: number) => {
    hero.adjustMaterial(mat, delta);
    onUpdate();
  };

  const handleAddManualEquipment = () => {
    if (!selectedGearToAdd) return;
    hero.addEquipment(selectedGearToAdd); //
    onUpdate(); //[cite: 1]
  };

  const totalMats = hero.totalMaterialsCount;

  return (
    <aside id="sidebar-drawer" class={isOpen ? 'active' : ''}>
      <div class="drawer-header">
        <span>
          <Icon name="book" /> CHARACTER SHEET
        </span>
        <button type="button" class="pixel-btn btn-danger" onClick={onClose}>
          X
        </button>
      </div>

      {/* Hero Name */}
      <div class="sidebar-field">
        <label>
          <Icon name="hero" /> HERO NAME
        </label>
        <input class="pixel-input" type="text" value={hero.name} onInput={handleNameChange} />
      </div>

      {/* Health Pool */}
      <div class="sidebar-field">
        <label>HEALTH POOL ({hero.hearts}/{hero.maxHearts})</label>
        <HealthPool
          current={hero.hearts}
          max={hero.maxHearts}
          onChange={(val) => {
            hero.hearts = val;
            onUpdate();
          }}
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
          <button type="button" class="pixel-btn btn-danger" onClick={() => adjustHp(-1)}>
            -1 HP
          </button>
          <button type="button" class="pixel-btn btn-success" onClick={() => adjustHp(1)}>
            +1 HP
          </button>
          <button type="button" class="pixel-btn btn-primary" onClick={restoreFullHp}>
            RESTORE
          </button>
        </div>
      </div>

      {/* Attributes */}
      <div class="sidebar-field">
        <label>ATTRIBUTES</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <StatBadge icon="sword" label="ATK:" value={hero.attack} />
          <StatBadge icon="tnt" label="DMG:" value={hero.damage} />
          <StatBadge icon="chestplate" label="ARM:" value={hero.armor} />
          <StatBadge icon="bed" label="RST:" value={hero.restarts} />
        </div>
      </div>

      {/* Equipped Slots */}
      <div class="sidebar-field">
        <label>EQUIPPED SLOTS</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(['weapon', 'armor', 'pickaxe', 'key'] as const).map((slot) => (
            <div key={slot}>
              <label style={{ fontSize: '10px', textTransform: 'uppercase' }}>{slot}</label>
              <select
                class="pixel-select"
                value={hero.equipped[slot] || ''}
                onChange={(e) => handleEquipSlot(slot, (e.target as HTMLSelectElement).value)}
              >
                <option value="">-- None --</option>
                {getSlotOptions(slot).map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment Inventory */}
      <div class="sidebar-field">
        <label>
          <Icon name="book" /> INVENTORY ({hero.equipmentInventoryIds.length})
        </label>

        {/* Manual Equipment Adder */}
        {allowInventoryEditing && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select
              class="pixel-select"
              value={selectedGearToAdd}
              onChange={(e) => setSelectedGearToAdd((e.target as HTMLSelectElement).value)}
              style={{ flex: 1 }}
            >
              {EQUIPMENT_DEFINITIONS.map((eq) => (
                <option key={eq.name} value={eq.name}>
                  [{eq.type.toUpperCase()}] {eq.name}
                </option>
              ))}
            </select>
            <button type="button" class="pixel-btn btn-success" onClick={handleAddManualEquipment}>
              + ADD
            </button>
          </div>
        )}

        {/* Existing Inventory List */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {hero.equipmentInventoryIds.map((itemName, idx) => {
            const item = getEquipmentItem(itemName);
            return (
              <li
                key={`${itemName}-${idx}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: '1px solid #333',
                }}
              >
                <span style={{ fontSize: '11px' }}>
                  [{item?.type?.toUpperCase() || 'ITEM'}] {itemName}
                </span>
                <button
                  type="button"
                  class="pixel-btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '9px' }}
                  onClick={() => handleDropEquipment(itemName)}
                >
                  DROP
                </button>
              </li>
            );
          })}
          {hero.equipmentInventoryIds.length === 0 && (
            <li style={{ color: '#888', fontSize: '10px' }}>Inventory is empty.</li>
          )}
        </ul>
      </div>

      {/* Materials Grid */}
      <div class="sidebar-field">
        <label>
          {hero.materialRule === 'total'
            ? `MATERIALS (${totalMats}/5 TOTAL)`
            : 'MATERIALS (MAX 5 EACH)'}
        </label>
        <div class="materials-grid">
          {TRACKED_MATERIALS.map((mat) => {
            const count = hero.materials[mat] || 0;
            const canAdd = hero.materialRule === 'total' ? totalMats < 5 : count < 5;

            return (
              <MaterialCard
                key={mat}
                material={mat}
                count={count}
                canAdd={canAdd}
                onAdjust={(delta) => handleAdjustMaterial(mat, delta)}
              />
            );
          })}
        </div>
      </div>
    </aside>
  );
}