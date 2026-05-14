import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import lockfile from 'proper-lockfile';
import type {
  CommitResult,
  IWorkbookService,
  WorkbookInfo,
} from '@excellence/shared-types';
import type { TableModel } from '@excellence/extraction-core';
import { decryptFile, encryptFile } from '../security/file-encryptor';
import { sanitizePath } from '../security/path-sanitizer';

interface WorkbookSession {
  originalPath: string;
  tempDir: string;
  encryptedPath: string;
  backupPath?: string;
  releaseLock?: () => Promise<void>;
}

const toColumnLetter = (count: number): string => {
  let col = '';
  let n = count;
  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }
  return col || 'A';
};

export class WorkbookService implements IWorkbookService {
  private session: WorkbookSession | null = null;

  async load(filePath: string): Promise<WorkbookInfo> {
    let sanitized = '';
    let releaseLock: (() => Promise<void>) | undefined;
    let tempDir: string | undefined;
    try {
      sanitized = sanitizePath(filePath);
      await fs.stat(sanitized);

      let lockedByExcel = false;
      try {
        releaseLock = await lockfile.lock(sanitized, { retries: 0 });
      } catch {
        lockedByExcel = true;
      }

      if (lockedByExcel) {
        return {
          filePath: sanitized,
          sheets: [],
          lockedByExcel: true,
        };
      }

      const tempRoot = path.join(app.getPath('temp'), 'excellence');
      await fs.mkdir(tempRoot, { recursive: true });
      tempDir = await fs.mkdtemp(path.join(tempRoot, 'workbook-'));
      const tempCopy = path.join(tempDir, path.basename(sanitized));
      const encryptedPath = `${tempCopy}.enc`;

      await fs.copyFile(sanitized, tempCopy);
      await encryptFile(tempCopy, encryptedPath);

      this.session = {
        originalPath: sanitized,
        tempDir,
        encryptedPath,
        releaseLock,
      };

      return {
        filePath: sanitized,
        sheets: [
          {
            name: 'Sheet1',
            rowCount: 0,
            colCount: 0,
          },
        ],
        lockedByExcel: false,
      };
    } catch (err) {
      if (releaseLock) {
        try {
          await releaseLock();
        } catch {
          // Ignore cleanup errors.
        }
      }
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors.
        }
      }
      throw new Error(`Workbook load failed: ${String(err)}`);
    }
  }

  async commit(tableModel: TableModel): Promise<CommitResult> {
    try {
      if (!this.session) {
        throw new Error('No workbook loaded.');
      }

      if (!this.session.backupPath) {
        const backupPath = `${this.session.originalPath}.bak`;
        await fs.copyFile(this.session.originalPath, backupPath);
        this.session.backupPath = backupPath;
      }

      const columnCount = tableModel.headers.length;
      const rowCount = tableModel.rows.length + 1;
      const range = `A1:${toColumnLetter(columnCount)}${rowCount}`;

      return {
        range,
        sheetName: tableModel.sheetName,
        rowsWritten: tableModel.rows.length,
      };
    } catch (err) {
      throw new Error(`Workbook commit failed: ${String(err)}`);
    }
  }

  async rollback(): Promise<void> {
    try {
      if (!this.session?.backupPath) {
        return;
      }
      await fs.copyFile(this.session.backupPath, this.session.originalPath);
    } catch (err) {
      throw new Error(`Workbook rollback failed: ${String(err)}`);
    }
  }

  async snapshot(): Promise<string> {
    try {
      if (!this.session) {
        throw new Error('No workbook loaded.');
      }

      const snapshotPath = path.join(
        this.session.tempDir,
        `snapshot-${Date.now()}.xlsx`
      );
      const encryptedCopy = `${snapshotPath}.enc`;
      await fs.copyFile(this.session.encryptedPath, encryptedCopy);
      await decryptFile(encryptedCopy, snapshotPath);
      return snapshotPath;
    } catch (err) {
      throw new Error(`Workbook snapshot failed: ${String(err)}`);
    }
  }

  async releaseAll(): Promise<void> {
    try {
      if (!this.session) return;
      await this.session.releaseLock?.();
      await fs.rm(this.session.tempDir, { recursive: true, force: true });
      this.session = null;
    } catch (err) {
      throw new Error(`Workbook cleanup failed: ${String(err)}`);
    }
  }
}
