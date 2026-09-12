import type { IconName } from '../../data/icons';
import type { ActiveView } from '../../types/game';
import { Icon } from '../ui/Icon';

interface ModeNavBarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  accessibleViews: ActiveView[];
}

const VIEW_CONFIG: { id: ActiveView; icon: IconName; label: string }[] = [
  { id: 'narrative', icon: 'book', label: 'STORY' },
  { id: 'world_map', icon: 'spark', label: 'WORLD' },
  { id: 'poi_node', icon: 'target', label: 'LOCATION' },
  { id: 'combat', icon: 'sword', label: 'COMBAT' },
  { id: 'forest', icon: 'tree', label: 'FOREST' },
  { id: 'mining', icon: 'pickaxe', label: 'MINING' },
  { id: 'crafting', icon: 'crafting', label: 'CRAFTING' },
];

export function ModeNavBar({ activeView, onSelectView, accessibleViews }: ModeNavBarProps) {
  const visibleTabs = VIEW_CONFIG.filter((v) => accessibleViews.includes(v.id));

  return (
    <nav class="mode-nav-bar">
      {visibleTabs.map(({ id, icon, label }) => (
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