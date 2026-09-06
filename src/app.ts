import { BESTIARY } from './data/bestiary';
import { CRAFTING_RECIPES, getEquipmentItem } from './data/recipes';
import { Character } from './models/Character';
import { Mob } from './models/Mob';
import { CombatEngine } from './engine/CombatEngine';
import { StorageManager } from './storage/StorageManager';
import { ModalManager } from './ui/ModalManager';
import { UIRenderer } from './ui/UIRenderer';
import { PixelDiceRenderer } from './ui/PixelDiceRenderer';
import type { ViewMode, DrawerName } from './types/common';
import type { TrackedMaterial, CraftingRecipe, EquippedSlots } from './types/inventory';
import type { DamageResult } from './types/combat';

export class AdventureApp {
  private storage: StorageManager;
  private character: Character;
  private currentMob!: Mob;
  private combatEngine!: CombatEngine;
  private ui: UIRenderer;
  private modal: ModalManager;
  private activeView: ViewMode = 'combat';
  private miningBonus: number = 0;

  constructor() {
    this.storage = new StorageManager();
    const savedData = this.storage.load();
    this.character = new Character(savedData ?? {});

    this.ui = new UIRenderer();
    this.modal = new ModalManager();

    this.ui.injectIcons();
    this.populateMobDropdown();
    this.setMob(0);
    this.bindEvents();
    this.render();
  }

  private populateMobDropdown(): void {
    const select = document.getElementById('mob-select') as HTMLSelectElement;
    select.innerHTML = '';
    BESTIARY.forEach((m, idx) => {
      const opt = document.createElement('option');
      opt.value = idx.toString();
      opt.textContent = `${m.name} [${m.hearts}HP | DEF ${m.defense}]`;
      select.appendChild(opt);
    });
  }

  private setMob(index: number): void {
    this.currentMob = new Mob(BESTIARY[index]);
    this.combatEngine = new CombatEngine(this.character, this.currentMob);
    this.combatEngine.initCombat();

    this.ui.renderMobInfo(this.currentMob);
    this.updateStatusDisplay();
  }

  private setMobByName(name: string): void {
    const idx = BESTIARY.findIndex((m) => m.name.toLowerCase() === name.toLowerCase());
    if (idx !== -1) {
      (document.getElementById('mob-select') as HTMLSelectElement).value = idx.toString();
      this.setMob(idx);
    }
  }

  private switchView(viewName: ViewMode): void {
    this.activeView = viewName;
    document.querySelectorAll('.view-panel').forEach((p) => {
      p.classList.toggle('active', p.id === `view-${viewName}`);
    });
    document.querySelectorAll('.mode-nav-bar button').forEach((b) => {
      b.classList.toggle('btn-active', (b as HTMLElement).dataset.view === viewName);
    });
    this.ui.renderMiningStats(this.character, this.miningBonus);
  }

  private toggleDrawer(drawerName: DrawerName, show: boolean): void {
    const sidebar = document.getElementById('sidebar-drawer')!;
    const options = document.getElementById('options-drawer')!;
    const overlay = document.getElementById('drawer-overlay')!;

    if (drawerName === 'sidebar') {
      sidebar.classList.toggle('active', show);
      if (show) options.classList.remove('active');
    } else {
      options.classList.toggle('active', show);
      if (show) sidebar.classList.remove('active');
    }
    overlay.classList.toggle('active', show);
  }

  private updateStatusDisplay(): void {
    const tags: string[] = [];
    const state = this.combatEngine.ctx.combatState;

    if (state.ignoreArmor) tags.push('Armor Ignored');
    if (state.heroDmgPenalty) tags.push(`Hero Dmg -${state.heroDmgPenalty}`);
    if (this.currentMob.state.villagerArmor) tags.push('Mob Armor -1');
    if (this.currentMob.state.fuse) tags.push(`Fuse ${this.currentMob.state.fuse}/8`);
    if (this.currentMob.state.oxygen) tags.push(`Oxygen ${this.currentMob.state.oxygen}/6`);

    const vexCount = state.effects.filter((e: any) => e.name === 'Vex').length;
    if (vexCount > 0) tags.push(`Active Vexes: ${vexCount}`);

    this.ui.renderStatus(tags);
  }

