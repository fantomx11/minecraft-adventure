import type { GameModeController, EngineContext, CombatTriggerPayload, ReturnBannerDescriptor } from '../types/controller';
import type { ActiveView } from '../types/game';
import type { TrackedMaterial } from '../types/inventory';

export class NarrativeModeController implements GameModeController {
  public readonly id = 'narrative';
  public readonly label = 'Narrative Mode';
  public readonly defaultView: ActiveView = 'narrative';
  public readonly allowInventoryEditing = false;

  public getAccessibleViews(ctx: EngineContext): ActiveView[] {
    const currentPassage = ctx.passages[ctx.game.narrative.currentPassageId];
    const allowed: ActiveView[] = ['narrative'];
    if (currentPassage?.accessibleViews) {
      allowed.push(...currentPassage.accessibleViews);
    }
    return allowed;
  }

  public canNavigateToView(targetView: ActiveView, ctx: EngineContext): boolean {
    if (targetView === 'combat') return true;
    return this.getAccessibleViews(ctx).includes(targetView);
  }

  public getReturnBanner(ctx: EngineContext): ReturnBannerDescriptor | null {
    if (ctx.game.activeView === 'narrative' || ctx.game.activeView === 'combat') {
      return null;
    }
    const currentPassage = ctx.passages[ctx.game.narrative.currentPassageId];
    return {
      label: `RETURN TO STORY (${currentPassage?.title?.toUpperCase() || 'PASSAGE'})`,
      action: () => ctx.setActiveView('narrative'),
    };
  }

  public onActivityCleared(type: 'forest' | 'mining', ctx: EngineContext): void {
    if (type === 'forest') ctx.game.sandbox.forestCleared += 1;
    if (type === 'mining') ctx.game.sandbox.mineCleared += 1;
    ctx.saveState();
  }

  public initiateCombat(_payload: CombatTriggerPayload, ctx: EngineContext): void {
    ctx.setActiveView('combat');
  }

  public resolveCombatExit(
    outcome: 'victory' | 'defeat',
    ctx: EngineContext,
    runtimeContext?: Record<string, any>
  ): void {
    if (outcome === 'victory' && runtimeContext?.victoryPassageId) {
      ctx.game.narrative.currentPassageId = runtimeContext.victoryPassageId;
    } else {
      ctx.hero.respawn();
      ctx.game.narrative.currentPassageId = runtimeContext?.defeatPassageId || 'combat_defeat';
    }
    ctx.setActiveView('narrative');
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
    ctx.game.narrative.currentPassageId = 'combat_defeat';
    ctx.setActiveView('narrative');
    ctx.saveState();
  }
}