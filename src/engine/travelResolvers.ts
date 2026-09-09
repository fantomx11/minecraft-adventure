import type { Character } from '../models/Character';
import type { OpenWorldProgression } from '../types/game';
import type { TravelRequest, TravelOutcome, TravelResolver } from '../types/world';
import { REGIONS } from '../data/regions';

export class StandardTravelResolver implements TravelResolver {
  public canTravel(
    hero: Character,
    state: OpenWorldProgression,
    req: TravelRequest
  ): { allowed: boolean; reason?: string } {
    const fromRegion = REGIONS[req.fromRegionId];
    if (!fromRegion) return { allowed: false, reason: 'Unknown origin region.' };

    const isAdjacent = fromRegion.adjacentRegionIds.includes(req.toRegionId);
    const isDiscovered = state.discoveredRegions.includes(req.toRegionId);

    // Baseline rule: Must be an adjacent region or a known fast-travel node
    if (!isAdjacent && !isDiscovered) {
      return { allowed: false, reason: 'Destination is not adjacent or discovered.' };
    }

    return { allowed: true };
  }

  public resolveTravel(
    hero: Character,
    state: OpenWorldProgression,
    req: TravelRequest
  ): TravelOutcome {
    const targetRegion = REGIONS[req.toRegionId];
    const roll = Math.floor(Math.random() * 6) + 1;
    const logs: string[] = [];

    // Track a generic step counter regardless of future rule sets
    state.counters.travelSteps = (state.counters.travelSteps || 0) + 1;

    // Optional Ambush Check on 1-2 if table exists
    if (roll <= 2 && targetRegion.travelMobTable?.length) {
      const mobEntry = targetRegion.travelMobTable[
        Math.floor(Math.random() * targetRegion.travelMobTable.length)
      ];
      logs.push(`Ambush on the road to ${targetRegion.name}! A ${mobEntry.mob} attacks!`);
      return {
        success: false,
        combatMob: mobEntry.mob,
        logMessages: logs,
      };
    }

    // Safe arrival
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