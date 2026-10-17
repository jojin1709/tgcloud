import React, { createContext, useContext, useEffect, useState } from 'react';
import { StorageStats, TGFile, TGFolder } from '@tgcloud/types';
import { api } from '../lib/api';

export type ActiveNavSection = 'files' | 'recent' | 'starred' | 'trash';

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface FilesContextType {
  currentFolderId: string | null;
  breadcrumbs: BreadcrumbItem[];
  folders: TGFolder[];
  files: TGFile[];
  stats: StorageStats | null;
  loading: boolean;
  navSection: ActiveNavSection;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  categoryFilter: string;
  sortBy: 'name' | 'size' | 'date';
  sortOrder: 'asc' | 'desc';
  setNavSection: (section: ActiveNavSection) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  setSortBy: (sort: 'name' | 'size' | 'date') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  navigateToFolder: (folderId: string | null, folderName?: string) => void;
  navigateToBreadcrumb: (index: number) => void;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  bulkDelete: () => Promise<void>;
  bulkStar: (star: boolean) => Promise<void>;
  bulkMove: (targetFolderId: string | null) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  renameFolder: (id: string, newName: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  renameFile: (id: string, newName: string) => Promise<void>;
  moveFile: (id: string, newParentFolderId: string | null) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  moveToTrash: (id: string) => Promise<void>;
  restoreFromTrash: (id: string) => Promise<void>;
  deletePermanent: (id: string) => Promise<void>;
  refreshFiles: () => Promise<void>;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export const FilesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'My Files' },
  ]);
  const [folders, setFolders] = useState<TGFolder[]>([]);
  const [files, setFiles] = useState<TGFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [navSection, setNavSection] = useState<ActiveNavSection>('files');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const refreshFiles = async () => {
    try {
      setLoading(true);
      const isStarred = navSection === 'starred';
      const isTrash = navSection === 'trash';

      if (!isStarred && !isTrash) {
        try {
          await api.syncTelegramMessages(currentFolderId);
        } catch (e) {
          console.warn('Telegram Saved Messages sync:', e);
        }
      }

      if (searchQuery.trim().length > 0) {
        const searchResults = await api.searchFiles({
          term: searchQuery,
          folderId: currentFolderId,
          mimeTypeCategory: categoryFilter !== 'all' ? (categoryFilter as any) : undefined,
          sortBy,
          sortOrder,
        });
        setFiles(searchResults);
        setFolders([]);
      } else {
        const [fetchedFolders, fetchedFiles, fetchedStats] = await Promise.all([
          isStarred || isTrash ? Promise.resolve([]) : api.listFolders(currentFolderId),
          api.listFiles(isStarred || isTrash ? null : currentFolderId, isStarred, isTrash),
          api.getStorageStats(),
        ]);

        let filteredFiles = fetchedFiles;
        if (categoryFilter !== 'all') {
          filteredFiles = fetchedFiles.filter((f) => {
            const mime = f.mimeType.toLowerCase();
            if (categoryFilter === 'documents') return mime.includes('pdf') || mime.includes('document') || mime.includes('text');
            if (categoryFilter === 'images') return mime.startsWith('image/');
            if (categoryFilter === 'videos') return mime.startsWith('video/');
            if (categoryFilter === 'audio') return mime.startsWith('audio/');
            if (categoryFilter === 'archives') return mime.includes('zip') || mime.includes('tar') || mime.includes('rar');
            return true;
          });
        }

        // Sorting
        filteredFiles.sort((a, b) => {
          let cmp = 0;
          if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
          else if (sortBy === 'size') cmp = a.size - b.size;
          else cmp = a.modifiedAt - b.modifiedAt;
          return sortOrder === 'asc' ? cmp : -cmp;
        });

        setFolders(fetchedFolders);
        setFiles(filteredFiles);
        setStats(fetchedStats);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFiles();
  }, [currentFolderId, navSection, searchQuery, categoryFilter, sortBy, sortOrder]);

  // Listen to background sync / file changes
  useEffect(() => {
    const unlisten = api.onFilesChanged(() => {
      refreshFiles();
    });
    return () => unlisten();
  }, [currentFolderId, navSection]);

  const navigateToFolder = (folderId: string | null, folderName?: string) => {
    setCurrentFolderId(folderId);
    setSearchQuery('');
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: 'My Files' }]);
    } else {
      setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName || 'Folder' }]);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    const target = breadcrumbs[index];
    setCurrentFolderId(target.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setSearchQuery('');
  };

  const createFolder = async (name: string) => {
    await api.createFolder(name, currentFolderId);
    await refreshFiles();
  };

  const renameFolder = async (id: string, newName: string) => {
    await api.renameFolder(id, newName);
    await refreshFiles();
  };

  const deleteFolder = async (id: string) => {
    await api.deleteFolder(id);
    await refreshFiles();
  };

  const renameFile = async (id: string, newName: string) => {
    await api.renameFile(id, newName);
    await refreshFiles();
  };

  const moveFile = async (id: string, newParentFolderId: string | null) => {
    await api.moveFile(id, newParentFolderId);
    await refreshFiles();
  };

  const toggleStar = async (id: string) => {
    await api.toggleStarFile(id);
    await refreshFiles();
  };

  const moveToTrash = async (id: string) => {
    await api.moveFileToTrash(id);
    await refreshFiles();
  };

  const restoreFromTrash = async (id: string) => {
    await api.restoreFileFromTrash(id);
    await refreshFiles();
  };

  const deletePermanent = async (id: string) => {
    await api.deleteFilePermanent(id);
    await refreshFiles();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set<string>();
    folders.forEach((f) => all.add(f.id));
    files.forEach((f) => all.add(f.id));
    setSelectedIds(all);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const bulkDelete = async () => {
    for (const id of selectedIds) {
      if (files.some((f) => f.id === id)) {
        await api.moveFileToTrash(id);
      } else if (folders.some((f) => f.id === id)) {
        await api.deleteFolder(id);
      }
    }
    clearSelection();
    await refreshFiles();
  };

  const bulkStar = async (star: boolean) => {
    for (const id of selectedIds) {
      const f = files.find((file) => file.id === id);
      if (f && f.isStarred !== star) {
        await api.toggleStarFile(id);
      }
    }
    clearSelection();
    await refreshFiles();
  };

  const bulkMove = async (targetFolderId: string | null) => {
    for (const id of selectedIds) {
      if (files.some((f) => f.id === id)) {
        await api.moveFile(id, targetFolderId);
      } else if (folders.some((f) => f.id === id)) {
        await api.moveFolder(id, targetFolderId);
      }
    }
    clearSelection();
    await refreshFiles();
  };

  return (
    <FilesContext.Provider
      value={{
        currentFolderId,
        breadcrumbs,
        folders,
        files,
        stats,
        loading,
        navSection,
        viewMode,
        searchQuery,
        categoryFilter,
        sortBy,
        sortOrder,
        selectedIds,
        toggleSelect,
        selectAll,
        clearSelection,
        bulkDelete,
        bulkStar,
        bulkMove,
        setNavSection,
        setViewMode,
        setSearchQuery,
        setCategoryFilter,
        setSortBy,
        setSortOrder,
        navigateToFolder,
        navigateToBreadcrumb,
        createFolder,
        renameFolder,
        deleteFolder,
        renameFile,
        moveFile,
        toggleStar,
        moveToTrash,
        restoreFromTrash,
        deletePermanent,
        refreshFiles,
      }}
    >
      {children}
    </FilesContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FilesContext);
  if (!context) throw new Error('useFiles must be used within a FilesProvider');
  return context;
};
