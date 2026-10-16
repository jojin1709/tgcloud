import React, { useState } from 'react';
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
import { TGFile } from '@tgcloud/types';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { FileRow } from './FileRow';

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
  } = useFiles();

  const { startDownload, startUpload } = useTransfers();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDownload = async (file: TGFile) => {
    // Standard download target path
    const downloadPath = `C:\\Users\\User\\Downloads\\${file.name}`;
    await startDownload(file.id, downloadPath);
  };

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
      const filePath = (file as any).path || file.name;
      await startUpload(filePath, currentFolderId);
    }
  };

  const isTrash = navSection === 'trash';
  const isStarred = navSection === 'starred';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex-1 overflow-y-auto p-6 flex flex-col gap-6 select-none ${
        isDragOver ? 'bg-tg-blue-500/5 ring-2 ring-inset ring-tg-blue-500/50' : ''
      }`}
    >
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm">
          {navSection === 'files' ? (
            breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id || 'root'}>
                {idx > 0 && <ChevronRight className="w-4 h-4 text-tg-dark-muted/60" />}
                <button
                  onClick={() => navigateToBreadcrumb(idx)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
                    idx === breadcrumbs.length - 1
                      ? 'text-white font-semibold bg-tg-dark-surface'
                      : 'text-tg-dark-muted hover:text-white'
                  }`}
                >
                  {idx === 0 && <Home className="w-3.5 h-3.5" />}
                  <span>{crumb.name}</span>
                </button>
              </React.Fragment>
            ))
          ) : (
            <div className="flex items-center gap-2">
              {isStarred && <Star className="w-5 h-5 text-amber-400 fill-current" />}
              {isTrash && <Trash2 className="w-5 h-5 text-red-400" />}
              <h1 className="text-lg font-bold text-white capitalize">{navSection} Files</h1>
            </div>
          )}
        </div>
      </div>

      {/* Folders Section (Only shown in My Files) */}
      {navSection === 'files' && folders.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-tg-dark-muted mb-3 flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5 text-tg-blue-400" />
            Folders ({folders.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onOpen={(id, name) => navigateToFolder(id, name)}
                onRename={(id, name) => onRenameFolder(id, name)}
                onDelete={(id) => deleteFolder(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="flex-1 flex flex-col">
        {files.length > 0 ? (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-tg-dark-muted mb-3">
              Files ({files.length})
            </h2>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
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
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-tg-dark-border bg-tg-dark-surface overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-tg-dark-border/80 text-[11px] font-semibold text-tg-dark-muted uppercase tracking-wider bg-tg-dark-bg/40">
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Date Modified</th>
                      <th className="py-2.5 px-4">Size</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
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
                  onClick={onNewFolder}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-tg-dark-surface border border-tg-dark-border text-white hover:bg-tg-dark-surfaceHover transition-colors"
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
