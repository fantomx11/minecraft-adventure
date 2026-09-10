import { useState } from 'preact/hooks';
import {
  CUSTOM_WORLD_STORAGE_KEY,
  getInitialWorldPackage,
  validateWorldPackage,
  REGIONS,
} from './data/regions';
import { STORY_PASSAGES } from './data/storyPassages';
import { Region, PointOfInterest, POIQuestHook, POINodeExit } from './types/world';
import { Passage, PassageChoice } from './types/narrative';
import { PixelFrame } from './components/ui/PixelFrame';
import { Icon } from './components/ui/Icon';
import { ConditionEditor } from './components/editor/ConditionEditor';
import { MutationListEditor } from './components/editor/MutationListEditor';
import { PassageSidebar } from './components/editor/PassageSidebar';
import { PassageForm } from './components/editor/PassageForm';

export function WorldEditorApp() {
  const [pkg, setPkg] = useState(() => getInitialWorldPackage());
  const [activeTab, setActiveTab] = useState<'world' | 'passages'>('world');

  // World Tab State
  const [selectedRegionId, setSelectedRegionId] = useState<string>(() => Object.keys(pkg.regions)[0] || '');
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(() => {
    const firstReg = Object.values(pkg.regions)[0];
    return firstReg?.pointsOfInterest[0]?.id || null;
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => {
    const firstReg = Object.values(pkg.regions)[0];
    return firstReg?.pointsOfInterest[0]?.entryNodeId || null;
  });
  const [poiSearch, setPoiSearch] = useState('');

  // Passages Tab State
  const [selectedPassageId, setSelectedPassageId] = useState<string>(() => Object.keys(pkg.passages)[0] || 'start');
  const [passageSearch, setPassageSearch] = useState('');

  // Modal / Feedback
  const [modalOpen, setModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const currentRegion = pkg.regions[selectedRegionId];
  const currentPoi = currentRegion?.pointsOfInterest.find((p) => p.id === selectedPoiId);
  const currentNode = currentPoi?.nodes[selectedNodeId || ''];

  const allPassageIds = Object.keys(pkg.passages);
  const allLocationIds = [
    ...Object.keys(pkg.regions),
    ...Object.values(pkg.regions).flatMap((r) => r.pointsOfInterest.map((p) => p.id)),
  ];

  const handleSaveToStorage = () => {
    localStorage.setItem(CUSTOM_WORLD_STORAGE_KEY, JSON.stringify(pkg, null, 2));
    flashNotice('Open World package saved to local storage!');
  };

  const handleAddRegion = () => {
    let count = Object.keys(pkg.regions).length + 1;
    while (pkg.regions[`region_${count}`]) count++;
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
    setPkg({
      ...pkg,
      regions: { ...pkg.regions, [id]: newReg },
    });
    setSelectedRegionId(id);
    setSelectedPoiId(null);
    setSelectedNodeId(null);
  };

  const handleDeleteRegion = (id: string) => {
    if (confirm(`Delete region "${pkg.regions[id].name}"?`)) {
      const copy = { ...pkg.regions };
      delete copy[id];
      setPkg({ ...pkg, regions: copy });
      const nextId = Object.keys(copy)[0] || '';
      setSelectedRegionId(nextId);
      const nextReg = copy[nextId];
      setSelectedPoiId(nextReg?.pointsOfInterest[0]?.id || null);
      setSelectedNodeId(nextReg?.pointsOfInterest[0]?.entryNodeId || null);
    }
  };

  const handleAddPoi = () => {
    if (!currentRegion) return;
    const poiId = `${selectedRegionId}_poi_${currentRegion.pointsOfInterest.length + 1}`;
    const entryId = 'entrance_node';
    const newPoi: PointOfInterest = {
      id: poiId,
      name: 'Mysterious Landmark',
      description: 'A landmark awaiting exploration.',
      entryNodeId: entryId,
      hidden: false,
      nodes: {
        [entryId]: {
          id: entryId,
          title: 'Entrance',
          description: 'You stand at the threshold.',
          exits: [{ exitToRegion: true, label: 'Return to road' }],
          actions: [],
          questHooks: [],
        },
      },
    };
    currentRegion.pointsOfInterest.push(newPoi);
    setPkg({ ...pkg });
    setSelectedPoiId(poiId);
    setSelectedNodeId(entryId);
  };

  const handleDeletePoi = (poiId: string) => {
    if (!currentRegion) return;
    const target = currentRegion.pointsOfInterest.find((p) => p.id === poiId);
    if (!target) return;

    if (confirm(`Delete POI "${target.name}"? All interior rooms and quest hooks inside it will be permanently removed.`)) {
      currentRegion.pointsOfInterest = currentRegion.pointsOfInterest.filter((p) => p.id !== poiId);
      setPkg({ ...pkg });
      const remaining = currentRegion.pointsOfInterest;
      if (remaining.length > 0) {
        setSelectedPoiId(remaining[0].id);
        setSelectedNodeId(remaining[0].entryNodeId);
      } else {
        setSelectedPoiId(null);
        setSelectedNodeId(null);
      }
    }
  };

  const handleAddNode = () => {
    if (!currentPoi) return;
    const nodeId = `room_node_${Object.keys(currentPoi.nodes).length + 1}`;
    currentPoi.nodes[nodeId] = {
      id: nodeId,
      title: 'Inner Chamber',
      description: 'Rough stone walls enclose this quiet space.',
      exits: [{ targetNodeId: currentPoi.entryNodeId, label: 'Back to entrance' }],
      actions: [],
      questHooks: [],
    };
    setPkg({ ...pkg });
    setSelectedNodeId(nodeId);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!currentPoi) return;
    if (nodeId === currentPoi.entryNodeId) {
      alert('Cannot delete the entry node of a POI.');
      return;
    }
    if (confirm(`Delete room "${currentPoi.nodes[nodeId]?.title}"?`)) {
      delete currentPoi.nodes[nodeId];
      // Clean up exits in other nodes pointing to this deleted node
      Object.values(currentPoi.nodes).forEach((n) => {
        n.exits = n.exits.filter((ex) => ex.targetNodeId !== nodeId);
      });
      setPkg({ ...pkg });
      setSelectedNodeId(currentPoi.entryNodeId);
    }
  };

  const handleAddExit = () => {
    if (!currentNode) return;
    const newExit: POINodeExit = {
      label: 'Passage Doorway',
      targetNodeId: currentPoi?.entryNodeId,
    };
    currentNode.exits.push(newExit);
    setPkg({ ...pkg });
  };

  const handleAddQuestHook = () => {
    if (!currentNode) return;
    const hook: POIQuestHook = {
      id: `quest_hook_${Date.now()}`,
      questId: 'main_quest',
      label: 'Speak with traveler',
      passageId: allPassageIds[0] || 'start',
    };
    currentNode.questHooks.push(hook);
    setPkg({ ...pkg });
  };

  // Passage handlers
  const handleUpdatePassage = <K extends keyof Passage>(key: K, value: Passage[K]) => {
    setPkg((prev) => ({
      ...prev,
      passages: {
        ...prev.passages,
        [selectedPassageId]: { ...prev.passages[selectedPassageId], [key]: value },
      },
    }));
  };

  const handleUpdateChoice = (idx: number, updated: Partial<PassageChoice>) => {
    const choices = [...pkg.passages[selectedPassageId].choices];
    choices[idx] = { ...choices[idx], ...updated };
    handleUpdatePassage('choices', choices);
  };

  const handleAddChoice = () => {
    const choices = [
      ...pkg.passages[selectedPassageId].choices,
      { text: 'New Choice Option', targetPassageId: selectedPassageId },
    ];
    handleUpdatePassage('choices', choices);
  };

  const handleRemoveChoice = (idx: number) => {
    const choices = pkg.passages[selectedPassageId].choices.filter((_, i) => i !== idx);
    handleUpdatePassage('choices', choices);
  };

  const filteredPois = currentRegion?.pointsOfInterest.filter((p) =>
    p.name.toLowerCase().includes(poiSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(poiSearch.toLowerCase())
  ) || [];

  return (
    <div class="app-root editor-root">
      <header class="editor-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="./index.html" class="pixel-btn">← BACK TO GAME</a>
          <span style={{ color: 'var(--pixel-yellow)', fontSize: '18px', fontWeight: 'bold' }}>
            OPEN WORLD EDITOR
          </span>
          <div style={{ display: 'flex', gap: '6px', marginLeft: '16px' }}>
            <button
              type="button"
              class={`pixel-btn ${activeTab === 'world' ? 'btn-active' : ''}`}
              onClick={() => setActiveTab('world')}
            >
              REGIONS & MAP
            </button>
            <button
              type="button"
              class={`pixel-btn ${activeTab === 'passages' ? 'btn-active' : ''}`}
              onClick={() => setActiveTab('passages')}
            >
              QUEST PASSAGES ({allPassageIds.length})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {notice && <span style={{ color: 'var(--pixel-green)', fontSize: '12px' }}>{notice}</span>}
          <button type="button" class="pixel-btn btn-primary" onClick={handleSaveToStorage}>
            SAVE PACKAGE
          </button>
          <button
            type="button"
            class="pixel-btn"
            onClick={() => {
              setJsonText(JSON.stringify(pkg, null, 2));
              setModalOpen(true);
            }}
          >
            IMPORT / EXPORT
          </button>
          <button
            type="button"
            class="pixel-btn btn-danger"
            onClick={() => {
              if (confirm('Reset Open World to built-in defaults?')) {
                setPkg({
                  regions: JSON.parse(JSON.stringify(REGIONS)),
                  passages: JSON.parse(JSON.stringify(STORY_PASSAGES)),
                });
                localStorage.removeItem(CUSTOM_WORLD_STORAGE_KEY);
                const firstRegKey = Object.keys(REGIONS)[0];
                setSelectedRegionId(firstRegKey);
                setSelectedPoiId(REGIONS[firstRegKey]?.pointsOfInterest[0]?.id || null);
                setSelectedNodeId(REGIONS[firstRegKey]?.pointsOfInterest[0]?.entryNodeId || null);
                setSelectedPassageId('start');
                flashNotice('Reset complete.');
              }
            }}
          >
            RESET
          </button>
        </div>
      </header>

      {activeTab === 'world' ? (
        <div class="editor-container">
          {/* Left Region Sidebar */}
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
                {Object.values(pkg.regions).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    class={`pixel-btn editor-passage-item ${r.id === selectedRegionId ? 'btn-active' : ''}`}
                    onClick={() => {
                      setSelectedRegionId(r.id);
                      setSelectedPoiId(r.pointsOfInterest[0]?.id || null);
                      setSelectedNodeId(r.pointsOfInterest[0]?.entryNodeId || null);
                    }}
                  >
                    <span>{r.name}</span>
                    <span style={{ opacity: 0.6, fontSize: '10px' }}>({r.pointsOfInterest.length})</span>
                  </button>
                ))}
              </div>
            </PixelFrame>
          </aside>

          {/* Main Content Area */}
          <main>
            {currentRegion && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Region Overview Box */}
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
                          setPkg({ ...pkg });
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
                          setPkg({ ...pkg });
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
                        setPkg({ ...pkg });
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
                        setPkg({ ...pkg });
                      }}
                    />
                  </div>
                </PixelFrame>

                {/* Master-Detail POI Manager */}
                <PixelFrame title={`POINTS OF INTEREST (${currentRegion.pointsOfInterest.length})`} icon="target">
                  <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '16px' }}>
                    {/* Master Column: Searchable POI List */}
                    <div style={{ borderRight: '3px solid #000', paddingRight: '16px' }}>
                      <input
                        type="text"
                        class="pixel-input"
                        placeholder="Search POIs..."
                        value={poiSearch}
                        onInput={(e) => setPoiSearch((e.target as HTMLInputElement).value)}
                        style={{ fontSize: '11px', padding: '6px 8px', marginBottom: '8px' }}
                      />
                      <button
                        type="button"
                        class="pixel-btn btn-success"
                        style={{ width: '100%', marginBottom: '10px', fontSize: '11px', padding: '8px' }}
                        onClick={handleAddPoi}
                      >
                        + ADD NEW POI
                      </button>

                      <div class="editor-sidebar-list" style={{ maxHeight: '520px', marginTop: 0 }}>
                        {filteredPois.map((p) => {
                          const isSelected = selectedPoiId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              class={`pixel-btn editor-passage-item ${isSelected ? 'btn-active' : ''}`}
                              onClick={() => {
                                setSelectedPoiId(p.id);
                                setSelectedNodeId(p.entryNodeId);
                              }}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <strong style={{ fontSize: '11px' }}>{p.name}</strong>
                                <span style={{ opacity: 0.6, fontSize: '9px' }}>
                                  ({Object.keys(p.nodes).length} rm)
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {p.hidden && (
                                  <span style={{ fontSize: '8px', background: '#333', color: '#ffb300', padding: '1px 4px', border: '1px solid #000' }}>
                                    HIDDEN
                                  </span>
                                )}
                                <span style={{ fontSize: '8px', color: '#666' }}>{p.id}</span>
                              </div>
                            </button>
                          );
                        })}
                        {filteredPois.length === 0 && (
                          <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', padding: '8px 0' }}>
                            {currentRegion.pointsOfInterest.length === 0
                              ? 'No POIs created in this region.'
                              : 'No POIs match your search.'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detail Column: Selected POI Inspector */}
                    <div>
                      {currentPoi ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                              EDITING POI: [{currentPoi.id}]
                            </span>
                            <button
                              type="button"
                              class="pixel-btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '10px' }}
                              onClick={() => handleDeletePoi(currentPoi.id)}
                            >
                              DELETE POI
                            </button>
                          </div>

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
                                  setPkg({ ...pkg });
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
                                  setPkg({ ...pkg });
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
                                setPkg({ ...pkg });
                              }}
                            />
                          </div>

                          {/* Room Nodes Sub-Section */}
                          <div style={{ background: '#eee', padding: '14px', border: '3px solid #000' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <span class="narrative-section-tag" style={{ margin: 0 }}>
                                INTERIOR ROOMS ({Object.keys(currentPoi.nodes).length})
                              </span>
                              <button type="button" class="pixel-btn btn-success" onClick={handleAddNode}>
                                + ADD ROOM NODE
                              </button>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                              {Object.values(currentPoi.nodes).map((n) => {
                                const isSelected = selectedNodeId === n.id;
                                const isEntry = n.id === currentPoi.entryNodeId;
                                return (
                                  <button
                                    key={n.id}
                                    type="button"
                                    class={`pixel-btn ${isSelected ? 'btn-active' : ''}`}
                                    onClick={() => setSelectedNodeId(n.id)}
                                    style={{ fontSize: '11px', padding: '8px 12px' }}
                                  >
                                    {isEntry ? '🚪 ' : ''}{n.title}
                                  </button>
                                );
                              })}
                            </div>

                            {currentNode && (
                              <div style={{ background: '#fff', border: '2px solid #000', padding: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                    ROOM: {currentNode.title} {currentNode.id === currentPoi.entryNodeId ? '(Entry Node)' : ''}
                                  </span>
                                  {currentNode.id !== currentPoi.entryNodeId && (
                                    <button
                                      type="button"
                                      class="pixel-btn btn-danger"
                                      style={{ padding: '3px 6px', fontSize: '9px' }}
                                      onClick={() => handleDeleteNode(currentNode.id)}
                                    >
                                      DELETE ROOM
                                    </button>
                                  )}
                                </div>

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
                                        setPkg({ ...pkg });
                                      }}
                                    />
                                  </div>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                  <label class="narrative-section-tag">ROOM DESCRIPTION</label>
                                  <textarea
                                    class="pixel-input"
                                    rows={2}
                                    value={currentNode.description}
                                    onInput={(e) => {
                                      currentNode.description = (e.target as HTMLTextAreaElement).value;
                                      setPkg({ ...pkg });
                                    }}
                                  />
                                </div>

                                {/* Room Exits */}
                                <div style={{ marginBottom: '16px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label class="narrative-section-tag" style={{ margin: 0 }}>
                                      ROOM EXITS ({currentNode.exits.length})
                                    </label>
                                    <button type="button" class="pixel-btn btn-success" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={handleAddExit}>
                                      + ADD EXIT
                                    </button>
                                  </div>

                                  {currentNode.exits.map((ex, idx) => (
                                    <div key={idx} class="editor-choice-card">
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Exit #{idx + 1}</span>
                                        <button
                                          type="button"
                                          class="pixel-btn btn-danger"
                                          style={{ padding: '2px 6px', fontSize: '9px' }}
                                          onClick={() => {
                                            currentNode.exits.splice(idx, 1);
                                            setPkg({ ...pkg });
                                          }}
                                        >
                                          REMOVE
                                        </button>
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                                        <div>
                                          <label style={{ fontSize: '9px' }}>LABEL</label>
                                          <input
                                            class="pixel-input"
                                            value={ex.label}
                                            onInput={(e) => {
                                              ex.label = (e.target as HTMLInputElement).value;
                                              setPkg({ ...pkg });
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <label style={{ fontSize: '9px' }}>TARGET ROOM</label>
                                          <select
                                            class="pixel-select"
                                            value={ex.exitToRegion ? '__region' : ex.targetNodeId || ''}
                                            onChange={(e) => {
                                              const val = (e.target as HTMLSelectElement).value;
                                              if (val === '__region') {
                                                ex.exitToRegion = true;
                                                delete ex.targetNodeId;
                                              } else {
                                                ex.exitToRegion = false;
                                                ex.targetNodeId = val;
                                              }
                                              setPkg({ ...pkg });
                                            }}
                                          >
                                            <option value="__region">-- Exit to Map --</option>
                                            {Object.values(currentPoi.nodes).map((n) => (
                                              <option key={n.id} value={n.id}>{n.title}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                                        <div>
                                          <label style={{ fontSize: '9px' }}>LOCKED REASON</label>
                                          <input
                                            class="pixel-input"
                                            placeholder="e.g. Requires Heavy Key"
                                            value={ex.lockedReason || ''}
                                            onInput={(e) => {
                                              ex.lockedReason = (e.target as HTMLInputElement).value || undefined;
                                              setPkg({ ...pkg });
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <label style={{ fontSize: '9px' }}>LOCKED BEHAVIOR</label>
                                          <select
                                            class="pixel-select"
                                            value={ex.behavior || 'disable'}
                                            onChange={(e) => {
                                              ex.behavior = (e.target as HTMLSelectElement).value as any;
                                              setPkg({ ...pkg });
                                            }}
                                          >
                                            <option value="disable">Disable Button</option>
                                            <option value="hide">Hide Completely</option>
                                          </select>
                                        </div>
                                      </div>

                                      <ConditionEditor
                                        label="EXIT ACCESS CONDITION"
                                        condition={ex.condition}
                                        allPassageIds={allPassageIds}
                                        allLocationIds={allLocationIds}
                                        onChange={(condition) => {
                                          ex.condition = condition;
                                          setPkg({ ...pkg });
                                        }}
                                      />

                                      <MutationListEditor
                                        title="EXIT MUTATIONS"
                                        mutations={ex.mutations}
                                        onChange={(mutations) => {
                                          ex.mutations = mutations;
                                          setPkg({ ...pkg });
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>

                                {/* Quest Hooks */}
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label class="narrative-section-tag" style={{ margin: 0 }}>
                                      QUEST HOOKS & DIALOGUE ({currentNode.questHooks.length})
                                    </label>
                                    <button type="button" class="pixel-btn btn-success" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={handleAddQuestHook}>
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
                                            setPkg({ ...pkg });
                                          }}
                                        >
                                          REMOVE
                                        </button>
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div>
                                          <label style={{ fontSize: '9px' }}>QUEST ID</label>
                                          <input
                                            class="pixel-input"
                                            value={qh.questId}
                                            onInput={(e) => {
                                              qh.questId = (e.target as HTMLInputElement).value;
                                              setPkg({ ...pkg });
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <label style={{ fontSize: '9px' }}>TARGET PASSAGE</label>
                                          <select
                                            class="pixel-select"
                                            value={qh.passageId}
                                            onChange={(e) => {
                                              qh.passageId = (e.target as HTMLSelectElement).value;
                                              setPkg({ ...pkg });
                                            }}
                                          >
                                            {allPassageIds.map((pId) => (
                                              <option key={pId} value={pId}>{pId}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>

                                      <div>
                                        <label style={{ fontSize: '9px' }}>PROMPT LABEL</label>
                                        <input
                                          class="pixel-input"
                                          value={qh.label}
                                          onInput={(e) => {
                                            qh.label = (e.target as HTMLInputElement).value;
                                            setPkg({ ...pkg });
                                          }}
                                        />
                                      </div>

                                      <ConditionEditor
                                        label="HOOK AVAILABILITY CONDITION"
                                        condition={qh.condition}
                                        allPassageIds={allPassageIds}
                                        allLocationIds={allLocationIds}
                                        onChange={(condition) => {
                                          qh.condition = condition;
                                          setPkg({ ...pkg });
                                        }}
                                      />

                                      <MutationListEditor
                                        title="HOOK CONSEQUENCES / MUTATIONS"
                                        mutations={qh.mutations}
                                        onChange={(mutations) => {
                                          qh.mutations = mutations;
                                          setPkg({ ...pkg });
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '36px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                          Select a POI from the left or click "+ ADD NEW POI" to begin configuring landmarks.
                        </div>
                      )}
                    </div>
                  </div>
                </PixelFrame>
              </div>
            )}
          </main>
        </div>
      ) : (
        /* Passages Tab for Quests & Open World Story Nodes */
        <div class="editor-container">
          <PassageSidebar
            passages={pkg.passages}
            selectedId={selectedPassageId}
            searchQuery={passageSearch}
            onSearchChange={setPassageSearch}
            onSelectPassage={setSelectedPassageId}
            onAddPassage={() => {
              let count = Object.keys(pkg.passages).length + 1;
              while (pkg.passages[`quest_passage_${count}`]) count++;
              const id = `quest_passage_${count}`;
              setPkg({
                ...pkg,
                passages: {
                  ...pkg.passages,
                  [id]: { id, title: 'New Quest Passage', text: '', choices: [] },
                },
              });
              setSelectedPassageId(id);
            }}
          />

          <main>
            {pkg.passages[selectedPassageId] && (
              <PassageForm
                passage={pkg.passages[selectedPassageId]}
                allPassageIds={allPassageIds}
                onUpdatePassage={handleUpdatePassage}
                onUpdateChoice={handleUpdateChoice}
                onAddChoice={handleAddChoice}
                onRemoveChoice={handleRemoveChoice}
                onDeletePassage={(id) => {
                  const copy = { ...pkg.passages };
                  delete copy[id];
                  setPkg({ ...pkg, passages: copy });
                  setSelectedPassageId(Object.keys(copy)[0]);
                }}
                onRenameId={(newId) => {
                  if (pkg.passages[newId]) return alert('ID already exists');
                  const copy = { ...pkg.passages };
                  copy[newId] = { ...copy[selectedPassageId], id: newId };
                  delete copy[selectedPassageId];
                  setPkg({ ...pkg, passages: copy });
                  setSelectedPassageId(newId);
                }}
              />
            )}
          </main>
        </div>
      )}

      {/* JSON Import/Export Modal */}
      {modalOpen && (
        <div id="swap-modal-overlay" class="active">
          <div class="pixel-frame is-dark swap-modal-frame" style={{ maxWidth: '640px' }}>
            <div class="drawer-header">
              <span><Icon name="book" /> IMPORT / EXPORT OPEN WORLD PACKAGE</span>
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
                    const validated = validateWorldPackage(parsed);
                    if (validated) {
                      setPkg(validated);
                      const firstRegKey = Object.keys(validated.regions)[0];
                      setSelectedRegionId(firstRegKey);
                      setSelectedPoiId(validated.regions[firstRegKey]?.pointsOfInterest[0]?.id || null);
                      setSelectedNodeId(validated.regions[firstRegKey]?.pointsOfInterest[0]?.entryNodeId || null);
                      setSelectedPassageId(Object.keys(validated.passages)[0] || 'start');
                      setModalOpen(false);
                      flashNotice('Open World package imported successfully!');
                    } else {
                      alert('Invalid Open World schema. Must contain regions.');
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