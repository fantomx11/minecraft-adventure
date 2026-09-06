import { Character } from "../../models/Character";
import { InventoryRule } from "../../types/inventory";
import { Icon } from "../ui/Icon";

interface OptionsDrawerProps {
  hero: Character;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onReset: () => void;
}

export function OptionsDrawer({ hero, isOpen, onClose, onUpdate, onReset }: OptionsDrawerProps) {
  const handleRuleChange = (rule: InventoryRule) => {
    hero.materialRule = rule;
    onUpdate();
  };

  return (
    <aside id="options-drawer" class={isOpen ? 'active' : ''}>
      <div class="drawer-header">
        <span>
          <Icon name="gear" /> SETTINGS
        </span>
        <button type="button" class="pixel-btn btn-danger" onClick={onClose}>
          X
        </button>
      </div>
      <div class="sidebar-field">
        <label>INVENTORY RULE</label>
        <div class="option-radio-group">
          <div
            class={`option-radio-card ${hero.materialRule === 'total' ? 'selected' : ''}`}
            onClick={() => handleRuleChange('total')}
          >
            <strong>Total Limit (5 Total)</strong>
            <small>Hero can only carry 5 materials in total.</small>
          </div>
          <div
            class={`option-radio-card ${hero.materialRule === 'stack' ? 'selected' : ''}`}
            onClick={() => handleRuleChange('stack')}
          >
            <strong>Stack Limit (5 Each)</strong>
            <small>Hero can hold up to 5 of each material type.</small>
          </div>
        </div>
      </div>
      <div class="sidebar-field" style={{ marginTop: '24px' }}>
        <button type="button" class="pixel-btn btn-danger" style={{ width: '100%' }} onClick={onReset}>
          RESET CHARACTER DATA
        </button>
      </div>
    </aside>
  );
}