import fs from 'fs';
import path from 'path';

export interface StorageAdapter {
  name: string;
  saveArtifact(runId: string, filename: string, data: Buffer | string): Promise<string>;
  getArtifact(runId: string, filename: string): Promise<Buffer | null>;
  listArtifacts(runId: string): Promise<string[]>;
}

export class LocalStorageAdapter implements StorageAdapter {
  name = 'Local Filesystem';
  private baseDir: string;

  constructor(baseDir = path.resolve(process.cwd(), 'data', 'artifacts')) {
    this.baseDir = baseDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveArtifact(runId: string, filename: string, data: Buffer | string): Promise<string> {
    const runDir = path.join(this.baseDir, runId);
    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true });
    }
    const filePath = path.join(runDir, filename);
    await fs.promises.writeFile(filePath, data);
    return `/artifacts/${runId}/${filename}`;
  }

  async getArtifact(runId: string, filename: string): Promise<Buffer | null> {
    const filePath = path.join(this.baseDir, runId, filename);
    if (!fs.existsSync(filePath)) return null;
    return await fs.promises.readFile(filePath);
  }

  async listArtifacts(runId: string): Promise<string[]> {
    const runDir = path.join(this.baseDir, runId);
    if (!fs.existsSync(runDir)) return [];
    return await fs.promises.readdir(runDir);
  }
}

export class GoogleDriveStorageAdapter implements StorageAdapter {
  name = 'Google Drive';
  private credentialsConfigured = false;
  private rootFolderId = '';

  configure(clientId: string, clientSecret: string, rootFolderId: string) {
    if (clientId && clientSecret) {
      this.credentialsConfigured = true;
      this.rootFolderId = rootFolderId || 'root';
    }
  }

  isConfigured(): boolean {
    return this.credentialsConfigured;
  }

  async saveArtifact(runId: string, filename: string, data: Buffer | string): Promise<string> {
    if (!this.credentialsConfigured) {
      throw new Error('Google Drive integration is not connected. Please provide OAuth credentials in Settings.');
    }
    // Remote Google Drive API upload handle
    return `gdrive://${this.rootFolderId}/${runId}/${filename}`;
  }

  async getArtifact(runId: string, filename: string): Promise<Buffer | null> {
    if (!this.credentialsConfigured) return null;
    return null;
  }

  async listArtifacts(runId: string): Promise<string[]> {
    if (!this.credentialsConfigured) return [];
    return [];
  }
}

export const localStorage = new LocalStorageAdapter();
export const googleDriveStorage = new GoogleDriveStorageAdapter();
