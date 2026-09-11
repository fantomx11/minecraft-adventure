import type { Expr, Action, BinaryOperator } from '../types/ast';

export type RuntimeScope = Record<string, any>;

export class AstInterpreter {
  /** Evaluates an expression into a scalar value or boolean */
  public static evalExpr(expr: Expr, scope: RuntimeScope): any {
    switch (expr.type) {
      case 'literal':
        return expr.value;

      case 'get':
        return this.resolvePath(scope, expr.path);

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

      case 'has_item': {
        return scope.hero ? scope.hero.hasItem(expr.itemId) : false;
      }
    }
  }

  /** Executes an array of AST Actions */
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

  // --- Dynamic Object Path Accessors ---

  private static resolvePath(scope: RuntimeScope, path: string): any {
    const parts = path.split('.');
    let root: any = scope;

    // Shortcuts
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

  private static applyBinaryOp(op: BinaryOperator, left: any, right: any): any {
    switch (op) {
      case '==': return left === right;
      case '!=': return left !== right;
      case '>': return Number(left) > Number(right);
      case '>=': return Number(left) >= Number(right);
      case '<': return Number(left) < Number(right);
      case '<=': return Number(left) <= Number(right);
      case '+': return typeof left === 'string' || typeof right === 'string' ? `${left}${right}` : Number(left) + Number(right);
      case '-': return Number(left) - Number(right);
      case '*': return Number(left) * Number(right);
      case '/': return Number(right) === 0 ? 0 : Number(left) / Number(right);
      case '%': return Number(left) % Number(right);
      case 'and': return Boolean(left && right);
      case 'or': return Boolean(left || right);
    }
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
          return true; // Halts remaining actions in current block
        }

        case 'loot_action': {
          returns.reward = this.evalExpr(action.reward, scope);
          returns.won = true;
          return true; // Halts remaining actions in current block
        }

        case 'if': {
          const conditionPassed = Boolean(this.evalExpr(action.condition, scope));
          const targetBranch = conditionPassed ? action.then : action.else;

          if (targetBranch && targetBranch.length > 0) {
            const returned = this.#executeBlock(targetBranch, scope, returns);
            if (returned) return true; // Propagate early exit upward
          }
          break;
        }

        // ... Standard actions (deal_damage, change_health, inventory, flags) ...
      }
    }

    return false;
  }
}