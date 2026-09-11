// src/engine/evaluator.ts
import type { Character } from '../models/Character';
import type { GameProgressionState } from '../types/game';
import type { Expr, Action } from '../types/ast';
import type { TrackedMaterial } from '../types/inventory';
import { AstInterpreter, type RuntimeScope } from './astInterpreter';

export interface EvaluationContext {
  hero: Character;
  game: GameProgressionState;
  onGainMaterial?: (mat: TrackedMaterial, amount: number) => void;
}

export function evaluateCondition(
  condition: Expr | undefined,
  ctx: EvaluationContext
): boolean {
  if (!condition) return true;
  const scope: RuntimeScope = {
    hero: ctx.hero,
    game: ctx.game,
  };
  return Boolean(AstInterpreter.evalExpr(condition, scope));
}

export function applyMutations(
  mutations: Action[] | undefined,
  ctx: EvaluationContext
): void {
  if (!mutations || mutations.length === 0) return;
  const scope: RuntimeScope = {
    hero: ctx.hero,
    game: ctx.game,
  };
  AstInterpreter.execute(mutations, scope);
}