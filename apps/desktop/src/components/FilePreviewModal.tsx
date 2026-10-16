import React from 'react';
import { X, Download, File, Calendar, HardDrive, Hash, Shield } from 'lucide-react';
import { TGFile } from '@tgcloud/types';
import { formatBytes, formatDate, getFileCategory } from '../lib/utils';
import { useTransfers } from '../context/TransfersContext';

interface FilePreviewModalProps {
  file: TGFile | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const { startDownload } = useTransfers();
  if (!file) return null;

  const category = getFileCategory(file.mimeType, file.name);

  const handleDownload = () => {
    const dest = `C:\\Users\\User\\Downloads\\${file.name}`;
    startDownload(file.id, dest);
  };

  const isImage = category === 'images';
  const isVideo = category === 'videos';
  const isAudio = category === 'audio';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-tg-dark-surface border border-tg-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tg-dark-border bg-tg-dark-bg/60">
          <div className="flex items-center gap-2.5 truncate max-w-lg">
            <span className="font-semibold text-white truncate text-base" title={file.name}>
              {file.name}
            </span>
            <span className="text-xs bg-tg-blue-500/10 text-tg-blue-400 border border-tg-blue-500/20 px-2 py-0.5 rounded-full shrink-0">
              {formatBytes(file.size)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 text-white text-xs font-semibold shadow-md shadow-tg-blue-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-tg-dark-bg/40 min-h-[300px]">
          {isImage ? (
            <div className="flex flex-col items-center justify-center">
              {file.thumbnailPath ? (
                <img
                  src={file.thumbnailPath}
                  alt={file.name}
                  className="max-h-[50vh] max-w-full rounded-xl object-contain shadow-lg"
                />
              ) : (
                <div className="text-center p-8 border border-tg-dark-border rounded-xl bg-tg-dark-surface">
                  <File className="w-16 h-16 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-tg-dark-muted mt-1">Image Preview cached on Telegram Cloud</p>
                </div>
              )}
            </div>
          ) : isAudio ? (
            <div className="w-full max-w-md p-6 bg-tg-dark-surface border border-tg-dark-border rounded-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <File className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-white truncate">{file.name}</h4>
              <p className="text-xs text-tg-dark-muted mt-1 mb-4">{formatBytes(file.size)}</p>
              <audio controls className="w-full">
                <source src="" type={file.mimeType} />
                Your browser does not support audio playback.
              </audio>
            </div>
          ) : isVideo ? (
            <div className="w-full max-w-lg p-6 bg-tg-dark-surface border border-tg-dark-border rounded-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-rose-400/10 text-rose-400 flex items-center justify-center mx-auto mb-3">
                <File className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-white truncate">{file.name}</h4>
              <p className="text-xs text-tg-dark-muted mt-1 mb-4">Video format • {formatBytes(file.size)}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 text-white text-xs font-semibold"
              >
                Download to Play Locally
              </button>
            </div>
          ) : (
            <div className="text-center p-8 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-tg-dark-surface border border-tg-dark-border flex items-center justify-center text-tg-dark-muted mx-auto mb-4">
                <File className="w-8 h-8 text-tg-blue-400" />
              </div>
              <h4 className="text-base font-semibold text-white">File cannot be previewed</h4>
              <p className="text-xs text-tg-dark-muted mt-1 mb-6">
                This file format ({file.mimeType || 'unknown'}) cannot be previewed in the embedded viewer. Download the file to view it on your system.
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 text-white text-sm font-semibold shadow-md shadow-tg-blue-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          )}
        </div>

        {/* Metadata Details Footer */}
        <div className="p-4 border-t border-tg-dark-border bg-tg-dark-surface grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-tg-dark-muted flex items-center gap-1.5 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-tg-blue-400" />
              File Size
            </span>
            <span className="font-semibold text-white">{formatBytes(file.size)}</span>
          </div>
          <div>
            <span className="text-tg-dark-muted flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-tg-blue-400" />
              Uploaded
            </span>
            <span className="font-semibold text-white">{formatDate(file.createdAt)}</span>
          </div>
          <div>
            <span className="text-tg-dark-muted flex items-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Storage Backend
            </span>
            <span className="font-semibold text-white">Telegram Vault</span>
          </div>
          <div>
            <span className="text-tg-dark-muted flex items-center gap-1.5 mb-1">
              <Hash className="w-3.5 h-3.5 text-purple-400" />
              Telegram Msg ID
            </span>
            <span className="font-mono text-white">#{file.telegramMessageId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
