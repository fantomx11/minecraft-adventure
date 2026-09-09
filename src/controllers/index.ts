import type { GameModeId } from '../types/game';
import type { GameModeController } from '../types/controller';
import { SandboxModeController } from './SandboxController';
import { NarrativeModeController } from './NarrativeController';
import { OpenWorldModeController } from './OpenWorldController';

export const MODE_CONTROLLERS: Record<GameModeId, GameModeController> = {
  sandbox: new SandboxModeController(),
  narrative: new NarrativeModeController(),
  open_world: new OpenWorldModeController(),
};

export function getModeController(modeId: GameModeId): GameModeController {
  return MODE_CONTROLLERS[modeId] || MODE_CONTROLLERS.sandbox;
}