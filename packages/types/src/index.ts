export type TransferType = 'upload' | 'download';

export type TransferStatus =
  | 'queued'
  | 'active'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TGUser {
  id: number;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  isPremium?: boolean;
}

export interface TGFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  modifiedAt: number;
  fileCount?: number;
  totalSize?: number;
}

export interface TGFile {
  id: string;
  name: string;
  parentFolderId: string | null;
  telegramChatId: number;
  telegramMessageId: number;
  telegramFileId: string;
  mimeType: string;
  size: number;
  hash?: string | null;
  createdAt: number;
  modifiedAt: number;
  thumbnailPath?: string | null;
  status: 'synced' | 'local_only' | 'uploading' | 'error';
  isStarred?: boolean;
  isTrash?: boolean;
}

export interface TGTransfer {
  id: string;
  fileId?: string;
  fileName: string;
  type: TransferType;
  status: TransferStatus;
  progress: number; // 0.0 to 100.0
  bytesTotal: number;
  bytesTransferred: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  error?: string | null;
  createdAt: number;
  updatedAt: number;
  localPath?: string;
}

export interface StorageStats {
  totalFiles: number;
  totalFolders: number;
  totalBytesUsed: number;
  starredFiles: number;
  trashFiles: number;
}

export type AuthStep =
  | 'idle'
  | 'need_credentials'
  | 'need_phone'
  | 'need_code'
  | 'need_password'
  | 'authenticated';

export interface AuthState {
  step: AuthStep;
  user: TGUser | null;
  phone?: string;
  error?: string | null;
  connectedVaultId?: number | null;
  connectedVaultTitle?: string | null;
}

export interface AppSettings {
  telegramApiId?: number;
  telegramApiHash?: string;
  concurrentUploads: number;
  concurrentDownloads: number;
  autoRetry: boolean;
  downloadLocation: string;
  theme: 'dark' | 'light' | 'system';
  appLock: boolean;
  vaultChatId?: number;
  vaultName?: string;
}

export interface SearchQuery {
  term: string;
  folderId?: string | null;
  mimeTypeCategory?: 'all' | 'documents' | 'images' | 'videos' | 'audio' | 'archives';
  sortBy?: 'name' | 'size' | 'date';
  sortOrder?: 'asc' | 'desc';
}
