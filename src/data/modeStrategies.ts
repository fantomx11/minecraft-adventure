import type { GameModeStrategy, CombatExitResolution } from '../types/mode';
import type { ActiveView } from '../types/game';

export const MODE_STRATEGIES: Record<string, GameModeStrategy> = {
  sandbox: {
    id: 'sandbox',
    label: 'Sandbox Mode',
    defaultView: 'combat',
    getAllowedViews: () => ['combat', 'forest', 'mining', 'crafting'], //[cite: 1]
    handleCombatFinished: () => ({ view: 'combat' }),
  },
  narrative: {
    id: 'narrative',
    label: 'Narrative Mode',
    defaultView: 'narrative',
    getAllowedViews: (game, passages) => {
      const current = passages[game.narrative.currentPassageId];
      const views: ActiveView[] = ['narrative'];
      if (current?.accessibleViews) {
        views.push(...current.accessibleViews); //[cite: 1]
      }
      return views;
    },
    handleCombatFinished: (outcome, game, hero, context) => {
      if (outcome === 'victory' && context?.passageVictoryId) {
        return { view: 'narrative', targetPassageId: context.passageVictoryId };
      }
      return {
        view: 'narrative',
        targetPassageId: context?.passageDefeatId || 'combat_defeat',
      };
    },
  },
  open_world: {
    id: 'open_world',
    label: 'Open World Mode',
    defaultView: 'world_map',
    getAllowedViews: (game) => {
      const views: ActiveView[] = ['world_map'];
      if (game.openWorld.currentPoiId) {
        views.push('poi_node');
      }
      return views;
    },
    handleCombatFinished: (outcome, game) => {
      if (game.openWorld.currentPoiId) {
        return { view: 'poi_node', poiNodeId: game.openWorld.currentNodeId || undefined };
      }
      return { view: 'world_map' };
    },
  },
};