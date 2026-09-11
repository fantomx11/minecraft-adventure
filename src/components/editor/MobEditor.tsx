// src/components/editor/MobEditor.tsx
import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import type { MobConfig } from '../../models/Mob';
import type { CombatHookEvent, CombatBehaviorAst, Action } from '../../types/ast';
import { AstInterpreter } from '../../engine/astInterpreter';
import { ActionListEditor } from './ActionNodeEditor';

interface MobEditorProps {
  initialMob?: Partial<MobConfig>;
  onSave: (mob: MobConfig) => void;
  onCancel?: () => void;
}

const COMBAT_HOOK_TABS: { id: CombatHookEvent; label: string }[] = [
  { id: 'onRollEvaluated', label: 'Roll Evaluated' },
  { id: 'onRoundStart', label: 'Round Start' },
  { id: 'onDealDamage', label: 'Deal Damage' },
  { id: 'onReceiveDamage', label: 'Receive Damage' },
  { id: 'onCombatStart', label: 'Combat Start' },
  { id: 'onRoundEnd', label: 'Round End' },
  { id: 'onDeath', label: 'On Death' },
];

export function MobEditor({ initialMob, onSave, onCancel }: MobEditorProps) {
  const [mob, setMob] = useState<MobConfig>({
    id: initialMob?.id || `mob_${Math.random().toString(36).substring(2, 7)}`,
    name: initialMob?.name || 'New Monster',
    maxHearts: initialMob?.maxHearts ?? 10,
    hearts: initialMob?.hearts ?? initialMob?.maxHearts ?? 10,
    damage: initialMob?.damage ?? 2,
    defense: initialMob?.defense ?? 4,
    rulesText: initialMob?.rulesText || '',
    lootText: initialMob?.lootText || '',
    behavior: initialMob?.behavior || {},
    loot: initialMob?.loot || [
      {
        type: 'if',
        condition: {
          type: 'binary',
          op: '>=',
          left: { type: 'get', path: 'roll' },
          right: { type: 'literal', value: 5 },
        },
        then: [{ type: 'loot_action', reward: { type: 'literal', value: '1 String' } }],
        else: [{ type: 'loot_action', reward: { type: 'literal', value: 'No loot' } }],
      },
    ],
  });

  const [activeTab, setActiveTab] = useState<'stats' | 'triggers' | 'loot' | 'raw'>('triggers');
  const [activeHook, setActiveHook] = useState<CombatHookEvent>('onRollEvaluated');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const hasValidLoot = AstInterpreter.hasActionType(mob.loot, 'loot_action');

  const updateStat = (key: keyof MobConfig, val: any) => {
    setMob((prev) => ({ ...prev, [key]: val }));
  };

  const updateHookActions = (hook: CombatHookEvent, actions: Action[]) => {
    setMob((prev) => ({
      ...prev,
      behavior: {
        ...prev.behavior,
        [hook]: actions,
      },
    }));
  };

  const handleSave = () => {
    if (!hasValidLoot) {
      alert('Validation Error: Loot script must declare at least one "loot_action" payout block.');
      return;
    }
    onSave(mob);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'monospace',
        border: '3px solid #000',
        boxShadow: '4px 4px 0px #000',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#1e293b',
          padding: '8px 12px',
          borderBottom: '2px solid #000',
        }}
      >
        <span style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '13px' }}>
          👾 MOB EDITOR: {mob.name.toUpperCase()} [{mob.id}]
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
            style={{
              background: '#10b981',
              color: '#000',
              fontWeight: 'bold',
              border: '2px solid #000',
              cursor: 'pointer',
              padding: '4px 10px',
            }}
          >
            SAVE MOB
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                background: '#64748b',
                color: '#fff',
                border: '2px solid #000',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              CLOSE
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', background: '#020617', borderBottom: '2px solid #000' }}>
        {[
          { id: 'triggers', label: '⚡ Combat Hooks' },
          { id: 'loot', label: `💎 Loot Table ${!hasValidLoot ? '(!)' : ''}` },
          { id: 'stats', label: '📋 Vitals & Text' },
          { id: 'raw', label: '{ } AST JSON' },
        ].map((t) => (
          <button
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '8px 14px',
              background: activeTab === t.id ? '#1e293b' : 'transparent',
              color: activeTab === t.id ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderRight: '1px solid #1e293b',
              fontWeight: activeTab === t.id ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {activeTab === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '600px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>Monster Name</label>
              <input
                type="text"
                value={mob.name}
                onInput={(e) => updateStat('name', (e.target as HTMLInputElement).value)}
                style={{ width: '100%', background: '#1e293b', color: '#fff', border: '1px solid #475569', padding: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>Unique Identifier ID</label>
              <input
                type="text"
                value={mob.id}
                onInput={(e) => updateStat('id', (e.target as HTMLInputElement).value)}
                style={{ width: '100%', background: '#1e293b', color: '#fff', border: '1px solid #475569', padding: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>Max Health (Hearts)</label>
              <input
                type="number"
                value={mob.maxHearts}
                onInput={(e) => updateStat('maxHearts', Number((e.target as HTMLInputElement).value))}
                style={{ width: '100%', background: '#1e293b', color: '#ef4444', border: '1px solid #475569', padding: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>Attack Damage</label>
              <input
                type="number"
                value={mob.damage}
                onInput={(e) => updateStat('damage', Number((e.target as HTMLInputElement).value))}
                style={{ width: '100%', background: '#1e293b', color: '#f97316', border: '1px solid #475569', padding: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>Defense / Armor Target</label>
              <input
                type="number"
                value={mob.defense}
                onInput={(e) => updateStat('defense', Number((e.target as HTMLInputElement).value))}
                style={{ width: '100%', background: '#1e293b', color: '#3b82f6', border: '1px solid #475569', padding: '4px' }}
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>Display Rules Text</label>
              <textarea
                value={mob.rulesText || ''}
                onInput={(e) => updateStat('rulesText', (e.target as HTMLTextAreaElement).value)}
                rows={2}
                style={{ width: '100%', background: '#1e293b', color: '#fff', border: '1px solid #475569', padding: '4px' }}
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>Display Loot Text</label>
              <textarea
                value={mob.lootText || ''}
                onInput={(e) => updateStat('lootText', (e.target as HTMLTextAreaElement).value)}
                rows={2}
                style={{ width: '100%', background: '#1e293b', color: '#fff', border: '1px solid #475569', padding: '4px' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'triggers' && (
          <div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {COMBAT_HOOK_TABS.map((tab) => {
                const count = mob.behavior?.[tab.id]?.length || 0;
                return (
                  <button
                    onClick={() => setActiveHook(tab.id)}
                    style={{
                      background: activeHook === tab.id ? '#38bdf8' : '#1e293b',
                      color: activeHook === tab.id ? '#000' : '#cbd5e1',
                      border: '1px solid #000',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: '11px',
                    }}
                  >
                    {tab.label} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>
            <div style={{ background: '#020617', padding: '10px', border: '2px solid #1e293b' }}>
              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                Event: {activeHook}
              </span>
              <ActionListEditor
                actions={mob.behavior?.[activeHook] || []}
                onChange={(actions) => updateHookActions(activeHook, actions)}
              />
            </div>
          </div>
        )}

        {activeTab === 'loot' && (
          <div>
            {!hasValidLoot && (
              <div
                style={{
                  background: '#7f1d1d',
                  color: '#fecaca',
                  padding: '6px 10px',
                  marginBottom: '10px',
                  border: '1px solid #ef4444',
                }}
              >
                ⚠️ Missing Required Block: Loot scripts must execute at least one <strong>loot_action</strong>.
              </div>
            )}
            <ActionListEditor actions={mob.loot || []} onChange={(actions) => updateStat('loot', actions)} />
          </div>
        )}

        {activeTab === 'raw' && (
          <div>
            {jsonError && <div style={{ color: '#ef4444', marginBottom: '6px' }}>{jsonError}</div>}
            <textarea
              value={JSON.stringify(mob, null, 2)}
              rows={22}
              onInput={(e) => {
                try {
                  const parsed = JSON.parse((e.target as HTMLTextAreaElement).value);
                  setMob(parsed);
                  setJsonError(null);
                } catch (err: any) {
                  setJsonError(err.message);
                }
              }}
              style={{
                width: '100%',
                background: '#020617',
                color: '#50fa7b',
                fontFamily: 'monospace',
                fontSize: '11px',
                border: '1px solid #334155',
                padding: '8px',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}