export interface FeedingLog {
  id: string;
  feedType: 'formula' | 'milk';
  amountMl: number;
  amountOz: number;
  durationMinutes: number;
  isBottleFed: boolean;
  timestamp: number;
}

export type UnitType = 'ml' | 'oz';
