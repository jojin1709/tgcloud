import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import {
  AppSettings,
  AuthState,
  SearchQuery,
  StorageStats,
  TGFile,
  TGFolder,
  TGTransfer,
  TGUser,
} from '@tgcloud/types';

export const isRunningInTauri = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window ||
      '__TAURI__' in window ||
      window.location.hostname === 'tauri.localhost' ||
      window.location.protocol === 'tauri:')
  );
};

// Fallback in-memory storage for web browser preview
class WebMockStorage {
  private user: TGUser | null = null;
  private folders: TGFolder[] = [];
  private files: TGFile[] = [];
  private transfers: TGTransfer[] = [];
  private settings: AppSettings = {
    concurrentUploads: 3,
    concurrentDownloads: 3,
    autoRetry: true,
    downloadLocation: 'C:\\Users\\User\\Downloads',
    theme: 'dark',
    appLock: false,
    vaultName: 'TGCloud Personal Vault (Web Demo)',
  };

  constructor() {
    this.initDefaultMockData();
  }

  private initDefaultMockData() {
    // Only initialized if in web demo mode
    const now = Date.now();
    this.folders = [
      { id: 'f-docs', name: 'Documents', parentId: null, createdAt: now - 86400000, modifiedAt: now - 86400000, fileCount: 0, totalSize: 0 },
      { id: 'f-projects', name: 'Projects', parentId: null, createdAt: now - 43200000, modifiedAt: now - 43200000, fileCount: 0, totalSize: 0 },
      { id: 'f-photos', name: 'Photos', parentId: null, createdAt: now - 21600000, modifiedAt: now - 21600000, fileCount: 0, totalSize: 0 },
    ];
  }

  getAuthState(): AuthState {
    return {
      step: this.user ? 'authenticated' : 'need_phone',
      user: this.user,
      connectedVaultId: this.user ? 998877 : null,
      connectedVaultTitle: this.user ? 'TGCloud Personal Vault' : null,
    };
  }

  loginDemoUser(phone: string): TGUser {
    this.user = {
      id: 77889900,
      username: 'cloud_user',
      firstName: 'Telegram',
      lastName: 'User',
      phone: phone || '+1 (555) 019-2834',
      isPremium: true,
    };
    return this.user;
  }

  logout() {
    this.user = null;
  }

  listFolders(parentId: string | null): TGFolder[] {
    return this.folders.filter((f) => f.parentId === parentId);
  }

  createFolder(name: string, parentId: string | null): TGFolder {
    const newFolder: TGFolder = {
      id: `f-${Date.now()}`,
      name,
      parentId,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      fileCount: 0,
      totalSize: 0,
    };
    this.folders.push(newFolder);
    return newFolder;
  }

  renameFolder(id: string, newName: string) {
    const f = this.folders.find((x) => x.id === id);
    if (f) {
      f.name = newName;
      f.modifiedAt = Date.now();
    }
  }

  deleteFolder(id: string) {
    this.folders = this.folders.filter((x) => x.id !== id);
  }

  listFiles(folderId: string | null, starredOnly?: boolean, trashOnly?: boolean): TGFile[] {
    return this.files.filter((f) => {
      if (trashOnly) return f.isTrash;
      if (starredOnly) return f.isStarred && !f.isTrash;
      return f.parentFolderId === folderId && !f.isTrash;
    });
  }

  insertFile(file: TGFile) {
    this.files.push(file);
  }

  renameFile(id: string, newName: string) {
    const f = this.files.find((x) => x.id === id);
    if (f) {
      f.name = newName;
      f.modifiedAt = Date.now();
    }
  }

  moveFile(id: string, newParentId: string | null) {
    const f = this.files.find((x) => x.id === id);
    if (f) {
      f.parentFolderId = newParentId;
      f.modifiedAt = Date.now();
    }
  }

  toggleStar(id: string): boolean {
    const f = this.files.find((x) => x.id === id);
    if (f) {
      f.isStarred = !f.isStarred;
      return f.isStarred;
    }
    return false;
  }

  setTrash(id: string, isTrash: boolean) {
    const f = this.files.find((x) => x.id === id);
    if (f) f.isTrash = isTrash;
  }

