interface PixelDieProps {
  value: number;
  isHit: boolean;
  size?: number;
}

const PIPS = {
  tl: <rect x="3" y="3" width="2" height="2" fill="#000" />,
  tr: <rect x="11" y="3" width="2" height="2" fill="#000" />,
  ml: <rect x="3" y="7" width="2" height="2" fill="#000" />,
  c:  <rect x="7" y="7" width="2" height="2" fill="#000" />,
  mr: <rect x="11" y="7" width="2" height="2" fill="#000" />,
  bl: <rect x="3" y="11" width="2" height="2" fill="#000" />,
  br: <rect x="11" y="11" width="2" height="2" fill="#000" />,
};

export function PixelDie({ value, isHit }: PixelDieProps) {
  const borderColor = isHit ? '#92cc41' : '#e76e55';
  const bgColor = isHit ? '#eaf8db' : '#fdeeed';

  return (
    <svg class="pixel-die-svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
      {/* Outer Border & Background */}
      <rect x="0" y="0" width="16" height="16" fill={borderColor} />
      <rect x="1" y="1" width="14" height="14" fill={bgColor} />

      {/* Highlights */}
      <rect x="1" y="1" width="14" height="1" fill="#fff" />
      <rect x="1" y="1" width="1" height="14" fill="#fff" />

      {/* Shadows */}
      <rect x="2" y="14" width="13" height="1" fill="#aaa" />
      <rect x="14" y="2" width="1" height="13" fill="#aaa" />

      {/* Pips */}
      {(value === 1 || value === 3 || value === 5) && PIPS.c}
      {value >= 2 && <>{PIPS.tl}{PIPS.br}</>}
      {value >= 4 && <>{PIPS.tr}{PIPS.bl}</>}
      {value === 6 && <>{PIPS.ml}{PIPS.mr}</>}
    </svg>
  );
}