import React, { useState, useEffect } from 'react';
import { X, Download, File, Calendar, HardDrive, Hash, Shield, Play, Pause, Copy, Check, FileCode, Music } from 'lucide-react';
import { TGFile } from '@tgcloud/types';
import { formatBytes, formatDate, getFileCategory } from '../lib/utils';
import { useTransfers } from '../context/TransfersContext';
import { api, isRunningInTauri } from '../lib/api';

interface FilePreviewModalProps {
  file: TGFile | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const { startDownload } = useTransfers();
  if (!file) return null;

  const category = getFileCategory(file.mimeType, file.name);

  const handleDownload = async () => {
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

  const isImage = category === 'images';
  const isVideo = category === 'videos';
  const isAudio = category === 'audio';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isCode = ['js', 'jsx', 'ts', 'tsx', 'py', 'rs', 'json', 'html', 'css', 'md', 'txt', 'c', 'cpp', 'sh', 'xml', 'yml', 'yaml', 'toml', 'sql'].includes(ext);
  const isPdf = ext === 'pdf' || file.mimeType.includes('pdf');

  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(file.thumbnailPath || null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    if (file && (isImage || isPdf || isAudio || isVideo)) {
      setLoadingPreview(true);
      api.getFilePreviewBytes(file.id)
        .then((bytes) => {
          if (active && bytes && bytes.length > 0) {
            const blob = new Blob([bytes.buffer as ArrayBuffer], { type: file.mimeType || 'application/octet-stream' });
            createdUrl = URL.createObjectURL(blob);
            setPreviewBlobUrl(createdUrl);
          }
        })
        .finally(() => {
          if (active) setLoadingPreview(false);
        });
    }

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [file.id, isImage, isPdf, isAudio, isVideo, file.mimeType]);

  const handleCopySample = () => {
    navigator.clipboard.writeText(`// TGCloud Vault File: ${file.name}\n// Size: ${formatBytes(file.size)}\n// File ID: ${file.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-tg-dark-surface border border-tg-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-tg-dark-border bg-tg-dark-bg/60">
          <div className="flex items-center gap-2 sm:gap-2.5 truncate max-w-xs sm:max-w-lg min-w-0">
            <span className="font-semibold text-white truncate text-sm sm:text-base" title={file.name}>
              {file.name}
            </span>
            <span className="text-[11px] sm:text-xs bg-tg-blue-500/10 text-tg-blue-400 border border-tg-blue-500/20 px-2 py-0.5 rounded-full shrink-0">
              {formatBytes(file.size)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 text-white text-xs font-semibold shadow-md shadow-tg-blue-500/20 transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-tg-dark-bg/40 min-h-[320px]">
          {loadingPreview && (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-tg-dark-muted mb-4">
              <div className="w-8 h-8 border-2 border-tg-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Streaming preview from Telegram Cloud...</span>
            </div>
          )}

          {isImage ? (
            <div className="flex flex-col items-center justify-center">
              {previewBlobUrl ? (
                <img
                  src={previewBlobUrl}
                  alt={file.name}
                  className="max-h-[52vh] max-w-full rounded-xl object-contain shadow-2xl border border-tg-dark-border"
                />
              ) : (
                <div className="text-center p-8 border border-tg-dark-border rounded-xl bg-tg-dark-surface">
                  <File className="w-16 h-16 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-tg-dark-muted mt-1">Image Preview cached on Telegram Cloud</p>
                </div>
              )}
            </div>
          ) : isCode ? (
            <div className="w-full h-full max-h-[50vh] flex flex-col rounded-xl bg-tg-dark-bg border border-tg-dark-border overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 bg-tg-dark-surface border-b border-tg-dark-border text-xs">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-tg-blue-400" />
                  <span className="font-mono text-white text-xs">{file.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-tg-dark-bg text-[10px] uppercase font-mono text-tg-dark-muted">
                    {ext}
                  </span>
                </div>
                <button
                  onClick={handleCopySample}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-tg-dark-bg hover:bg-tg-dark-border text-tg-dark-muted hover:text-white transition-colors text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-4 font-mono text-xs overflow-auto flex-1 text-slate-300 leading-relaxed bg-[#0b0f17]">
                <div className="text-tg-dark-muted/60 mb-2">// TGCloud Sovereign Vault File: {file.name}</div>
                <div className="text-tg-dark-muted/60 mb-3">// Encrypted & Streamed over Telegram MTProto</div>
                <div className="text-emerald-400">export const <span className="text-blue-400">vaultItem</span> = &#123;</div>
                <div className="pl-4 text-slate-300">id: <span className="text-amber-300">"{file.id}"</span>,</div>
                <div className="pl-4 text-slate-300">name: <span className="text-amber-300">"{file.name}"</span>,</div>
                <div className="pl-4 text-slate-300">sizeBytes: <span className="text-purple-300">{file.size}</span>,</div>
                <div className="pl-4 text-slate-300">status: <span className="text-emerald-300">"synced"</span>,</div>
                <div className="pl-4 text-slate-300">telegramMessageId: <span className="text-purple-300">{file.telegramMessageId}</span></div>
                <div className="text-emerald-400">&#125;;</div>
              </div>
            </div>
          ) : isAudio ? (
            <div className="w-full max-w-md p-6 bg-tg-dark-surface border border-tg-dark-border rounded-2xl text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Music className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-semibold text-white truncate text-base">{file.name}</h4>
                <p className="text-xs text-tg-dark-muted mt-0.5">High-Fidelity Audio • {formatBytes(file.size)}</p>
              </div>

              {previewBlobUrl && (
                <audio src={previewBlobUrl} autoPlay={isPlaying} />
              )}

              {/* Animated Waveform Visualizer */}
              <div className="flex items-center justify-center gap-1 h-12 px-4 py-2 bg-tg-dark-bg/60 rounded-xl border border-tg-dark-border/60">
                {[18, 32, 24, 45, 28, 40, 20, 36, 48, 22, 38, 26, 44, 30, 24, 42, 16, 34].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: isPlaying ? `${Math.max(8, (h * (0.6 + Math.random() * 0.8)))}px` : `${h * 0.4}px` }}
                    className={`w-1 rounded-full transition-all duration-150 ${isPlaying ? 'bg-amber-400' : 'bg-tg-dark-border'}`}
                  />
                ))}
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
              </div>
            </div>
          ) : isPdf ? (
            <div className="w-full h-full max-h-[55vh] flex flex-col rounded-xl overflow-hidden">
              {previewBlobUrl ? (
                <iframe
                  src={previewBlobUrl}
                  title={file.name}
                  className="w-full h-[52vh] rounded-xl border border-tg-dark-border bg-slate-900"
                />
              ) : (
                <div className="w-full max-w-md p-6 bg-tg-dark-surface border border-tg-dark-border rounded-2xl text-center space-y-3 mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                    <File className="w-8 h-8" />
                  </div>
                  <h4 className="font-semibold text-white truncate text-base">{file.name}</h4>
                  <p className="text-xs text-tg-dark-muted">PDF Document • {formatBytes(file.size)}</p>
                  <button
                    onClick={handleDownload}
                    className="w-full py-2.5 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 text-white text-xs font-semibold shadow-md shadow-tg-blue-500/20 transition-all cursor-pointer"
                  >
                    Download to Open Locally
                  </button>
                </div>
              )}
            </div>
          ) : isVideo ? (
            <div className="w-full max-w-lg p-4 bg-tg-dark-surface border border-tg-dark-border rounded-2xl text-center">
              {previewBlobUrl ? (
                <video
                  src={previewBlobUrl}
                  controls
                  className="max-h-[50vh] max-w-full rounded-xl shadow-2xl border border-tg-dark-border mx-auto"
                />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-rose-400/10 text-rose-400 flex items-center justify-center mx-auto mb-3">
                    <File className="w-8 h-8" />
                  </div>
                  <h4 className="font-semibold text-white truncate">{file.name}</h4>
                  <p className="text-xs text-tg-dark-muted mt-1 mb-4">Video format • {formatBytes(file.size)}</p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Download to Play Locally
                  </button>
                </>
              )}
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 text-white text-sm font-semibold shadow-md shadow-tg-blue-500/20 cursor-pointer"
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
