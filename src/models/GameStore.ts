import { Observable } from './Observable';
import type {
  GameProgressionState,
  GameModeId,
  ActiveView,
  SandboxProgression,
  NarrativeProgression,
  OpenWorldProgression,
} from '../types/game';

export class GameStore extends Observable {
  #data: GameProgressionState;

  constructor(initialData: GameProgressionState) {
    super();
    // Deep-proxied reactive store
    this.#data = this.createReactiveStore(initialData);
  }

  // --- Top-Level Accessors ---
  public get mode(): GameModeId {
    return this.#data.mode;
  }
  public set mode(val: GameModeId) {
    this.#data.mode = val;
  }

  public get activeView(): ActiveView {
    return this.#data.activeView;
  }
  public set activeView(val: ActiveView) {
    this.#data.activeView = val;
  }

  // --- Sub-Progression Accessors (Mutations on child properties trigger notify) ---
  public get sandbox(): SandboxProgression {
    return this.#data.sandbox;
  }

  public get narrative(): NarrativeProgression {
    return this.#data.narrative;
  }

  public get openWorld(): OpenWorldProgression {
    return this.#data.openWorld;
  }

  // --- Serialization ---
  public toJSON(): GameProgressionState {
    return JSON.parse(JSON.stringify(this.#data));
  }
}