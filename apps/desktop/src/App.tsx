import React, { useState, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FilesProvider, useFiles } from './context/FilesContext';
import { TransfersProvider } from './context/TransfersContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FileBrowser } from './components/FileBrowser';
import { FilePreviewModal } from './components/FilePreviewModal';
import { TransfersModal } from './components/TransfersModal';
import { SettingsModal, applyAppTheme } from './components/SettingsModal';
import { NewFolderDialog } from './components/NewFolderDialog';
import { RenameDialog } from './components/RenameDialog';
import { LoginModal } from './components/LoginModal';
import { MobileActionSheet } from './components/MobileActionSheet';
import { UpdateNotificationBanner } from './components/UpdateNotificationBanner';
import { BatchActionBar } from './components/BatchActionBar';
import { Plus } from 'lucide-react';
import { TGFile } from '@tgcloud/types';
import { api } from './lib/api';
import { checkAppUpdates, UpdateInfo } from './lib/updater';

const MainLayout: React.FC = () => {
  const { authState, loading } = useAuth();
  const {
    renameFile,
    renameFolder,
    refreshFiles,
    selectedIds,
    selectAll,
    clearSelection,
    bulkDelete,
    files,
  } = useFiles();

  const [previewFile, setPreviewFile] = useState<TGFile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isMobileActionSheetOpen, setIsMobileActionSheetOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Rename Dialog State
  const [renameState, setRenameState] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    type: 'file' | 'folder';
  }>({
    isOpen: false,
    id: '',
    name: '',
    type: 'file',
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  React.useEffect(() => {
    api.getSettings().then((s) => {
      if (s?.theme) {
        applyAppTheme(s.theme as any);
      }
    }).catch(console.error);

    // Non-blocking auto update check
    checkAppUpdates()
      .then((info) => {
        if (info.updateAvailable) {
          setUpdateInfo(info);
        }
      })
      .catch(console.error);
  }, []);

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Escape: Dismiss active preview/modals or selection
      if (e.key === 'Escape') {
        if (previewFile) {
          setPreviewFile(null);
          return;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (isNewFolderOpen) {
          setIsNewFolderOpen(false);
          return;
        }
        if (renameState.isOpen) {
          setRenameState((prev) => ({ ...prev, isOpen: false }));
          return;
        }
        if (selectedIds.size > 0) {
          clearSelection();
          return;
        }
      }

      if (isInput) return;

      // Ctrl + A or Meta + A: Select All
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }

      // Delete / Backspace: Bulk delete
      if (e.key === 'Delete') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          bulkDelete();
          return;
        }
      }

      // Space: Quick Preview single selected file
      if (e.key === ' ' || e.code === 'Space') {
        if (selectedIds.size === 1) {
          const selectedId = Array.from(selectedIds)[0];
          const fileToPreview = files.find((f) => f.id === selectedId);
          if (fileToPreview) {
            e.preventDefault();
            setPreviewFile(fileToPreview);
          }
        }
      }

      // Ctrl + F: Focus search input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        const searchInput = document.querySelector(
          'input[type="text"][placeholder*="Search"]'
        ) as HTMLInputElement;
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    previewFile,
    isSettingsOpen,
    isNewFolderOpen,
    renameState.isOpen,
    selectedIds,
    selectAll,
    clearSelection,
    bulkDelete,
    files,
  ]);

  React.useEffect(() => {
    let t: NodeJS.Timeout;
    if (loading) {
      t = setTimeout(() => setShowSkip(true), 2500);
    } else {
      setShowSkip(false);
    }
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !showSkip) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-tg-dark-bg text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-tg-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-tg-dark-muted font-medium">Connecting to Telegram...</p>
        </div>
      </div>
    );
  }

  if (authState.step !== 'authenticated') {
    return <LoginModal />;
  }

  return (
    <div className="h-screen w-screen flex bg-tg-dark-bg overflow-hidden relative">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Responsive Drawer on Mobile, Fixed on Desktop) */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenSettings={() => {
          setIsMobileSidebarOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0">
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onNewFolderClick={() => setIsNewFolderOpen(true)}
          fileInputRef={fileInputRef}
          mediaInputRef={mediaInputRef}
        />
        <FileBrowser
          onPreviewFile={(file) => setPreviewFile(file)}
          onRenameFile={(file) =>
            setRenameState({ isOpen: true, id: file.id, name: file.name, type: 'file' })
          }
          onRenameFolder={(id, name) =>
            setRenameState({ isOpen: true, id, name, type: 'folder' })
          }
          onNewFolder={() => setIsNewFolderOpen(true)}
        />
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={() => setIsMobileActionSheetOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-tg-blue-600 to-tg-blue-400 text-white shadow-xl shadow-tg-blue-500/40 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
        aria-label="Add or upload to Telegram"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Mobile Action Sheet Modal */}
      <MobileActionSheet
        isOpen={isMobileActionSheetOpen}
        onClose={() => setIsMobileActionSheetOpen(false)}
        onUploadFiles={() => fileInputRef.current?.click()}
        onUploadMedia={() => mediaInputRef.current?.click()}
        onNewFolder={() => setIsNewFolderOpen(true)}
        onSyncTelegram={() => refreshFiles()}
      />

      {/* Modals & Dialogs */}
      <BatchActionBar />
      <UpdateNotificationBanner updateInfo={updateInfo} onDismiss={() => setUpdateInfo(null)} />
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      <TransfersModal />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NewFolderDialog isOpen={isNewFolderOpen} onClose={() => setIsNewFolderOpen(false)} />
      <RenameDialog
        isOpen={renameState.isOpen}
        initialName={renameState.name}
        itemType={renameState.type}
        onClose={() => setRenameState({ ...renameState, isOpen: false })}
        onConfirm={async (newName) => {
          if (renameState.type === 'file') {
            await renameFile(renameState.id, newName);
          } else {
            await renameFolder(renameState.id, newName);
          }
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <FilesProvider>
        <TransfersProvider>
          <MainLayout />
        </TransfersProvider>
      </FilesProvider>
    </AuthProvider>
  );
};

export default App;
