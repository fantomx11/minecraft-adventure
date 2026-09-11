import type { GameModeId } from './game';
import type { Region } from './world';
import type { Passage } from './narrative';
import type { MobConfig } from '../models/Mob';

export interface GamePackageMetadata {
  title: string;
  author?: string;
  version: number;
  description?: string;
}

export interface GamePackage {
  mode: GameModeId; // 'narrative' | 'open_world'
  metadata: GamePackageMetadata;
  mobs: Record<string, MobConfig>; // Keyed by Mob ID
  passages?: Record<string, Passage>;
  regions?: Record<string, Region>;
  startPassageId?: string; // For narrative packages
  startRegionId?: string;  // For open world packages
}

export function validateGamePackage(raw: unknown): GamePackage | null {
  if (!raw || typeof raw !== 'object') return null;
  const pkg = raw as Partial<GamePackage>;

  if (pkg.mode !== 'narrative' && pkg.mode !== 'open_world') return null;
  if (!pkg.mobs || typeof pkg.mobs !== 'object') return null;

  if (pkg.mode === 'narrative' && (!pkg.passages || typeof pkg.passages !== 'object')) {
    return null;
  }
  if (pkg.mode === 'open_world' && (!pkg.regions || typeof pkg.regions !== 'object')) {
    return null;
  }

  return pkg as GamePackage;
}