import React, { useState } from 'react';
import { formatBytes, getFileCategory } from '../lib/utils';
import { useFiles } from '../context/FilesContext';

export interface CategoryBreakdown {
  id: string;
  label: string;
  bytes: number;
  count: number;
  percent: number;
  colorClass: string;
  bgHex: string;
}

export const StorageBreakdownBar: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { files, stats } = useFiles();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const totalBytes = stats?.totalBytesUsed || files.reduce((acc, f) => acc + (f.size || 0), 0);

  const categories: Record<string, { label: string; colorClass: string; bgHex: string }> = {
    images: { label: 'Photos', colorClass: 'bg-emerald-400', bgHex: '#34d399' },
    videos: { label: 'Videos', colorClass: 'bg-rose-400', bgHex: '#fb7185' },
    documents: { label: 'Docs', colorClass: 'bg-tg-blue-400', bgHex: '#38bdf8' },
    audio: { label: 'Audio', colorClass: 'bg-amber-400', bgHex: '#fbbf24' },
    archives: { label: 'Archives', colorClass: 'bg-purple-400', bgHex: '#c084fc' },
    other: { label: 'Other', colorClass: 'bg-slate-400', bgHex: '#94a3b8' },
  };

  const buckets: Record<string, { bytes: number; count: number }> = {
    images: { bytes: 0, count: 0 },
    videos: { bytes: 0, count: 0 },
    documents: { bytes: 0, count: 0 },
    audio: { bytes: 0, count: 0 },
    archives: { bytes: 0, count: 0 },
    other: { bytes: 0, count: 0 },
  };

  for (const file of files) {
    if (file.isTrash) continue;
    const cat = getFileCategory(file.mimeType, file.name);
    const key = buckets[cat] ? cat : 'other';
    buckets[key].bytes += file.size || 0;
    buckets[key].count += 1;
  }

  const breakdown: CategoryBreakdown[] = Object.keys(buckets).map((key) => {
    const bytes = buckets[key].bytes;
    const count = buckets[key].count;
    const percent = totalBytes > 0 ? (bytes / totalBytes) * 100 : 0;
    return {
      id: key,
      label: categories[key].label,
      bytes,
      count,
      percent,
      colorClass: categories[key].colorClass,
      bgHex: categories[key].bgHex,
    };
  }).filter((b) => b.bytes > 0 || b.count > 0);

  return (
    <div className="w-full space-y-2">
      {/* Segmented Multi-Color Bar */}
      <div className={`w-full bg-tg-dark-border/80 ${compact ? 'h-2' : 'h-3'} rounded-full overflow-hidden flex`}>
        {totalBytes === 0 || breakdown.length === 0 ? (
          <div className="w-full h-full bg-tg-dark-border/40 rounded-full" />
        ) : (
          breakdown.map((item) => (
            <div
              key={item.id}
              style={{ width: `${Math.max(2, item.percent)}%` }}
              onMouseEnter={() => setActiveCategory(item.id)}
              onMouseLeave={() => setActiveCategory(null)}
              className={`${item.colorClass} h-full transition-all duration-300 hover:brightness-125 cursor-pointer relative group`}
              title={`${item.label}: ${formatBytes(item.bytes)} (${item.percent.toFixed(1)}%)`}
            />
          ))
        )}
      </div>

      {/* Legend / Tooltip Info */}
      {!compact && breakdown.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
          {breakdown.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-1.5 p-1 rounded-lg transition-colors ${
                activeCategory === item.id ? 'bg-tg-dark-bg/80' : ''
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${item.colorClass} shrink-0`} />
              <span className="text-tg-dark-muted truncate">{item.label}</span>
              <span className="text-white font-medium ml-auto truncate">{formatBytes(item.bytes)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary Row */}
      <div className="flex items-center justify-between text-[11px] text-tg-dark-muted pt-0.5">
        <span className="text-white font-medium">{formatBytes(totalBytes)}</span>
        <span>{stats?.totalFiles || files.length} Files</span>
      </div>
    </div>
  );
};
