import { getEquipmentItem } from "../../data/recipes";
import { CraftingRecipe } from "../../types/inventory";

interface RecipeCardProps {
  recipe: CraftingRecipe;
  canAfford: boolean;
  isOwned?: boolean;
  onCraft: (recipe: CraftingRecipe) => void;
}

export function RecipeCard({ recipe, canAfford, isOwned = false, onCraft }: RecipeCardProps) {
  const item = getEquipmentItem(recipe.name);
  const costStr = Object.entries(recipe.cost)
    .map(([mat, amt]) => `${amt} ${mat}`)
    .join(', ');

  const canCraft = canAfford && !isOwned;

  return (
    <div class="recipe-card">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {recipe.name}
          </span>
          {isOwned && (
            <span
              style={{
                fontSize: '10px',
                background: '#333',
                color: 'var(--pixel-yellow)',
                padding: '2px 6px',
                border: '1px solid #000',
              }}
            >
              OWNED
            </span>
          )}
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
        class={`pixel-btn ${canCraft ? 'btn-success' : ''}`}
        disabled={!canCraft}
        onClick={() => onCraft(recipe)}
      >
        {isOwned ? 'OWNED' : 'CRAFT'}
      </button>
    </div>
  );
}