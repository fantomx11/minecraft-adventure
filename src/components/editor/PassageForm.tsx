import { PixelFrame } from '../ui/PixelFrame';
import { IconName, ICONS } from '../../data/icons';
import { Passage, PassageChoice } from '../../types/narrative';
import { ChoiceEditor } from './ChoiceEditor';
import { MutationListEditor } from './MutationListEditor';

interface PassageFormProps {
  passage: Passage;
  allPassageIds: string[];
  onUpdatePassage: <K extends keyof Passage>(key: K, value: Passage[K]) => void;
  onUpdateChoice: (idx: number, updated: Partial<PassageChoice>) => void;
  onAddChoice: () => void;
  onRemoveChoice: (idx: number) => void;
  onDeletePassage: (id: string) => void;
  onRenameId: (newId: string) => void;
}

export function PassageForm({
  passage,
  allPassageIds,
  onUpdatePassage,
  onUpdateChoice,
  onAddChoice,
  onRemoveChoice,
  onDeletePassage,
  onRenameId,
}: PassageFormProps) {
  const availableIcons = Object.keys(ICONS) as IconName[];

  return (
    <PixelFrame title={`EDIT: [${passage.id}]`} icon="gear">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ fontSize: '12px', color: '#555' }}>
          Referenced as target ID by choices in your story.
        </span>
        <button
          type="button"
          class="pixel-btn btn-danger"
          style={{ padding: '4px 8px', fontSize: '10px' }}
          onClick={() => onDeletePassage(passage.id)}
        >
          DELETE PASSAGE
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 120px', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label class="narrative-section-tag">PASSAGE ID</label>
          <input
            type="text"
            class="pixel-input"
            value={passage.id}
            onBlur={(e) => onRenameId((e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label class="narrative-section-tag">TITLE</label>
          <input
            type="text"
            class="pixel-input"
            value={passage.title}
            onInput={(e) => onUpdatePassage('title', (e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label class="narrative-section-tag">ICON</label>
          <select
            class="pixel-select"
            value={passage.icon || 'spark'}
            onChange={(e) => onUpdatePassage('icon', (e.target as HTMLSelectElement).value)}
          >
            <option value="">-- None --</option>
            {availableIcons.map((ic) => (
              <option key={ic} value={ic}>{ic}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label class="narrative-section-tag">PASSAGE PROSE</label>
        <textarea
          class="pixel-input"
          rows={4}
          value={passage.text}
          onInput={(e) => onUpdatePassage('text', (e.target as HTMLTextAreaElement).value)}
          style={{ resize: 'vertical' }}
        />
      </div>

      {/* On-Enter Mutations */}
      <div style={{ marginBottom: '16px' }}>
        <MutationListEditor
          title="ON ENTER PASSAGE MUTATIONS"
          mutations={passage.onEnterMutations}
          onChange={(mutations) => onUpdatePassage('onEnterMutations', mutations)}
        />
      </div>

      {/* Screen Unlocks */}
      <div style={{ marginBottom: '16px', background: '#eee', padding: '12px', border: '2px solid #000' }}>
        <label class="narrative-section-tag">UNLOCKED SUB-SCREENS</label>
        <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
          {(['forest', 'mining', 'crafting'] as const).map((view) => {
            const checked = passage.accessibleViews?.includes(view) || false;
            return (
              <label key={view} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const isCheck = (e.target as HTMLInputElement).checked;
                    const current = passage.accessibleViews || [];
                    const updated = isCheck
                      ? [...current, view]
                      : current.filter((v) => v !== view);
                    onUpdatePassage('accessibleViews', updated);
                  }}
                />
                {view.toUpperCase()}
              </label>
            );
          })}
        </div>
      </div>

      {/* Choices List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label class="narrative-section-tag">BRANCHING CHOICES ({passage.choices.length})</label>
          <button type="button" class="pixel-btn btn-success" onClick={onAddChoice}>
            + ADD CHOICE
          </button>
        </div>

        {passage.choices.map((choice, idx) => (
          <ChoiceEditor
            key={idx}
            index={idx}
            choice={choice}
            availablePassageIds={allPassageIds}
            onChange={(updated) => onUpdateChoice(idx, updated)}
            onRemove={() => onRemoveChoice(idx)}
          />
        ))}
      </div>
    </PixelFrame>
  );
}