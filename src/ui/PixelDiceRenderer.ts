export class PixelDiceRenderer {
  public static getSvg(val: number, isHit: boolean): string {
    const pips: Record<string, string> = {
      tl: '<rect x="3" y="3" width="2" height="2" fill="#000"/>',
      tr: '<rect x="11" y="3" width="2" height="2" fill="#000"/>',
      ml: '<rect x="3" y="7" width="2" height="2" fill="#000"/>',
      c:  '<rect x="7" y="7" width="2" height="2" fill="#000"/>',
      mr: '<rect x="11" y="7" width="2" height="2" fill="#000"/>',
      bl: '<rect x="3" y="11" width="2" height="2" fill="#000"/>',
      br: '<rect x="11" y="11" width="2" height="2" fill="#000"/>',
    };

    let active = '';
    if (val === 1) active = pips.c;
    else if (val === 2) active = pips.tl + pips.br;
    else if (val === 3) active = pips.tl + pips.c + pips.br;
    else if (val === 4) active = pips.tl + pips.tr + pips.bl + pips.br;
    else if (val === 5) active = pips.tl + pips.tr + pips.c + pips.bl + pips.br;
    else if (val === 6) active = pips.tl + pips.tr + pips.ml + pips.mr + pips.bl + pips.br;

    const borderCol = isHit ? '#92cc41' : '#e76e55';
    const bgCol = isHit ? '#eaf8db' : '#fdeeed';

    return `
      <svg class="pixel-die-svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
        <rect x="0" y="0" width="16" height="16" fill="${borderCol}"/>
        <rect x="1" y="1" width="14" height="14" fill="${bgCol}"/>
        <rect x="1" y="1" width="14" height="1" fill="#fff"/>
        <rect x="1" y="1" width="1" height="14" fill="#fff"/>
        <rect x="2" y="14" width="13" height="1" fill="#aaa"/>
        <rect x="14" y="2" width="1" height="13" fill="#aaa"/>
        ${active}
      </svg>
    `;
  }
}