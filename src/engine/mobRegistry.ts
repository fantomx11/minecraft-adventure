import { BESTIARY } from '../data/bestiary';
import { Mob, type MobConfig } from '../models/Mob';

// Convert default bestiary array into a keyed lookup map
const DEFAULT_MOB_MAP: Record<string, MobConfig> = Object.fromEntries(
  BESTIARY.map((m) => [m.id || m.name.toLowerCase().replace(/\s+/g, '_'), m])
);

export class MobRegistry {
  /**
   * Resolves a MobConfig by ID or Display Name.
   * Checks custom mobs first, then falls back to default BESTIARY.
   */
  public static findConfig(
    query: string,
    customMobs: Record<string, MobConfig> = {}
  ): MobConfig | undefined {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, '_');

    // 1. Direct key match in custom mobs
    if (customMobs[query]) return customMobs[query];
    if (customMobs[normalized]) return customMobs[normalized];

    // 2. Name search in custom mobs
    const customMatch = Object.values(customMobs).find(
      (m) => m.name.toLowerCase() === query.toLowerCase()
    );
    if (customMatch) return customMatch;

    // 3. Fallback to default Bestiary
    if (DEFAULT_MOB_MAP[normalized]) return DEFAULT_MOB_MAP[normalized];
    return Object.values(DEFAULT_MOB_MAP).find(
      (m) => m.name.toLowerCase() === query.toLowerCase()
    );
  }

  /**
   * Instantiates a functional Mob instance ready for CombatEngine.
   */
  public static createMob(
    query: string,
    customMobs: Record<string, MobConfig> = {}
  ): Mob {
    const config = this.findConfig(query, customMobs);
    if (!config) {
      console.warn(`[MobRegistry] Unknown mob: "${query}". Spawning fallback Zombie.`);
      return new Mob(DEFAULT_MOB_MAP['zombie']);
    }
    return new Mob(config);
  }

  /**
   * Returns a merged dictionary of default bestiary and custom mobs.
   */
  public static getAllAvailableConfigs(
    customMobs: Record<string, MobConfig> = {}
  ): Record<string, MobConfig> {
    return {
      ...DEFAULT_MOB_MAP,
      ...customMobs,
    };
  }
}