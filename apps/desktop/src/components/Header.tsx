import React, { useRef } from 'react';
import {
  Search,
  X,
  LayoutGrid,
  List,
  ArrowUpDown,
  UploadCloud,
  FolderPlus,
  ArrowDownUp,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { useFiles } from '../context/FilesContext';
import { useTransfers } from '../context/TransfersContext';
import { api, isRunningInTauri } from '../lib/api';

interface HeaderProps {
  onNewFolderClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewFolderClick }) => {
  const {
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    currentFolderId,
    refreshFiles,
  } = useFiles();

  const { activeCount, setIsTransfersOpen, startUpload } = useTransfers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'documents', label: 'Docs' },
    { id: 'images', label: 'Photos' },
    { id: 'videos', label: 'Videos' },
    { id: 'audio', label: 'Audio' },
    { id: 'archives', label: 'Archives' },
  ];

  const handleUploadClick = async () => {
    if (isRunningInTauri()) {
      try {
        const selected = await api.pickFiles();
        if (selected && selected.length > 0) {
          for (const filePath of selected) {
            await startUpload(filePath, currentFolderId);
          }
          return;
        }
      } catch (err) {
        console.warn('Native picker unavailable, falling back to input:', err);
      }
    }
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = (file as any).path || file.name;
      await startUpload(filePath, currentFolderId);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="h-16 border-b border-tg-dark-border px-6 flex items-center justify-between gap-4 bg-tg-dark-bg/80 backdrop-blur-md shrink-0">
      {/* Hidden file input for file uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
      />

      {/* Search Bar & Categories */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-tg-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your Telegram cloud files..."
            className="w-full bg-tg-dark-surface border border-tg-dark-border rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-tg-dark-muted focus:outline-none focus:border-tg-blue-500 focus:ring-1 focus:ring-tg-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tg-dark-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="hidden lg:flex items-center gap-1 bg-tg-dark-surface p-1 rounded-xl border border-tg-dark-border">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                categoryFilter === c.id
                  ? 'bg-tg-blue-500 text-white'
                  : 'text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions & Controls */}
      <div className="flex items-center gap-2.5">
        {/* Sort Controls */}
        <div className="flex items-center bg-tg-dark-surface border border-tg-dark-border rounded-xl p-1 text-xs">
          <button
            onClick={() => setSortBy(sortBy === 'name' ? 'date' : sortBy === 'date' ? 'size' : 'name')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-tg-dark-muted hover:text-white rounded-lg transition-colors capitalize"
            title="Sort attribute"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-tg-blue-400" />
            <span>{sortBy}</span>
          </button>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2 py-1 text-tg-dark-muted hover:text-white rounded-lg transition-colors"
            title={`Direction: ${sortOrder.toUpperCase()}`}
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grid / List Switcher */}
        <div className="flex items-center bg-tg-dark-surface border border-tg-dark-border rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-tg-blue-500 text-white'
                : 'text-tg-dark-muted hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-tg-blue-500 text-white'
                : 'text-tg-dark-muted hover:text-white'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Refresh / Sync Button */}
        <button
          onClick={() => refreshFiles()}
          className="p-2 rounded-xl text-tg-dark-muted hover:text-white bg-tg-dark-surface border border-tg-dark-border hover:bg-tg-dark-surfaceHover transition-all active:scale-95"
          title="Refresh & Sync Files"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Transfers Manager Button */}
        <button
          onClick={() => setIsTransfersOpen(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            activeCount > 0
              ? 'bg-tg-blue-500/20 text-tg-blue-400 border-tg-blue-500/40 shadow-sm animate-pulse'
              : 'bg-tg-dark-surface text-tg-dark-muted border-tg-dark-border hover:text-white hover:bg-tg-dark-surfaceHover'
          }`}
          title="Transfer Manager"
        >
          <Activity className="w-4 h-4" />
          <span>Transfers</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-tg-blue-500 text-white text-[11px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* Create Folder Button */}
        <button
          onClick={onNewFolderClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-tg-dark-surface border border-tg-dark-border text-white hover:bg-tg-dark-surfaceHover hover:border-tg-blue-500/40 transition-all"
        >
          <FolderPlus className="w-4 h-4 text-tg-blue-400" />
          <span className="hidden sm:inline">New Folder</span>
        </button>

        {/* Upload Button */}
        <button
          onClick={handleUploadClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-tg-blue-500 hover:bg-tg-blue-600 text-white shadow-md shadow-tg-blue-500/30 transition-all active:scale-[0.98] cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
};
