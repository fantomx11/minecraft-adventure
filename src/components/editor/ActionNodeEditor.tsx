import type { Action } from '../../types/ast';
import { ExpressionEditor } from './ExpressionEditor';

interface ActionNodeEditorProps {
  action: Action;
  onChange: (updated: Action) => void;
  onDelete: () => void;
}

interface ActionListEditorProps {
  actions: Action[];
  onChange: (actions: Action[]) => void;
  allowedTypes?: Action['type'][];
}

const ACTION_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  if: { bg: '#1e293b', border: '#38bdf8', label: 'BRANCH [IF]' },
  deal_damage: { bg: '#3b1d1d', border: '#ef4444', label: 'DEAL DAMAGE' },
  change_health: { bg: '#2e1065', border: '#a855f7', label: 'CHANGE HP' },
  modify_damage_instances: { bg: '#451a03', border: '#f97316', label: 'DAMAGE FILTER' },
  set: { bg: '#064e3b', border: '#10b981', label: 'SET VARIABLE' },
  modify: { bg: '#064e3b', border: '#34d399', label: 'MODIFY VALUE' },
  inventory: { bg: '#422006', border: '#d97706', label: 'INVENTORY' },
  message: { bg: '#262626', border: '#a3a3a3', label: 'LOG MESSAGE' },
  add_effect: { bg: '#581c87', border: '#c084fc', label: 'ADD STATUS EFFECT' },
  clear_damage: { bg: '#1f2937', border: '#6b7280', label: 'CANCEL DAMAGE' },
  clear_mob_damage: { bg: '#1f2937', border: '#6b7280', label: 'CANCEL MOB ATTACK' },
  prevent_death: { bg: '#713f12', border: '#eab308', label: 'PREVENT DEATH' },
  loot_action: { bg: '#713f12', border: '#facc15', label: 'LOOT REWARD' },
};

