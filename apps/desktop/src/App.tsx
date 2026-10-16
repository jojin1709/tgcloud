import React, { useState } from 'react';
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
import { TGFile } from '@tgcloud/types';
import { api } from './lib/api';

const MainLayout: React.FC = () => {
  const { authState, loading } = useAuth();
  const { renameFile, renameFolder } = useFiles();

  const [previewFile, setPreviewFile] = useState<TGFile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);

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

  React.useEffect(() => {
    api.getSettings().then((s) => {
      if (s?.theme) {
        applyAppTheme(s.theme as any);
      }
    }).catch(console.error);
  }, []);

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

      {/* Modals & Dialogs */}
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
