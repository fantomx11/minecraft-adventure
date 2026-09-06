import type { Character } from '../models/Character';
import type { Mob } from '../models/Mob';
import type { CraftingRecipe, EquipmentType, TrackedMaterial } from '../types/inventory';
import { ICONS } from '../data/icons';
import { TRACKED_MATERIALS } from '../data/recipes';

export class UIRenderer {
  public dom: Record<string, HTMLElement | HTMLInputElement | HTMLSelectElement>;

  constructor() {
    this.dom = {
      hudName: document.getElementById('hud-name')!,
      hudHp: document.getElementById('hud-hp')!,
      hudAttack: document.getElementById('hud-attack')!,
      hudDamage: document.getElementById('hud-damage')!,
      hudArmor: document.getElementById('hud-armor')!,
      hudRestarts: document.getElementById('hud-restarts')!,
      slotWeapon: document.getElementById('slot-weapon') as HTMLSelectElement,
      slotArmor: document.getElementById('slot-armor') as HTMLSelectElement,
      slotPickaxe: document.getElementById('slot-pickaxe') as HTMLSelectElement,
      slotKey: document.getElementById('slot-key') as HTMLSelectElement,
      statAttack: document.getElementById('stat-readout-attack')!,
      statDamage: document.getElementById('stat-readout-damage')!,
      statArmor: document.getElementById('stat-readout-armor')!,
      statRestarts: document.getElementById('stat-readout-restarts')!,
      inputName: document.getElementById('char-name') as HTMLInputElement,
      heartsContainer: document.getElementById('hearts-container')!,
      equipmentList: document.getElementById('equipment-list')!,
      materialsFrameTitle: document.getElementById('materials-frame-title')!,
      materialsContainer: document.getElementById('materials-container')!,
      inputDiceCount: document.getElementById('dice-count') as HTMLInputElement,
      diceTray: document.getElementById('dice-tray')!,
      statusDisplay: document.getElementById('status-display')!,
      mobRulesStream: document.getElementById('mob-rules-stream')!,
      combatLogStream: document.getElementById('combat-log-stream')!,
      craftingRecipesContainer: document.getElementById('crafting-recipes-container')!,
      miningPickaxeName: document.getElementById('mining-pickaxe-name')!,
      miningBonusVal: document.getElementById('mining-bonus-val')!,
      forestClearedCount: document.getElementById('forest-cleared-count')!,
      mineClearedCount: document.getElementById('mine-cleared-count')!,
      optRuleTotal: document.getElementById('opt-rule-total')!,
      optRuleStack: document.getElementById('opt-rule-stack')!,
    };
  }

