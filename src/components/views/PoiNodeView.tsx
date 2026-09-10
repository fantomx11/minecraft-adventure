import type { Character } from '../../models/Character';
import type { OpenWorldProgression, ActiveView } from '../../types/game';
import type { TrackedMaterial } from '../../types/inventory';
import type { POINode, PointOfInterest, POINodeExit, Region } from '../../types/world';
import { REGIONS } from '../../data/regions';
import { PixelFrame } from '../ui/PixelFrame';
import { StatusBar } from '../ui/StatusBar';
import { Icon } from '../ui/Icon';

interface PoiNodeViewProps {
  hero: Character;
  state: OpenWorldProgression;
  regions: Record<string, Region>;
  onUpdate: () => void;
  onNavigateView: (view: ActiveView) => void;
  onTriggerCombat: (mobName: string) => void;
  onTriggerPassage: (passageId: string) => void;
  onGainMaterial: (mat: TrackedMaterial, amt: number) => void;
  onExitToMap: () => void;
}

export function PoiNodeView({
  hero,
  state,
  regions,
  onUpdate,
  onNavigateView,
  onTriggerCombat,
  onTriggerPassage,
  onGainMaterial,
  onExitToMap,
}: PoiNodeViewProps) {
  const currentRegion = regions[state.currentRegionId] || Object.values(regions)[0];
  const currentPoi: PointOfInterest | undefined = currentRegion.pointsOfInterest.find(
    (p) => p.id === state.currentPoiId
  );
  const activeNodeId = state.currentNodeId || currentPoi?.entryNodeId || '';
  const currentNode: POINode | undefined = currentPoi?.nodes[activeNodeId];

  if (!currentPoi || !currentNode) {
    return (
      <section class="view-panel active">
        <PixelFrame title="UNKNOWN LOCATION" icon="target">
          <p>Location interior could not be found.</p>
          <button type="button" class="pixel-btn btn-primary" onClick={onExitToMap}>
            RETURN TO MAP
          </button>
        </PixelFrame>
      </section>
    );
  }

  const checkExitRequirement = (exit: POINodeExit): { allowed: boolean; reason?: string } => {
    if (exit.requiresItem && !hero.hasItem(exit.requiresItem)) {
      return { allowed: false, reason: `Requires: ${exit.requiresItem}` };
    }
    if (exit.requiresFlags) {
      for (const [flag, val] of Object.entries(exit.requiresFlags)) {
        if (state.questFlags[flag] !== val) {
          return { allowed: false, reason: 'Path is sealed' };
        }
      }
    }
    return { allowed: true };
  };

  const handleExitClick = (exit: POINodeExit) => {
    const { allowed } = checkExitRequirement(exit);
    if (!allowed) return;

    if (exit.exitToRegion) {
      onExitToMap();
      return;
    }

    if (exit.targetNodeId) {
      state.currentNodeId = exit.targetNodeId;
      onUpdate();
    }
  };

  const handleAction = (action: typeof currentNode.actions[0]) => {
    if (action.type === 'combat' && action.mobName) {
      onTriggerCombat(action.mobName);
      return;
    }
    if (action.type === 'view' && action.view) {
      onNavigateView(action.view);
      return;
    }
    if (action.type === 'gather' && action.resourceGain) {
      onGainMaterial(action.resourceGain.material, action.resourceGain.count);
      return;
    }
    if (action.type === 'rest') {
      hero.changeHealth(5);
      onUpdate();
    }
  };

  return (
    <section class="view-panel active">
      <PixelFrame title={`${currentPoi.name.toUpperCase()} - ${currentNode.title.toUpperCase()}`} icon="target">
        <p class="narrative-prose">{currentNode.description}</p>

        {currentNode.accessibleViews && currentNode.accessibleViews.length > 0 && (
          <div style={{ background: '#eee', border: '3px solid #000', padding: '14px', marginBottom: '16px' }}>
            <span class="narrative-section-tag">WORKSTATIONS & STATIONS</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {currentNode.accessibleViews.includes('crafting') && (
                <button type="button" class="pixel-btn btn-active" onClick={() => onNavigateView('crafting')}>
                  <Icon name="crafting" /> CRAFTING BENCH
                </button>
              )}
              {currentNode.accessibleViews.includes('mining') && (
                <button type="button" class="pixel-btn btn-primary" onClick={() => onNavigateView('mining')}>
                  <Icon name="pickaxe" /> EXCAVATE MINES
                </button>
              )}
              {currentNode.accessibleViews.includes('forest') && (
                <button type="button" class="pixel-btn btn-success" onClick={() => onNavigateView('forest')}>
                  <Icon name="tree" /> FORAGE GROVES
                </button>
              )}
            </div>
          </div>
        )}

        {currentNode.actions.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <span class="narrative-section-tag">AVAILABLE ACTIONS</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {currentNode.actions.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  class={`pixel-btn ${act.type === 'combat' ? 'btn-danger' : act.type === 'rest' ? 'btn-success' : ''}`}
                  onClick={() => handleAction(act)}
                >
                  {act.type === 'combat' && <Icon name="sword" />}
                  {act.type === 'rest' && <Icon name="bed" />}
                  {act.type === 'gather' && <Icon name="spark" />}
                  {act.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentNode.questHooks.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <span class="narrative-section-tag">QUEST HOOKS & DIALOGUE</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {currentNode.questHooks.map((qh) => (
                <button
                  key={qh.id}
                  type="button"
                  class="pixel-btn btn-active"
                  onClick={() => onTriggerPassage(qh.passageId)}
                >
                  <Icon name="book" /> {qh.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <span class="narrative-section-tag">PATHS & EXITS</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {currentNode.exits.map((ex, idx) => {
              const { allowed, reason } = checkExitRequirement(ex);
              return (
                <button
                  key={idx}
                  type="button"
                  class={`pixel-btn ${!allowed ? 'choice-locked' : ''}`}
                  disabled={!allowed}
                  onClick={() => handleExitClick(ex)}
                  style={{ justifyContent: 'space-between' }}
                >
                  <span>{ex.label}</span>
                  {!allowed && reason && <span class="choice-badge badge-locked">[{reason}]</span>}
                </button>
              );
            })}
          </div>
        </div>

        <StatusBar marginTop="16px">
          Location: {currentPoi.name} | Room: {currentNode.title}
        </StatusBar>
      </PixelFrame>
    </section>
  );
}