import { Fragment } from 'preact';
import { useState } from 'preact/hooks';
import type { MobConfig } from '../../models/Mob';
import type { GamePackage } from '../../types/package';
import { MobRegistry } from '../../engine/mobRegistry';
import { MobEditor } from './MobEditor';

interface MobManagerModalProps {
  customMobs: Record<string, MobConfig>;
  onUpdateMobs: (updated: Record<string, MobConfig>) => void;
  onClose: () => void;
  onSelectMob?: (mobId: string, mobName: string) => void;
  onExportPackage?: () => void;
  onImportPackage?: (pkg: GamePackage) => void;
}

export function MobManagerModal({
  customMobs,
  onUpdateMobs,
  onClose,
  onSelectMob,
  onExportPackage,
  onImportPackage,
}: MobManagerModalProps) {
  const [editingMob, setEditingMob] = useState<MobConfig | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allMobs = MobRegistry.getAllAvailableConfigs(customMobs);
  const customMobKeys = Object.keys(customMobs);

  const handleSaveMob = (mob: MobConfig) => {
    onUpdateMobs({
      ...customMobs,
      [mob.id]: mob,
    });
    setEditingMob(null);
  };

  const handleDeleteMob = (id: string) => {
    if (confirm(`Delete custom mob [${id}]?`)) {
      const next = { ...customMobs };
      delete next[id];
      onUpdateMobs(next);
      if (selectedId === id) setSelectedId(null);
    }
  };

  const handleCloneDefault = (source: MobConfig) => {
    const cloneId = `${source.id || 'mob'}_copy_${Math.random().toString(36).substring(2, 6)}`;
    const cloned: MobConfig = {
      ...JSON.parse(JSON.stringify(source)),
      id: cloneId,
      name: `${source.name} (Custom)`,
    };
    onUpdateMobs({ ...customMobs, [cloneId]: cloned });
    setEditingMob(cloned);
  };

  const handleFileImport = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !onImportPackage) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const pkg = JSON.parse(event.target?.result as string) as GamePackage;
        onImportPackage(pkg);
      } catch (err: any) {
        alert(`Invalid package JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '16px',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          width: '900px',
          height: '650px',
          background: '#0f172a',
          border: '4px solid #000',
          boxShadow: '6px 6px 0px #000',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {editingMob ? (
          <MobEditor
            initialMob={editingMob}
            onSave={handleSaveMob}
            onCancel={() => setEditingMob(null)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div
              style={{
                background: '#1e293b',
                padding: '10px 14px',
                borderBottom: '3px solid #000',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '13px' }}>
                👾 PACKAGE MOBS & ENCOUNTERS
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {onExportPackage && (
                  <button
                    onClick={onExportPackage}
                    style={{
                      background: '#3b82f6',
                      color: '#fff',
                      border: '2px solid #000',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: '11px',
                    }}
                  >
                    💾 EXPORT JSON
                  </button>
                )}
                {onImportPackage && (
                  <label
                    style={{
                      background: '#8b5cf6',
                      color: '#fff',
                      border: '2px solid #000',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: '11px',
                      display: 'inline-block',
                    }}
                  >
                    📁 IMPORT JSON
                    <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
                  </label>
                )}
                <button
                  onClick={onClose}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: '2px solid #000',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: '11px',
                  }}
                >
                  CLOSE
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left Column: Mob List */}
              <div
                style={{
                  width: '320px',
                  borderRight: '3px solid #000',
                  background: '#020617',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ padding: '8px', borderBottom: '1px solid #1e293b' }}>
                  <button
                    onClick={() =>
                      setEditingMob({
                        id: `custom_${Math.random().toString(36).substring(2, 7)}`,
                        name: 'New Monster',
                        maxHearts: 10,
                        damage: 2,
                        defense: 4,
                        behavior: {},
                        loot: [],
                      })
                    }
                    style={{
                      width: '100%',
                      background: '#10b981',
                      color: '#000',
                      fontWeight: 'bold',
                      border: '2px solid #000',
                      cursor: 'pointer',
                      padding: '6px',
                    }}
                  >
                    + CREATE NEW MOB
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', margin: '4px 6px' }}>PACKAGE MOBS</div>
                  {customMobKeys.length === 0 && (
                    <div style={{ color: '#475569', fontSize: '11px', padding: '6px' }}>
                      No custom mobs defined yet.
                    </div>
                  )}
                  {customMobKeys.map((id) => {
                    const m = customMobs[id];
                    const isSelected = selectedId === id;
                    return (
                      <div
                        key={id}
                        onClick={() => setSelectedId(id)}
                        style={{
                          background: isSelected ? '#1e293b' : '#0f172a',
                          border: isSelected ? '1px solid #38bdf8' : '1px solid #1e293b',
                          padding: '6px 8px',
                          marginBottom: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '12px' }}>{m.name}</div>
                          <div style={{ color: '#64748b', fontSize: '10px' }}>ID: {id}</div>
                        </div>
                        <span style={{ color: '#ef4444', fontSize: '10px' }}>❤ {m.maxHearts}</span>
                      </div>
                    );
                  })}

                  <div style={{ fontSize: '10px', color: '#64748b', margin: '10px 6px 4px' }}>
                    BASE BESTIARY TEMPLATES
                  </div>
                  {Object.values(allMobs)
                    .filter((m) => !customMobs[m.id])
                    .map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedId(m.id)}
                        style={{
                          background: selectedId === m.id ? '#1e293b' : '#090d16',
                          border: '1px solid #1e293b',
                          padding: '4px 8px',
                          marginBottom: '3px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          opacity: 0.75,
                        }}
                      >
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>{m.name}</span>
                        <span style={{ color: '#475569', fontSize: '10px' }}>Base</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Right Column: Preview & Action Panel */}
              <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' }}>
                {selectedId && allMobs[selectedId] ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h2 style={{ margin: 0, color: '#f59e0b', fontSize: '18px' }}>
                          {allMobs[selectedId].name}
                        </h2>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>ID: {selectedId}</div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {customMobs[selectedId] ? (
                          <Fragment>
                            <button
                              onClick={() => setEditingMob(customMobs[selectedId])}
                              style={{
                                background: '#38bdf8',
                                color: '#000',
                                border: '2px solid #000',
                                cursor: 'pointer',
                                padding: '4px 10px',
                                fontWeight: 'bold',
                              }}
                            >
                              EDIT AST
                            </button>
                            <button
                              onClick={() => handleDeleteMob(selectedId)}
                              style={{
                                background: '#ef4444',
                                color: '#fff',
                                border: '2px solid #000',
                                cursor: 'pointer',
                                padding: '4px 8px',
                              }}
                            >
                              DELETE
                            </button>
                          </Fragment>
                        ) : (
                          <button
                            onClick={() => handleCloneDefault(allMobs[selectedId])}
                            style={{
                              background: '#f59e0b',
                              color: '#000',
                              border: '2px solid #000',
                              cursor: 'pointer',
                              padding: '4px 10px',
                              fontWeight: 'bold',
                            }}
                          >
                            CLONE TO CUSTOM
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Vitals summary */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        margin: '16px 0',
                        padding: '8px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                      }}
                    >
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '10px' }}>HEARTS: </span>
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{allMobs[selectedId].maxHearts}</span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '10px' }}>DAMAGE: </span>
                        <span style={{ color: '#f97316', fontWeight: 'bold' }}>{allMobs[selectedId].damage}</span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '10px' }}>DEFENSE: </span>
                        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{allMobs[selectedId].defense}</span>
                      </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>RULES TEXT:</div>
                      <div style={{ background: '#020617', padding: '8px', border: '1px solid #1e293b', marginBottom: '12px' }}>
                        {allMobs[selectedId].rulesText || 'None.'}
                      </div>

                      <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>LOOT TEXT:</div>
                      <div style={{ background: '#020617', padding: '8px', border: '1px solid #1e293b' }}>
                        {allMobs[selectedId].lootText || 'None.'}
                      </div>
                    </div>

                    {/* Selector button if invoked as a picker */}
                    {onSelectMob && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #1e293b' }}>
                        <button
                          onClick={() => onSelectMob(selectedId, allMobs[selectedId].name)}
                          style={{
                            width: '100%',
                            background: '#10b981',
                            color: '#000',
                            fontWeight: 'bold',
                            border: '2px solid #000',
                            padding: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          SELECT [{allMobs[selectedId].name}] FOR ENCOUNTER
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#475569', margin: 'auto' }}>Select a mob from the left to view or edit.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}