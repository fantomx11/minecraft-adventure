import type { IconName } from '../../data/icons';
import type { ActiveView } from '../../App';
import { Icon } from '../ui/Icon';

interface ModeNavBarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
}

const VIEW_CONFIG: { id: ActiveView; icon: IconName }[] = [
  { id: 'combat', icon: 'sword' },
  { id: 'forest', icon: 'tree' },
  { id: 'mining', icon: 'pickaxe' },
  { id: 'crafting', icon: 'crafting' },
];

export function ModeNavBar({ activeView, onSelectView }: ModeNavBarProps) {
  return (
    <nav class="mode-nav-bar">
      {VIEW_CONFIG.map(({ id, icon }) => (
        <button
          key={id}
          type="button"
          class={`pixel-btn ${activeView === id ? 'btn-active' : ''}`}
          onClick={() => onSelectView(id)}
        >
          <Icon name={icon} /> {id.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}