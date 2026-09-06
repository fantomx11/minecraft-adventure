import { TrackedMaterial } from "../../types/inventory";

interface MaterialCardProps {
  material: TrackedMaterial;
  count: number;
  canAdd: boolean;
  onAdjust: (delta: number) => void;
}

export function MaterialCard({ material, count, canAdd, onAdjust }: MaterialCardProps) {
  return (
    <div class="material-card">
      <span>{material}</span>
      <div class="mat-controls">
        <button
          type="button"
          class="pixel-btn btn-qty"
          disabled={count <= 0}
          onClick={() => onAdjust(-1)}
        >
          -
        </button>
        <span style={{ width: '24px', textAlign: 'center' }}>{count}</span>
        <button
          type="button"
          class="pixel-btn btn-qty"
          disabled={!canAdd}
          onClick={() => onAdjust(1)}
        >
          +
        </button>
      </div>
    </div>
  );
}