import { TrackedMaterial } from "../../types/inventory";
import { Icon } from "../ui/Icon";

interface MaterialSwapModalProps {
  isOpen: boolean;
  newItemName: TrackedMaterial | null;
  materials: Record<TrackedMaterial, number>;
  onSwap: (discardMat: TrackedMaterial) => void;
  onDiscard: () => void;
}

export function MaterialSwapModal({
  isOpen,
  newItemName,
  materials,
  onSwap,
  onDiscard,
}: MaterialSwapModalProps) {
  if (!isOpen || !newItemName) return null;

  const heldMaterials = (Object.entries(materials) as [TrackedMaterial, number][]).filter(
    ([, qty]) => qty > 0
  );

  return (
    <div id="swap-modal-overlay" class="active">
      <div class="pixel-frame is-dark swap-modal-frame">
        <div class="drawer-header">
          <span>
            <Icon name="book" /> INVENTORY LIMIT REACHED
          </span>
          <button type="button" class="pixel-btn btn-danger" onClick={onDiscard}>
            X
          </button>
        </div>

        <p style={{ fontSize: '12px', lineHeight: '1.6', color: '#eee' }}>
          You found <strong>1x {newItemName}</strong>, but your inventory is at the maximum limit of 5 total materials. Choose a material to discard, or drop the newly acquired item:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0' }}>
          {heldMaterials.map(([mat, qty]) => (
            <button
              key={mat}
              type="button"
              class="pixel-btn btn-primary"
              style={{ width: '100%', justifyContent: 'space-between' }}
              onClick={() => onSwap(mat)}
            >
              <span>DISCARD 1 {mat.toUpperCase()}</span>
              <span>({qty} held)</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          class="pixel-btn btn-danger"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onDiscard}
        >
          DISCARD NEW {newItemName.toUpperCase()}
        </button>
      </div>
    </div>
  );
}