  private async acquireMaterial(matName: TrackedMaterial): Promise<{ kept: boolean; swapped: boolean; discarded: TrackedMaterial | null }> {
    const isStrict = this.character.materialRule === 'total';
    const total = this.character.totalMaterialsCount;

    if (isStrict && total >= 5) {
      const discarded = await this.modal.showSwapModal(matName, this.character.materials);
      if (discarded) {
        this.character.adjustMaterial(discarded, -1);
        this.character.adjustMaterial(matName, 1);
        return { kept: true, swapped: true, discarded };
      }
      return { kept: false, swapped: false, discarded: null };
    }

    const added = this.character.adjustMaterial(matName, 1);
    return { kept: added > 0, swapped: false, discarded: null };
  }

  private async handleForage(): Promise<void> {
    const roll = Math.floor(Math.random() * 6) + 1;
    let html = `<div class="log-round-title">=== FORAGING THE WOODS (d6: ${roll}) ===</div>`;

    if (roll <= 2) {
      const res = await this.acquireMaterial('Wood');
      html += this.formatGatherLog('Wood', res);
    } else if (roll <= 4) {
      const res = await this.acquireMaterial('Wheat');
      html += this.formatGatherLog('Wheat', res);
    } else if (roll === 5) {
      const res = await this.acquireMaterial('Leather');
      html += this.formatGatherLog('Leather', res);
    } else {
      html += `<div class="log-special">⚠️ AMBUSH! A Slime drops from the trees and attacks!</div>`;
      this.ui.appendLog(html);
      this.setMobByName('Slime');
      this.switchView('combat');
      this.saveAndRender();
      return;
    }

    this.ui.appendLog(html);
    this.saveAndRender();
  }

  private async handleMineVein(): Promise<void> {
    const pickaxe = this.character.equippedPickaxe;
    if (!pickaxe) {
      this.ui.appendLog(`<div class="log-miss">⚠️ Equip a Pickaxe in your character sheet before mining!</div>`);
      return;
    }

    const diceCount = pickaxe.diceBonus || 1;
    const rolls: number[] = [];
    for (let i = 0; i < diceCount; i++) rolls.push(Math.floor(Math.random() * 6) + 1);

    const highest = Math.max(...rolls);
    const total = highest + this.miningBonus;
    let html = `<div class="log-round-title">=== MINING VEIN (Rolled: [${rolls.join(', ')}], Best: ${highest} + Bonus: ${this.miningBonus} = ${total}) ===</div>`;

    if (total <= 2) {
      const res = await this.acquireMaterial('Stone');
      html += this.formatGatherLog('Stone', res);
    } else if (total <= 4) {
      const res = await this.acquireMaterial('Coal');
      html += this.formatGatherLog('Coal', res);
    } else if (total <= 6) {
      const res = await this.acquireMaterial('Iron');
      html += this.formatGatherLog('Iron', res);
    } else {
      html += `<div class="log-special">💥 CAVE-IN! The tunnel collapses and you fall into deeper shafts!</div>`;
    }

    this.miningBonus++;
    this.ui.appendLog(html);
    this.saveAndRender();
  }

  private formatGatherLog(mat: TrackedMaterial, res: { kept: boolean; swapped: boolean; discarded: TrackedMaterial | null }): string {
    if (res.kept && res.swapped) return `<div class="log-hit">• Discarded 1 ${res.discarded} to keep 1 ${mat}!</div>`;
    if (res.kept) return `<div class="log-hit">• Collected 1 ${mat} (${this.character.materials[mat]}).</div>`;
    return `<div class="log-notice">• Inventory full! Left 1 ${mat} behind.</div>`;
  }

