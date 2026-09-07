import type { IconName } from '../../data/icons';
import type { ActiveView } from '../../App';
import { Icon } from '../ui/Icon';
import { Character } from '../../models/Character';

interface ModeNavBarProps {
  hero: Character;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  accessibleViews?: ('forest' | 'mining' | 'crafting')[];
  combatActive?: boolean;
}

const VIEW_CONFIG: { id: ActiveView; icon: IconName, label: string }[] = [
  { id: 'narrative', icon: 'book', label: 'STORY' },
  { id: 'combat', icon: 'sword', label: 'COMBAT' },
  { id: 'forest', icon: 'tree', label: 'FOREST' },
  { id: 'mining', icon: 'pickaxe', label: 'MINING' },
  { id: 'crafting', icon: 'crafting', label: 'CRAFTING' },
];

export function ModeNavBar({
  hero,
  activeView,
  onSelectView,
  accessibleViews = [],
  combatActive = false,
}: ModeNavBarProps) {

  if (!hero.narrativeMode) {
    const sandboxTabs = VIEW_CONFIG.filter((v) => v.id !== 'narrative');
    return (
      <nav class="mode-nav-bar">
        {sandboxTabs.map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            class={`pixel-btn ${activeView === id ? 'btn-active' : ''}`}
            onClick={() => onSelectView(id)}
          >
            <Icon name={icon} /> {label}
          </button>
        ))}
      </nav>
    );
  }
  // In Narrative mode: Show Story, plus only the screens allowed by the current passage
  const allowedViews = VIEW_CONFIG.filter((v) => {
    if (v.id === 'narrative') return true;
    if (v.id === 'combat' && (combatActive || activeView === 'combat')) return true;
    return accessibleViews.includes(v.id as any);
  });

  return (
    <nav class="mode-nav-bar">
      {allowedViews.map(({ id, icon, label }) => (
        <button
          key={id}
          type="button"
          class={`pixel-btn ${activeView === id ? 'btn-active' : ''}`}
          onClick={() => onSelectView(id)}
        >
          <Icon name={icon} /> {label}
        </button>
      ))}
    </nav>
  );
}