import type { GameModeController, EngineContext, CombatTriggerPayload, ReturnBannerDescriptor } from '../types/controller';
import type { ActiveView } from '../types/game';
import type { TrackedMaterial } from '../types/inventory';

export class OpenWorldModeController implements GameModeController {
  public readonly id = 'open_world';
  public readonly label = 'Open World Mode';
  public readonly defaultView: ActiveView = 'world_map';
  public readonly allowInventoryEditing = false;

  public getAccessibleViews(ctx: EngineContext): ActiveView[] {
    const views: ActiveView[] = ['world_map'];
    if (ctx.game.openWorld.currentPoiId) {
      views.push('poi_node');
    }
    return views;
  }

  public canNavigateToView(targetView: ActiveView, ctx: EngineContext): boolean {
    return this.getAccessibleViews(ctx).includes(targetView);
  }

  public getReturnBanner(ctx: EngineContext): ReturnBannerDescriptor | null {
    if (ctx.game.activeView === 'world_map' || ctx.game.activeView === 'poi_node') {
      return null;
    }
    if (ctx.game.openWorld.currentPoiId) {
      return {
        label: 'RETURN TO LOCATION',
        action: () => ctx.setActiveView('poi_node'),
      };
    }
    return {
      label: 'RETURN TO WORLD MAP',
      action: () => ctx.setActiveView('world_map'),
    };
  }

  public initiateCombat(payload: CombatTriggerPayload, ctx: EngineContext): void {
    ctx.setActiveView('combat');
  }

  public resolveCombatExit(outcome: 'victory' | 'defeat', ctx: EngineContext): void {
    if (outcome === 'defeat') {
      ctx.hero.respawn();
      ctx.game.openWorld.currentPoiId = null;
      ctx.game.openWorld.currentNodeId = null;
      ctx.setActiveView('world_map');
    } else {
      ctx.setActiveView(ctx.game.openWorld.currentPoiId ? 'poi_node' : 'world_map');
    }
    ctx.saveState();
  }

  public handleGainMaterial(mat: TrackedMaterial, amount: number, ctx: EngineContext): void {
    const added = ctx.hero.adjustMaterial(mat, amount);
    if (added === 0 && ctx.hero.materialRule === 'total' && ctx.hero.totalMaterialsCount >= 5) {
      ctx.setPendingMaterial(mat);
    } else {
      ctx.saveState();
    }
  }

  public handleHeroDefeated(ctx: EngineContext): void {
    ctx.hero.respawn();
    ctx.game.openWorld.currentPoiId = null;
    ctx.game.openWorld.currentNodeId = null;
    ctx.setActiveView('world_map');
    ctx.saveState();
  }
}