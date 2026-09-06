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
  const [message, setMessage] = useState('Select an equipment recipe to craft.');

  const handleCraft = (recipe: CraftingRecipe) => {
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

  const filteredRecipes =
    selectedFilter === 'all'
      ? CRAFTING_RECIPES
      : CRAFTING_RECIPES.filter((r) => r.type === selectedFilter);

  return (
    <section class="view-panel active">
      <PixelFrame title="CRAFTING BENCH" icon="crafting">
        {/* Filter Navigation */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
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
        </div>

        {/* Recipe Grid */}
        <div class="crafting-grid">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.name}
              recipe={recipe}
              canAfford={hero.canCraft(recipe.cost)}
              onCraft={handleCraft}
            />
          ))}
        </div>

        <StatusBar marginTop="16px">{message}</StatusBar>
      </PixelFrame>
    </section>
  );
}