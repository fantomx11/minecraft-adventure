import { useState } from 'preact/hooks';
import { CRAFTING_RECIPES } from '../../data/recipes';
import { Character } from '../../models/Character';
import { EquipmentType, CraftingRecipe, TrackedMaterial } from '../../types/inventory';
import { PixelFrame } from '../ui/PixelFrame';
import { RecipeCard } from '../ui/RecipeCard';
import { StatusBar } from '../ui/StatusBar';

interface CraftingViewProps {
  hero: Character;
  onUpdate: () => void;
}

export function CraftingView({ hero, onUpdate }: CraftingViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | EquipmentType>('all');
  const [onlyCraftable, setOnlyCraftable] = useState(false);
  const [message, setMessage] = useState('Select an equipment recipe to craft.');

  const handleCraft = (recipe: CraftingRecipe) => {
    if (hero.hasItem(recipe.name)) {
      setMessage(`Cannot craft ${recipe.name}: item already exists in your inventory.`);
      return;
    }
    if (!hero.canCraft(recipe.cost)) {
      setMessage(`Cannot craft ${recipe.name}: missing required materials.`);
      return;
    }
    for (const [mat, required] of Object.entries(recipe.cost) as [TrackedMaterial, number][]) {
      hero.adjustMaterial(mat, -required);
    }
    hero.addEquipment(recipe.name);
    setMessage(`Successfully crafted ${recipe.name}! Added to your inventory.`);
    onUpdate();
  };

  const filteredRecipes = CRAFTING_RECIPES.filter((recipe) => {
    if (selectedFilter !== 'all' && recipe.type !== selectedFilter) {
      return false;
    }
    if (onlyCraftable) {
      const isOwned = hero.hasItem(recipe.name);
      const canAfford = hero.canCraft(recipe.cost);
      if (isOwned || !canAfford) {
        return false;
      }
    }
    return true;
  });

  return (
    <section class="view-panel active">
      <PixelFrame title="CRAFTING BENCH" icon="crafting">
        {/* Filter Navigation */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
          {(['all', 'weapon', 'armor', 'pickaxe', 'key'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              class={`pixel-btn ${selectedFilter === cat ? 'btn-active' : ''}`}
              onClick={() => setSelectedFilter(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}

          {/* Craftable Only Toggle */}
          <button
            type="button"
            class={`pixel-btn ${onlyCraftable ? 'btn-success' : ''}`}
            style={{ marginLeft: 'auto' }}
            onClick={() => setOnlyCraftable((prev) => !prev)}
          >
            {onlyCraftable ? '✓ CRAFTABLE ONLY' : 'CRAFTABLE ONLY'}
          </button>
        </div>

        {/* Recipe Grid */}
        <div class="crafting-grid">
          {filteredRecipes.map((recipe) => {
            const isOwned = hero.hasItem(recipe.name);
            const canAfford = hero.canCraft(recipe.cost);
            return (
              <RecipeCard
                key={recipe.name}
                recipe={recipe}
                canAfford={canAfford}
                isOwned={isOwned}
                onCraft={handleCraft}
              />
            );
          })}
          {filteredRecipes.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
              No recipes match the selected filters.
            </div>
          )}
        </div>

        <StatusBar marginTop="16px">{message}</StatusBar>
      </PixelFrame>
    </section>
  );
}