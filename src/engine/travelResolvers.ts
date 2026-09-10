import type { Character } from '../models/Character';
import type { OpenWorldProgression } from '../types/game';
import type { TravelRequest, TravelOutcome, TravelResolver, Region } from '../types/world';
import { REGIONS } from '../data/regions';

export class StandardTravelResolver implements TravelResolver {
  public canTravel(
    _hero: Character,
    state: OpenWorldProgression,
    req: TravelRequest,
    regions: Record<string, Region> = REGIONS
  ): { allowed: boolean; reason?: string } {
    const fromRegion = regions[req.fromRegionId];
    if (!fromRegion) return { allowed: false, reason: 'Unknown origin region.' };
    const isAdjacent = fromRegion.adjacentRegionIds.includes(req.toRegionId);
    const isDiscovered = state.discoveredRegions.includes(req.toRegionId);
    
    if (!isAdjacent && !isDiscovered) {
      return { allowed: false, reason: 'Destination is not adjacent or discovered.' };
    }
    return { allowed: true };
  }

  public resolveTravel(
    _hero: Character,
    state: OpenWorldProgression,
    req: TravelRequest,
    regions: Record<string, Region> = REGIONS
  ): TravelOutcome {
    const targetRegion = regions[req.toRegionId];
    if (!targetRegion) {
      return { success: false, logMessages: ['Unknown destination region.'] };
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    const logs: string[] = [];

    state.counters.travelSteps = (state.counters.travelSteps || 0) + 1;
    state.counters.trekBonus = 0;

    if (roll <= 2 && targetRegion.encounterTable?.length) {
      const mobEntry = targetRegion.encounterTable[
        Math.floor(Math.random() * targetRegion.encounterTable.length)
      ];
      logs.push(`Ambush on the road to ${targetRegion.name}! A ${mobEntry.mob} attacks!`);
      return {
        success: false,
        combatMob: mobEntry.mob,
        logMessages: logs,
      };
    }

    logs.push(`Traveled safely to ${targetRegion.name}.`);
    if (!state.discoveredRegions.includes(req.toRegionId)) {
      state.discoveredRegions.push(req.toRegionId);
      logs.push(`Discovered new region: ${targetRegion.name}!`);
    }

    state.currentRegionId = req.toRegionId;
    state.currentPoiId = null;
    state.currentNodeId = null;

    return {
      success: true,
      logMessages: logs,
    };
  }
}