export function ActionNodeEditor({ action, onChange, onDelete }: ActionNodeEditorProps) {
  const theme = ACTION_COLORS[action.type] || { bg: '#18181b', border: '#52525b', label: action.type };

  const update = (patch: Partial<any>) => {
    onChange({ ...action, ...patch } as Action);
  };

  return (
    <div
      class="ast-font"
      style={{
        background: theme.bg,
        borderLeft: `4px solid ${theme.border}`,
        borderTop: '2px solid #000',
        borderRight: '2px solid #000',
        borderBottom: '2px solid #000',
        boxShadow: '2px 2px 0px #000',
        padding: '6px 8px',
        marginBottom: '6px',
        fontFamily: "'TIC-80 Narrow', monospace",
        fontSize: '11px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ color: theme.border, fontWeight: 'bold', fontSize: '10px' }}>{theme.label}</span>
        <button
          onClick={onDelete}
          style={{
            background: '#ef4444',
            color: '#fff',
            border: '1px solid #000',
            cursor: 'pointer',
            padding: '1px 5px',
            fontSize: '10px',
          }}
        >
          X
        </button>
      </div>

      {action.type === 'if' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Condition:</span>
            <ExpressionEditor expr={action.condition} onChange={(condition) => update({ condition })} />
          </div>
          <div style={{ marginLeft: '12px', borderLeft: '2px dashed #475569', paddingLeft: '8px' }}>
            <span style={{ color: '#38bdf8', fontSize: '10px' }}>THEN:</span>
            <ActionListEditor actions={action.then} onChange={(then) => update({ then })} />
          </div>
          <div style={{ marginLeft: '12px', borderLeft: '2px dashed #475569', paddingLeft: '8px', marginTop: '6px' }}>
            <span style={{ color: '#94a3b8', fontSize: '10px' }}>ELSE:</span>
            <ActionListEditor actions={action.else || []} onChange={(elseBranch) => update({ else: elseBranch })} />
          </div>
        </div>
      )}

      {action.type === 'deal_damage' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span>Target:</span>
          <select
            value={action.target}
            onChange={(e) => update({ target: (e.target as HTMLSelectElement).value })}
            style={{ background: '#111', color: '#fff', border: '1px solid #444' }}
          >
            <option value="hero">Hero</option>
            <option value="mob">Mob</option>
          </select>
          <span>Amount:</span>
          <ExpressionEditor expr={action.amount} onChange={(amount) => update({ amount })} />
          <span>Source:</span>
          <input
            type="text"
            value={action.source}
            onInput={(e) => update({ source: (e.target as HTMLInputElement).value })}
            style={{ background: '#111', color: '#fff', border: '1px solid #444', width: '120px' }}
          />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={action.appliesArmor ?? true}
              onChange={(e) => update({ appliesArmor: (e.target as HTMLInputElement).checked })}
            />
            Applies Armor
          </label>
        </div>
      )}

      {action.type === 'change_health' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Target:</span>
          <select
            value={action.target}
            onChange={(e) => update({ target: (e.target as HTMLSelectElement).value })}
            style={{ background: '#111', color: '#fff', border: '1px solid #444' }}
          >
            <option value="hero">Hero</option>
            <option value="mob">Mob</option>
          </select>
          <span>Amount (+/-):</span>
          <ExpressionEditor expr={action.amount} onChange={(amount) => update({ amount })} />
        </div>
      )}

      {action.type === 'modify_damage_instances' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span>Modify:</span>
          <select
            value={action.target}
            onChange={(e) => update({ target: (e.target as HTMLSelectElement).value })}
            style={{ background: '#111', color: '#fff', border: '1px solid #444' }}
          >
            <option value="hero_damage">Hero Attacks</option>
            <option value="mob_damage">Mob Attacks</option>
          </select>
          <span>Delta:</span>
          <ExpressionEditor
            expr={action.delta || { type: 'literal', value: 0 }}
            onChange={(delta) => update({ delta })}
          />
        </div>
      )}

      {action.type === 'set' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span>Target Variable:</span>
          <input
            type="text"
            value={action.target}
            onInput={(e) => update({ target: (e.target as HTMLInputElement).value })}
            style={{ background: '#111', color: '#fff', border: '1px solid #444', width: '120px' }}
          />
          <span>=</span>
          <ExpressionEditor expr={action.value} onChange={(value) => update({ value })} />
        </div>
      )}

      {action.type === 'modify' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span>Variable:</span>
          <input
            type="text"
            value={action.target}
            onInput={(e) => update({ target: (e.target as HTMLInputElement).value })}
            style={{ background: '#111', color: '#fff', border: '1px solid #444', width: '100px' }}
          />
          <select
            value={action.op}
            onChange={(e) => update({ op: (e.target as HTMLSelectElement).value })}
            style={{ background: '#111', color: '#fff', border: '1px solid #444' }}
          >
            <option value="add">Add (+)</option>
            <option value="multiply">Multiply (*)</option>
          </select>
          <ExpressionEditor expr={action.value} onChange={(value) => update({ value })} />
        </div>
      )}

      {action.type === 'inventory' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <select
            value={action.action}
            onChange={(e) => update({ action: (e.target as HTMLSelectElement).value })}
            style={{ background: '#111', color: '#fff', border: '1px solid #444' }}
          >
            <option value="add">Give Item</option>
            <option value="remove">Remove Item</option>
          </select>
          <input
            type="text"
            placeholder="Item / Material ID"
            value={typeof action.itemId === 'string' ? action.itemId : ''}
            onInput={(e) => update({ itemId: (e.target as HTMLInputElement).value })}
            style={{ background: '#111', color: '#fff', border: '1px solid #444', width: '110px' }}
          />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={action.isMaterial ?? false}
              onChange={(e) => update({ isMaterial: (e.target as HTMLInputElement).checked })}
            />
            Is Material
          </label>
        </div>
      )}

      {action.type === 'message' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span>Style:</span>
          <select
            value={action.messageType}
            onChange={(e) => update({ messageType: (e.target as HTMLSelectElement).value })}
            style={{ background: '#111', color: '#fff', border: '1px solid #444' }}
          >
            <option value="special">Special (Gold)</option>
            <option value="notice">Notice (Blue)</option>
            <option value="hit">Hit</option>
            <option value="miss">Miss</option>
          </select>
          <span>Text:</span>
          <ExpressionEditor expr={action.text} onChange={(text) => update({ text })} />
        </div>
      )}

      {action.type === 'add_effect' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Apply:</span>
          <select
            value={action.effect}
            onChange={(e) => update({ effect: (e.target as HTMLSelectElement).value })}
            style={{ background: '#111', color: '#fff', border: '1px solid #444' }}
          >
            <option value="poison">Poison</option>
            <option value="vex">Summon Vex</option>
          </select>
          <span>Stacks:</span>
          <ExpressionEditor
            expr={action.amount || { type: 'literal', value: 1 }}
            onChange={(amount) => update({ amount })}
          />
        </div>
      )}

      {action.type === 'loot_action' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Award Log:</span>
          <ExpressionEditor expr={action.reward} onChange={(reward) => update({ reward })} />
        </div>
      )}
    </div>
  );
}

