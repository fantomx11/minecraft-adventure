import type { Region } from '../types/world';

export const CUSTOM_WORLD_STORAGE_KEY = 'minecraft_custom_world_regions';

export const REGIONS: Record<string, Region> = {
  plains_settlement: {
    id: 'plains_settlement',
    name: 'Riverwood Vale',
    description: 'A rustic timber settlement resting in a river gorge beneath snowy mountain peaks.',
    biome: 'plains',
    adjacentRegionIds: ['bleak_falls_pass'],
    dangerLevel: 1,
    encounterTable: [
      { mob: 'Spider', rollRange: [1, 3], label: 'River Spider' },
      { mob: 'Zombie', rollRange: [4, 6], label: 'Wandering Bandit' },
    ],
    pointsOfInterest: [
      {
        id: 'riverwood_village',
        name: 'Riverwood Settlement',
        description: 'A cluster of timber dwellings, a lumber mill, and an open stone forge.',
        entryNodeId: 'town_square',
        hidden: false,
        nodes: {
          town_square: {
            id: 'town_square',
            title: 'Village Crossroads',
            description: 'The sawmill wheel turns steadily in the river. Down the gravel path stands the general merchant and local forge.',
            actions: [
            ],
            exits: [
              { targetNodeId: 'trader_shop', label: 'Enter Riverwood Trader' },
              { targetNodeId: 'blacksmith_forge', label: 'Approach Blacksmith Anvil' },
              { exitToRegion: true, label: 'Head out to the wilderness road' },
            ],
            questHooks: [],
          },
          trader_shop: {
            id: 'trader_shop',
            title: 'Riverwood Trader',
            description: 'Counter shelves filled with dried rations and mining supplies. The merchant mutters about a stolen family heirloom.',
            exits: [
              { targetNodeId: 'town_square', label: 'Step outside to the village path' },
            ],
            actions: [],
            questHooks: [
              {
                id: 'lucan_quest_hook',
                questId: 'golden_claw',
                label: 'Inquire about the bandit break-in',
                passageId: 'abandoned_shack',
                prohibitedFlags: ['golden_claw_recovered'],
              },
            ],
          },
          blacksmith_forge: {
            id: 'blacksmith_forge',
            title: 'Village Forge',
            description: 'A hearth with hot coals and a heavy anvil. Tools and iron tongs hang ready.',
            accessibleViews: ['crafting'],
            exits: [
              { targetNodeId: 'town_square', label: 'Back to the crossroads' },
            ],
            actions: [],
            questHooks: [],
          },
        },
      },
      {
        id: 'hidden_hunter_blind',
        name: 'Abandoned Hunter Blind',
        description: 'A hidden lean-to tucked deep into the treeline along the riverbank.',
        entryNodeId: 'hunter_blind_camp',
        hidden: true,
        minTrekTotal: 4,
        discoveryLog: 'Parted thick riverside ferns and uncovered an old hunter campsite!',
        nodes: {
          hunter_blind_camp: {
            id: 'hunter_blind_camp',
            title: 'Hunter Blind Shelter',
            description: 'An old spruce shelter containing salvaged skins, seasoned logs, and a cold firepit.',
            accessibleViews: ['forest'],
            actions: [
              {
                id: 'gather_timber',
                label: 'Chop dry firewood (+2 Wood)',
                type: 'gather',
                resourceGain: { material: 'Wood', count: 2 },
              },
            ],
            exits: [
              { exitToRegion: true, label: 'Return to the wilderness trail' },
            ],
            questHooks: [],
          },
        },
      },
    ],
  },

  bleak_falls_pass: {
    id: 'bleak_falls_pass',
    name: 'Bleak Falls Pass',
    description: 'A steep mountain road climbing into freezing mist and ancient stone ruins.',
    biome: 'mountains',
    adjacentRegionIds: ['plains_settlement'],
    dangerLevel: 3,
    encounterTable: [
      { mob: 'Skeleton', rollRange: [1, 3], label: 'Draugr Sentry' },
      { mob: 'Cave Spider', rollRange: [4, 6], label: 'Frostbite Spider' },
    ],
    pointsOfInterest: [
      {
        id: 'mountain_watchtower',
        name: 'Overlook Watchtower',
        description: 'A ruined stone watchtower surveying the mountain ascent.',
        entryNodeId: 'watchtower_ground',
        hidden: true,
        minTrekTotal: 4,
        discoveryLog: 'Spotted a mossy stone lookout tower standing high above the road!',
        nodes: {
          watchtower_ground: {
            id: 'watchtower_ground',
            title: 'Watchtower Ground Floor',
            description: 'A shattered wooden door opens onto a flagstone floor strewn with bandit supplies.',
            actions: [
              { id: 'patrol_fight', label: 'Engage Bandit Scout', type: 'combat', mobName: 'Zombie' },
            ],
            exits: [
              { exitToRegion: true, label: 'Descend to mountain path' },
            ],
            questHooks: [],
          },
        },
      },
      {
        id: 'bleak_falls_barrow',
        name: 'Bleak Falls Barrow',
        description: 'A massive ancient stone temple embedded into the frozen mountain face.',
        entryNodeId: 'barrow_vestibule',
        hidden: true,
        minTrekTotal: 8,
        discoveryLog: 'Pushed past the blizzard ridge and discovered the colossal entrance to Bleak Falls Barrow!',
        nodes: {
          barrow_vestibule: {
            id: 'barrow_vestibule',
            title: 'Temple Vestibule',
            description: 'Carved stone arches draped in webs. The freezing wind dies down as you step inside.',
            accessibleViews: ['mining'],
            actions: [
              {
                id: 'excavate_rubble',
                label: 'Excavate loose rubble (+1 Stone)',
                type: 'gather',
                resourceGain: { material: 'Stone', count: 1 },
              },
            ],
            exits: [
              { targetNodeId: 'crypt_inner_gate', label: 'Descend into the catacombs' },
              { exitToRegion: true, label: 'Exit back to mountain pass' },
            ],
            questHooks: [],
          },
          crypt_inner_gate: {
            id: 'crypt_inner_gate',
            title: 'Reinforced Crypt Gate',
            description: 'A heavy iron portcullis blocks passage into the inner burial chambers.',
            actions: [
              { id: 'gate_sentinel', label: 'Fight Gate Guardian', type: 'combat', mobName: 'Skeleton' },
            ],
            exits: [
              { targetNodeId: 'barrow_vestibule', label: 'Retreat to vestibule' },
            ],
            questHooks: [],
          },
        },
      },
    ],
  },
};

export function validateWorld(raw: unknown): Record<string, Region> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const candidate = raw as Record<string, any>;
  if (Object.keys(candidate).length === 0) return null;

  for (const reg of Object.values(candidate)) {
    if (
      typeof reg.id !== 'string' ||
      typeof reg.name !== 'string' ||
      typeof reg.description !== 'string' ||
      !Array.isArray(reg.pointsOfInterest) ||
      !Array.isArray(reg.adjacentRegionIds)
    ) {
      return null;
    }
  }
  return candidate as Record<string, Region>;
}

export function getInitialRegions(): Record<string, Region> {
  const custom = localStorage.getItem(CUSTOM_WORLD_STORAGE_KEY);
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      const validated = validateWorld(parsed);
      if (validated) return validated;
    } catch {
      console.warn('Failed to parse custom world regions. Falling back to default.');
    }
  }
  return JSON.parse(JSON.stringify(REGIONS));
}