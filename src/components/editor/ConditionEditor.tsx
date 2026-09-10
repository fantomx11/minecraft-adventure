import type { Condition, FlagComparator } from '../../types/world';
import { EQUIPMENT_DEFINITIONS, TRACKED_MATERIALS } from '../../data/recipes';

interface ConditionEditorProps {
  condition: Condition | undefined;
  onChange: (updated: Condition | undefined) => void;
  label?: string;
  allPassageIds?: string[];
  allLocationIds?: string[];
}

const COMPARATORS: FlagComparator[] = ['==', '!=', '>', '>=', '<', '<='];

export function ConditionEditor({
  condition,
  onChange,
  label = 'REQUIREMENT CONDITION',
  allPassageIds = [],
  allLocationIds = [],
}: ConditionEditorProps) {
  if (!condition) {
    return (
      <div style={{ margin: '8px 0' }}>
        <button
          type="button"
          class="pixel-btn btn-success"
          style={{ fontSize: '10px', padding: '4px 8px' }}
          onClick={() =>
            onChange({
              type: 'flag',
              flag: 'new_flag',
              comparator: '==',
              value: true,
            })
          }
        >
          + ADD CONDITION
        </button>
      </div>
    );
  }

  const handleTypeChange = (newType: string) => {
    switch (newType) {
      case 'flag':
        onChange({ type: 'flag', flag: 'flag_name', comparator: '==', value: true });
        break;
      case 'inventory':
        onChange({ type: 'inventory', itemId: TRACKED_MATERIALS[0], comparator: '>=', count: 1 });
        break;
      case 'player':
        onChange({ type: 'player', stat: 'armor', comparator: '>=', value: 1 });
        break;
      case 'progression':
        onChange({ type: 'progression', counter: 'forestCleared', comparator: '>=', value: 1 });
        break;
      case 'passage':
        onChange({ type: 'passage', passageId: allPassageIds[0] || 'start', visited: true });
        break;
      case 'location':
        onChange({ type: 'location', locationId: allLocationIds[0] || '', discovered: true });
        break;
      case 'and':
      case 'or':
        onChange({
          type: newType,
          conditions: [{ type: 'flag', flag: 'flag_1', comparator: '==', value: true }],
        });
        break;
      case 'not':
        onChange({
          type: 'not',
          condition: { type: 'flag', flag: 'flag_1', comparator: '==', value: true },
        });
        break;
    }
  };

  return (
    <div style={{ background: '#dedede', border: '2px solid #000', padding: '10px', margin: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#222' }}>{label}</span>
        <button
          type="button"
          class="pixel-btn btn-danger"
          style={{ fontSize: '9px', padding: '2px 6px' }}
          onClick={() => onChange(undefined)}
        >
          CLEAR
        </button>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label style={{ fontSize: '9px', display: 'block' }}>CONDITION TYPE</label>
        <select
          class="pixel-select"
          style={{ fontSize: '12px', padding: '4px' }}
          value={condition.type}
          onChange={(e) => handleTypeChange((e.target as HTMLSelectElement).value)}
        >
          <option value="flag">Quest Flag</option>
          <option value="inventory">Inventory (Item/Material)</option>
          <option value="player">Player Stat</option>
          <option value="progression">Progression Counter</option>
          <option value="passage">Passage Visited</option>
          <option value="location">Location Discovered</option>
          <option value="and">Logical AND Group</option>
          <option value="or">Logical OR Group</option>
          <option value="not">Logical NOT (Invert)</option>
        </select>
      </div>

      {condition.type === 'flag' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '6px' }}>
          <div>
            <label style={{ fontSize: '9px' }}>FLAG NAME</label>
            <input
              class="pixel-input"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.flag}
              onInput={(e) => onChange({ ...condition, flag: (e.target as HTMLInputElement).value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '9px' }}>COMP</label>
            <select
              class="pixel-select"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.comparator}
              onChange={(e) => onChange({ ...condition, comparator: (e.target as HTMLSelectElement).value as FlagComparator })}
            >
              {COMPARATORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '9px' }}>TARGET VALUE</label>
            <input
              class="pixel-input"
              style={{ fontSize: '11px', padding: '4px' }}
              value={String(condition.value)}
              onInput={(e) => {
                const raw = (e.target as HTMLInputElement).value;
                let val: boolean | number | string = raw;
                if (raw === 'true') val = true;
                else if (raw === 'false') val = false;
                else if (!isNaN(Number(raw)) && raw.trim() !== '') val = Number(raw);
                onChange({ ...condition, value: val });
              }}
            />
          </div>
        </div>
      )}

      {condition.type === 'inventory' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px' }}>
          <div>
            <label style={{ fontSize: '9px' }}>ITEM / MATERIAL</label>
            <input
              class="pixel-input"
              style={{ fontSize: '11px', padding: '4px' }}
              list="items-list"
              value={condition.itemId}
              onInput={(e) => onChange({ ...condition, itemId: (e.target as HTMLInputElement).value })}
            />
            <datalist id="items-list">
              {TRACKED_MATERIALS.map((m) => <option key={m} value={m} />)}
              {EQUIPMENT_DEFINITIONS.map((eq) => <option key={eq.name} value={eq.name} />)}
            </datalist>
          </div>
          <div>
            <label style={{ fontSize: '9px' }}>COMP</label>
            <select
              class="pixel-select"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.comparator || '>='}
              onChange={(e) => onChange({ ...condition, comparator: (e.target as HTMLSelectElement).value as FlagComparator })}
            >
              {COMPARATORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '9px' }}>COUNT</label>
            <input
              type="number"
              class="pixel-input"
              style={{ fontSize: '11px', padding: '4px' }}
              min="1"
              value={condition.count ?? 1}
              onInput={(e) => onChange({ ...condition, count: parseInt((e.target as HTMLInputElement).value, 10) || 1 })}
            />
          </div>
        </div>
      )}

      {condition.type === 'player' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px' }}>
          <div>
            <label style={{ fontSize: '9px' }}>STAT</label>
            <select
              class="pixel-select"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.stat}
              onChange={(e) => onChange({ ...condition, stat: (e.target as HTMLSelectElement).value as any })}
            >
              <option value="attack">Attack (ATK)</option>
              <option value="damage">Damage (DMG)</option>
              <option value="armor">Armor (ARM)</option>
              <option value="restarts">Restarts (RST)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '9px' }}>COMP</label>
            <select
              class="pixel-select"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.comparator}
              onChange={(e) => onChange({ ...condition, comparator: (e.target as HTMLSelectElement).value as FlagComparator })}
            >
              {COMPARATORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '9px' }}>VALUE</label>
            <input
              type="number"
              class="pixel-input"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.value}
              onInput={(e) => onChange({ ...condition, value: parseInt((e.target as HTMLInputElement).value, 10) || 0 })}
            />
          </div>
        </div>
      )}

      {condition.type === 'progression' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px' }}>
          <div>
            <label style={{ fontSize: '9px' }}>COUNTER</label>
            <select
              class="pixel-select"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.counter}
              onChange={(e) => onChange({ ...condition, counter: (e.target as HTMLSelectElement).value as any })}
            >
              <option value="forestCleared">Groves Cleared</option>
              <option value="mineCleared">Mines Cleared</option>
              <option value="travelSteps">Travel Steps</option>
              <option value="trekBonus">Trek Bonus</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '9px' }}>COMP</label>
            <select
              class="pixel-select"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.comparator}
              onChange={(e) => onChange({ ...condition, comparator: (e.target as HTMLSelectElement).value as FlagComparator })}
            >
              {COMPARATORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '9px' }}>VALUE</label>
            <input
              type="number"
              class="pixel-input"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.value}
              onInput={(e) => onChange({ ...condition, value: parseInt((e.target as HTMLInputElement).value, 10) || 0 })}
            />
          </div>
        </div>
      )}

      {condition.type === 'passage' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px' }}>
          <div>
            <label style={{ fontSize: '9px' }}>PASSAGE ID</label>
            <input
              class="pixel-input"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.passageId}
              onInput={(e) => onChange({ ...condition, passageId: (e.target as HTMLInputElement).value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '9px' }}>STATE</label>
            <select
              class="pixel-select"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.visited ?? true ? 'true' : 'false'}
              onChange={(e) => onChange({ ...condition, visited: (e.target as HTMLSelectElement).value === 'true' })}
            >
              <option value="true">Visited</option>
              <option value="false">Unvisited</option>
            </select>
          </div>
        </div>
      )}

      {condition.type === 'location' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px' }}>
          <div>
            <label style={{ fontSize: '9px' }}>LOCATION / POI ID</label>
            <input
              class="pixel-input"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.locationId}
              onInput={(e) => onChange({ ...condition, locationId: (e.target as HTMLInputElement).value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '9px' }}>STATE</label>
            <select
              class="pixel-select"
              style={{ fontSize: '11px', padding: '4px' }}
              value={condition.discovered ?? true ? 'true' : 'false'}
              onChange={(e) => onChange({ ...condition, discovered: (e.target as HTMLSelectElement).value === 'true' })}
            >
              <option value="true">Discovered</option>
              <option value="false">Undiscovered</option>
            </select>
          </div>
        </div>
      )}

      {(condition.type === 'and' || condition.type === 'or') && (
        <div style={{ paddingLeft: '8px', borderLeft: '3px solid #666', marginTop: '6px' }}>
          {condition.conditions.map((child, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <ConditionEditor
                label={`GROUP ITEM #${idx + 1}`}
                condition={child}
                allPassageIds={allPassageIds}
                allLocationIds={allLocationIds}
                onChange={(updated) => {
                  const copy = [...condition.conditions];
                  if (!updated) copy.splice(idx, 1);
                  else copy[idx] = updated;
                  onChange({ ...condition, conditions: copy });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            class="pixel-btn btn-success"
            style={{ fontSize: '9px', padding: '3px 6px', marginTop: '4px' }}
            onClick={() =>
              onChange({
                ...condition,
                conditions: [
                  ...condition.conditions,
                  { type: 'flag', flag: 'new_flag', comparator: '==', value: true },
                ],
              })
            }
          >
            + ADD SUB-CONDITION
          </button>
        </div>
      )}

      {condition.type === 'not' && (
        <div style={{ paddingLeft: '8px', borderLeft: '3px solid var(--pixel-red)', marginTop: '6px' }}>
          <ConditionEditor
            label="INVERTED TARGET"
            condition={condition.condition}
            allPassageIds={allPassageIds}
            allLocationIds={allLocationIds}
            onChange={(updated) => {
              if (updated) onChange({ ...condition, condition: updated });
            }}
          />
        </div>
      )}
    </div>
  );
}