import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Star,
  Download,
  FolderInput,
  Trash2,
  X,
  ChevronDown,
  Archive,
  Loader2,
} from 'lucide-react';
import { useFiles } from '../context/FilesContext';
import { useTransfers } from '../context/TransfersContext';
import { api } from '../lib/api';
import JSZip from 'jszip';

export const BatchActionBar: React.FC = () => {
  const {
    selectedIds,
    files,
    folders,
    clearSelection,
    selectAll,
    bulkDelete,
    bulkStar,
    bulkMove,
    currentFolderId,
  } = useFiles();

  const { startDownload } = useTransfers();
  const [isMovePopoverOpen, setIsMovePopoverOpen] = useState(false);
  const [zipping, setZipping] = useState(false);

  if (selectedIds.size === 0) return null;

  const totalItemsCount = files.length + folders.length;
  const isAllSelected = selectedIds.size === totalItemsCount && totalItemsCount > 0;

  // Selected files list
  const selectedFiles = files.filter((f) => selectedIds.has(f.id));
  const hasFiles = selectedFiles.length > 0;

  // Destination folders (exclude folders that are themselves selected)
  const availableMoveTargets = folders.filter((f) => !selectedIds.has(f.id));

  const handleDownloadSelected = async () => {
    for (const f of selectedFiles) {
      await startDownload(f.id, f.name);
    }
    clearSelection();
  };

  const handleDownloadZip = async () => {
    if (selectedFiles.length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const f of selectedFiles) {
        const bytes = await api.getFilePreviewBytes(f.id);
        if (bytes && bytes.length > 0) {
          zip.file(f.name, bytes);
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TGCloud_Archive_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      clearSelection();
    } catch (e) {
      console.error('Failed to create ZIP:', e);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="relative flex items-center justify-between gap-2 p-3 bg-tg-dark-surface/95 backdrop-blur-xl border border-tg-blue-500/50 rounded-2xl shadow-2xl shadow-black/60 text-white">
        {/* Left: Count and Select All */}
        <div className="flex items-center gap-2 pl-1.5 shrink-0">
          <button
            onClick={isAllSelected ? clearSelection : selectAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-tg-dark-bg/80 border border-tg-dark-border text-xs font-semibold hover:border-tg-blue-500/50 transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-tg-blue-400" />
            ) : (
              <Square className="w-4 h-4 text-tg-dark-muted" />
            )}
            <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
          </button>

          <span className="text-xs font-semibold text-tg-blue-300 px-2 py-1 rounded-lg bg-tg-blue-500/15 border border-tg-blue-500/30">
            {selectedIds.size} selected
          </span>
        </div>

        {/* Center: Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
          {hasFiles && (
            <button
              onClick={() => bulkStar(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-tg-dark-bg/80 border border-tg-dark-border hover:bg-tg-dark-surfaceHover hover:border-amber-500/40 text-xs font-semibold text-amber-300 transition-all active:scale-95 flex items-center gap-1.5"
              title="Star Selected"
            >
              <Star className="w-4 h-4 fill-amber-400/20" />
              <span className="hidden sm:inline">Star</span>
            </button>
          )}

          {hasFiles && (
            <button
              onClick={handleDownloadSelected}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-tg-dark-bg/80 border border-tg-dark-border hover:bg-tg-dark-surfaceHover hover:border-tg-blue-500/40 text-xs font-semibold text-tg-blue-400 transition-all active:scale-95 flex items-center gap-1.5"
              title="Download Selected Files"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}

          {hasFiles && selectedFiles.length > 1 && (
            <button
              onClick={handleDownloadZip}
              disabled={zipping}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-xs font-semibold text-purple-300 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              title="Bundle and Download Selected Files as a single ZIP archive"
            >
              {zipping ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <Archive className="w-4 h-4 text-purple-400" />}
              <span className="hidden sm:inline">{zipping ? 'Zipping...' : 'Download ZIP'}</span>
            </button>
          )}

          {/* Move to Folder Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMovePopoverOpen(!isMovePopoverOpen)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-tg-dark-bg/80 border border-tg-dark-border hover:bg-tg-dark-surfaceHover hover:border-purple-500/40 text-xs font-semibold text-purple-300 transition-all active:scale-95 flex items-center gap-1.5"
              title="Move to Folder"
            >
              <FolderInput className="w-4 h-4" />
              <span className="hidden sm:inline">Move</span>
              <ChevronDown className="w-3 h-3 text-tg-dark-muted hidden sm:inline" />
            </button>

            {isMovePopoverOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsMovePopoverOpen(false)}
                />
                <div className="absolute right-0 bottom-12 w-48 p-1.5 bg-tg-dark-surface border border-tg-dark-border rounded-xl shadow-2xl z-40 text-xs max-h-56 overflow-y-auto">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-tg-dark-muted">
                    Move items to:
                  </div>
                  {currentFolderId !== null && (
                    <button
                      onClick={() => {
                        setIsMovePopoverOpen(false);
                        bulkMove(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-white hover:bg-tg-blue-500/20 hover:text-tg-blue-300 transition-colors"
                    >
                      Root (My Files)
                    </button>
                  )}
                  {availableMoveTargets.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setIsMovePopoverOpen(false);
                        bulkMove(folder.id);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-white hover:bg-tg-blue-500/20 hover:text-tg-blue-300 transition-colors truncate"
                    >
                      {folder.name}
                    </button>
                  ))}
                  {availableMoveTargets.length === 0 && currentFolderId === null && (
                    <div className="px-2.5 py-2 text-tg-dark-muted text-[11px]">
                      No subfolders available.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Delete to Trash */}
          <button
            onClick={bulkDelete}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-xs font-semibold text-red-400 transition-all active:scale-95 flex items-center gap-1.5"
            title="Move Selected to Trash"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>

          {/* Clear / Dismiss */}
          <button
            onClick={clearSelection}
            className="p-2 rounded-xl text-tg-dark-muted hover:text-white hover:bg-tg-dark-bg transition-colors"
            title="Clear Selection"
            aria-label="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
