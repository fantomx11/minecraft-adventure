import { useState } from 'preact/hooks';
import { REGIONS, CUSTOM_WORLD_STORAGE_KEY, validateWorld } from './data/regions';
import { Region, PointOfInterest, POIQuestHook } from './types/world';
import { PixelFrame } from './components/ui/PixelFrame';
import { Icon } from './components/ui/Icon';

export function WorldEditorApp() {
  const [regions, setRegions] = useState<Record<string, Region>>(() => {
    const raw = localStorage.getItem(CUSTOM_WORLD_STORAGE_KEY);
    if (raw) {
      try {
        const validated = validateWorld(JSON.parse(raw));
        if (validated) return validated;
      } catch {}
    }
    return JSON.parse(JSON.stringify(REGIONS));
  });

  const [selectedRegionId, setSelectedRegionId] = useState<string>(() => Object.keys(regions)[0] || '');
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const currentRegion = regions[selectedRegionId];
  const currentPoi = currentRegion?.pointsOfInterest.find((p) => p.id === selectedPoiId);
  const currentNode = currentPoi?.nodes[selectedNodeId || ''];

  const handleSaveToStorage = () => {
    localStorage.setItem(CUSTOM_WORLD_STORAGE_KEY, JSON.stringify(regions, null, 2));
    flashNotice('World saved to local storage!');
  };

  const handleAddRegion = () => {
    let count = Object.keys(regions).length + 1;
    while (regions[`region_${count}`]) count++;
    const id = `region_${count}`;
    const newReg: Region = {
      id,
      name: 'New Frontier',
      description: 'An unexplored territory of blocky terrain.',
      biome: 'plains',
      adjacentRegionIds: [],
      dangerLevel: 1,
      encounterTable: [{ mob: 'Zombie', rollRange: [1, 6], label: 'Zombie' }],
      pointsOfInterest: [],
    };
    setRegions({ ...regions, [id]: newReg });
    setSelectedRegionId(id);
    setSelectedPoiId(null);
    setSelectedNodeId(null);
  };

  const handleDeleteRegion = (id: string) => {
    if (confirm(`Delete region "${regions[id].name}"?`)) {
      const copy = { ...regions };
      delete copy[id];
      setRegions(copy);
      const next = Object.keys(copy)[0] || '';
      setSelectedRegionId(next);
      setSelectedPoiId(null);
      setSelectedNodeId(null);
    }
  };

  const handleAddPoi = () => {
    if (!currentRegion) return;
    let count = currentRegion.pointsOfInterest.length + 1;
    const poiId = `${selectedRegionId}_poi_${count}`;
    const entryId = 'entrance_node';
    const newPoi: PointOfInterest = {
      id: poiId,
      name: 'Mysterious Landmark',
      description: 'A newly spotted landmark awaiting excavation.',
      entryNodeId: entryId,
      hidden: false,
      nodes: {
        [entryId]: {
          id: entryId,
          title: 'Entrance',
          description: 'You stand at the perimeter.',
          exits: [{ exitToRegion: true, label: 'Return to map' }],
          actions: [],
          questHooks: [],
        },
      },
    };
    currentRegion.pointsOfInterest.push(newPoi);
    setRegions({ ...regions });
    setSelectedPoiId(poiId);
    setSelectedNodeId(entryId);
  };

  const handleAddNode = () => {
    if (!currentPoi) return;
    let count = Object.keys(currentPoi.nodes).length + 1;
    const nodeId = `room_node_${count}`;
    currentPoi.nodes[nodeId] = {
      id: nodeId,
      title: 'New Chamber',
      description: 'Rough-hewn stone walls enclose this quiet space.',
      exits: [{ targetNodeId: currentPoi.entryNodeId, label: 'Back to entrance' }],
      actions: [],
      questHooks: [],
    };
    setRegions({ ...regions });
    setSelectedNodeId(nodeId);
  };

  const handleAddQuestHook = () => {
    if (!currentNode) return;
    const hook: POIQuestHook = {
      id: `quest_hook_${Date.now()}`,
      questId: 'main_quest',
      label: 'Speak to local scout',
      passageId: 'start',
    };
    currentNode.questHooks.push(hook);
    setRegions({ ...regions });
  };

  return (
    <div class="app-root editor-root">
      <header class="editor-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="./index.html" class="pixel-btn">← BACK TO GAME</a>
          <span style={{ color: 'var(--pixel-yellow)', fontSize: '18px', fontWeight: 'bold' }}>
            WORLD & QUEST EDITOR
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {notice && <span style={{ color: 'var(--pixel-green)', fontSize: '12px' }}>{notice}</span>}
          <button type="button" class="pixel-btn btn-primary" onClick={handleSaveToStorage}>
            SAVE CHANGES
          </button>
          <button
            type="button"
            class="pixel-btn"
            onClick={() => {
              setJsonText(JSON.stringify(regions, null, 2));
              setModalOpen(true);
            }}
          >
            IMPORT / EXPORT
          </button>
          <button
            type="button"
            class="pixel-btn btn-danger"
            onClick={() => {
              if (confirm('Reset to built-in world?')) {
                setRegions(JSON.parse(JSON.stringify(REGIONS)));
                localStorage.removeItem(CUSTOM_WORLD_STORAGE_KEY);
                setSelectedRegionId(Object.keys(REGIONS)[0]);
                setSelectedPoiId(null);
                setSelectedNodeId(null);
                flashNotice('Reset complete.');
              }
            }}
          >
            RESET BUILT-IN
          </button>
        </div>
      </header>

      <div class="editor-container">
        {/* Navigation Sidebar */}
        <aside>
          <PixelFrame title="REGIONS" icon="spark">
            <button
              type="button"
              class="pixel-btn btn-success"
              style={{ width: '100%', marginBottom: '12px' }}
              onClick={handleAddRegion}
            >
              + NEW REGION
            </button>
            <div class="editor-sidebar-list">
              {Object.values(regions).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  class={`pixel-btn editor-passage-item ${r.id === selectedRegionId ? 'btn-active' : ''}`}
                  onClick={() => {
                    setSelectedRegionId(r.id);
                    setSelectedPoiId(null);
                    setSelectedNodeId(null);
                  }}
                >
                  <span>{r.name}</span>
                  <span style={{ opacity: 0.6, fontSize: '10px' }}>({r.pointsOfInterest.length} POIs)</span>
                </button>
              ))}
            </div>
          </PixelFrame>
        </aside>

        {/* Main Editor Pane */}
        <main>
          {currentRegion && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <PixelFrame title={`REGION: ${currentRegion.name.toUpperCase()}`} icon="gear">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <button
                    type="button"
                    class="pixel-btn btn-danger"
                    style={{ padding: '4px 8px', fontSize: '10px' }}
                    onClick={() => handleDeleteRegion(currentRegion.id)}
                  >
                    DELETE REGION
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 120px', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label class="narrative-section-tag">REGION ID</label>
                    <input class="pixel-input" value={currentRegion.id} disabled />
                  </div>
                  <div>
                    <label class="narrative-section-tag">NAME</label>
                    <input
                      class="pixel-input"
                      value={currentRegion.name}
                      onInput={(e) => {
                        currentRegion.name = (e.target as HTMLInputElement).value;
                        setRegions({ ...regions });
                      }}
                    />
                  </div>
                  <div>
                    <label class="narrative-section-tag">BIOME</label>
                    <select
                      class="pixel-select"
                      value={currentRegion.biome}
                      onChange={(e) => {
                        currentRegion.biome = (e.target as HTMLSelectElement).value as any;
                        setRegions({ ...regions });
                      }}
                    >
                      {['plains', 'forest', 'mountains', 'ocean', 'swamp', 'desert'].map((b) => (
                        <option key={b} value={b}>{b.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label class="narrative-section-tag">DESCRIPTION</label>
                  <textarea
                    class="pixel-input"
                    rows={2}
                    value={currentRegion.description}
                    onInput={(e) => {
                      currentRegion.description = (e.target as HTMLTextAreaElement).value;
                      setRegions({ ...regions });
                    }}
                  />
                </div>

                <div>
                  <label class="narrative-section-tag">ADJACENT REGION IDS (COMMA SEPARATED)</label>
                  <input
                    class="pixel-input"
                    value={currentRegion.adjacentRegionIds.join(', ')}
                    onInput={(e) => {
                      currentRegion.adjacentRegionIds = (e.target as HTMLInputElement).value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      setRegions({ ...regions });
                    }}
                  />
                </div>
              </PixelFrame>

              {/* POI Selector & Editor */}
              <PixelFrame title={`POINTS OF INTEREST IN ${currentRegion.name.toUpperCase()}`} icon="target">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {currentRegion.pointsOfInterest.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      class={`pixel-btn ${selectedPoiId === p.id ? 'btn-active' : ''}`}
                      onClick={() => {
                        setSelectedPoiId(p.id);
                        setSelectedNodeId(p.entryNodeId);
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                  <button type="button" class="pixel-btn btn-success" onClick={handleAddPoi}>
                    + ADD POI
                  </button>
                </div>

                {currentPoi && (
                  <div style={{ borderTop: '3px solid #000', paddingTop: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 100px', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label class="narrative-section-tag">POI ID</label>
                        <input class="pixel-input" value={currentPoi.id} disabled />
                      </div>
                      <div>
                        <label class="narrative-section-tag">NAME</label>
                        <input
                          class="pixel-input"
                          value={currentPoi.name}
                          onInput={(e) => {
                            currentPoi.name = (e.target as HTMLInputElement).value;
                            setRegions({ ...regions });
                          }}
                        />
                      </div>
                      <div>
                        <label class="narrative-section-tag">HIDDEN?</label>
                        <select
                          class="pixel-select"
                          value={currentPoi.hidden ? 'true' : 'false'}
                          onChange={(e) => {
                            currentPoi.hidden = (e.target as HTMLSelectElement).value === 'true';
                            setRegions({ ...regions });
                          }}
                        >
                          <option value="false">NO</option>
                          <option value="true">YES</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label class="narrative-section-tag">POI DESCRIPTION</label>
                      <textarea
                        class="pixel-input"
                        rows={2}
                        value={currentPoi.description}
                        onInput={(e) => {
                          currentPoi.description = (e.target as HTMLTextAreaElement).value;
                          setRegions({ ...regions });
                        }}
                      />
                    </div>

                    {/* Room Nodes */}
                    <div style={{ background: '#eee', padding: '14px', border: '3px solid #000' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span class="narrative-section-tag" style={{ margin: 0 }}>
                          INTERIOR ROOMS & NODES ({Object.keys(currentPoi.nodes).length})
                        </span>
                        <button type="button" class="pixel-btn btn-success" onClick={handleAddNode}>
                          + ADD NODE
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {Object.values(currentPoi.nodes).map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            class={`pixel-btn ${selectedNodeId === n.id ? 'btn-active' : ''}`}
                            onClick={() => setSelectedNodeId(n.id)}
                          >
                            {n.title}
                          </button>
                        ))}
                      </div>

                      {currentNode && (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
                            <div>
                              <label class="narrative-section-tag">ROOM ID</label>
                              <input class="pixel-input" value={currentNode.id} disabled />
                            </div>
                            <div>
                              <label class="narrative-section-tag">TITLE</label>
                              <input
                                class="pixel-input"
                                value={currentNode.title}
                                onInput={(e) => {
                                  currentNode.title = (e.target as HTMLInputElement).value;
                                  setRegions({ ...regions });
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <label class="narrative-section-tag">ROOM TEXT</label>
                            <textarea
                              class="pixel-input"
                              rows={2}
                              value={currentNode.description}
                              onInput={(e) => {
                                currentNode.description = (e.target as HTMLTextAreaElement).value;
                                setRegions({ ...regions });
                              }}
                            />
                          </div>

                          {/* Quest Hooks in this node */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <label class="narrative-section-tag" style={{ margin: 0 }}>
                                QUEST HOOKS ({currentNode.questHooks.length})
                              </label>
                              <button
                                type="button"
                                class="pixel-btn btn-success"
                                style={{ padding: '2px 8px', fontSize: '10px' }}
                                onClick={handleAddQuestHook}
                              >
                                + ADD QUEST HOOK
                              </button>
                            </div>

                            {currentNode.questHooks.map((qh, idx) => (
                              <div key={qh.id} class="editor-choice-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Quest Hook #{idx + 1}</span>
                                  <button
                                    type="button"
                                    class="pixel-btn btn-danger"
                                    style={{ padding: '2px 6px', fontSize: '9px' }}
                                    onClick={() => {
                                      currentNode.questHooks.splice(idx, 1);
                                      setRegions({ ...regions });
                                    }}
                                  >
                                    REMOVE
                                  </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  <div>
                                    <label style={{ fontSize: '10px' }}>QUEST ID</label>
                                    <input
                                      class="pixel-input"
                                      value={qh.questId}
                                      onInput={(e) => {
                                        qh.questId = (e.target as HTMLInputElement).value;
                                        setRegions({ ...regions });
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '10px' }}>TARGET PASSAGE ID</label>
                                    <input
                                      class="pixel-input"
                                      value={qh.passageId}
                                      onInput={(e) => {
                                        qh.passageId = (e.target as HTMLInputElement).value;
                                        setRegions({ ...regions });
                                      }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label style={{ fontSize: '10px' }}>PROMPT LABEL</label>
                                  <input
                                    class="pixel-input"
                                    value={qh.label}
                                    onInput={(e) => {
                                      qh.label = (e.target as HTMLInputElement).value;
                                      setRegions({ ...regions });
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </PixelFrame>
            </div>
          )}
        </main>
      </div>

      {/* JSON Import/Export Modal */}
      {modalOpen && (
        <div id="swap-modal-overlay" class="active">
          <div class="pixel-frame is-dark swap-modal-frame" style={{ maxWidth: '640px' }}>
            <div class="drawer-header">
              <span><Icon name="book" /> IMPORT / EXPORT WORLD JSON</span>
              <button type="button" class="pixel-btn btn-danger" onClick={() => setModalOpen(false)}>X</button>
            </div>
            <textarea
              class="pixel-input"
              rows={12}
              value={jsonText}
              onInput={(e) => setJsonText((e.target as HTMLTextAreaElement).value)}
              style={{ resize: 'vertical', width: '100%', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                class="pixel-btn btn-primary"
                onClick={async () => {
                  await navigator.clipboard.writeText(jsonText);
                  flashNotice('Copied JSON to clipboard!');
                }}
              >
                COPY
              </button>
              <button
                type="button"
                class="pixel-btn btn-success"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(jsonText);
                    const validated = validateWorld(parsed);
                    if (validated) {
                      setRegions(validated);
                      setSelectedRegionId(Object.keys(validated)[0]);
                      setSelectedPoiId(null);
                      setSelectedNodeId(null);
                      setModalOpen(false);
                      flashNotice('World imported successfully!');
                    } else {
                      alert('Invalid world schema.');
                    }
                  } catch (e) {
                    alert(`JSON syntax error: ${e}`);
                  }
                }}
              >
                APPLY JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}