import { useState } from 'preact/hooks';
import { Character } from "../../models/Character";
import { Icon } from "../ui/Icon";
import { Passage } from '../../types/narrative';

interface OptionsDrawerProps {
  hero: Character;
  isOpen: boolean;
  passages: Record<string, Passage>;
  isCustomStory: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onReset: () => void;
  onLoad: (json: string) => boolean;
  onLoadStory: (json: string) => boolean;
  onResetStory: () => void;
}

export function OptionsDrawer({
  hero,
  isOpen,
  passages,
  isCustomStory,
  onClose,
  onUpdate,
  onReset,
  onLoad,
  onLoadStory,
  onResetStory,
}: OptionsDrawerProps) {
  const [importString, setImportString] = useState('');
  const [statusNotice, setStatusNotice] = useState('');
  const [storyImportString, setStoryImportString] = useState('');
  const [storyNotice, setStoryNotice] = useState('');

  const handleCopyStory = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(passages, null, 2));
      setStoryNotice('Current story JSON copied to clipboard!');
    } catch {
      setStoryNotice('Failed to copy story to clipboard.');
    }
  };

  const handleApplyStory = () => {
    if (!storyImportString.trim()) return;
    const ok = onLoadStory(storyImportString);
    if (ok) {
      setStoryNotice('Custom narrative pack loaded successfully!');
      setStoryImportString('');
    } else {
      setStoryNotice('Error: Invalid narrative pack schema. Must contain valid passages.');
    }
  };

  const handleCopySave = async () => {
    try {
      const dataStr = JSON.stringify(hero.toJSON(), null, 2);
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
        <label>GAMEPLAY MODE</label>
        <div class="option-radio-group">
          <div
            class={`option-radio-card ${!hero.narrativeMode ? 'selected' : ''}`}
            onClick={() => {
              hero.narrativeMode = false;
              onUpdate();
            }}
          >
            <strong>Sandbox Mode</strong>
            <small>Free navigation between Combat, Forest, Mining, and Crafting.</small>
          </div>
          <div
            class={`option-radio-card ${hero.narrativeMode ? 'selected' : ''}`}
            onClick={() => {
              hero.narrativeMode = true;
              onUpdate();
            }}
          >
            <strong>Narrative Mode</strong>
            <small>Story passages with choices, item requirements, and screen unlocks.</small>
          </div>
        </div>

        {/* Narrative Story Pack Loader */}
        {hero.narrativeMode && (
          <div class="sidebar-field" style={{ marginBottom: '24px' }}>
            <label>
              <Icon name="book" /> STORY PACK (JSON)
            </label>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
              Current: <strong>{isCustomStory ? 'Custom Narrative' : 'Built-in Overworld Quest'}</strong> (
              {Object.keys(passages).length} passages)
            </div>

            <button
              type="button"
              class="pixel-btn"
              style={{ width: '100%', marginBottom: '8px' }}
              onClick={handleCopyStory}
            >
              EXPORT CURRENT STORY JSON
            </button>

            <textarea
              class="pixel-input"
              placeholder="Paste custom narrative JSON here..."
              value={storyImportString}
              onInput={(e) => setStoryImportString((e.target as HTMLTextAreaElement).value)}
              rows={3}
              style={{ resize: 'vertical', width: '100%', marginBottom: '8px' }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                class="pixel-btn btn-success"
                style={{ flex: 1 }}
                onClick={handleApplyStory}
              >
                LOAD STORY JSON
              </button>
              {isCustomStory && (
                <button
                  type="button"
                  class="pixel-btn btn-danger"
                  onClick={onResetStory}
                >
                  RESET STORY
                </button>
              )}
            </div>

            {storyNotice && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--pixel-yellow)' }}>
                {storyNotice}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inventory Rule Section */}
      <div class="sidebar-field">
        <label>INVENTORY RULE</label>
        <div class="option-radio-group">
          <div
            class={`option-radio-card ${hero.materialRule === 'total' ? 'selected' : ''}`}
            onClick={() => { hero.materialRule = 'total'; onUpdate(); }}
          >
            <strong>Total Limit (5 Total)</strong>
            <small>Hero can only carry 5 materials in total.</small>
          </div>
          <div
            class={`option-radio-card ${hero.materialRule === 'stack' ? 'selected' : ''}`}
            onClick={() => { hero.materialRule = 'stack'; onUpdate(); }}
          >
            <strong>Stack Limit (5 Each)</strong>
            <small>Hero can hold up to 5 of each material type.</small>
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
        <button type="button" class="pixel-btn btn-danger" style={{ width: '100%' }} onClick={onReset}>
          RESET CHARACTER DATA
        </button>
      </div>
    </aside>
  );
}