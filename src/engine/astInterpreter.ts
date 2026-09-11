import type { Expr, Action, BinaryOperator } from '../types/ast';
import { PoisonEffect, VexEffect } from '../models/Effects';
import { TRACKED_MATERIALS } from '../data/recipes';

export type RuntimeScope = Record<string, any>;

export class AstInterpreter {
  public static hasActionType(actions: Action[] | undefined, targetType: Action['type']): boolean {
    if (!actions || !Array.isArray(actions)) return false;

    for (const act of actions) {
      if (act.type === targetType) return true;
      if (act.type === 'if') {
        if (this.hasActionType(act.then, targetType)) return true;
        if (act.else && this.hasActionType(act.else, targetType)) return true;
      }
      if (act.type === 'for_each') {
        if (this.hasActionType(act.actions, targetType)) return true;
      }
    }

    return false;
  }

  public static evalExpr(expr: Expr, scope: RuntimeScope): any {
    switch (expr.type) {
      case 'literal':
        return expr.value;

      case 'get':
        return this.resolvePath(scope, expr.path);

      case 'template':
        return expr.template.replace(/\$\{([^}]+)\}/g, (_, path) => {
          const val = this.resolvePath(scope, path.trim());
          return val !== undefined ? String(val) : '';
        });

      case 'binary': {
        const left = this.evalExpr(expr.left, scope);
        const right = this.evalExpr(expr.right, scope);
        return this.applyBinaryOp(expr.op, left, right);
      }

      case 'unary': {
        const operand = this.evalExpr(expr.operand, scope);
        if (expr.op === 'not') return !operand;
        if (expr.op === '-') return -Number(operand);
        return operand;
      }

      case 'dice': {
        let sum = 0;
        for (let i = 0; i < expr.count; i++) {
          sum += Math.floor(Math.random() * expr.sides) + 1;
        }
        return sum;
      }

      case 'has_item':
        return scope.hero ? scope.hero.hasItem(expr.itemId) : false;
    }
  }

  public static execute(
    actions: Action[] | undefined,
    scope: RuntimeScope
  ): Record<string, any> {
    const returns: Record<string, any> = {};
    if (!actions || actions.length === 0) return returns;

    this.#executeBlock(actions, scope, returns);
    return returns;
  }

  public static executeRequire(
    actions: Action[] | undefined,
    scope: RuntimeScope,
    requiredType: Action['type']
  ): Record<string, any> {
    if (!actions || actions.length === 0 || !this.hasActionType(actions, requiredType)) {
      throw new Error(
        `[AstInterpreter] Validation Failed: Script must declare at least one '${requiredType}' action.`
      );
    }

    return this.execute(actions, scope);
  }

  static #executeBlock(
    actions: Action[],
    scope: RuntimeScope,
    returns: Record<string, any>
  ): boolean {
    for (const action of actions) {
      switch (action.type) {
        case 'return': {
          returns[action.key] = this.evalExpr(action.value, scope);
          return true;
        }

        case 'loot_action': {
          returns.reward = this.evalExpr(action.reward, scope);
          returns.won = true;
          return true;
        }

        case 'if': {
          const passed = Boolean(this.evalExpr(action.condition, scope));
          const branch = passed ? action.then : action.else;
          if (branch && branch.length > 0) {
            if (this.#executeBlock(branch, scope, returns)) return true;
          }
          break;
        }

        case 'for_each': {
          const list = this.evalExpr(action.list, scope);
          if (Array.isArray(list)) {
            for (const item of list) {
              const loopScope = { ...scope, [action.as]: item };
              if (this.#executeBlock(action.actions, loopScope, returns)) return true;
            }
          }
          break;
        }

        case 'set': {
          this.assignPath(scope, action.target, this.evalExpr(action.value, scope));
          break;
        }

        case 'modify': {
          const delta = Number(this.evalExpr(action.value, scope)) || 0;
          const current = Number(this.resolvePath(scope, action.target)) || 0;
          const next = action.op === 'multiply' ? current * delta : current + delta;
          this.assignPath(scope, action.target, next);
          break;
        }

        case 'deal_damage': {
          if (!scope.round) break;
          const amount = Number(this.evalExpr(action.amount, scope)) || 0;
          const inst = {
            amount,
            source: action.source,
            appliesArmor: action.appliesArmor ?? true,
          };
          if (action.target === 'hero') {
            scope.round.mobDamageInstances.push(inst);
          } else {
            scope.round.heroDamageInstances.push(inst);
          }
          break;
        }

        case 'modify_damage_instances': {
          if (!scope.round) break;
          const delta = action.delta !== undefined ? Number(this.evalExpr(action.delta, scope)) || 0 : undefined;
          const fixedAmt = action.amount !== undefined ? Number(this.evalExpr(action.amount, scope)) : undefined;
          const list = action.target === 'hero_damage'
            ? scope.round.heroDamageInstances
            : scope.round.mobDamageInstances;

          for (const inst of list) {
            if (fixedAmt !== undefined) {
              inst.amount = Math.max(action.min ?? 0, fixedAmt);
            } else if (delta !== undefined) {
              inst.amount = Math.max(action.min ?? 0, inst.amount + delta);
            }
            if (action.appliesArmor !== undefined) inst.appliesArmor = action.appliesArmor;
            if (action.source !== undefined) inst.source = action.source;
          }
          break;
        }

        case 'change_health': {
          const delta = Number(this.evalExpr(action.amount, scope)) || 0;
          const target = action.target === 'hero' ? scope.hero : (scope.mob || scope.self);
          target?.changeHealth(delta);
          break;
        }

        case 'clear_mob_damage':
        case 'clear_damage': {
          if (!scope.round) break;
          const target = (action as any).target || 'mob';
          if (target === 'hero') {
            scope.round.heroDamageInstances = [];
          } else {
            scope.round.mobDamageInstances = [];
          }
          break;
        }

        case 'prevent_death': {
          if (scope.round) scope.round.preventDeath = true;
          break;
        }

        case 'message': {
          if (scope.round) {
            scope.round.messages.push({
              type: action.messageType,
              text: String(this.evalExpr(action.text, scope)),
            });
          }
          break;
        }

        case 'add_effect': {
          if (scope.combat) {
            const amt = action.amount ? Number(this.evalExpr(action.amount, scope)) : 1;
            if (action.effect === 'poison') scope.combat.effects.push(new PoisonEffect(amt));
            if (action.effect === 'vex') scope.combat.effects.push(new VexEffect());
          }
          break;
        }

        case 'inventory': {
          if (!scope.hero) break;
          if (action.slot) {
            const equippedItem = scope.hero.equipped[action.slot];
            if (equippedItem) {
              scope.hero.removeEquipment(equippedItem);
            }
            break;
          }

          const rawItemId = typeof action.itemId === 'object' && action.itemId !== null
            ? this.evalExpr(action.itemId, scope)
            : action.itemId;
          const itemId = String(rawItemId || '');
          if (!itemId) break;

          const count = action.count ? Number(this.evalExpr(action.count, scope)) : 1;
          const isMat = action.isMaterial ?? TRACKED_MATERIALS.some(m => m.toLowerCase() === itemId.toLowerCase());

          if (isMat) {
            const matKey = TRACKED_MATERIALS.find(m => m.toLowerCase() === itemId.toLowerCase())!;
            scope.hero.adjustMaterial(matKey, action.action === 'add' ? count : -count);
          } else {
            if (action.action === 'add') {
              for (let i = 0; i < count; i++) scope.hero.addEquipment(itemId);
            } else {
              for (let i = 0; i < count; i++) scope.hero.removeEquipment(itemId);
            }
          }
          break;
        }

        case 'flag': {
          if (!scope.game) break;
          const flags = scope.game.openWorld.questFlags;
          if (action.action === 'set') {
            flags[action.flag] = this.evalExpr(action.value!, scope);
          } else if (action.action === 'add') {
            const cur = Number(flags[action.flag]) || 0;
            flags[action.flag] = cur + (Number(this.evalExpr(action.value!, scope)) || 0);
          } else if (action.action === 'toggle') {
            flags[action.flag] = !flags[action.flag];
          } else if (action.action === 'delete') {
            delete flags[action.flag];
          }
          break;
        }
      }
    }
    return false;
  }

  private static resolvePath(scope: RuntimeScope, path: string): any {
    const parts = path.split('.');
    let root: any = scope;

    if (parts[0] === 'flags' && scope.game) {
      root = scope.game.openWorld.questFlags;
      parts.shift();
    }

    for (const part of parts) {
      if (root === null || root === undefined) return undefined;
      root = root[part];
    }
    return root;
  }

  private static assignPath(scope: RuntimeScope, path: string, value: any): void {
    const parts = path.split('.');
    let root: any = scope;

    if (parts[0] === 'flags' && scope.game) {
      root = scope.game.openWorld.questFlags;
      parts.shift();
    }

    for (let i = 0; i < parts.length - 1; i++) {
      if (!root[parts[i]] || typeof root[parts[i]] !== 'object') {
        root[parts[i]] = {};
      }
      root = root[parts[i]];
    }
    root[parts[parts.length - 1]] = value;
  }

  private static applyBinaryOp(op: BinaryOperator, left: any, right: any): any {
    switch (op) {
      case '==': return left === right;
      case '!=': return left !== right;
      case '>': return Number(left) > Number(right);
      case '>=': return Number(left) >= Number(right);
      case '<': return Number(left) < Number(right);
      case '<=': return Number(left) <= Number(right);
      case '+':
        return typeof left === 'string' || typeof right === 'string'
          ? `${left}${right}`
          : Number(left) + Number(right);
      case '-': return Number(left) - Number(right);
      case '*': return Number(left) * Number(right);
      case '/': return Number(right) === 0 ? 0 : Number(left) / Number(right);
      case '%': return Number(left) % Number(right);
      case 'and': return Boolean(left && right);
      case 'or': return Boolean(left || right);
    }
  }
}