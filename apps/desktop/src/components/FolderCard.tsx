import React, { useState } from 'react';
import { Folder, MoreVertical, Edit2, Trash2, FolderOpen, CheckSquare, Square, CornerDownRight } from 'lucide-react';
import { TGFolder } from '@tgcloud/types';
import { formatBytes } from '../lib/utils';
import { useFiles } from '../context/FilesContext';

interface FolderCardProps {
  folder: TGFolder;
  onOpen: (id: string, name: string) => void;
  onRename: (id: string, currentName: string) => void;
  onDelete: (id: string) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onOpen,
  onRename,
  onDelete,
}) => {
  const { selectedIds, toggleSelect, moveFile } = useFiles();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragOverTarget, setIsDragOverTarget] = useState(false);
  const isSelected = selectedIds.has(folder.id);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverTarget(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverTarget(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverTarget(false);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.type === 'tg-file' && data.id) {
          await moveFile(data.id, folder.id);
        }
      }
    } catch (err) {
      console.warn('Failed to parse dropped data:', err);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || selectedIds.size > 0) {
          e.stopPropagation();
          toggleSelect(folder.id);
        } else {
          onOpen(folder.id, folder.name);
        }
      }}
      className={`group relative p-3 sm:p-4 rounded-2xl bg-tg-dark-surface border transition-all duration-200 card-hover cursor-pointer active:scale-[0.98] ${
        isDragOverTarget
          ? 'border-tg-blue-400 bg-tg-blue-500/20 ring-4 ring-tg-blue-500/30 scale-105'
          : isSelected
          ? 'border-tg-blue-500 bg-tg-blue-500/10 shadow-lg shadow-tg-blue-500/15'
          : 'border-tg-dark-border hover:border-tg-blue-500/40 hover:bg-tg-dark-surfaceHover/80'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSelect(folder.id);
            }}
            className={`p-1 rounded-lg transition-all ${
              isSelected
                ? 'opacity-100 text-tg-blue-400'
                : selectedIds.size > 0
                ? 'opacity-70 hover:opacity-100 text-tg-dark-muted'
                : 'opacity-0 group-hover:opacity-100 text-tg-dark-muted hover:text-white'
            }`}
            title={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-tg-blue-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all shrink-0 ${
              isDragOverTarget
                ? 'bg-tg-blue-500 text-white shadow-lg shadow-tg-blue-500/50'
                : 'bg-tg-blue-500/10 border border-tg-blue-500/20 text-tg-blue-400 group-hover:bg-tg-blue-500/20'
            }`}
          >
            {isDragOverTarget ? (
              <CornerDownRight className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
            ) : (
              <Folder className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-2 sm:p-1.5 rounded-xl text-tg-dark-muted hover:text-white hover:bg-tg-dark-bg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Folder actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-9 w-40 py-1.5 bg-tg-dark-surface border border-tg-dark-border rounded-2xl shadow-2xl z-30 text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onOpen(folder.id, folder.name);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-tg-blue-400" />
                  <span>Open</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onRename(folder.id, folder.name);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(folder.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3.5" onClick={() => onOpen(folder.id, folder.name)}>
        <h3 className="font-semibold text-sm text-white truncate" title={folder.name}>
          {folder.name}
        </h3>
        <p className="text-xs text-tg-dark-muted mt-0.5">
          {folder.fileCount || 0} items • {formatBytes(folder.totalSize || 0)}
        </p>
      </div>
    </div>
  );
};
