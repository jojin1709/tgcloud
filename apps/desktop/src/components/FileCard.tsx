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
} from 'lucide-react';
import { TGFile } from '@tgcloud/types';
import { formatBytes, formatDate, getFileCategory } from '../lib/utils';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const category = getFileCategory(file.mimeType, file.name);

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

  return (
    <div
      onDoubleClick={() => onPreview(file)}
      className="group relative p-3.5 rounded-2xl bg-tg-dark-surface border border-tg-dark-border hover:border-tg-blue-500/40 hover:bg-tg-dark-surfaceHover/80 transition-all duration-200 card-hover flex flex-col justify-between"
    >
      <div>
        {/* Card Top: Category Icon & Actions */}
        <div className="flex items-start justify-between">
          <div
            onClick={() => onPreview(file)}
            className="w-12 h-12 rounded-xl bg-tg-dark-bg/80 border border-tg-dark-border flex items-center justify-center group-hover:scale-105 transition-all cursor-pointer"
          >
            {getIcon()}
          </div>

          <div className="flex items-center gap-1">
            {!isTrashView && (
              <button
                onClick={() => onToggleStar(file.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  file.isStarred
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-tg-dark-muted/40 hover:text-tg-dark-muted group-hover:text-tg-dark-muted'
                }`}
                title={file.isStarred ? 'Unstar' : 'Star file'}
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
                className="p-1.5 rounded-lg text-tg-dark-muted hover:text-white hover:bg-tg-dark-bg transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                  />
                  <div className="absolute right-0 top-7 w-40 py-1 bg-tg-dark-bg border border-tg-dark-border rounded-xl shadow-xl z-20 text-xs">
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
        <div className="mt-3" onClick={() => onPreview(file)}>
          <h3 className="font-medium text-sm text-white truncate cursor-pointer" title={file.name}>
            {file.name}
          </h3>
          <p className="text-[11px] text-tg-dark-muted mt-0.5 flex items-center justify-between">
            <span>{formatBytes(file.size)}</span>
            <span>{formatDate(file.modifiedAt)}</span>
          </p>
        </div>
      </div>

      {/* Cloud Sync Status Pill */}
      <div className="mt-3 pt-2.5 border-t border-tg-dark-border/60 flex items-center justify-between text-[11px]">
        <span className="text-tg-blue-400/90 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Telegram Synced
        </span>
        {!isTrashView && (
          <button
            onClick={() => onDownload(file)}
            className="text-tg-dark-muted hover:text-white p-1 rounded-md hover:bg-tg-dark-surfaceHover transition-colors"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
