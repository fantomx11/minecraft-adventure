export type DieTagVariant = 'hit' | 'miss' | 'neutral' | 'bonus';

export interface DieItem {
  value: number;
  tag?: string;
  variant?: DieTagVariant;
  selected?: boolean;
}