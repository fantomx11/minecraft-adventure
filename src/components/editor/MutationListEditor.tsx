import type { Mutation } from '../../types/world';
import { EQUIPMENT_DEFINITIONS, TRACKED_MATERIALS } from '../../data/recipes';

interface MutationListEditorProps {
  mutations: Mutation[] | undefined;
  onChange: (updated: Mutation[] | undefined) => void;
  title?: string;
  allLocationIds?: string[];
}

export function MutationListEditor({
  mutations = [],
  onChange,
  title = 'STATE MUTATIONS',
}: MutationListEditorProps) {
  const handleAddMutation = (type: 'flag' | 'inventory' | 'location') => {
    let newMut: Mutation;
    if (type === 'flag') {
      newMut = { type: 'flag', flag: 'quest_step', action: 'set', value: 1 };
    } else if (type === 'inventory') {
      newMut = { type: 'inventory', itemId: TRACKED_MATERIALS[0], action: 'add', count: 1 };
    } else {
      newMut = { type: 'location', locationId: 'poi_id', action: 'discover' };
    }
    onChange([...mutations, newMut]);
  };

  const handleUpdate = (index: number, updated: Mutation) => {
    const copy = [...mutations];
    copy[index] = updated;
    onChange(copy);
  };

  const handleRemove = (index: number) => {
    const copy = mutations.filter((_, i) => i !== index);
    onChange(copy.length > 0 ? copy : undefined);
  };

  return (
    <div style={{ background: '#dedede', border: '2px solid #000', padding: '10px', margin: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>
          {title} ({mutations.length})
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            class="pixel-btn btn-success"
            style={{ fontSize: '9px', padding: '3px 6px' }}
            onClick={() => handleAddMutation('flag')}
          >
            + FLAG
          </button>
          <button
            type="button"
            class="pixel-btn btn-primary"
            style={{ fontSize: '9px', padding: '3px 6px' }}
            onClick={() => handleAddMutation('inventory')}
          >
            + ITEM
          </button>
          <button
            type="button"
            class="pixel-btn btn-active"
            style={{ fontSize: '9px', padding: '3px 6px' }}
            onClick={() => handleAddMutation('location')}
          >
            + MAP
          </button>
        </div>
      </div>

      {mutations.length === 0 && (
        <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
          No mutations attached. (State remains unchanged when triggered).
        </div>
      )}

      {mutations.map((mut, idx) => (
        <div
          key={idx}
          style={{
            background: '#fff',
            border: '2px solid #000',
            padding: '8px',
            marginBottom: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              #{idx + 1} {mut.type} MUTATION
            </span>
            <button
              type="button"
              class="pixel-btn btn-danger"
              style={{ fontSize: '8px', padding: '2px 4px' }}
              onClick={() => handleRemove(idx)}
            >
              REMOVE
            </button>
          </div>

          {mut.type === 'flag' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '6px' }}>
              <div>
                <label style={{ fontSize: '8px' }}>FLAG</label>
                <input
                  class="pixel-input"
                  style={{ fontSize: '11px', padding: '4px' }}
                  value={mut.flag}
                  onInput={(e) => handleUpdate(idx, { ...mut, flag: (e.target as HTMLInputElement).value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '8px' }}>ACTION</label>
                <select
                  class="pixel-select"
                  style={{ fontSize: '11px', padding: '4px' }}
                  value={mut.action}
                  onChange={(e) => handleUpdate(idx, { ...mut, action: (e.target as HTMLSelectElement).value as any })}
                >
                  <option value="set">Set</option>
                  <option value="add">Add (+)</option>
                  <option value="toggle">Toggle</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '8px' }}>VALUE</label>
                <input
                  class="pixel-input"
                  style={{ fontSize: '11px', padding: '4px' }}
                  disabled={mut.action === 'toggle' || mut.action === 'delete'}
                  value={mut.value !== undefined ? String(mut.value) : ''}
                  onInput={(e) => {
                    const raw = (e.target as HTMLInputElement).value;
                    let val: boolean | number | string = raw;
                    if (raw === 'true') val = true;
                    else if (raw === 'false') val = false;
                    else if (!isNaN(Number(raw)) && raw.trim() !== '') val = Number(raw);
                    handleUpdate(idx, { ...mut, value: val });
                  }}
                />
              </div>
            </div>
          )}

          {mut.type === 'inventory' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px' }}>
              <div>
                <label style={{ fontSize: '8px' }}>ITEM / MATERIAL</label>
                <input
                  class="pixel-input"
                  style={{ fontSize: '11px', padding: '4px' }}
                  list="items-list"
                  value={mut.itemId}
                  onInput={(e) => handleUpdate(idx, { ...mut, itemId: (e.target as HTMLInputElement).value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '8px' }}>ACTION</label>
                <select
                  class="pixel-select"
                  style={{ fontSize: '11px', padding: '4px' }}
                  value={mut.action}
                  onChange={(e) => handleUpdate(idx, { ...mut, action: (e.target as HTMLSelectElement).value as any })}
                >
                  <option value="add">Add (+)</option>
                  <option value="remove">Remove (-)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '8px' }}>COUNT</label>
                <input
                  type="number"
                  min="1"
                  class="pixel-input"
                  style={{ fontSize: '11px', padding: '4px' }}
                  value={mut.count ?? 1}
                  onInput={(e) => handleUpdate(idx, { ...mut, count: parseInt((e.target as HTMLInputElement).value, 10) || 1 })}
                />
              </div>
            </div>
          )}

          {mut.type === 'location' && (
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '6px' }}>
              <div>
                <label style={{ fontSize: '8px' }}>DISCOVER REGION / POI ID</label>
                <input
                  class="pixel-input"
                  style={{ fontSize: '11px', padding: '4px' }}
                  value={mut.locationId}
                  onInput={(e) => handleUpdate(idx, { ...mut, locationId: (e.target as HTMLInputElement).value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '8px' }}>ACTION</label>
                <input class="pixel-input" style={{ fontSize: '11px', padding: '4px' }} value="DISCOVER" disabled />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}