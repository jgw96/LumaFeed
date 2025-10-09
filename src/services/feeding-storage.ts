import type { FeedingLog } from '../types/feeding-log.js';

const STORAGE_FILE_NAME = 'feeding-logs.json';

export class FeedingStorageService {
  private async getFileHandle(): Promise<FileSystemFileHandle> {
    const root = await navigator.storage.getDirectory();
    return await root.getFileHandle(STORAGE_FILE_NAME, { create: true });
  }

  async saveLogs(logs: FeedingLog[]): Promise<void> {
    try {
      const fileHandle = await this.getFileHandle();
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(logs, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error saving feeding logs:', error);
      throw error;
    }
  }

  async loadLogs(): Promise<FeedingLog[]> {
    try {
      const fileHandle = await this.getFileHandle();
      const file = await fileHandle.getFile();
      const contents = await file.text();
      
      if (!contents.trim()) {
        return [];
      }
      
      return JSON.parse(contents) as FeedingLog[];
    } catch (error) {
      console.error('Error loading feeding logs:', error);
      return [];
    }
  }

  async addLog(log: FeedingLog): Promise<void> {
    const logs = await this.loadLogs();
    logs.unshift(log); // Add to beginning for most recent first
    await this.saveLogs(logs);
  }

  async deleteLog(id: string): Promise<void> {
    const logs = await this.loadLogs();
    const filtered = logs.filter(log => log.id !== id);
    await this.saveLogs(filtered);
  }
}

export const feedingStorage = new FeedingStorageService();
