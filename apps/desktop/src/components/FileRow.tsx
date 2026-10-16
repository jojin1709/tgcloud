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
  MoreHorizontal,
  Trash2,
  Edit2,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { TGFile } from '@tgcloud/types';
import { formatBytes, formatDate, getFileCategory } from '../lib/utils';

interface FileRowProps {
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

export const FileRow: React.FC<FileRowProps> = ({
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
        return <FileImage className="w-4 h-4 text-emerald-400" />;
      case 'videos':
        return <FileVideo className="w-4 h-4 text-rose-400" />;
      case 'audio':
        return <FileAudio className="w-4 h-4 text-amber-400" />;
      case 'documents':
        return <FileText className="w-4 h-4 text-tg-blue-400" />;
      case 'archives':
        return <FileArchive className="w-4 h-4 text-purple-400" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <tr
      onDoubleClick={() => onPreview(file)}
      className="group border-b border-tg-dark-border/50 hover:bg-tg-dark-surfaceHover/60 transition-colors text-sm cursor-pointer select-none"
    >
      <td className="py-3 px-3 sm:px-4 flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-tg-dark-bg/80 border border-tg-dark-border flex items-center justify-center shrink-0">
          {getIcon()}
        </div>
        <span className="font-medium text-white truncate max-w-xs sm:max-w-md group-hover:text-tg-blue-300 transition-colors" title={file.name}>
          {file.name}
        </span>
      </td>

      <td className="hidden md:table-cell py-3 px-3 sm:px-4 text-tg-dark-muted text-xs whitespace-nowrap">
        {formatDate(file.modifiedAt)}
      </td>

      <td className="py-3 px-3 sm:px-4 text-tg-dark-muted text-xs whitespace-nowrap">
        {formatBytes(file.size)}
      </td>

      <td className="hidden sm:table-cell py-3 px-3 sm:px-4 text-xs whitespace-nowrap">
        <span className="text-emerald-400/90 flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Synced
        </span>
      </td>

      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {!isTrashView && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(file.id);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  file.isStarred
                    ? 'text-amber-400'
                    : 'text-tg-dark-muted hover:text-white'
                }`}
                title={file.isStarred ? 'Unstar' : 'Star file'}
              >
                <Star className={`w-4 h-4 ${file.isStarred ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(file);
                }}
                className="p-1.5 rounded-lg text-tg-dark-muted hover:text-white hover:bg-tg-dark-surface transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-lg text-tg-dark-muted hover:text-white hover:bg-tg-dark-surface transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
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
                <div className="absolute right-0 top-7 w-36 py-1 bg-tg-dark-bg border border-tg-dark-border rounded-xl shadow-xl z-20 text-xs">
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
                        <span>Delete</span>
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
                          <span>Restore</span>
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
                          <span>Delete Permanently</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};
