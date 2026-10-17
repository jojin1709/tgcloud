import React from 'react';
import { UploadCloud, Image, FolderPlus, RefreshCw, X } from 'lucide-react';

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFiles: () => void;
  onUploadMedia: () => void;
  onNewFolder: () => void;
  onSyncTelegram: () => void;
}

export const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
  isOpen,
  onClose,
  onUploadFiles,
  onUploadMedia,
  onNewFolder,
  onSyncTelegram,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative w-full bg-tg-dark-surface border-t border-tg-dark-border/80 rounded-t-3xl p-5 pt-3 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
        {/* Handle Pill */}
        <div className="w-12 h-1.5 bg-tg-dark-border rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-tg-dark-border/60">
          <div>
            <h3 className="text-base font-bold text-white">Add to Telegram Cloud</h3>
            <p className="text-xs text-tg-dark-muted">Choose an action or upload destination</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions List */}
        <div className="space-y-2.5 mb-4">
          <label
            htmlFor="global-file-input"
            onClick={() => {
              onClose();
              onUploadFiles();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-tg-dark-bg/60 border border-tg-dark-border/80 hover:bg-tg-dark-surfaceHover text-left transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-tg-blue-500/20 border border-tg-blue-500/40 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5 text-tg-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-white">Upload Files</div>
              <div className="text-xs text-tg-dark-muted truncate">Documents, archives, code, any files</div>
            </div>
          </label>

          <label
            htmlFor="global-media-input"
            onClick={() => {
              onClose();
              onUploadMedia();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-tg-dark-bg/60 border border-tg-dark-border/80 hover:bg-tg-dark-surfaceHover text-left transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Image className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-white">Upload Photos & Videos</div>
              <div className="text-xs text-tg-dark-muted truncate">Pick pictures or recordings from gallery</div>
            </div>
          </label>

          <button
            onClick={() => {
              onClose();
              onNewFolder();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-tg-dark-bg/60 border border-tg-dark-border/80 hover:bg-tg-dark-surfaceHover text-left transition-all active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
              <FolderPlus className="w-5 h-5 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-white">New Folder</div>
              <div className="text-xs text-tg-dark-muted truncate">Create a folder to organize your vault</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onSyncTelegram();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-tg-dark-bg/60 border border-tg-dark-border/80 hover:bg-tg-dark-surfaceHover text-left transition-all active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-white">Sync Telegram Files</div>
              <div className="text-xs text-tg-dark-muted truncate">Scan and sync your Telegram Saved Messages</div>
            </div>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-medium text-sm text-tg-dark-muted bg-tg-dark-bg/80 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