export function ActionListEditor({ actions, onChange }: ActionListEditorProps) {
  const addAction = (type: Action['type']) => {
    let newAction: Action;
    switch (type) {
      case 'if':
        newAction = {
          type: 'if',
          condition: {
            type: 'binary',
            op: '>=',
            left: { type: 'get', path: 'round.matchingMisses' },
            right: { type: 'literal', value: 2 },
          },
          then: [],
        };
        break;
      case 'deal_damage':
        newAction = {
          type: 'deal_damage',
          target: 'hero',
          amount: { type: 'get', path: 'mob.damage' },
          source: 'Special Strike',
          appliesArmor: true,
        };
        break;
      case 'change_health':
        newAction = { type: 'change_health', target: 'hero', amount: { type: 'literal', value: -4 } };
        break;
      case 'set':
        newAction = { type: 'set', target: 'mob.defense', value: { type: 'literal', value: 5 } };
        break;
      case 'modify':
        newAction = { type: 'modify', target: 'mob.damage', op: 'multiply', value: { type: 'literal', value: 2 } };
        break;
      case 'inventory':
        newAction = { type: 'inventory', action: 'add', itemId: 'Iron', isMaterial: true };
        break;
      case 'message':
        newAction = { type: 'message', messageType: 'special', text: { type: 'literal', value: '⚡ Power surge!' } };
        break;
      case 'add_effect':
        newAction = { type: 'add_effect', effect: 'poison', amount: { type: 'literal', value: 1 } };
        break;
      case 'loot_action':
        newAction = { type: 'loot_action', reward: { type: 'literal', value: '1 Iron' } };
        break;
      default:
        newAction = { type: 'clear_damage', target: 'hero' };
        break;
    }
    onChange([...actions, newAction]);
  };

  const updateNode = (index: number, updated: Action) => {
    const next = [...actions];
    next[index] = updated;
    onChange(next);
  };

  const deleteNode = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  return (
    <div style={{ marginTop: '4px' }}>
      {actions.map((act, i) => (
        <ActionNodeEditor key={i} action={act} onChange={(node) => updateNode(i, node)} onDelete={() => deleteNode(i)} />
      ))}
      <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }} class="ast-font">
        <select
          id="action-add-select"
          style={{
            background: '#18181b',
            color: '#fff',
            border: '1px solid #444',
            fontSize: '12px',
          }}
          onChange={(e) => {
            const select = e.target as HTMLSelectElement;
            if (select.value) {
              addAction(select.value as Action['type']);
              select.value = '';
            }
          }}
        >
          <option value="">+ Add Action Block...</option>
          <option value="if">Branch (If/Else)</option>
          <option value="deal_damage">Deal Damage</option>
          <option value="change_health">Change Health</option>
          <option value="set">Set Variable</option>
          <option value="modify">Modify Value (*, +)</option>
          <option value="inventory">Give / Take Item</option>
          <option value="message">Combat Message</option>
          <option value="add_effect">Status Effect (Poison/Vex)</option>
          <option value="loot_action">Loot Reward (Macro)</option>
        </select>
      </div>
    </div>
  );
}