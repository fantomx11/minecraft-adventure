import { useState } from 'preact/hooks';
import type { Character } from '../../models/Character';
import type { OpenWorldProgression } from '../../types/game';
import type { Region } from '../../types/world';
import type { DieItem } from '../../types/dice';
import type { TrackedMaterial } from '../../types/inventory';
import { REGIONS } from '../../data/regions';
import { StandardTravelResolver } from '../../engine/travelResolvers';
import { rollOnMobTable } from '../../data/storyPassages';
import { PixelFrame } from '../ui/PixelFrame';
import { StatusBar } from '../ui/StatusBar';
import { DiceRoller } from '../ui/DiceRoller';
import { Icon } from '../ui/Icon';

interface WorldMapViewProps {
  hero: Character;
  state: OpenWorldProgression;
  regions: Record<string, Region>;
  onUpdate: () => void;
  onNavigateCombat: (mobName: string) => void;
  onEnterPoi: (poiId: string, nodeId: string) => void;
  onGainMaterial: (mat: TrackedMaterial, amt: number) => void;
}

const travelResolver = new StandardTravelResolver();

export function WorldMapView({
  hero,
  state,
  regions,
  onUpdate,
  onNavigateCombat,
  onEnterPoi,
  onGainMaterial,
}: WorldMapViewProps) {
  const currentRegion: Region = regions[state.currentRegionId] || Object.values(regions)[0];
  const trekBonus = state.counters.trekBonus || 0;
  const [logMessage, setLogMessage] = useState<string>(
    `Standing in ${currentRegion.name}. The wilderness stretches out before you.`
  );

  const diceCount = 1 + (hero.hasItem('Compass') ? 1 : 0) + (hero.hasItem('World Map') ? 1 : 0);

  const handleRollPreview = (rolls: number[]): DieItem[] => {
    return rolls.map((roll) => {
      const total = roll + trekBonus;
      const isEven = total % 2 === 0;
      return {
        value: roll,
        tag: isEven ? `POI (${total})` : `COMBAT (${total})`,
        variant: isEven ? (total >= 8 ? 'bonus' : 'hit') : 'miss',
      };
    });
  };

  const handleConfirmPick = (
    selectedIndices: number[],
    rolls: number[],
    labeledDice: DieItem[]
  ): DieItem[] => {
    const chosenIndex = selectedIndices[0];
    const roll = rolls[chosenIndex];
    const total = roll + trekBonus;
    const isEven = total % 2 === 0;

    state.counters.trekBonus = trekBonus + 1;

    if (isEven) {
      const available = currentRegion.pointsOfInterest.filter(
        (p) => p.hidden && !state.discoveredPoiIds.includes(p.id) && total >= (p.minTrekTotal || 2)
      );

      if (available.length > 0) {
        const discovered = available[available.length - 1];
        state.discoveredPoiIds.push(discovered.id);
        setLogMessage(discovered.discoveryLog || `Discovered: ${discovered.name}!`);
      } else {
        const mat: TrackedMaterial = total >= 8 ? 'Iron' : 'Wood';
        onGainMaterial(mat, 1);
        setLogMessage(`Scouted local territory (Total ${total}): Salvaged 1 ${mat}.`);
      }
    } else {
      const encounter = rollOnMobTable(currentRegion.encounterTable);
      setLogMessage(`Threat encountered (Total ${total})! A hostile ${encounter.mob} attacks!`);
      onNavigateCombat(encounter.mob);
    }

    onUpdate();
    return labeledDice.map((d, i) => ({
      ...d,
      tag: i === chosenIndex ? d.tag : 'IGNORED',
      variant: i === chosenIndex ? d.variant : 'neutral',
    }));
  };

  const handleMakeCamp = () => {
    state.counters.trekBonus = 0;
    hero.changeHealth(3);
    setLogMessage('Camp established (+3 HP). Wilderness trek bonus reset to 0.');
    onUpdate();
  };

  const handleTravel = (targetRegionId: string) => {
    const outcome = travelResolver.resolveTravel(hero, state, {
      fromRegionId: currentRegion.id,
      toRegionId: targetRegionId,
    }, regions);
    if (outcome.combatMob) {
      onNavigateCombat(outcome.combatMob);
    }
    setLogMessage(outcome.logMessages.join(' '));
    onUpdate();
  };

  const visiblePois = currentRegion.pointsOfInterest.filter(
    (p) => !p.hidden || state.discoveredPoiIds.includes(p.id)
  );
  const hiddenCount = currentRegion.pointsOfInterest.length - visiblePois.length;

  return (
    <section class="view-panel active">
      <PixelFrame title={currentRegion.name.toUpperCase()} icon="spark">
        <p style={{ fontSize: '13px', lineHeight: '1.8', margin: '0 0 16px 0' }}>
          {currentRegion.description}
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span class="hud-badge">Biome: {currentRegion.biome.toUpperCase()}</span>
          <span class="hud-badge">Danger: Tier {currentRegion.dangerLevel}</span>
          <span class="hud-badge">Wilderness Trek: +{trekBonus}</span>
        </div>

        <div style={{ background: '#eee', padding: '14px', border: '3px solid #000', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>EXPLORE SURROUNDINGS</span>
            <button type="button" class="pixel-btn btn-success" onClick={handleMakeCamp}>
              MAKE CAMP (REST)
            </button>
          </div>
          <DiceRoller
            diceCount={diceCount}
            pickCount={1}
            rollButtonLabel="TREK WILDERNESS (EVEN=POI / ODD=MOB)"
            confirmButtonLabel="FOLLOW TRAIL"
            buttonClass="btn-primary"
            onRoll={handleRollPreview}
            onConfirm={handleConfirmPick}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span class="narrative-section-tag">POINTS OF INTEREST ({visiblePois.length} KNOWN)</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {visiblePois.map((poi) => (
              <button
                key={poi.id}
                type="button"
                class="pixel-btn btn-active"
                style={{ width: '100%', justifyContent: 'space-between' }}
                onClick={() => onEnterPoi(poi.id, poi.entryNodeId)}
              >
                <span><Icon name="target" /> {poi.name}</span>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>ENTER LOCATION</span>
              </button>
            ))}
            {hiddenCount > 0 && (
              <div style={{ padding: '10px', background: '#333', color: '#aaa', fontSize: '11px', border: '2px dashed #666' }}>
                ? ? ? {hiddenCount} undiscovered landmark{hiddenCount > 1 ? 's' : ''} hidden in this region.
              </div>
            )}
          </div>
        </div>

        <div>
          <span class="narrative-section-tag">CONNECTING ROADS</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            {currentRegion.adjacentRegionIds.map((adjId) => {
              const adjRegion = REGIONS[adjId];
              return (
                <button
                  key={adjId}
                  type="button"
                  class="pixel-btn"
                  onClick={() => handleTravel(adjId)}
                >
                  ROAD TO {adjRegion ? adjRegion.name.toUpperCase() : adjId.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        <StatusBar marginTop="16px">{logMessage}</StatusBar>
      </PixelFrame>
    </section>
  );
}