  private resolveCombatRound(): void {
    const diceCount = parseInt((this.ui.dom.inputDiceCount as HTMLInputElement).value, 10) || 1;
    const def = this.currentMob.defense;
    const outcome = this.combatEngine.executeRound(diceCount, def);

    this.ui.dom.diceTray.innerHTML = '';
    this.combatEngine.ctx.roundState.rolls.forEach((val) => {
      const isHit = val >= def;
      const dieBox = document.createElement('div');
      dieBox.className = 'die-wrapper';
      dieBox.innerHTML = `
        ${PixelDiceRenderer.getSvg(val, isHit)}
        <span class="die-tag ${isHit ? 'tag-hit' : 'tag-miss'}">${isHit ? 'HIT' : 'MISS'}</span>
      `;
      this.ui.dom.diceTray.appendChild(dieBox);
    });

    if (outcome.heroDmgRes && outcome.mobDmgRes) {
      this.appendRoundLog(outcome.heroDmgRes, outcome.mobDmgRes, def);
    }

    if (outcome.status === 'victory') {
      this.combatEngine.dispatchHook('onCombatEnd');
      this.ui.appendLog(`<div class="log-notice">🏆 VICTORY! ${this.currentMob.name} defeated!<br/>Hero restored to 20 HP! Roll mob loot drop.</div>`);
      this.character.resetHealth();
      if (this.activeView === 'forest') this.character.forestCleared++;
      if (this.activeView === 'mining') this.character.mineCleared++;
      this.setMob(parseInt((document.getElementById('mob-select') as HTMLSelectElement).value, 10));
    } else if (outcome.status === 'defeat') {
      this.combatEngine.dispatchHook('onCombatEnd');
      this.ui.appendLog(`<div class="log-miss">💀 DEFEAT! You were knocked out!<br/>Respawned at home bed with 20 HP (+1 Restart).</div>`);
      this.character.respawn();
      this.setMob(parseInt((document.getElementById('mob-select') as HTMLSelectElement).value, 10));
    }

    (document.getElementById('mob-hearts') as HTMLInputElement).value = this.currentMob.hearts.toString();
    this.updateStatusDisplay();
    this.saveAndRender();
  }

  private appendRoundLog(heroResult: DamageResult, mobResult: DamageResult, def: number): void {
    let html = `<div class="log-round-title">=== TURN ${this.combatEngine.ctx.combatState.turn} (Rolled: [ ${this.combatEngine.ctx.roundState.rolls.join(', ')} ] vs DEF ${def}) ===</div>`;
    html += `<div class="log-hit">• Dealt ${heroResult.appliedTotal} DMG to ${this.currentMob.name} (${this.currentMob.hearts}HP left).</div>`;
    html += `<div class="log-miss">• Took ${mobResult.appliedTotal} DMG (${this.character.hearts}/20HP left).</div>`;

    for (const msg of this.combatEngine.ctx.roundState.messages) {
      html += `<div class="log-${msg.type}">${msg.text}</div>`;
    }
    this.ui.appendLog(html);
  }

