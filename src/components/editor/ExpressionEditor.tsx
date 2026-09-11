import { h, Fragment } from 'preact';
import type { Expr, BinaryOperator } from '../../types/ast';

interface ExpressionEditorProps {
  expr: Expr;
  onChange: (next: Expr) => void;
  compact?: boolean;
}

const COMMON_PATHS = [
  'round.matchingMisses',
  'round.matchingHits',
  'round.hits',
  'round.misses',
  'mob.damage',
  'mob.defense',
  'hero.armor',
  'hero.hearts',
  'combat.ignoreArmor',
  'roll',
];

export function ExpressionEditor({ expr, onChange, compact = false }: ExpressionEditorProps) {
  const update = (patch: Partial<any>) => {
    onChange({ ...expr, ...patch } as Expr);
  };

  const changeType = (newType: Expr['type']) => {
    switch (newType) {
      case 'literal':
        onChange({ type: 'literal', value: 0 });
        break;
      case 'get':
        onChange({ type: 'get', path: 'round.matchingMisses' });
        break;
      case 'binary':
        onChange({
          type: 'binary',
          op: '>=',
          left: { type: 'get', path: 'round.matchingMisses' },
          right: { type: 'literal', value: 2 },
        });
        break;
      case 'unary':
        onChange({ type: 'unary', op: 'not', operand: { type: 'literal', value: false } });
        break;
      case 'dice':
        onChange({ type: 'dice', count: 1, sides: 6 });
        break;
      case 'has_item':
        onChange({ type: 'has_item', itemId: 'Iron Sword' });
        break;
      case 'template':
        onChange({ type: 'template', template: 'Damage doubled to ${mob.damage}!' });
        break;
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 4px',
        background: '#1a1c23',
        border: '1px solid #333',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '11px',
      }}
    >
      <select
        value={expr.type}
        onChange={(e) => changeType((e.target as HTMLSelectElement).value as Expr['type'])}
        style={{
          background: '#2b2d38',
          color: '#8be9fd',
          border: '1px solid #444',
          fontSize: '10px',
        }}
      >
        <option value="binary">Compare [A op B]</option>
        <option value="get">Get Value</option>
        <option value="literal">Literal</option>
        <option value="dice">Roll Dice</option>
        <option value="has_item">Has Item</option>
        <option value="template">Template String</option>
        <option value="unary">Not / Invert</option>
      </select>

      {expr.type === 'literal' && (
        <input
          type={typeof expr.value === 'number' ? 'number' : 'text'}
          value={String(expr.value)}
          onInput={(e) => {
            const val = (e.target as HTMLInputElement).value;
            update({ value: isNaN(Number(val)) ? val : Number(val) });
          }}
          style={{ width: '70px', background: '#111', color: '#50fa7b', border: '1px solid #444' }}
        />
      )}

      {expr.type === 'get' && (
        <Fragment>
          <input
            type="text"
            list="ast-common-paths"
            value={expr.path}
            onInput={(e) => update({ path: (e.target as HTMLInputElement).value })}
            style={{ width: '130px', background: '#111', color: '#ffb86c', border: '1px solid #444' }}
          />
          <datalist id="ast-common-paths">
            {COMMON_PATHS.map((p) => (
              <option value={p} />
            ))}
          </datalist>
        </Fragment>
      )}

      {expr.type === 'binary' && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ExpressionEditor expr={expr.left} onChange={(left) => update({ left })} compact />
          <select
            value={expr.op}
            onChange={(e) => update({ op: (e.target as HTMLSelectElement).value as BinaryOperator })}
            style={{ background: '#44475a', color: '#ff79c6', border: 'none', fontWeight: 'bold' }}
          >
            <option value="==">==</option>
            <option value="!=">!=</option>
            <option value=">=">&gt;=</option>
            <option value=">">&gt;</option>
            <option value="<=">&lt;=</option>
            <option value="<">&lt;</option>
            <option value="and">AND</option>
            <option value="or">OR</option>
            <option value="+">+</option>
            <option value="-">-</option>
            <option value="*">*</option>
            <option value="%">%</option>
          </select>
          <ExpressionEditor expr={expr.right} onChange={(right) => update({ right })} compact />
        </div>
      )}

      {expr.type === 'dice' && (
        <Fragment>
          <input
            type="number"
            value={expr.count}
            min={1}
            onInput={(e) => update({ count: Number((e.target as HTMLInputElement).value) })}
            style={{ width: '35px', background: '#111', color: '#bd93f9', border: '1px solid #444' }}
          />
          <span>d</span>
          <input
            type="number"
            value={expr.sides}
            min={2}
            onInput={(e) => update({ sides: Number((e.target as HTMLInputElement).value) })}
            style={{ width: '40px', background: '#111', color: '#bd93f9', border: '1px solid #444' }}
          />
        </Fragment>
      )}

      {expr.type === 'has_item' && (
        <input
          type="text"
          placeholder="Item Name"
          value={expr.itemId}
          onInput={(e) => update({ itemId: (e.target as HTMLInputElement).value })}
          style={{ width: '100px', background: '#111', color: '#f1fa8c', border: '1px solid #444' }}
        />
      )}

      {expr.type === 'template' && (
        <input
          type="text"
          value={expr.template}
          onInput={(e) => update({ template: (e.target as HTMLInputElement).value })}
          style={{ width: '160px', background: '#111', color: '#f1fa8c', border: '1px solid #444' }}
        />
      )}
    </div>
  );
}