import React, { createContext, useContext, useEffect, useState } from 'react';
import { TGTransfer } from '@tgcloud/types';
import { api } from '../lib/api';

interface TransfersContextType {
  transfers: TGTransfer[];
  activeCount: number;
  isTransfersOpen: boolean;
  setIsTransfersOpen: (open: boolean) => void;
  startUpload: (filePath: string, parentFolderId?: string | null) => Promise<string>;
  startDownload: (fileId: string, destinationPath: string) => Promise<string>;
  pauseTransfer: (id: string) => Promise<void>;
  resumeTransfer: (id: string) => Promise<void>;
  cancelTransfer: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  refreshTransfers: () => Promise<void>;
}

const TransfersContext = createContext<TransfersContextType | undefined>(undefined);

export const TransfersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transfers, setTransfers] = useState<TGTransfer[]>([]);
  const [isTransfersOpen, setIsTransfersOpen] = useState(false);

  const refreshTransfers = async () => {
    try {
      const list = await api.listTransfers();
      setTransfers(list);
    } catch (err) {
      console.error('Failed to list transfers:', err);
    }
  };

  useEffect(() => {
    refreshTransfers();

    // Subscribe to transfer progress events from Tauri backend
    const unlisten = api.onTransferUpdate((updated) => {
      setTransfers((prev) => {
        const index = prev.findIndex((t) => t.id === updated.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    });

    return () => {
      unlisten();
    };
  }, []);

  const activeCount = transfers.filter(
    (t) => t.status === 'active' || t.status === 'queued'
  ).length;

  const startUpload = async (filePath: string, parentFolderId: string | null = null) => {
    const id = await api.startUpload(filePath, parentFolderId);
    await refreshTransfers();
    return id;
  };

  const startDownload = async (fileId: string, destinationPath: string) => {
    const id = await api.startDownload(fileId, destinationPath);
    await refreshTransfers();
    return id;
  };

  const pauseTransfer = async (id: string) => {
    await api.pauseTransfer(id);
    await refreshTransfers();
  };

  const resumeTransfer = async (id: string) => {
    await api.resumeTransfer(id);
    await refreshTransfers();
  };

  const cancelTransfer = async (id: string) => {
    await api.cancelTransfer(id);
    await refreshTransfers();
  };

  const clearCompleted = async () => {
    await api.clearCompletedTransfers();
    await refreshTransfers();
  };

  return (
    <TransfersContext.Provider
      value={{
        transfers,
        activeCount,
        isTransfersOpen,
        setIsTransfersOpen,
        startUpload,
        startDownload,
        pauseTransfer,
        resumeTransfer,
        cancelTransfer,
        clearCompleted,
        refreshTransfers,
      }}
    >
      {children}
    </TransfersContext.Provider>
  );
};

export const useTransfers = () => {
  const context = useContext(TransfersContext);
  if (!context) throw new Error('useTransfers must be used within a TransfersProvider');
  return context;
};