  private bindEvents(): void {
    document.querySelectorAll('.mode-nav-bar button').forEach((btn) => {
      btn.addEventListener('click', () => this.switchView((btn as HTMLElement).dataset.view as ViewMode));
    });

    document.getElementById('btn-toggle-sidebar')!.addEventListener('click', () => this.toggleDrawer('sidebar', true));
    document.getElementById('btn-close-sidebar')!.addEventListener('click', () => this.toggleDrawer('sidebar', false));
    document.getElementById('btn-toggle-options')!.addEventListener('click', () => this.toggleDrawer('options', true));
    document.getElementById('btn-close-options')!.addEventListener('click', () => this.toggleDrawer('options', false));
    document.getElementById('drawer-overlay')!.addEventListener('click', () => {
      this.toggleDrawer('sidebar', false);
      this.toggleDrawer('options', false);
    });

    document.getElementById('opt-rule-total')!.addEventListener('click', () => {
      this.character.materialRule = 'total';
      this.saveAndRender();
    });
    document.getElementById('opt-rule-stack')!.addEventListener('click', () => {
      this.character.materialRule = 'stack';
      this.saveAndRender();
    });

    document.getElementById('btn-reset-hero')!.addEventListener('click', () => {
      if (confirm('Reset character progress and items back to defaults?')) {
        this.storage.clear();
        this.character = new Character(undefined);
        this.setMob(0);
        this.toggleDrawer('options', false);
        this.saveAndRender();
        this.ui.appendLog(`<div class="log-special">♻️ Character reset to initial defaults.</div>`);
      }
    });

    document.getElementById('btn-sub-hp')!.addEventListener('click', () => { this.character.changeHealth(-1); this.saveAndRender(); });
    document.getElementById('btn-add-hp')!.addEventListener('click', () => { this.character.changeHealth(1); this.saveAndRender(); });
    document.getElementById('btn-full-hp')!.addEventListener('click', () => { this.character.resetHealth(); this.saveAndRender(); });

    this.ui.dom.inputName.addEventListener('input', (e) => {
      this.character.name = (e.target as HTMLInputElement).value;
      this.saveAndRender();
    });

    (['weapon', 'armor', 'pickaxe', 'key'] as (keyof EquippedSlots)[]).forEach((slot) => {
      const el = this.ui.dom[`slot${slot.charAt(0).toUpperCase() + slot.slice(1)}`] as HTMLSelectElement;
      el.addEventListener('change', (e) => {
        this.character.equipped[slot] = (e.target as HTMLSelectElement).value || null;
        this.character.recalculateStats();
        this.saveAndRender();
      });
    });

    document.getElementById('mob-select')!.addEventListener('change', (e) => {
      const idx = parseInt((e.target as HTMLSelectElement).value, 10);
      this.setMob(idx);
      this.ui.appendLog(`<span class="log-notice">[ENCOUNTER] ${this.currentMob.name} engages! DEF ${this.currentMob.defense}.</span>`);
    });

    document.getElementById('btn-roll-combat')!.addEventListener('click', () => this.resolveCombatRound());
    document.getElementById('btn-forage')!.addEventListener('click', () => this.handleForage());
    document.getElementById('btn-delve-woods')!.addEventListener('click', () => {
      const roll = Math.floor(Math.random() * 6) + 1;
      let mob = 'Spider';
      if (roll >= 4 && roll <= 5) mob = 'Skeleton';
      if (roll === 6) mob = 'Witch';
      this.ui.appendLog(`<div class="log-special">🌲 Deep Woods Delve (d6: ${roll})! Encountered a ${mob}!</div>`);
      this.setMobByName(mob);
      this.switchView('combat');
      this.saveAndRender();
    });

    document.getElementById('btn-mine-vein')!.addEventListener('click', () => this.handleMineVein());
    document.getElementById('btn-leave-mine')!.addEventListener('click', () => {
      this.miningBonus = 0;
      this.ui.renderMiningStats(this.character, this.miningBonus);
      this.ui.appendLog(`<div class="log-notice">🚪 Left the mine. Depth bonus reset to +0.</div>`);
    });

    document.getElementById('btn-explore-mine')!.addEventListener('click', () => {
      if (!this.character.hasItem('Torch')) {
        this.ui.appendLog(`<div class="log-miss">⚠️ Pitch black! You must possess a Torch to explore shafts!</div>`);
        return;
      }
      const roll = Math.floor(Math.random() * 6) + 1;
      let mob = 'Zombie';
      if (roll >= 3 && roll <= 4) mob = 'Skeleton';
      if (roll >= 5) mob = 'Slime';
      this.ui.appendLog(`<div class="log-special">🔦 Explored dark shaft (d6: ${roll})! Encountered a ${mob}!</div>`);
      this.setMobByName(mob);
      this.switchView('combat');
      this.saveAndRender();
    });
  }

  private handleCraft(recipe: CraftingRecipe): void {
    if (this.character.canCraft(recipe.cost)) {
      for (const [mat, amt] of Object.entries(recipe.cost) as [TrackedMaterial, number][]) {
        this.character.adjustMaterial(mat, -amt);
      }
      const item = getEquipmentItem(recipe.name);
      if (item) this.character.addEquipment(recipe.name);
      this.ui.appendLog(`<div class="log-hit">🔨 Crafted ${recipe.name}! Added to Equipment Bag.</div>`);
      this.saveAndRender();
    }
  }

  private saveAndRender(): void {
    this.storage.save(this.character.toJSON());
    this.render();
  }

  private render(): void {
    this.character.recalculateStats();
    this.ui.renderCharacter(
      this.character,
      (hp) => { this.character.setHealth(hp); this.saveAndRender(); },
      (item) => { this.character.removeEquipment(item); this.saveAndRender(); },
      (mat, dir) => { this.character.adjustMaterial(mat, dir); this.saveAndRender(); }
    );
    this.ui.renderMiningStats(this.character, this.miningBonus);
    this.ui.renderCraftingRecipes(CRAFTING_RECIPES, this.character, (r) => this.handleCraft(r));
  }
}

window.addEventListener('DOMContentLoaded', () => new AdventureApp());