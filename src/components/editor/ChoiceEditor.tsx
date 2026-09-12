import { BESTIARY } from '../../data/bestiary';
import { Expr, Action } from '../../types/ast';
import { PassageChoice } from '../../types/narrative';
import { ActionListEditor } from './ActionNodeEditor';
import { ExpressionEditor } from './ExpressionEditor';

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

      {/* Lock Feedback & Display Behavior */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '10px' }}>LOCKED REASON BADGE</label>
          <input
            type="text"
            class="pixel-input"
            placeholder="e.g. Requires Golden Key"
            value={choice.lockedReason || ''}
            onInput={(e) => onChange({ lockedReason: (e.target as HTMLInputElement).value || undefined })}
          />
        </div>
        <div>
          <label style={{ fontSize: '10px' }}>LOCKED BEHAVIOR</label>
          <select
            class="pixel-select"
            value={choice.behavior || 'disable'}
            onChange={(e) => onChange({ behavior: (e.target as HTMLSelectElement).value as any })}
          >
            <option value="disable">Disable Button</option>
            <option value="hide">Hide Completely</option>
          </select>
        </div>
      </div>

      {choice.type === 'combat' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
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
          <div>
            <label style={{ fontSize: '10px' }}>VICTORY PASSAGE</label>
            <select
              class="pixel-select"
              value={choice.onVictoryPassageId || ''}
              onChange={(e) => onChange({ onVictoryPassageId: (e.target as HTMLSelectElement).value || undefined })}
            >
              <option value="">-- Victory Node --</option>
              {availablePassageIds.map((pId) => (
                <option key={pId} value={pId}>{pId}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '10px' }}>DEFEAT PASSAGE</label>
            <select
              class="pixel-select"
              value={choice.onDefeatPassageId || ''}
              onChange={(e) => onChange({ onDefeatPassageId: (e.target as HTMLSelectElement).value || undefined })}
            >
              <option value="">-- Defeat Node --</option>
              {availablePassageIds.map((pId) => (
                <option key={pId} value={pId}>{pId}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Conditions and Mutations Plugs */}
      <ExpressionEditor
        expr={choice.condition ?? { type: 'literal', value: true }}
        onChange={(expr: Expr) => onChange({ condition: expr })}
      />

      <ActionListEditor
        actions={choice.mutations ?? []}
        onChange={(mutations: Action[]) => onChange({ mutations })}
      />
    </div>
  );
}