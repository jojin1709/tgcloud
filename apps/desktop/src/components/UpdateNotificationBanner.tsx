import React, { useState } from 'react';
import { X, ExternalLink, Sparkles, Smartphone, Monitor } from 'lucide-react';
import { UpdateInfo, triggerUpdateDownload } from '../lib/updater';

interface UpdateNotificationBannerProps {
  updateInfo: UpdateInfo | null;
  onDismiss: () => void;
}

export const UpdateNotificationBanner: React.FC<UpdateNotificationBannerProps> = ({
  updateInfo,
  onDismiss,
}) => {
  const [showNotes, setShowNotes] = useState(false);

  if (!updateInfo || !updateInfo.updateAvailable) return null;

  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const targetDownloadUrl = isAndroid
    ? (updateInfo.androidApkUrl || updateInfo.htmlUrl)
    : (updateInfo.windowsSetupUrl || updateInfo.windowsExeUrl || updateInfo.htmlUrl);

  const downloadLabel = isAndroid ? 'Download APK' : 'Update TGCloud';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-xl animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-tg-dark-surface via-tg-dark-surface to-tg-blue-950/40 border border-tg-blue-500/50 shadow-2xl shadow-tg-blue-500/20 p-4">
        {/* Glowing Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-tg-blue-500 via-sky-400 to-emerald-400" />

        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-tg-blue-500/20 border border-tg-blue-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-tg-blue-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-white">Update Available</span>
              <span className="px-2 py-0.5 rounded-full bg-tg-blue-500/20 border border-tg-blue-500/40 text-tg-blue-300 text-xs font-semibold">
                v{updateInfo.latestVersion}
              </span>
              <span className="text-[11px] text-tg-dark-muted">
                Current: v{updateInfo.currentVersion}
              </span>
            </div>

            <p className="text-xs text-tg-dark-muted mt-1 truncate">
              {updateInfo.releaseName || 'A new release is ready with updates and improvements.'}
            </p>

            {showNotes && updateInfo.releaseNotes && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-tg-dark-bg/80 border border-tg-dark-border text-xs text-tg-dark-muted max-h-32 overflow-y-auto whitespace-pre-wrap">
                {updateInfo.releaseNotes}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                onClick={() => triggerUpdateDownload(targetDownloadUrl)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 active:scale-95 text-white text-xs font-semibold shadow-md shadow-tg-blue-500/30 transition-all cursor-pointer"
              >
                {isAndroid ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                <span>{downloadLabel}</span>
              </button>

              {updateInfo.releaseNotes && (
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="px-2.5 py-1.5 rounded-xl bg-tg-dark-bg hover:bg-tg-dark-surface text-tg-dark-muted hover:text-white text-xs border border-tg-dark-border transition-colors"
                >
                  {showNotes ? 'Hide Details' : 'What\'s New'}
                </button>
              )}

              <a
                href={updateInfo.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-tg-dark-muted hover:text-white text-xs transition-colors"
              >
                <span>GitHub Release</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-tg-dark-muted hover:text-white hover:bg-tg-dark-surface transition-colors shrink-0"
            aria-label="Dismiss update notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
