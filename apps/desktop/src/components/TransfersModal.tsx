import React from 'react';
import {
  X,
  Upload,
  Download,
  Pause,
  Play,
  XCircle,
  CheckCircle,
  Trash2,
  Activity,
} from 'lucide-react';
import { useTransfers } from '../context/TransfersContext';
import { formatBytes, formatEta, formatSpeed } from '../lib/utils';
import { TGTransfer } from '@tgcloud/types';

export const TransfersModal: React.FC = () => {
  const {
    transfers,
    isTransfersOpen,
    setIsTransfersOpen,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
    clearCompleted,
  } = useTransfers();

  if (!isTransfersOpen) return null;

  const uploads = transfers.filter((t) => t.type === 'upload' && t.status !== 'completed' && t.status !== 'cancelled');
  const downloads = transfers.filter((t) => t.type === 'download' && t.status !== 'completed' && t.status !== 'cancelled');
  const completed = transfers.filter((t) => t.status === 'completed' || t.status === 'cancelled');

  const renderTransferItem = (t: TGTransfer) => {
    const isCompleted = t.status === 'completed';
    const isFailed = t.status === 'failed';
    const isPaused = t.status === 'paused';
    const isActive = t.status === 'active';

    return (
      <div
        key={t.id}
        className="p-3.5 rounded-xl bg-tg-dark-bg/60 border border-tg-dark-border flex flex-col gap-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate max-w-md">
            {t.type === 'upload' ? (
              <div className="w-8 h-8 rounded-lg bg-tg-blue-500/10 text-tg-blue-400 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
            )}
            <div className="truncate">
              <h4 className="text-sm font-semibold text-white truncate" title={t.fileName}>
                {t.fileName}
              </h4>
              <p className="text-[11px] text-tg-dark-muted">
                {formatBytes(t.bytesTransferred)} / {formatBytes(t.bytesTotal)}
                {isActive && (
                  <span className="ml-2 text-tg-blue-400 font-mono">
                    • {formatSpeed(t.speedBytesPerSec)} • ETA: {formatEta(t.etaSeconds)}
                  </span>
                )}
                {isPaused && <span className="ml-2 text-amber-400 font-semibold">• Paused</span>}
                {isFailed && <span className="ml-2 text-red-400 font-semibold">• Error: {t.error || 'Failed'}</span>}
                {isCompleted && <span className="ml-2 text-emerald-400 font-semibold">• Finished</span>}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isActive && (
              <button
                onClick={() => pauseTransfer(t.id)}
                className="p-1.5 rounded-lg text-tg-dark-muted hover:text-white hover:bg-tg-dark-surface transition-colors"
                title="Pause transfer"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            {isPaused && (
              <button
                onClick={() => resumeTransfer(t.id)}
                className="p-1.5 rounded-lg text-tg-blue-400 hover:text-white hover:bg-tg-blue-500 transition-colors"
                title="Resume transfer"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            {!isCompleted && (
              <button
                onClick={() => cancelTransfer(t.id)}
                className="p-1.5 rounded-lg text-tg-dark-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Cancel transfer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
            {isCompleted && (
              <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-tg-dark-border h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-emerald-500'
                : isFailed
                ? 'bg-red-500'
                : isPaused
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-tg-blue-600 to-tg-blue-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, t.progress))}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div className="fixed inset-0" onClick={() => setIsTransfersOpen(false)} />

      <div className="relative w-full max-w-2xl bg-tg-dark-surface border border-tg-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-tg-dark-border bg-tg-dark-bg/60">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-tg-blue-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">Transfers Manager</h2>
          </div>

          <div className="flex items-center gap-2">
            {completed.length > 0 && (
              <button
                onClick={clearCompleted}
                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-tg-dark-bg border border-tg-dark-border text-xs text-tg-dark-muted hover:text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Completed</span>
              </button>
            )}
            <button
              onClick={() => setIsTransfersOpen(false)}
              className="p-1.5 rounded-xl text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Transfers Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Active Uploads */}
          {uploads.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-tg-dark-muted mb-3 flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-tg-blue-400" />
                Uploading ({uploads.length})
              </h3>
              <div className="space-y-2.5">{uploads.map(renderTransferItem)}</div>
            </div>
          )}

          {/* Active Downloads */}
          {downloads.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-tg-dark-muted mb-3 flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                Downloading ({downloads.length})
              </h3>
              <div className="space-y-2.5">{downloads.map(renderTransferItem)}</div>
            </div>
          )}

          {/* Completed History */}
          {completed.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-tg-dark-muted mb-3 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Completed ({completed.length})
              </h3>
              <div className="space-y-2.5">{completed.map(renderTransferItem)}</div>
            </div>
          )}

          {transfers.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-tg-dark-muted/40 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-white">No active transfers</h4>
              <p className="text-xs text-tg-dark-muted mt-1">
                Upload or download files to track progress, transfer speeds, and ETAs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
