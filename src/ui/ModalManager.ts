import type { TrackedMaterial } from '../types/inventory';

export class ModalManager {
  private overlay: HTMLElement;
  private newItemLabel: HTMLElement;
  private optionsContainer: HTMLElement;
  private discardNewBtn: HTMLElement;
  private currentResolver: ((value: TrackedMaterial | null) => void) | null = null;

  constructor() {
    this.overlay = document.getElementById('swap-modal-overlay') as HTMLElement;
    this.newItemLabel = document.getElementById('swap-new-item-name') as HTMLElement;
    this.optionsContainer = document.getElementById('swap-options-list') as HTMLElement;
    this.discardNewBtn = document.getElementById('btn-discard-new') as HTMLElement;

    this.discardNewBtn?.addEventListener('click', () => {
      if (this.currentResolver) {
        this.currentResolver(null);
        this.close();
      }
    });
  }

  public showSwapModal(
    newItemName: TrackedMaterial,
    materials: Record<TrackedMaterial, number>
  ): Promise<TrackedMaterial | null> {
    return new Promise((resolve) => {
      this.currentResolver = resolve;
      this.newItemLabel.textContent = newItemName;
      this.optionsContainer.innerHTML = '';

      (Object.entries(materials) as [TrackedMaterial, number][]).forEach(([mat, qty]) => {
        if (qty > 0) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'pixel-btn btn-primary';
          btn.style.width = '100%';
          btn.style.justifyContent = 'space-between';
          btn.innerHTML = `<span>DISCARD 1 ${mat.toUpperCase()}</span><span>(${qty} held)</span>`;
          btn.addEventListener('click', () => {
            this.close();
            resolve(mat);
          });
          this.optionsContainer.appendChild(btn);
        }
      });

      this.overlay.classList.add('active');
    });
  }

  public close(): void {
    this.overlay.classList.remove('active');
    this.currentResolver = null;
  }
}