import React, { useState, useRef } from 'react';
import {
  ChevronRight,
  Home,
  UploadCloud,
  FolderOpen,
  Inbox,
  Star,
  Trash2,
} from 'lucide-react';
import { useFiles } from '../context/FilesContext';
import { useTransfers } from '../context/TransfersContext';
import { api, isRunningInTauri } from '../lib/api';
import { TGFile, TGFolder } from '@tgcloud/types';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { FileRow } from './FileRow';
import { ContextMenu } from './ContextMenu';

interface FileBrowserProps {
  onPreviewFile: (file: TGFile) => void;
  onRenameFile: (file: TGFile) => void;
  onRenameFolder: (id: string, name: string) => void;
  onNewFolder: () => void;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  onPreviewFile,
  onRenameFile,
  onRenameFolder,
  onNewFolder,
}) => {
  const {
    breadcrumbs,
    navigateToFolder,
    navigateToBreadcrumb,
    folders,
    files,
    navSection,
    viewMode,
    deleteFolder,
    toggleStar,
    moveToTrash,
    restoreFromTrash,
    deletePermanent,
    currentFolderId,
    categoryFilter,
    setCategoryFilter,
    refreshFiles,
    selectedIds,
    setSelectedIds,
    clearSelection,
    selectAll,
  } = useFiles();

  const { startDownload, startUpload } = useTransfers();
  const [isDragOver, setIsDragOver] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    file?: TGFile | null;
    folder?: TGFolder | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    file: null,
    folder: null,
  });

  // Marquee Selection State
  const containerRef = useRef<HTMLDivElement>(null);
  const [marqueeBox, setMarqueeBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const isMarqueeDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a') ||
      target.closest('[data-item-id]') ||
      target.closest('.no-marquee')
    ) {
      return;
    }

    marqueeStartRef.current = { x: e.clientX, y: e.clientY };
    isMarqueeDragging.current = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!marqueeStartRef.current) return;
      const startX = marqueeStartRef.current.x;
      const startY = marqueeStartRef.current.y;
      const currentX = moveEvent.clientX;
      const currentY = moveEvent.clientY;

      const diffX = Math.abs(currentX - startX);
      const diffY = Math.abs(currentY - startY);

      if (diffX > 4 || diffY > 4) {
        isMarqueeDragging.current = true;
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = diffX;
        const height = diffY;

        setMarqueeBox({ left, top, width, height });

        if (containerRef.current) {
          const itemEls = containerRef.current.querySelectorAll('[data-item-id]');
          const marqueeRect = {
            left,
            top,
            right: left + width,
            bottom: top + height,
          };

          const newSelected = new Set(
            moveEvent.ctrlKey || moveEvent.shiftKey ? selectedIds : []
          );
          itemEls.forEach((el) => {
            const r = el.getBoundingClientRect();
            const intersects = !(
              r.right < marqueeRect.left ||
              r.left > marqueeRect.right ||
              r.bottom < marqueeRect.top ||
              r.top > marqueeRect.bottom
            );
            const id = el.getAttribute('data-item-id');
            if (id && intersects) {
              newSelected.add(id);
            }
          });
          setSelectedIds(newSelected);
        }
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (!isMarqueeDragging.current) {
        clearSelection();
      }
      setMarqueeBox(null);
      marqueeStartRef.current = null;
      isMarqueeDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-item-id]') || target.closest('button')) {
      return;
    }
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      file: null,
      folder: null,
    });
  };

  const handleUploadClick = async () => {
    if (isRunningInTauri()) {
      const selected = await api.pickFiles();
      if (selected && selected.length > 0) {
        for (const filePath of selected) {
          await startUpload(filePath, currentFolderId);
        }
      }
    }
  };

  const handleDownload = async (file: TGFile) => {
    if (isRunningInTauri()) {
      try {
        const savePath = await api.pickSaveFile(file.name);
        if (savePath) {
          await startDownload(file.id, savePath);
          return;
        }
      } catch (e) {
        console.warn('Native picker unavailable, falling back:', e);
      }
    }
    await startDownload(file.id, file.name);
  };

  React.useEffect(() => {
    if (!isRunningInTauri()) return;

    let unlisten: (() => void) | undefined;
    import('@tauri-apps/api/webview')
      .then(({ getCurrentWebview }) => {
        getCurrentWebview()
          .onDragDropEvent((event) => {
            if (event.payload.type === 'over' || event.payload.type === 'enter') {
              setIsDragOver(true);
            } else if (event.payload.type === 'drop') {
              setIsDragOver(false);
              const paths = event.payload.paths;
              if (paths && paths.length > 0) {
                for (const p of paths) {
                  startUpload(p, currentFolderId);
                }
              }
            } else {
              setIsDragOver(false);
            }
          })
          .then((u) => {
            unlisten = u;
          });
      })
      .catch(console.error);

    return () => {
      if (unlisten) unlisten();
    };
  }, [currentFolderId, startUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length === 0) return;

    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];
      await startUpload(file, currentFolderId);
    }
    await refreshFiles();
  };

  const isTrash = navSection === 'trash';
  const isStarred = navSection === 'starred';

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onContextMenu={handleBackgroundContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex-1 overflow-y-auto p-3 sm:p-6 pb-28 sm:pb-8 flex flex-col gap-3.5 sm:gap-6 select-none ${
        isDragOver ? 'bg-tg-blue-500/5 ring-2 ring-inset ring-tg-blue-500/50' : ''
      }`}
    >
      {/* Marquee Selection Rectangle Overlay */}
      {marqueeBox && (
        <div
          className="fixed border border-tg-blue-400 bg-tg-blue-500/20 rounded pointer-events-none z-40 backdrop-blur-[0.5px]"
          style={{
            left: `${marqueeBox.left}px`,
            top: `${marqueeBox.top}px`,
            width: `${marqueeBox.width}px`,
            height: `${marqueeBox.height}px`,
          }}
        />
      )}

      {/* Custom Context Menu */}
      {contextMenu.isOpen && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          folder={contextMenu.folder}
          onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0, file: null, folder: null })}
          onPreview={contextMenu.file ? () => onPreviewFile(contextMenu.file!) : undefined}
          onDownload={contextMenu.file ? () => handleDownload(contextMenu.file!) : undefined}
          onStar={contextMenu.file ? () => toggleStar(contextMenu.file!.id) : undefined}
          onRename={() => {
            if (contextMenu.file) onRenameFile(contextMenu.file);
            else if (contextMenu.folder) onRenameFolder(contextMenu.folder.id, contextMenu.folder.name);
          }}
          onDelete={() => {
            if (contextMenu.file) moveToTrash(contextMenu.file.id);
            else if (contextMenu.folder) deleteFolder(contextMenu.folder.id);
          }}
          onUpload={handleUploadClick}
          onNewFolder={onNewFolder}
          onSelectAll={selectAll}
          onRefresh={refreshFiles}
        />
      )}

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-tg-dark-bg/80 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-tg-blue-500 rounded-2xl m-4 pointer-events-none">
          <UploadCloud className="w-16 h-16 text-tg-blue-400 animate-bounce mb-3" />
          <h2 className="text-xl font-bold text-white">Drop files to upload to Telegram</h2>
          <p className="text-sm text-tg-dark-muted mt-1">
            Files will be stored securely in your private Telegram cloud vault
          </p>
        </div>
      )}

      {/* Breadcrumb Navigation & Section Title */}
      <div className="flex items-center justify-between overflow-x-auto pb-1 pt-0.5 shrink-0">
        <div className="flex items-center gap-1.5 text-sm">
          {navSection === 'files' ? (
            breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id || 'root'}>
                {idx > 0 && <ChevronRight className="w-4 h-4 text-tg-dark-muted/60 shrink-0" />}
                <button
                  onClick={() => navigateToBreadcrumb(idx)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors truncate active:scale-95 ${
                    idx === breadcrumbs.length - 1
                      ? 'text-white font-semibold bg-tg-dark-surface border border-tg-dark-border/60 shadow-sm'
                      : 'text-tg-dark-muted hover:text-white'
                  }`}
                >
                  {idx === 0 && <Home className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{crumb.name}</span>
                </button>
              </React.Fragment>
            ))
          ) : (
            <div className="flex items-center gap-2">
              {isStarred && <Star className="w-5 h-5 text-amber-400 fill-current shrink-0" />}
              {isTrash && <Trash2 className="w-5 h-5 text-red-400 shrink-0" />}
              <h1 className="text-base sm:text-lg font-bold text-white capitalize">{navSection} Files</h1>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Category Filters Horizontal Strip */}
      <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none shrink-0">
        {[
          { id: 'all', label: 'All' },
          { id: 'documents', label: 'Docs' },
          { id: 'images', label: 'Photos' },
          { id: 'videos', label: 'Videos' },
          { id: 'audio', label: 'Audio' },
          { id: 'archives', label: 'Archives' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all shrink-0 active:scale-95 ${
              categoryFilter === c.id
                ? 'bg-tg-blue-500 text-white shadow-sm shadow-tg-blue-500/30'
                : 'bg-tg-dark-surface text-tg-dark-muted border border-tg-dark-border hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Folders Section (Only shown in My Files) */}
      {navSection === 'files' && folders.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-tg-dark-muted mb-2.5 flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5 text-tg-blue-400" />
            Folders ({folders.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onOpen={(id, name) => navigateToFolder(id, name)}
                onRename={(id, name) => onRenameFolder(id, name)}
                onDelete={(id) => deleteFolder(id)}
                onContextMenu={(e, f) =>
                  setContextMenu({
                    isOpen: true,
                    x: e.clientX,
                    y: e.clientY,
                    file: null,
                    folder: f,
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="flex-1 flex flex-col">
        {files.length > 0 ? (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-tg-dark-muted mb-2.5">
              Files ({files.length})
            </h2>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onPreview={onPreviewFile}
                    onDownload={handleDownload}
                    onToggleStar={toggleStar}
                    onRename={onRenameFile}
                    onMoveToTrash={moveToTrash}
                    onRestoreFromTrash={restoreFromTrash}
                    onDeletePermanent={deletePermanent}
                    isTrashView={isTrash}
                    onContextMenu={(e, f) =>
                      setContextMenu({
                        isOpen: true,
                        x: e.clientX,
                        y: e.clientY,
                        file: f,
                        folder: null,
                      })
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-tg-dark-border bg-tg-dark-surface overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-full">
                  <thead>
                    <tr className="border-b border-tg-dark-border/80 text-[11px] font-semibold text-tg-dark-muted uppercase tracking-wider bg-tg-dark-bg/40">
                      <th className="py-2.5 px-3 sm:px-4">Name</th>
                      <th className="hidden md:table-cell py-2.5 px-3 sm:px-4">Date Modified</th>
                      <th className="py-2.5 px-3 sm:px-4">Size</th>
                      <th className="hidden sm:table-cell py-2.5 px-3 sm:px-4">Status</th>
                      <th className="py-2.5 px-3 sm:px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <FileRow
                        key={file.id}
                        file={file}
                        onPreview={onPreviewFile}
                        onDownload={handleDownload}
                        onToggleStar={toggleStar}
                        onRename={onRenameFile}
                        onMoveToTrash={moveToTrash}
                        onRestoreFromTrash={restoreFromTrash}
                        onDeletePermanent={deletePermanent}
                        isTrashView={isTrash}
                        onContextMenu={(e, f) =>
                          setContextMenu({
                            isOpen: true,
                            x: e.clientX,
                            y: e.clientY,
                            file: f,
                            folder: null,
                          })
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-tg-dark-surface border border-tg-dark-border flex items-center justify-center text-tg-dark-muted mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {isTrash ? 'Trash is empty' : isStarred ? 'No starred files' : 'No files here yet'}
            </h3>
            <p className="text-xs text-tg-dark-muted mt-1 max-w-sm">
              {isTrash
                ? 'Files moved to trash will appear here before permanent deletion.'
                : isStarred
                ? 'Star your favorite or frequently accessed Telegram files for quick access.'
                : 'Drag and drop files here, or click the Upload button to upload files to your Telegram vault.'}
            </p>
            {navSection === 'files' && (
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleUploadClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-tg-blue-500 hover:bg-tg-blue-600 text-white shadow-md shadow-tg-blue-500/20 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Files</span>
                </button>
                <button
                  onClick={onNewFolder}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-tg-dark-surface border border-tg-dark-border text-white hover:bg-tg-dark-surfaceHover transition-colors cursor-pointer"
                >
                  Create Folder
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
