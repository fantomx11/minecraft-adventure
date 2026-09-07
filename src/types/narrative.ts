import type { TrackedMaterial } from './inventory';

export type ChoiceType = 'passage' | 'combat' | 'view' | 'dice_check';

export interface MobTableEntry {
  mob: string;
  rollRange: [number, number]; // e.g. [1, 2] = Spider, [3, 4] = Zombie
  label?: string;
}

export interface PassageReward {
  materials?: Partial<Record<TrackedMaterial, number>>;
  equipment?: string[];
  healthDelta?: number;
  message?: string;
}

export interface DiceCheckConfig {
  target: number; // e.g. 4+ on 1d6
  successPassageId: string;
  failurePassageId: string;
  successText?: string;
  failureText?: string;
}

export interface PassageChoice {
  text: string;
  type?: ChoiceType;
  targetPassageId?: string;

  // Requirements to pick this choice
  requiresItem?: string;
  requiresMaterial?: { material: TrackedMaterial; count: number };
  requiresGrovesCleared?: number;
  requiresMinesCleared?: number;

  // Costs deducted when chosen
  consumeMaterial?: { material: TrackedMaterial; count: number };
  consumeItem?: string;

  // For 'view' choice type (unlocks and switches to screen)
  targetView?: 'forest' | 'mining' | 'crafting';

  // For 'combat' choice type
  mob?: string;
  mobTable?: MobTableEntry[];
  onVictoryPassageId?: string;

  // For 'dice_check' choice type
  diceCheck?: DiceCheckConfig;

  // Direct rewards for choosing this option
  grantReward?: PassageReward;
}

export interface PassageCombatTrigger {
  mob?: string;
  mobTable?: MobTableEntry[];
  introText?: string;
  onVictoryPassageId: string;
  onDefeatPassageId?: string;
}

export interface Passage {
  id: string;
  title: string;
  text: string;
  icon?: string;

  // Automatically granted on first visit
  autoGrant?: PassageReward;

  // Combat triggered upon entering the passage
  triggerCombat?: PassageCombatTrigger;

  // Screens that can only be accessed from this passage
  accessibleViews?: ('forest' | 'mining' | 'crafting')[];

  // Options available to the player
  choices: PassageChoice[];
}