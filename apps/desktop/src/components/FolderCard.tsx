import React, { useState } from 'react';
import { Folder, MoreVertical, Edit2, Trash2, FolderOpen } from 'lucide-react';
import { TGFolder } from '@tgcloud/types';
import { formatBytes } from '../lib/utils';

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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onClick={() => onOpen(folder.id, folder.name)}
      className="group relative p-3 sm:p-4 rounded-2xl bg-tg-dark-surface border border-tg-dark-border hover:border-tg-blue-500/40 hover:bg-tg-dark-surfaceHover/80 transition-all duration-200 card-hover cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-tg-blue-500/10 border border-tg-blue-500/20 text-tg-blue-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-tg-blue-500/20 transition-all shrink-0"
        >
          <Folder className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
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