  public injectIcons(): void {
    const mappings: Record<string, string> = {
      'icon-hud-hero': ICONS.hero,
      'icon-hud-hp': ICONS.heartFull,
      'icon-hud-attack': ICONS.sword,
      'icon-hud-damage': ICONS.tnt,
      'icon-hud-armor': ICONS.chestplate,
      'icon-hud-restarts': ICONS.bed,
      'icon-btn-sheet': ICONS.book,
      'icon-btn-gear': ICONS.gear,
      'icon-nav-combat': ICONS.sword,
      'icon-nav-forest': ICONS.tree,
      'icon-nav-mining': ICONS.pickaxe,
      'icon-nav-crafting': ICONS.crafting,
      'icon-title-target': ICONS.target,
      'icon-label-mobhp': ICONS.heartFull,
      'icon-label-mobdef': ICONS.chestplate,
      'icon-label-mobdmg': ICONS.tnt,
      'icon-title-roller': ICONS.sword,
      'icon-btn-roll': ICONS.sword,
      'icon-title-rules': ICONS.spark,
      'icon-title-log': ICONS.book,
      'icon-title-forest': ICONS.tree,
      'icon-title-mining': ICONS.pickaxe,
      'icon-title-crafting': ICONS.crafting,
      'icon-drawer-gear': ICONS.gear,
      'icon-drawer-sheet': ICONS.book,
      'icon-sidebar-name': ICONS.hero,
      'icon-sidebar-attack': ICONS.sword,
      'icon-sidebar-armor': ICONS.chestplate,
      'icon-slot-pickaxe': ICONS.pickaxe,
      'icon-sidebar-inv': ICONS.book,
    };

    for (const [id, svg] of Object.entries(mappings)) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = svg;
    }
  }

  public renderCharacter(
    hero: Character,
    onHpClick: (hp: number) => void,
    onRemoveEquipment: (name: string) => void,
    onAdjustMaterial: (mat: TrackedMaterial, dir: number) => void
  ): void {
    this.dom.hudName.textContent = hero.name || 'Steve';
    this.dom.hudHp.textContent = `${hero.hearts}/${hero.maxHearts}`;
    this.dom.hudAttack.textContent = hero.attack.toString();
    this.dom.hudDamage.textContent = hero.damage.toString();
    this.dom.hudArmor.textContent = hero.armor.toString();
    this.dom.hudRestarts.textContent = hero.restarts.toString();

    this.dom.statAttack.textContent = hero.attack.toString();
    this.dom.statDamage.textContent = hero.damage.toString();
    this.dom.statArmor.textContent = hero.armor.toString();
    this.dom.statRestarts.textContent = hero.restarts.toString();
    (this.dom.inputName as HTMLInputElement).value = hero.name;

    const maxDice = Math.max(1, hero.attack);
    const diceInput = this.dom.inputDiceCount as HTMLInputElement;
    diceInput.max = maxDice.toString();
    if (parseInt(diceInput.value, 10) > maxDice) {
      diceInput.value = maxDice.toString();
    }

    this.dom.optRuleTotal.classList.toggle('selected', hero.materialRule === 'total');
    this.dom.optRuleStack.classList.toggle('selected', hero.materialRule === 'stack');

    this.dom.heartsContainer.innerHTML = '';
    for (let i = 1; i <= hero.maxHearts; i++) {
      const span = document.createElement('span');
      span.className = 'heart-interactive';
      span.innerHTML = i <= hero.hearts ? ICONS.heartFull : ICONS.heartEmpty;
      const svg = span.firstElementChild as HTMLElement;
      if (svg) {
        svg.style.width = '100%';
        svg.style.height = '100%';
      }
      span.addEventListener('click', () => onHpClick(i));
      this.dom.heartsContainer.appendChild(span);
    }

    this.renderSlotSelect(this.dom.slotWeapon as HTMLSelectElement, hero, 'weapon', 'Bare Hands (1 ATK, 1 DMG)');
    this.renderSlotSelect(this.dom.slotArmor as HTMLSelectElement, hero, 'armor', 'None (0 ARM)');
    this.renderSlotSelect(this.dom.slotPickaxe as HTMLSelectElement, hero, 'pickaxe', 'None');
    this.renderSlotSelect(this.dom.slotKey as HTMLSelectElement, hero, 'key', 'None');

    this.dom.equipmentList.innerHTML = '';
    hero.equipmentInventory.forEach((item) => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.marginBottom = '8px';
      li.innerHTML = `<span>[${item.type.toUpperCase()}] ${item.name}</span><span class="delete-item-btn">✕</span>`;
      li.querySelector('.delete-item-btn')!.addEventListener('click', () => onRemoveEquipment(item.name));
      this.dom.equipmentList.appendChild(li);
    });

    const totalCount = hero.totalMaterialsCount;
    this.dom.materialsFrameTitle.textContent =
      hero.materialRule === 'total' ? `MATERIALS (${totalCount}/5 TOTAL)` : `MATERIALS (MAX 5 EACH)`;

    this.dom.materialsContainer.innerHTML = '';
    TRACKED_MATERIALS.forEach((mat) => {
      const count = hero.materials[mat] || 0;
      const disablePlus = hero.materialRule === 'total' ? totalCount >= 5 : count >= 5;

      const card = document.createElement('div');
      card.className = 'material-card';
      card.innerHTML = `
        <span>${mat}</span>
        <div class="mat-controls">
          <button class="pixel-btn btn-qty" data-mat="${mat}" data-dir="-1" ${count <= 0 ? 'disabled' : ''}>-</button>
          <span style="width: 24px; text-align: center;">${count}</span>
          <button class="pixel-btn btn-qty" data-mat="${mat}" data-dir="1" ${disablePlus ? 'disabled' : ''}>+</button>
        </div>
      `;
      this.dom.materialsContainer.appendChild(card);
    });

    this.dom.materialsContainer.querySelectorAll('.btn-qty').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const mat = target.getAttribute('data-mat') as TrackedMaterial;
        const dir = parseInt(target.getAttribute('data-dir')!, 10);
        onAdjustMaterial(mat, dir);
      });
    });
  }

  public renderMiningStats(hero: Character, miningBonus: number): void {
    const pickaxe = hero.equippedPickaxe;
    this.dom.miningPickaxeName.textContent = pickaxe ? pickaxe.name : 'None';
    this.dom.miningBonusVal.textContent = `+${miningBonus}`;
    this.dom.forestClearedCount.textContent = hero.forestCleared.toString();
    this.dom.mineClearedCount.textContent = hero.mineCleared.toString();
  }

  public renderMobInfo(mob: Mob): void {
    (document.getElementById('mob-hearts') as HTMLInputElement).value = mob.hearts.toString();
    (document.getElementById('mob-defense') as HTMLInputElement).value = mob.defense.toString();
    (document.getElementById('mob-damage') as HTMLInputElement).value = mob.damage.toString();

    this.dom.mobRulesStream.innerHTML = `
      <span class="rules-header-tag">⚡ SPECIAL ABILITY</span>
      <span class="rules-body-text">${mob.rules}</span>
      <span class="rules-header-tag">🎁 LOOT DROP</span>
      <span class="rules-body-text">${mob.loot}</span>
    `;
  }

  public renderStatus(tags: string[]): void {
    this.dom.statusDisplay.textContent =
      tags.length > 0 ? `Status: [ ${tags.join(' | ')} ]` : 'Status: Normal Encounter';
  }

  public renderCraftingRecipes(
    recipes: CraftingRecipe[],
    hero: Character,
    onCraft: (recipe: CraftingRecipe) => void
  ): void {
    this.dom.craftingRecipesContainer.innerHTML = '';

    recipes.forEach((recipe) => {
      const canCraft = hero.canCraft(recipe.cost);
      const costStr = Object.entries(recipe.cost)
        .map(([m, c]) => `${c} ${m}`)
        .join(', ');

      const card = document.createElement('div');
      card.className = 'recipe-card';
      card.innerHTML = `
        <div>
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 6px;">${recipe.name}</div>
          <div style="color: #666; font-size: 16px; margin-bottom: 8px;">[${recipe.type.toUpperCase()}] ${recipe.desc}</div>
          <div style="font-size: 16px;">Cost: <strong>${costStr}</strong></div>
        </div>
        <button type="button" class="pixel-btn ${canCraft ? 'btn-success' : ''}" ${canCraft ? '' : 'disabled'}>
          🔨 CRAFT
        </button>
      `;

      card.querySelector('button')!.addEventListener('click', () => onCraft(recipe));
      this.dom.craftingRecipesContainer.appendChild(card);
    });
  }

  public appendLog(html: string): void {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = html;
    this.dom.combatLogStream.appendChild(entry);
    this.dom.combatLogStream.scrollTop = this.dom.combatLogStream.scrollHeight;
  }

  private renderSlotSelect(
    selectEl: HTMLSelectElement,
    hero: Character,
    type: EquipmentType,
    emptyLabel: string
  ): void {
    const current = hero.equipped[type];
    selectEl.innerHTML = `<option value="">-- ${emptyLabel} --</option>`;

    const available = hero.equipmentInventory.filter((i) => i.type === type);
    available.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item.name;
      opt.textContent = item.name;
      if (current === item.name) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }
}