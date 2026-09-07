// src/components/editor/ChoiceEditor.tsx
import { BESTIARY } from '../../data/bestiary';
import { EQUIPMENT_DEFINITIONS } from '../../data/recipes';
import { PassageChoice } from '../../types/narrative';

interface ChoiceEditorProps {
  index: number;
  choice: PassageChoice;
  availablePassageIds: string[];
  onChange: (updated: Partial<PassageChoice>) => void;
  onRemove: () => void;
}

export function ChoiceEditor({
  index,
  choice,
  availablePassageIds,
  onChange,
  onRemove,
}: ChoiceEditorProps) {
  return (
    <div class="editor-choice-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Option #{index + 1}</span>
        <button
          type="button"
          class="pixel-btn btn-danger"
          style={{ padding: '2px 6px', fontSize: '10px' }}
          onClick={onRemove}
        >
          REMOVE
        </button>
      </div>

      <div>
        <label style={{ fontSize: '10px' }}>BUTTON TEXT</label>
        <input
          type="text"
          class="pixel-input"
          value={choice.text}
          onInput={(e) => onChange({ text: (e.target as HTMLInputElement).value })}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '10px' }}>CHOICE TYPE</label>
          <select
            class="pixel-select"
            value={choice.type || 'passage'}
            onChange={(e) => onChange({ type: (e.target as HTMLSelectElement).value as any })}
          >
            <option value="passage">Passage Branch</option>
            <option value="combat">Combat Encounter</option>
            <option value="view">Open Screen</option>
            <option value="dice_check">Dice Check</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '10px' }}>TARGET PASSAGE</label>
          <select
            class="pixel-select"
            value={choice.targetPassageId || ''}
            onChange={(e) => onChange({ targetPassageId: (e.target as HTMLSelectElement).value })}
          >
            <option value="">-- None --</option>
            {availablePassageIds.map((pId) => (
              <option key={pId} value={pId}>
                {pId}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Item Requirements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '10px' }}>REQUIRES ITEM</label>
          <select
            class="pixel-select"
            value={choice.requiresItem || ''}
            onChange={(e) =>
              onChange({ requiresItem: (e.target as HTMLSelectElement).value || undefined })
            }
          >
            <option value="">-- None --</option>
            {EQUIPMENT_DEFINITIONS.map((eq) => (
              <option key={eq.name} value={eq.name}>
                {eq.name}
              </option>
            ))}
          </select>
        </div>

        {choice.type === 'combat' && (
          <div>
            <label style={{ fontSize: '10px' }}>TRIGGER MOB</label>
            <select
              class="pixel-select"
              value={choice.mob || BESTIARY[0].name}
              onChange={(e) => onChange({ mob: (e.target as HTMLSelectElement).value })}
            >
              {BESTIARY.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}