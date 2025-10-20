export type DiaperEventType = 'pee' | 'poop';

export type StoolColor = 'yellow' | 'green' | 'brown' | 'black' | 'red' | 'other' | null;

export type StoolConsistency = 'watery' | 'seedy' | 'soft' | 'pasty' | 'formed' | 'mucousy' | null;

export interface DiaperLog {
  id: string;
  timestamp: number;
  wet: boolean;
  dirty: boolean;
  stoolColor: StoolColor;
  stoolConsistency: StoolConsistency;
  containsMucus: boolean;
  containsBlood: boolean;
  notes: string;
}

export interface DiaperPeriodSummary {
  wet: number;
  dirty: number;
  both: number;
  total: number;
}

export interface DiaperSummaryStats {
  last24Hours: DiaperPeriodSummary;
  last7Days: DiaperPeriodSummary;
  lastWetTime: number | null;
  lastDirtyTime: number | null;
  averageIntervalMinutes: number | null;
}

export interface DiaperChartPoint {
  timestamp: number;
  wet: number;
  dirty: number;
  both: number;
  total: number;
}
