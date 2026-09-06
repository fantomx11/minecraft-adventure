import type { SerializedCharacter } from '../models/Character';

export class StorageManager {
  private storageKey: string;

  constructor(key: string = 'minecraft_multimode_rpg_data') {
    this.storageKey = key;
  }

  public save(data: SerializedCharacter): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }

  public load(): Partial<SerializedCharacter> | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as Partial<SerializedCharacter>) : null;
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
      return null;
    }
  }

  public clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}