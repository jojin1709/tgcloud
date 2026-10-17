import React, { useState } from 'react';
import {
  FileText,
  FileArchive,
  FileImage,
  FileAudio,
  FileVideo,
  File,
  Star,
  Download,
  MoreVertical,
  Trash2,
  Edit2,
  ExternalLink,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react';
import { TGFile } from '@tgcloud/types';
import { formatBytes, formatDate, getFileCategory } from '../lib/utils';
import { useFiles } from '../context/FilesContext';

interface FileCardProps {
  file: TGFile;
  onPreview: (file: TGFile) => void;
  onDownload: (file: TGFile) => void;
  onToggleStar: (id: string) => void;
  onRename: (file: TGFile) => void;
  onMoveToTrash: (id: string) => void;
  onRestoreFromTrash?: (id: string) => void;
  onDeletePermanent?: (id: string) => void;
  isTrashView?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onPreview,
  onDownload,
  onToggleStar,
  onRename,
  onMoveToTrash,
  onRestoreFromTrash,
  onDeletePermanent,
  isTrashView,
}) => {
  const { selectedIds, toggleSelect } = useFiles();
  const [menuOpen, setMenuOpen] = useState(false);
  const category = getFileCategory(file.mimeType, file.name);
  const isSelected = selectedIds.has(file.id);

  const getIcon = () => {
    switch (category) {
      case 'images':
        return <FileImage className="w-8 h-8 text-emerald-400" />;
      case 'videos':
        return <FileVideo className="w-8 h-8 text-rose-400" />;
      case 'audio':
        return <FileAudio className="w-8 h-8 text-amber-400" />;
      case 'documents':
        return <FileText className="w-8 h-8 text-tg-blue-400" />;
      case 'archives':
        return <FileArchive className="w-8 h-8 text-purple-400" />;
      default:
        return <File className="w-8 h-8 text-slate-400" />;
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'tg-file', id: file.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable={!isTrashView}
      onDragStart={handleDragStart}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || selectedIds.size > 0) {
          e.stopPropagation();
          toggleSelect(file.id);
        } else {
          onPreview(file);
        }
      }}
      className={`group relative p-3 sm:p-3.5 rounded-2xl bg-tg-dark-surface border transition-all duration-200 card-hover flex flex-col justify-between cursor-pointer active:scale-[0.99] ${
        isSelected
          ? 'border-tg-blue-500 bg-tg-blue-500/10 shadow-lg shadow-tg-blue-500/15'
          : 'border-tg-dark-border hover:border-tg-blue-500/40 hover:bg-tg-dark-surfaceHover/80'
      }`}
    >
      <div>
        {/* Card Top: Category Icon & Actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {!isTrashView && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(file.id);
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
            )}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-tg-dark-bg/80 border border-tg-dark-border flex items-center justify-center group-hover:scale-105 transition-all shrink-0">
              {getIcon()}
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            {!isTrashView && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(file.id);
                }}
                className={`p-2 sm:p-1.5 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
                  file.isStarred
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-tg-dark-muted/40 hover:text-tg-dark-muted group-hover:text-tg-dark-muted'
                }`}
                title={file.isStarred ? 'Unstar' : 'Star file'}
                aria-label="Star file"
              >
                <Star className={`w-4 h-4 ${file.isStarred ? 'fill-current' : ''}`} />
              </button>
            )}

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-2 sm:p-1.5 rounded-xl text-tg-dark-muted hover:text-white hover:bg-tg-dark-bg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="More actions"
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
                  <div className="absolute right-0 top-9 w-44 py-1.5 bg-tg-dark-surface border border-tg-dark-border rounded-2xl shadow-2xl z-30 text-xs">
                    {!isTrashView ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(false);
                            onPreview(file);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-tg-blue-400" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(false);
                            onDownload(file);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(false);
                            onRename(file);
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
                            onMoveToTrash(file.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Move to Trash</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {onRestoreFromTrash && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpen(false);
                              onRestoreFromTrash(file.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-tg-blue-400 hover:bg-tg-dark-surfaceHover transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Restore File</span>
                          </button>
                        )}
                        {onDeletePermanent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpen(false);
                              onDeletePermanent(file.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Forever</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* File Information */}
        <div className="mt-2.5 sm:mt-3" onClick={() => onPreview(file)}>
          <h3 className="font-medium text-xs sm:text-sm text-white truncate cursor-pointer" title={file.name}>
            {file.name}
          </h3>
          <p className="text-[10px] sm:text-[11px] text-tg-dark-muted mt-1 flex items-center justify-between gap-2 overflow-hidden">
            <span className="shrink-0 font-medium">{formatBytes(file.size)}</span>
            <span className="truncate whitespace-nowrap text-right">{formatDate(file.modifiedAt)}</span>
          </p>
        </div>
      </div>

      {/* Cloud Sync Status Pill */}
      <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-tg-dark-border/60 flex items-center justify-between text-[10px] sm:text-[11px] gap-1">
        <span className="text-tg-blue-400/90 font-medium flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">Telegram Synced</span>
        </span>
        {!isTrashView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            className="text-tg-dark-muted hover:text-white p-2 sm:p-1.5 rounded-xl hover:bg-tg-dark-surfaceHover transition-colors shrink-0 min-w-[34px] min-h-[34px] flex items-center justify-center active:scale-95"
            title="Download file"
            aria-label="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