  deletePermanent(id: string) {
    this.files = this.files.filter((x) => x.id !== id);
  }

  searchFiles(query: SearchQuery): TGFile[] {
    const term = query.term.toLowerCase();
    return this.files.filter((f) => !f.isTrash && f.name.toLowerCase().includes(term));
  }

  getStorageStats(): StorageStats {
    const active = this.files.filter((f) => !f.isTrash);
    return {
      totalFiles: active.length,
      totalFolders: this.folders.length,
      totalBytesUsed: active.reduce((acc, f) => acc + f.size, 0),
      starredFiles: this.files.filter((f) => f.isStarred && !f.isTrash).length,
      trashFiles: this.files.filter((f) => f.isTrash).length,
    };
  }

  listTransfers(): TGTransfer[] {
    return this.transfers;
  }

  addTransfer(t: TGTransfer) {
    this.transfers.unshift(t);
  }

  getSettings(): AppSettings {
    return this.settings;
  }

  saveSettings(s: AppSettings) {
    this.settings = s;
  }
}

const mock = new WebMockStorage();

// Typed API Wrappers
export const api = {
  // Auth
  async getAuthState(): Promise<AuthState> {
    if (isRunningInTauri()) {
      try {
        const timeoutPromise = new Promise<AuthState>((_, reject) =>
          setTimeout(() => reject(new Error('IPC request timed out')), 5000)
        );
        return await Promise.race([invoke<AuthState>('get_auth_state'), timeoutPromise]);
      } catch (err: any) {
        console.warn('getAuthState failed, defaulting to need_phone:', err);
        return {
          step: 'need_phone',
          user: null,
          connectedVaultId: null,
          connectedVaultTitle: null,
          error: null,
        };
      }
    }
    return mock.getAuthState();
  },

  async sendPhoneCode(phone: string): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('send_phone_code', { phone });
    }
    // Web mock succeeds
  },

  async verifyPhoneCode(code: string): Promise<TGUser> {
    if (isRunningInTauri()) {
      return await invoke<TGUser>('verify_phone_code', { code });
    }
    return mock.loginDemoUser('+1 555-0199');
  },

  async submit2faPassword(password: string): Promise<TGUser> {
    if (isRunningInTauri()) {
      return await invoke<TGUser>('submit_2fa_password', { password });
    }
    return mock.loginDemoUser('+1 555-0199');
  },

  async logout(): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('logout');
    }
    mock.logout();
  },

  // Folders
  async listFolders(parentId: string | null = null): Promise<TGFolder[]> {
    if (isRunningInTauri()) {
      return await invoke<TGFolder[]>('list_folders', { parentId });
    }
    return mock.listFolders(parentId);
  },

  async createFolder(name: string, parentId: string | null = null): Promise<TGFolder> {
    if (isRunningInTauri()) {
      return await invoke<TGFolder>('create_folder', { name, parentId });
    }
    return mock.createFolder(name, parentId);
  },

  async renameFolder(id: string, newName: string): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('rename_folder', { id, newName });
    }
    mock.renameFolder(id, newName);
  },

  async moveFolder(id: string, newParentId: string | null): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('move_folder', { id, newParentId });
    }
  },

  async deleteFolder(id: string): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('delete_folder', { id });
    }
    mock.deleteFolder(id);
  },

  // Files
  async listFiles(
    folderId: string | null = null,
    starredOnly?: boolean,
    trashOnly?: boolean
  ): Promise<TGFile[]> {
    if (isRunningInTauri()) {
      return await invoke<TGFile[]>('list_files', { folderId, starredOnly, trashOnly });
    }
    return mock.listFiles(folderId, starredOnly, trashOnly);
  },

  async getFile(id: string): Promise<TGFile | null> {
    if (isRunningInTauri()) {
      return await invoke<TGFile | null>('get_file', { id });
    }
    return null;
  },

  async renameFile(id: string, newName: string): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('rename_file', { id, newName });
    }
    mock.renameFile(id, newName);
  },

  async moveFile(id: string, newParentFolderId: string | null): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('move_file', { id, newParentFolderId });
    }
    mock.moveFile(id, newParentFolderId);
  },

  async toggleStarFile(id: string): Promise<boolean> {
    if (isRunningInTauri()) {
      return await invoke<boolean>('toggle_star_file', { id });
    }
    return mock.toggleStar(id);
  },

  async moveFileToTrash(id: string): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('move_file_to_trash', { id });
    }
    mock.setTrash(id, true);
  },

  async restoreFileFromTrash(id: string): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('restore_file_from_trash', { id });
    }
    mock.setTrash(id, false);
  },

  async deleteFilePermanent(id: string): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('delete_file_permanent', { id });
    }
    mock.deletePermanent(id);
  },

  async searchFiles(query: SearchQuery): Promise<TGFile[]> {
    if (isRunningInTauri()) {
      return await invoke<TGFile[]>('search_files', { query });
    }
    return mock.searchFiles(query);
  },

  async getStorageStats(): Promise<StorageStats> {
    if (isRunningInTauri()) {
      return await invoke<StorageStats>('get_storage_stats');
    }
    return mock.getStorageStats();
  },

  // Transfers
  async startUpload(filePath: string, parentFolderId: string | null = null): Promise<string> {
    if (isRunningInTauri()) {
      return await invoke<string>('start_upload', { filePath, parentFolderId });
    }
    const transferId = `up-${Date.now()}`;
    const filename = filePath.split(/[/\\]/).pop() || 'uploaded_file';
    mock.addTransfer({
      id: transferId,
      fileName: filename,
      type: 'upload',
      status: 'completed',
      progress: 100,
      bytesTotal: 1024 * 1024 * 15,
      bytesTransferred: 1024 * 1024 * 15,
      speedBytesPerSec: 0,
      etaSeconds: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    mock.insertFile({
      id: `f-${Date.now()}`,
      name: filename,
      parentFolderId,
      telegramChatId: 998877,
      telegramMessageId: Math.floor(Math.random() * 10000),
      telegramFileId: `tg_${Date.now()}`,
      mimeType: 'application/octet-stream',
      size: 1024 * 1024 * 15,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      status: 'synced',
    });
    return transferId;
  },

  async startDownload(fileId: string, destinationPath: string): Promise<string> {
    if (isRunningInTauri()) {
      return await invoke<string>('start_download', { fileId, destinationPath });
    }
    return `dl-${Date.now()}`;
  },

  async listTransfers(): Promise<TGTransfer[]> {
    if (isRunningInTauri()) {
      return await invoke<TGTransfer[]>('list_transfers');
    }
    return mock.listTransfers();
  },

  async pauseTransfer(id: string): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('pause_transfer', { id });
    }
  },

  async resumeTransfer(id: string): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('resume_transfer', { id });
    }
  },

  async cancelTransfer(id: string): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('cancel_transfer', { id });
    }
  },

  async clearCompletedTransfers(): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('clear_completed_transfers');
    }
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    if (isRunningInTauri()) {
      return await invoke<AppSettings>('get_settings');
    }
    return mock.getSettings();
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('save_settings', { settings });
    }
    mock.saveSettings(settings);
  },

  async openFileInOs(filePath: string): Promise<void> {
    if (isRunningInTauri()) {
      return await invoke('open_file_in_os', { filePath });
    }
  },

  // Event listener
  onTransferUpdate(callback: (transfer: TGTransfer) => void): () => void {
    if (isRunningInTauri()) {
      let unlistenFn: UnlistenFn | null = null;
      listen<TGTransfer>('transfer-update', (event) => {
        callback(event.payload);
      }).then((unlisten) => {
        unlistenFn = unlisten;
      });

      return () => {
        if (unlistenFn) unlistenFn();
      };
    }
    return () => {};
  },

  onFilesChanged(callback: () => void): () => void {
    if (isRunningInTauri()) {
      let unlistenFn: UnlistenFn | null = null;
      listen('files-changed', () => {
        callback();
      }).then((unlisten) => {
        unlistenFn = unlisten;
      });

      return () => {
        if (unlistenFn) unlistenFn();
      };
    }
    return () => {};
  },
};
