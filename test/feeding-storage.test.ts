import { describe, it, expect, beforeEach } from 'vitest';
import { feedingStorage } from '../src/services/feeding-storage.js';
import type { FeedingLog } from '../src/types/feeding-log.js';

describe('FeedingStorage', () => {
  beforeEach(async () => {
    // Clear storage before each test
    await feedingStorage.saveLogs([]);
  });

  it('should save and load logs', async () => {
    const log: FeedingLog = {
      id: 'test-1',
      feedType: 'formula',
      amountMl: 120,
      amountOz: 4.1,
      durationMinutes: 20,
      isBottleFed: true,
      timestamp: Date.now(),
      startTime: Date.now() - 20 * 60000,
      endTime: Date.now(),
      nextFeedTime: Date.now() + 180 * 60000,
    };

    await feedingStorage.addLog(log);
    const logs = await feedingStorage.loadLogs();

    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe('test-1');
    expect(logs[0].amountMl).toBe(120);
  });

  it('should get a specific log by ID', async () => {
    const log1: FeedingLog = {
      id: 'test-1',
      feedType: 'formula',
      amountMl: 120,
      amountOz: 4.1,
      durationMinutes: 20,
      isBottleFed: true,
      timestamp: Date.now(),
      startTime: Date.now() - 20 * 60000,
      endTime: Date.now(),
      nextFeedTime: Date.now() + 180 * 60000,
    };

    const log2: FeedingLog = {
      id: 'test-2',
      feedType: 'milk',
      amountMl: 100,
      amountOz: 3.4,
      durationMinutes: 15,
      isBottleFed: false,
      timestamp: Date.now(),
      startTime: Date.now() - 15 * 60000,
      endTime: Date.now(),
      nextFeedTime: Date.now() + 180 * 60000,
    };

    await feedingStorage.addLog(log1);
    await feedingStorage.addLog(log2);

    const retrieved = await feedingStorage.getLog('test-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('test-1');
    expect(retrieved?.feedType).toBe('formula');
  });

  it('should return null when log is not found', async () => {
    const retrieved = await feedingStorage.getLog('nonexistent');
    expect(retrieved).toBeNull();
  });

  it('should update an existing log', async () => {
    const log: FeedingLog = {
      id: 'test-1',
      feedType: 'formula',
      amountMl: 120,
      amountOz: 4.1,
      durationMinutes: 20,
      isBottleFed: true,
      timestamp: Date.now(),
      startTime: Date.now() - 20 * 60000,
      endTime: Date.now(),
      nextFeedTime: Date.now() + 180 * 60000,
    };

    await feedingStorage.addLog(log);

    const updatedLog: FeedingLog = {
      ...log,
      amountMl: 150,
      amountOz: 5.1,
    };

    await feedingStorage.updateLog(updatedLog);

    const retrieved = await feedingStorage.getLog('test-1');
    expect(retrieved?.amountMl).toBe(150);
    expect(retrieved?.amountOz).toBe(5.1);
  });

  it('should throw error when updating non-existent log', async () => {
    const log: FeedingLog = {
      id: 'nonexistent',
      feedType: 'formula',
      amountMl: 120,
      amountOz: 4.1,
      durationMinutes: 20,
      isBottleFed: true,
      timestamp: Date.now(),
      startTime: Date.now() - 20 * 60000,
      endTime: Date.now(),
      nextFeedTime: Date.now() + 180 * 60000,
    };

    await expect(feedingStorage.updateLog(log)).rejects.toThrow('Log with id nonexistent not found');
  });

  it('should delete a log', async () => {
    const log: FeedingLog = {
      id: 'test-1',
      feedType: 'formula',
      amountMl: 120,
      amountOz: 4.1,
      durationMinutes: 20,
      isBottleFed: true,
      timestamp: Date.now(),
      startTime: Date.now() - 20 * 60000,
      endTime: Date.now(),
      nextFeedTime: Date.now() + 180 * 60000,
    };

    await feedingStorage.addLog(log);
    await feedingStorage.deleteLog('test-1');

    const logs = await feedingStorage.loadLogs();
    expect(logs).toHaveLength(0);
  });
});
