import { getEquipmentItem } from "../../data/recipes";
import { CraftingRecipe } from "../../types/inventory";

interface RecipeCardProps {
  recipe: CraftingRecipe;
  canAfford: boolean;
  onCraft: (recipe: CraftingRecipe) => void;
}

export function RecipeCard({ recipe, canAfford, onCraft }: RecipeCardProps) {
  const item = getEquipmentItem(recipe.name);
  const costStr = Object.entries(recipe.cost)
    .map(([mat, amt]) => `${amt} ${mat}`)
    .join(', ');

  return (
    <div class="recipe-card">
      <div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>
          {recipe.name}
        </div>
        <div style={{ color: '#555', fontSize: '12px', marginBottom: '8px' }}>
          [{recipe.type.toUpperCase()}] {recipe.desc || item?.description}
        </div>
        <div style={{ fontSize: '12px' }}>
          Cost: <strong>{costStr}</strong>
        </div>
      </div>
      <button
        type="button"
        class={`pixel-btn ${canAfford ? 'btn-success' : ''}`}
        disabled={!canAfford}
        onClick={() => onCraft(recipe)}
      >
        CRAFT
      </button>
    </div>
  );
}