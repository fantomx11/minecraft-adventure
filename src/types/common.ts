export type ViewMode = 'combat' | 'forest' | 'mining' | 'crafting';

export type DrawerName = 'sidebar' | 'options';

export interface LogMessage {
  type: 'round-title' | 'hit' | 'miss' | 'special' | 'notice';
  text: string;
}