import type { Condition, Mutation } from './world';

export type ChoiceType = 'passage' | 'combat' | 'view' | 'dice_check';

export interface MobTableEntry {
  mob: string;
  rollRange: [number, number];
  label?: string;
}

export interface DiceCheckConfig {
  target: number;
  successPassageId: string;
  failurePassageId: string;
  successText?: string;
  failureText?: string;
}

export interface PassageChoice {
  text: string;
  type?: ChoiceType;
  targetPassageId?: string;
  targetView?: 'forest' | 'mining' | 'crafting';

  condition?: Condition;
  mutations?: Mutation[];
  lockedReason?: string;
  behavior?: 'hide' | 'disable';

  mob?: string;
  mobTable?: MobTableEntry[];
  onVictoryPassageId?: string;
  onDefeatPassageId?: string;

  diceCheck?: DiceCheckConfig;
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

  onEnterMutations?: Mutation[];
  triggerCombat?: PassageCombatTrigger;
  accessibleViews?: ('forest' | 'mining' | 'crafting')[];
  choices: PassageChoice[];
}