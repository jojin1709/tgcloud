import React, { useEffect, useRef } from 'react';
import {
  Eye,
  Download,
  Star,
  Trash2,
  Edit3,
  Link2,
  FolderInput,
  Check,
  UploadCloud,
  FolderPlus,
  CheckSquare,
  RotateCw,
} from 'lucide-react';
import { TGFile, TGFolder } from '@tgcloud/types';

interface ContextMenuProps {
  x: number;
  y: number;
  file?: TGFile | null;
  folder?: TGFolder | null;
  onClose: () => void;
  onPreview?: () => void;
  onDownload?: () => void;
  onStar?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  onUpload?: () => void;
  onNewFolder?: () => void;
  onSelectAll?: () => void;
  onRefresh?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  file,
  folder,
  onClose,
  onPreview,
  onDownload,
  onStar,
  onRename,
  onMove,
  onDelete,
  onUpload,
  onNewFolder,
  onSelectAll,
  onRefresh,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [copiedLink, setCopiedLink] = React.useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust coordinates to prevent menu running off screen
  const menuWidth = 210;
  const menuHeight = 260;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 12);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 12);

  const handleCopyLink = () => {
    if (file) {
      const shareUrl = `https://t.me/c/${Math.abs(file.telegramChatId)}/${file.telegramMessageId}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 w-52 bg-tg-dark-surface/95 backdrop-blur-xl border border-tg-dark-border/80 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-0.5 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {/* Header Info */}
      <div className="px-3 py-1.5 border-b border-tg-dark-border/50 text-[11px] text-tg-dark-muted truncate font-medium">
        {file?.name || folder?.name || 'Folder Actions'}
      </div>

      {!file && !folder && (
        <>
          {onUpload && (
            <button
              onClick={() => {
                onUpload();
                onClose();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-tg-blue-500/15 hover:text-tg-blue-400 transition-colors text-left cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-tg-blue-400" />
              <span>Upload Files</span>
            </button>
          )}

          {onNewFolder && (
            <button
              onClick={() => {
                onNewFolder();
                onClose();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-tg-blue-500/15 hover:text-tg-blue-400 transition-colors text-left cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-emerald-400" />
              <span>New Folder</span>
            </button>
          )}

          {onSelectAll && (
            <button
              onClick={() => {
                onSelectAll();
                onClose();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-tg-blue-500/15 hover:text-tg-blue-400 transition-colors text-left cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-purple-400" />
              <span>Select All</span>
              <span className="ml-auto text-[10px] text-tg-dark-muted font-mono">Ctrl+A</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={() => {
                onRefresh();
                onClose();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-tg-blue-500/15 hover:text-tg-blue-400 transition-colors text-left cursor-pointer"
            >
              <RotateCw className="w-4 h-4 text-amber-400" />
              <span>Refresh Vault</span>
            </button>
          )}
        </>
      )}

      {file && onPreview && (
        <button
          onClick={() => {
            onPreview();
            onClose();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-tg-blue-500/15 hover:text-tg-blue-400 transition-colors text-left cursor-pointer"
        >
          <Eye className="w-4 h-4 text-tg-blue-400" />
          <span>Quick Preview</span>
          <span className="ml-auto text-[10px] text-tg-dark-muted font-mono">Space</span>
        </button>
      )}

      {file && onDownload && (
        <button
          onClick={() => {
            onDownload();
            onClose();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-tg-blue-500/15 hover:text-tg-blue-400 transition-colors text-left cursor-pointer"
        >
          <Download className="w-4 h-4 text-tg-blue-400" />
          <span>Download</span>
        </button>
      )}

      {file && (
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-tg-blue-500/15 hover:text-tg-blue-400 transition-colors text-left cursor-pointer"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4 text-purple-400" />}
          <span>{copiedLink ? 'Copied Link!' : 'Copy Cloud Link'}</span>
        </button>
      )}

      {file && onStar && (
        <button
          onClick={() => {
            onStar();
            onClose();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-500/15 hover:text-amber-400 transition-colors text-left cursor-pointer"
        >
          <Star className={`w-4 h-4 ${file.isStarred ? 'text-amber-400 fill-amber-400' : 'text-amber-400'}`} />
          <span>{file.isStarred ? 'Remove from Starred' : 'Add to Starred'}</span>
        </button>
      )}

      {onMove && (
        <button
          onClick={() => {
            onMove();
            onClose();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-tg-blue-500/15 hover:text-tg-blue-400 transition-colors text-left cursor-pointer"
        >
          <FolderInput className="w-4 h-4 text-tg-blue-400" />
          <span>Move to Folder...</span>
        </button>
      )}

      {onRename && (
        <button
          onClick={() => {
            onRename();
            onClose();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-tg-dark-surfaceHover transition-colors text-left cursor-pointer"
        >
          <Edit3 className="w-4 h-4 text-slate-400" />
          <span>Rename</span>
        </button>
      )}

      <div className="h-px bg-tg-dark-border/60 my-1" />

      {onDelete && (
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/15 text-rose-400 transition-colors text-left cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Move to Trash</span>
          <span className="ml-auto text-[10px] text-rose-400/60 font-mono">Del</span>
        </button>
      )}
    </div>
  );
};
