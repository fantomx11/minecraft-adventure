import type { Character } from '../../models/Character';
import { StatBadge } from '../ui/StatBadge';
import { Icon } from '../ui/Icon';

interface HudBarProps {
  hero: Character;
  onOpenSheet: () => void;
  onOpenOptions: () => void;
}

export function HudBar({ hero, onOpenSheet, onOpenOptions }: HudBarProps) {
  return (
    <header id="hud-bar">
      <div class="hud-stats">
        <StatBadge icon="hero" value={hero.name} />
        <StatBadge icon="heartFull" value={`${hero.hearts}/${hero.maxHearts}`} />
        <StatBadge icon="sword" label="ATK" value={hero.attack} />
        <StatBadge icon="tnt" label="DMG" value={hero.damage} />
        <StatBadge icon="chestplate" label="ARM" value={hero.armor} />
        <StatBadge icon="bed" label="RST" value={hero.restarts} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" class="pixel-btn" onClick={onOpenSheet}>
          <Icon name="book" /> SHEET
        </button>
        <button type="button" class="pixel-btn" onClick={onOpenOptions}>
          <Icon name="gear" /> OPTIONS
        </button>
      </div>
    </header>
  );
}