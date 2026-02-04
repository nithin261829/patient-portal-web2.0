// Slot Cache Service - Prevents redundant API calls
// Based on Angular SlotCacheService

interface CachedSlots {
  [key: string]: any[];
}

class SlotCacheService {
  private cache: CachedSlots = {};

  getCachedSlots(monthKey: string, operatories: string): any[] | null {
    const key = this.generateKey(monthKey, operatories);
    return this.cache[key] || null;
  }

  setCachedSlots(monthKey: string, operatories: string, slots: any[]): void {
    const key = this.generateKey(monthKey, operatories);
    this.cache[key] = slots;
  }

  clearCache(): void {
    this.cache = {};
  }

  private generateKey(monthKey: string, operatories: string): string {
    return `${monthKey}_${operatories}`;
  }
}

export const slotCacheService = new SlotCacheService();
