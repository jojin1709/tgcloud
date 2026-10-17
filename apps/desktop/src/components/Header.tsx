import React, { useRef, useState } from 'react';
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
  Menu,
  ArrowLeft,
  MoreVertical,
  Cloud,
} from 'lucide-react';
import { useFiles } from '../context/FilesContext';
import { useTransfers } from '../context/TransfersContext';
import { api, isRunningInTauri } from '../lib/api';

interface HeaderProps {
  onNewFolderClick: () => void;
  onToggleMobileSidebar?: () => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  mediaInputRef?: React.RefObject<HTMLInputElement>;
}

export const Header: React.FC<HeaderProps> = ({
  onNewFolderClick,
  onToggleMobileSidebar,
  fileInputRef: externalFileInputRef,
  mediaInputRef: externalMediaInputRef,
}) => {
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
    breadcrumbs,
  } = useFiles();

  const { activeCount, setIsTransfersOpen, startUpload } = useTransfers();
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const internalMediaInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = externalFileInputRef || internalFileInputRef;
  const mediaInputRef = externalMediaInputRef || internalMediaInputRef;

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          await refreshFiles();
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
      await startUpload(file, currentFolderId);
    }
    await refreshFiles();

    if (e.target) {
      e.target.value = '';
    }
  };

  const currentTitle = breadcrumbs[breadcrumbs.length - 1]?.name || 'TGCloud';

  return (
    <header className="h-16 border-b border-tg-dark-border px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 bg-tg-dark-bg/90 backdrop-blur-md shrink-0 relative z-30">
      {/* Hidden file input for general uploading */}
      <input
        id="global-file-input"
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="fixed -top-96 -left-96 opacity-0 pointer-events-none w-0 h-0"
      />

      {/* Hidden file input for photos/media */}
      <input
        id="global-media-input"
        type="file"
        ref={mediaInputRef}
        onChange={handleFileInputChange}
        accept="image/*,video/*"
        multiple
        className="fixed -top-96 -left-96 opacity-0 pointer-events-none w-0 h-0"
      />

      {/* MOBILE FULL-WIDTH SEARCH VIEW */}
      {isMobileSearchOpen ? (
        <div className="flex items-center gap-2 w-full sm:hidden">
          <button
            onClick={() => {
              setIsMobileSearchOpen(false);
              setSearchQuery('');
            }}
            className="p-2 rounded-xl text-tg-dark-muted hover:text-white bg-tg-dark-surface border border-tg-dark-border shrink-0 active:scale-95 transition-all"
            aria-label="Back from search"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-tg-dark-muted absolute left-3 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-tg-dark-surface border border-tg-dark-border rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-tg-dark-muted focus:outline-none focus:border-tg-blue-500 focus:ring-1 focus:ring-tg-blue-500 transition-all truncate"
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
        </div>
      ) : (
        <>
          {/* DESKTOP SEARCH & MOBILE TITLE */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-2xl">
            {onToggleMobileSidebar && (
              <button
                onClick={onToggleMobileSidebar}
                className="md:hidden p-2 rounded-xl text-tg-dark-muted hover:text-white bg-tg-dark-surface border border-tg-dark-border hover:bg-tg-dark-surfaceHover transition-all shrink-0 active:scale-95"
                title="Open Navigation"
                aria-label="Open Navigation"
              >
                <Menu className="w-4 h-4 text-white" />
              </button>
            )}

            {/* Mobile Header Title */}
            <div className="flex items-center gap-2 sm:hidden truncate">
              <div className="w-7 h-7 rounded-lg bg-tg-blue-500/20 border border-tg-blue-500/30 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4 text-tg-blue-400" />
              </div>
              <span className="font-bold text-sm text-white truncate">{currentTitle}</span>
            </div>

            {/* Desktop Search Input */}
            <div className="relative w-full max-w-md min-w-0 hidden sm:block">
              <Search className="w-4 h-4 text-tg-dark-muted absolute left-3 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full bg-tg-dark-surface border border-tg-dark-border rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-tg-dark-muted focus:outline-none focus:border-tg-blue-500 focus:ring-1 focus:ring-tg-blue-500 transition-all truncate"
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

            {/* Category Pills (Hidden on mobile / tablet, shown on lg) */}
            <div className="hidden lg:flex items-center gap-1 bg-tg-dark-surface p-1 rounded-xl border border-tg-dark-border shrink-0">
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

          {/* DESKTOP ACTIONS */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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
            <div className="flex items-center bg-tg-dark-surface border border-tg-dark-border rounded-xl p-0.5 sm:p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-tg-blue-500 text-white'
                    : 'text-tg-dark-muted hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Refresh / Sync Button */}
            <button
              onClick={() => refreshFiles()}
              className="p-1.5 sm:p-2 rounded-xl text-tg-dark-muted hover:text-white bg-tg-dark-surface border border-tg-dark-border hover:bg-tg-dark-surfaceHover transition-all active:scale-95 shrink-0"
              title="Refresh & Sync Telegram Files"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Transfers Manager Button */}
            <button
              onClick={() => setIsTransfersOpen(true)}
              className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                activeCount > 0
                  ? 'bg-tg-blue-500/20 text-tg-blue-400 border-tg-blue-500/40 shadow-sm animate-pulse'
                  : 'bg-tg-dark-surface text-tg-dark-muted border-tg-dark-border hover:text-white hover:bg-tg-dark-surfaceHover'
              }`}
              title="Transfers Manager"
            >
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Transfers</span>
              {activeCount > 0 && (
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-tg-blue-500 text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>

            {/* Create Folder Button */}
            <button
              onClick={onNewFolderClick}
              className="p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-tg-dark-surface border border-tg-dark-border text-white hover:bg-tg-dark-surfaceHover hover:border-tg-blue-500/40 transition-all shrink-0"
              title="New Folder"
            >
              <FolderPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-tg-blue-400 inline" />
              <span className="hidden md:inline ml-1.5">New Folder</span>
            </button>

            {/* Upload Button */}
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold bg-tg-blue-500 hover:bg-tg-blue-600 text-white shadow-md shadow-tg-blue-500/30 transition-all active:scale-[0.98] cursor-pointer shrink-0"
              title="Upload to Telegram"
            >
              <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>

          {/* MOBILE ACTIONS */}
          <div className="flex items-center gap-1.5 sm:hidden shrink-0">
            {/* Search Trigger Button */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-2 rounded-xl text-tg-dark-muted hover:text-white bg-tg-dark-surface border border-tg-dark-border transition-all active:scale-95"
              title="Search files"
            >
              <Search className="w-4 h-4 text-white" />
            </button>

            {/* Transfers Indicator */}
            <button
              onClick={() => setIsTransfersOpen(true)}
              className={`relative p-2 rounded-xl border transition-all active:scale-95 ${
                activeCount > 0
                  ? 'bg-tg-blue-500/20 text-tg-blue-400 border-tg-blue-500/40 animate-pulse'
                  : 'bg-tg-dark-surface text-tg-dark-muted border-tg-dark-border hover:text-white'
              }`}
              title="Transfers"
            >
              <Activity className="w-4 h-4 text-white" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-tg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>

            {/* Mobile Options Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-tg-dark-muted hover:text-white bg-tg-dark-surface border border-tg-dark-border transition-all active:scale-95"
                title="Options"
              >
                <MoreVertical className="w-4 h-4 text-white" />
              </button>

              {isMobileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-12 w-52 py-2 bg-tg-dark-surface border border-tg-dark-border rounded-2xl shadow-2xl z-40 text-xs">
                    <div className="px-3 py-1 font-semibold uppercase tracking-wider text-[10px] text-tg-dark-muted/80">
                      View Mode
                    </div>
                    <div className="flex items-center px-2 py-1 gap-1">
                      <button
                        onClick={() => {
                          setViewMode('grid');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border font-medium ${
                          viewMode === 'grid'
                            ? 'bg-tg-blue-500 text-white border-tg-blue-500'
                            : 'bg-tg-dark-bg text-tg-dark-muted border-tg-dark-border'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Grid</span>
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('list');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border font-medium ${
                          viewMode === 'list'
                            ? 'bg-tg-blue-500 text-white border-tg-blue-500'
                            : 'bg-tg-dark-bg text-tg-dark-muted border-tg-dark-border'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>List</span>
                      </button>
                    </div>

                    <div className="border-t border-tg-dark-border/60 my-1.5" />

                    <div className="px-3 py-1 font-semibold uppercase tracking-wider text-[10px] text-tg-dark-muted/80">
                      Sort By
                    </div>
                    {(['name', 'date', 'size'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          if (sortBy === s) {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy(s);
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover capitalize"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="w-3.5 h-3.5 text-tg-blue-400" />
                          <span>{s}</span>
                        </div>
                        {sortBy === s && (
                          <span className="text-[10px] text-tg-blue-400 font-semibold uppercase">
                            {sortOrder}
                          </span>
                        )}
                      </button>
                    ))}

                    <div className="border-t border-tg-dark-border/60 my-1.5" />

                    <button
                      onClick={() => {
                        refreshFiles();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-tg-blue-400 hover:bg-tg-dark-surfaceHover font-medium"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync Telegram Files</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
