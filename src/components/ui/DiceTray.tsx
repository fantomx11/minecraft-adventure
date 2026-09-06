import { PixelDie } from './PixelDie';

interface DiceTrayProps {
  rolls: number[];
  targetDef: number;
}

export function DiceTray({ rolls, targetDef }: DiceTrayProps) {
  return (
    <div class="dice-tray">
      {rolls.map((roll, idx) => {
        const isHit = roll >= targetDef;
        return (
          <div key={idx} class="die-wrapper">
            <PixelDie value={roll} isHit={isHit} />
            <span class={`die-tag ${isHit ? 'tag-hit' : 'tag-miss'}`}>
              {isHit ? 'HIT' : 'MISS'}
            </span>
          </div>
        );
      })}
      {rolls.length === 0 && (
        <div style={{ color: '#666', fontSize: '11px', alignSelf: 'center' }}>
          Dice tray empty
        </div>
      )}
    </div>
  );
}