import type { Character } from '../models/Character';
import type { GameProgressionState } from '../types/game';
import type { Condition, Mutation, FlagComparator } from '../types/world';
import type { TrackedMaterial } from '../types/inventory';
import { TRACKED_MATERIALS } from '../data/recipes';

export interface EvaluationContext {
  hero: Character;
  game: GameProgressionState;
  onGainMaterial?: (mat: TrackedMaterial, amount: number) => void;
}

function compareValues(actual: unknown, comparator: FlagComparator, target: unknown): boolean {
  if (comparator === '==') return actual === target;
  if (comparator === '!=') return actual !== target;

  const numA = Number(actual);
  const numB = Number(target);
  if (isNaN(numA) || isNaN(numB)) return false;

  switch (comparator) {
    case '>': return numA > numB;
    case '>=': return numA >= numB;
    case '<': return numA < numB;
    case '<=': return numA <= numB;
    default: return false;
  }
}

export function getItemCount(hero: Character, itemId: string): number {
  const isMaterial = TRACKED_MATERIALS.some(
    (m) => m.toLowerCase() === itemId.toLowerCase()
  );
  if (isMaterial) {
    const matKey = TRACKED_MATERIALS.find(
      (m) => m.toLowerCase() === itemId.toLowerCase()
    )!;
    return hero.materials[matKey] || 0;
  }
  return hero.equipmentInventoryIds.filter(
    (id) => id.toLowerCase() === itemId.toLowerCase()
  ).length;
}

export function evaluateCondition(
  condition: Condition | undefined,
  ctx: EvaluationContext
): boolean {
  if (!condition) return true;

  switch (condition.type) {
    case 'flag': {
      const raw = ctx.game.openWorld.questFlags[condition.flag];
      let actual = raw;
      if (raw === undefined) {
        if (typeof condition.value === 'boolean') actual = false;
        else if (typeof condition.value === 'number') actual = 0;
        else actual = '';
      }
      return compareValues(actual, condition.comparator, condition.value);
    }

    case 'inventory': {
      const count = getItemCount(ctx.hero, condition.itemId);
      const comp = condition.comparator || '>=';
      const target = condition.count ?? 1;
      return compareValues(count, comp, target);
    }

    case 'player': {
      const actual = ctx.hero[condition.stat] ?? 0;
      return compareValues(actual, condition.comparator, condition.value);
    }

    case 'progression': {
      let actual = 0;
      if (condition.counter === 'forestCleared') {
        actual = ctx.game.sandbox.forestCleared;
      } else if (condition.counter === 'mineCleared') {
        actual = ctx.game.sandbox.mineCleared;
      } else {
        actual = ctx.game.openWorld.counters[condition.counter] || 0;
      }
      return compareValues(actual, condition.comparator, condition.value);
    }

    case 'passage': {
      const isVisited = ctx.game.narrative.visitedPassages.includes(condition.passageId);
      const expected = condition.visited ?? true;
      return isVisited === expected;
    }

    case 'location': {
      const isDiscovered =
        ctx.game.openWorld.discoveredRegions.includes(condition.locationId) ||
        ctx.game.openWorld.discoveredPoiIds.includes(condition.locationId);
      const expected = condition.discovered ?? true;
      return isDiscovered === expected;
    }

    case 'and': {
      return condition.conditions.every((c) => evaluateCondition(c, ctx));
    }

    case 'or': {
      return condition.conditions.some((c) => evaluateCondition(c, ctx));
    }

    case 'not': {
      return !evaluateCondition(condition.condition, ctx);
    }

    default:
      return true;
  }
}

export function applyMutations(
  mutations: Mutation[] | undefined,
  ctx: EvaluationContext
): void {
  if (!mutations || mutations.length === 0) return;

  for (const mut of mutations) {
    switch (mut.type) {
      case 'flag': {
        const flags = ctx.game.openWorld.questFlags;
        const current = flags[mut.flag];

        if (mut.action === 'set') {
          if (mut.value !== undefined) {
            flags[mut.flag] = mut.value;
          }
        } else if (mut.action === 'add') {
          flags[mut.flag] = (Number(current) || 0) + Number(mut.value || 0);
        } else if (mut.action === 'toggle') {
          flags[mut.flag] = !Boolean(current);
        } else if (mut.action === 'delete') {
          delete flags[mut.flag];
        }
        break;
      }

      case 'inventory': {
        const count = mut.count ?? 1;
        const isMaterial = TRACKED_MATERIALS.some(
          (m) => m.toLowerCase() === mut.itemId.toLowerCase()
        );

        if (isMaterial) {
          const matKey = TRACKED_MATERIALS.find(
            (m) => m.toLowerCase() === mut.itemId.toLowerCase()
          )!;
          if (mut.action === 'add') {
            if (ctx.onGainMaterial) {
              ctx.onGainMaterial(matKey, count);
            } else {
              ctx.hero.adjustMaterial(matKey, count);
            }
          } else if (mut.action === 'remove') {
            ctx.hero.adjustMaterial(matKey, -count);
          }
        } else {
          if (mut.action === 'add') {
            for (let i = 0; i < count; i++) {
              ctx.hero.addEquipment(mut.itemId);
            }
          } else if (mut.action === 'remove') {
            for (let i = 0; i < count; i++) {
              ctx.hero.removeEquipment(mut.itemId);
            }
          }
        }
        break;
      }

      case 'location': {
        if (mut.action === 'discover') {
          if (!ctx.game.openWorld.discoveredPoiIds.includes(mut.locationId)) {
            ctx.game.openWorld.discoveredPoiIds.push(mut.locationId);
          }
          if (!ctx.game.openWorld.discoveredRegions.includes(mut.locationId)) {
            ctx.game.openWorld.discoveredRegions.push(mut.locationId);
          }
        }
        break;
      }
    }
  }
}