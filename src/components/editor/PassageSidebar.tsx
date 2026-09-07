// src/components/editor/PassageSidebar.tsx
import { PixelFrame } from '../ui/PixelFrame';
import { Icon } from '../ui/Icon';
import { IconName } from '../../data/icons';
import { Passage } from '../../types/narrative';

interface PassageSidebarProps {
  passages: Record<string, Passage>;
  selectedId: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectPassage: (id: string) => void;
  onAddPassage: () => void;
}

export function PassageSidebar({
  passages,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelectPassage,
  onAddPassage,
}: PassageSidebarProps) {
  const filteredIds = Object.keys(passages).filter((id) => {
    const p = passages[id];
    return (
      id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <aside>
      <PixelFrame title="PASSAGES" icon="book">
        <input
          type="text"
          class="pixel-input"
          placeholder="Search passages..."
          value={searchQuery}
          onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
        />
        <button
          type="button"
          class="pixel-btn btn-success"
          style={{ width: '100%', marginTop: '10px' }}
          onClick={onAddPassage}
        >
          + NEW PASSAGE
        </button>
        <div class="editor-sidebar-list">
          {filteredIds.map((id) => {
            const item = passages[id];
            const isSelected = id === selectedId;
            return (
              <button
                key={id}
                type="button"
                class={`pixel-btn editor-passage-item ${isSelected ? 'btn-active' : ''}`}
                onClick={() => onSelectPassage(id)}
              >
                <span>
                  {item.icon && <Icon name={item.icon as IconName} />} {item.title}
                </span>
                <span style={{ opacity: 0.6, fontSize: '10px' }}>({item.choices.length})</span>
              </button>
            );
          })}
        </div>
      </PixelFrame>
    </aside>
  );
}