import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FilesProvider, useFiles } from './context/FilesContext';
import { TransfersProvider } from './context/TransfersContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FileBrowser } from './components/FileBrowser';
import { FilePreviewModal } from './components/FilePreviewModal';
import { TransfersModal } from './components/TransfersModal';
import { SettingsModal } from './components/SettingsModal';
import { NewFolderDialog } from './components/NewFolderDialog';
import { RenameDialog } from './components/RenameDialog';
import { LoginModal } from './components/LoginModal';
import { TGFile } from '@tgcloud/types';

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

  if (loading) {
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
    <div className="h-screen w-screen flex bg-tg-dark-bg overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header onNewFolderClick={() => setIsNewFolderOpen(true)} />
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
