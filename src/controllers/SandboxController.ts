import type { GameModeController, EngineContext, CombatTriggerPayload, ReturnBannerDescriptor } from '../types/controller';
import type { ActiveView } from '../types/game';
import type { TrackedMaterial } from '../types/inventory';

export class SandboxModeController implements GameModeController {
  public readonly id = 'sandbox';
  public readonly label = 'Sandbox Mode';
  public readonly defaultView: ActiveView = 'combat';
  public readonly allowInventoryEditing = true;

  public getAccessibleViews(): ActiveView[] {
    return ['combat', 'forest', 'mining', 'crafting'];
  }

  public canNavigateToView(targetView: ActiveView): boolean {
    return this.getAccessibleViews().includes(targetView);
  }

  public getReturnBanner(): ReturnBannerDescriptor | null {
    return null;
  }

  public onActivityCleared(type: 'forest' | 'mining', ctx: EngineContext): void {
    if (type === 'forest') ctx.game.sandbox.forestCleared += 1;
    if (type === 'mining') ctx.game.sandbox.mineCleared += 1;
    ctx.saveState();
  }

  public initiateCombat(payload: CombatTriggerPayload, ctx: EngineContext): void {
    ctx.setActiveView('combat');
  }

  public resolveCombatExit(outcome: 'victory' | 'defeat', ctx: EngineContext): void {
    ctx.setActiveView('combat');
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
    ctx.saveState();
  }
}