import { useState } from 'preact/hooks';
import { Character } from "../../models/Character";
import { Icon } from "../ui/Icon"; //[cite: 1]

interface OptionsDrawerProps {
  hero: Character; //[cite: 1]
  isOpen: boolean; //[cite: 1]
  onClose: () => void; //[cite: 1]
  onUpdate: () => void; //[cite: 1]
  onReset: () => void; //[cite: 1]
  onLoad: (json: string) => boolean;
}

export function OptionsDrawer({ hero, isOpen, onClose, onUpdate, onReset, onLoad }: OptionsDrawerProps) { //[cite: 1]
  const [importString, setImportString] = useState('');
  const [statusNotice, setStatusNotice] = useState('');

  const handleCopySave = async () => {
    try {
      const dataStr = JSON.stringify(hero.toJSON(), null, 2); //[cite: 1]
      await navigator.clipboard.writeText(dataStr);
      setStatusNotice('Save copied to clipboard!');
    } catch {
      setStatusNotice('Failed to copy to clipboard.');
    }
  };

  const handleApplyLoad = () => {
    if (!importString.trim()) return;
    const success = onLoad(importString);
    if (success) {
      setStatusNotice('Save successfully loaded!');
      setImportString('');
    } else {
      setStatusNotice('Error: Invalid JSON save format.');
    }
  };

  return (
    <aside id="options-drawer" class={isOpen ? 'active' : ''}> {/*[cite: 1] */}
      <div class="drawer-header"> {/*[cite: 1] */}
        <span>
          <Icon name="gear" /> SETTINGS {/*[cite: 1] */}
        </span>
        <button type="button" class="pixel-btn btn-danger" onClick={onClose}> {/*[cite: 1] */}
          X {/*[cite: 1] */}
        </button>
      </div>

      {/* Inventory Rule Section */}
      <div class="sidebar-field">
        <label>INVENTORY RULE</label> {/*[cite: 1] */}
        <div class="option-radio-group"> {/*[cite: 1] */}
          <div
            class={`option-radio-card ${hero.materialRule === 'total' ? 'selected' : ''}`} //[cite: 1]
            onClick={() => { hero.materialRule = 'total'; onUpdate(); }} //[cite: 1]
          >
            <strong>Total Limit (5 Total)</strong> {/*[cite: 1] */}
            <small>Hero can only carry 5 materials in total.</small> {/*[cite: 1] */}
          </div>
          <div
            class={`option-radio-card ${hero.materialRule === 'stack' ? 'selected' : ''}`} //[cite: 1]
            onClick={() => { hero.materialRule = 'stack'; onUpdate(); }} //[cite: 1]
          >
            <strong>Stack Limit (5 Each)</strong> {/*[cite: 1] */}
            <small>Hero can hold up to 5 of each material type.</small> {/*[cite: 1] */}
          </div>
        </div>
      </div>

      {/* Backup & Restore Data */}
      <div class="sidebar-field" style={{ marginTop: '20px' }}>
        <label>BACKUP & RESTORE DATA</label>
        <button
          type="button"
          class="pixel-btn btn-primary"
          style={{ width: '100%', marginBottom: '10px' }}
          onClick={handleCopySave}
        >
          COPY SAVE TO CLIPBOARD
        </button>

        <textarea
          class="pixel-input"
          placeholder="Paste save JSON here..."
          value={importString}
          onInput={(e) => setImportString((e.target as HTMLTextAreaElement).value)}
          rows={3}
          style={{ resize: 'vertical', width: '100%', marginBottom: '8px' }}
        />
        <button
          type="button"
          class="pixel-btn btn-success"
          style={{ width: '100%' }}
          onClick={handleApplyLoad}
        >
          IMPORT SAVE JSON
        </button>

        {statusNotice && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--pixel-yellow)' }}>
            {statusNotice}
          </div>
        )}
      </div>

      {/* Reset */}
      <div class="sidebar-field" style={{ marginTop: '28px' }}>
        <button type="button" class="pixel-btn btn-danger" style={{ width: '100%' }} onClick={onReset}> {/*[cite: 1] */}
          RESET CHARACTER DATA {/*[cite: 1] */}
        </button>
      </div>
    </aside>
  );
}