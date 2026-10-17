import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Zap,
  HardDrive,
  Palette,
  Shield,
  Info,
  Check,
  LogOut,
  Trash2,
  ExternalLink,
  Globe,
  Linkedin,
  Github,
  Send,
  ArrowDownCircle,
  RefreshCw,
  Smartphone,
  Monitor,
  FolderSync,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Folder,
  CheckCircle2,
  Layers,
  Radio,
  FileWarning,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../context/FilesContext';
import { api } from '../lib/api';
import { AppSettings, TGFile } from '@tgcloud/types';
import { checkAppUpdates, triggerUpdateDownload, UpdateInfo, CURRENT_APP_VERSION } from '../lib/updater';
import { StorageBreakdownBar } from './StorageBreakdownBar';
import { formatBytes } from '../lib/utils';

export const applyAppTheme = (th: 'dark' | 'light' | 'system') => {
  if (th === 'light') {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  } else if (th === 'dark') {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { authState, logout } = useAuth();
  const { stats, refreshFiles, files, moveToTrash } = useFiles();
  const [activeTab, setActiveTab] = useState<'account' | 'transfers' | 'storage' | 'appearance' | 'security' | 'updates' | 'about'>('account');
  const [settings, setSettings] = useState<AppSettings>({
    concurrentUploads: 3,
    concurrentDownloads: 3,
    autoRetry: true,
    downloadLocation: 'C:\\Users\\User\\Downloads',
    theme: 'dark',
    appLock: false,
    vaultName: 'TGCloud Personal Vault',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncFolder, setSyncFolder] = useState<string>('~/TGCloud');
  const [watcherRunning, setWatcherRunning] = useState<boolean>(false);
  const [zkPassphrase, setZkPassphrase] = useState<string>('');
  const [zkEnabled, setZkEnabled] = useState<boolean>(false);
  const [showZkPassphrase, setShowZkPassphrase] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<{
    checking: boolean;
    checked: boolean;
    info: UpdateInfo | null;
  }>({
    checking: false,
    checked: false,
    info: null,
  });

  // Custom Telegram Vault Selector State
  const [customVaultMode, setCustomVaultMode] = useState<'saved_messages' | 'custom_channel'>('saved_messages');
  const [vaultChatIdInput, setVaultChatIdInput] = useState<string>('');
  const [vaultNameInput, setVaultNameInput] = useState<string>('');
  const [vaultSaveSuccess, setVaultSaveSuccess] = useState<boolean>(false);

  // Storage Tools State
  const [cleaningDuplicates, setCleaningDuplicates] = useState<boolean>(false);
  const [cleanedDuplicatesResult, setCleanedDuplicatesResult] = useState<string | null>(null);

  const largeFiles = React.useMemo(() => {
    return files
      .filter((f) => !f.isTrash && f.size > 25 * 1024 * 1024)
      .sort((a, b) => b.size - a.size);
  }, [files]);

  const duplicateGroups = React.useMemo(() => {
    const map = new Map<string, TGFile[]>();
    files.forEach((f) => {
      if (f.isTrash) return;
      const key = f.hash ? `hash:${f.hash}` : `name:${f.name}_size:${f.size}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    });
    return Array.from(map.values()).filter((group) => group.length > 1);
  }, [files]);

  const totalDuplicateBytes = React.useMemo(() => {
    return duplicateGroups.reduce((acc, group) => {
      const extraItems = group.slice(1);
      return acc + extraItems.reduce((sum, item) => sum + item.size, 0);
    }, 0);
  }, [duplicateGroups]);

  const handleCleanDuplicates = async () => {
    if (duplicateGroups.length === 0) return;
    setCleaningDuplicates(true);
    let count = 0;
    try {
      for (const group of duplicateGroups) {
        const duplicates = group.slice(1);
        for (const item of duplicates) {
          await moveToTrash(item.id);
          count++;
        }
      }
      await refreshFiles();
      setCleanedDuplicatesResult(
        `Moved ${count} duplicate files to trash (${formatBytes(totalDuplicateBytes)} freed).`
      );
    } catch (e) {
      console.error('Failed to clean duplicates:', e);
    } finally {
      setCleaningDuplicates(false);
    }
  };

  const handleSaveVault = async () => {
    const newSettings: AppSettings = {
      ...settings,
      vaultChatId:
        customVaultMode === 'custom_channel' && vaultChatIdInput.trim()
          ? Number(vaultChatIdInput.trim())
          : undefined,
      vaultName:
        customVaultMode === 'custom_channel'
          ? vaultNameInput.trim() || 'Custom Channel Vault'
          : 'Saved Messages',
    };
    await api.saveSettings(newSettings);
    setSettings(newSettings);
    setVaultSaveSuccess(true);
    setTimeout(() => setVaultSaveSuccess(false), 2500);
    await refreshFiles();
  };

  const handleCheckUpdates = async () => {
    setUpdateState((prev) => ({ ...prev, checking: true }));
    try {
      const res = await checkAppUpdates();
      setUpdateState({ checking: false, checked: true, info: res });
    } catch {
      setUpdateState({ checking: false, checked: true, info: null });
    }
  };

  useEffect(() => {
    if (isOpen) {
      api
        .getSettings()
        .then((s) => {
          setSettings(s);
          applyAppTheme(s.theme as any);
          if (s.vaultChatId) {
            setCustomVaultMode('custom_channel');
            setVaultChatIdInput(String(s.vaultChatId));
            setVaultNameInput(s.vaultName || 'Custom Channel Vault');
          } else {
            setCustomVaultMode('saved_messages');
            setVaultChatIdInput('');
            setVaultNameInput(s.vaultName || 'Saved Messages');
          }
        })
        .catch(console.error);

      api.getSyncFolder().then(setSyncFolder).catch(console.error);
    }
  }, [isOpen]);

  const handlePickSyncFolder = async () => {
    const folder = await api.pickFolder();
    if (folder) {
      await api.setSyncFolder(folder);
      setSyncFolder(folder);
    }
  };

  const handleStartWatcher = async () => {
    try {
      await api.startFolderWatcher();
      setWatcherRunning(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const handleThemeChange = (th: 'dark' | 'light' | 'system') => {
    setSettings((prev) => ({ ...prev, theme: th }));
    applyAppTheme(th);
  };

  const handleBrowseFolder = async () => {
    const folder = await api.pickFolder();
    if (folder) {
      setSettings((prev) => ({ ...prev, downloadLocation: folder }));
    }
  };

  const handleSave = async () => {
    await api.saveSettings(settings);
    applyAppTheme(settings.theme as any);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
    { id: 'transfers', label: 'Transfers', icon: <Zap className="w-4 h-4" /> },
    { id: 'storage', label: 'Storage', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'updates', label: 'Updates', icon: <ArrowDownCircle className="w-4 h-4" /> },
    { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-tg-dark-surface border border-tg-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[580px] max-h-[90vh] z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-tg-dark-border bg-tg-dark-bg/60">
          <h2 className="text-base font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Layout: Sidebar Tabs + Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Tabs Sidebar (Horizontal scroll on mobile, vertical sidebar on desktop) */}
          <div className="w-full md:w-48 bg-tg-dark-bg/40 border-b md:border-b-0 md:border-r border-tg-dark-border p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-xl text-xs font-semibold transition-all shrink-0 md:w-full ${
                  activeTab === tab.id
                    ? 'bg-tg-blue-500 text-white shadow-sm'
                    : 'text-tg-dark-muted hover:text-white hover:bg-tg-dark-surface'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 text-sm">
            {activeTab === 'account' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white mb-2">Telegram Account</h3>
                <div className="p-4 rounded-xl bg-tg-dark-bg/60 border border-tg-dark-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-tg-dark-muted">Name</span>
                    <span className="text-xs font-semibold text-white">
                      {authState.user?.firstName} {authState.user?.lastName || ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-tg-dark-muted">Username</span>
                    <span className="text-xs font-semibold text-tg-blue-400">
                      @{authState.user?.username || 'none'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-tg-dark-muted">Phone Number</span>
                    <span className="text-xs font-mono text-white">
                      {authState.user?.phone || 'Connected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-tg-dark-muted">Telegram Vault</span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {settings.vaultName || authState.connectedVaultTitle || 'Private Vault Channel'}
                    </span>
                  </div>
                </div>

                {/* Storage Destination Vault Selector */}
                <div className="p-4 rounded-xl bg-tg-dark-bg/60 border border-tg-dark-border space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-tg-blue-400" />
                      Storage Destination Vault
                    </h4>
                    <p className="text-[11px] text-tg-dark-muted mt-0.5">
                      Choose between default Saved Messages or a dedicated Telegram Channel or Group.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCustomVaultMode('saved_messages')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        customVaultMode === 'saved_messages'
                          ? 'bg-tg-blue-500/20 border-tg-blue-500 text-white shadow-sm'
                          : 'bg-tg-dark-surface/60 border-tg-dark-border text-tg-dark-muted hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-white">Saved Messages</div>
                      <div className="text-[10px] text-tg-dark-muted mt-0.5">Personal private cloud (Default)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomVaultMode('custom_channel')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        customVaultMode === 'custom_channel'
                          ? 'bg-tg-blue-500/20 border-tg-blue-500 text-white shadow-sm'
                          : 'bg-tg-dark-surface/60 border-tg-dark-border text-tg-dark-muted hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-white">Custom Channel / Group</div>
                      <div className="text-[10px] text-tg-dark-muted mt-0.5">Shared or dedicated archive</div>
                    </button>
                  </div>

                  {customVaultMode === 'custom_channel' && (
                    <div className="space-y-2 pt-2 border-t border-tg-dark-border/50 text-xs">
                      <div>
                        <label className="text-[11px] text-tg-dark-muted font-medium block mb-1">
                          Channel or Group Chat ID
                        </label>
                        <input
                          type="text"
                          value={vaultChatIdInput}
                          onChange={(e) => setVaultChatIdInput(e.target.value)}
                          placeholder="e.g. -1001928374652"
                          className="w-full bg-tg-dark-surface border border-tg-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-tg-dark-muted focus:outline-none focus:border-tg-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-tg-dark-muted font-medium block mb-1">
                          Vault Friendly Name
                        </label>
                        <input
                          type="text"
                          value={vaultNameInput}
                          onChange={(e) => setVaultNameInput(e.target.value)}
                          placeholder="e.g. Project Archives Vault"
                          className="w-full bg-tg-dark-surface border border-tg-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-tg-dark-muted focus:outline-none focus:border-tg-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    {vaultSaveSuccess ? (
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Vault preferences saved!
                      </span>
                    ) : (
                      <span className="text-[11px] text-tg-dark-muted">Applies to newly uploaded items.</span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveVault}
                      className="px-3.5 py-1.5 rounded-xl bg-tg-blue-500 text-white text-xs font-semibold hover:bg-tg-blue-600 transition-colors cursor-pointer shrink-0"
                    >
                      Save Vault
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all mt-4"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Telegram</span>
                </button>
              </div>
            )}

            {activeTab === 'transfers' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white mb-2">Transfer Preferences</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-tg-dark-muted block mb-1.5">
                      Download Location
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={settings.downloadLocation}
                        onChange={(e) =>
                          setSettings({ ...settings, downloadLocation: e.target.value })
                        }
                        className="flex-1 bg-tg-dark-bg border border-tg-dark-border rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={handleBrowseFolder}
                        className="px-3 py-2 bg-tg-dark-bg border border-tg-dark-border rounded-xl text-xs font-semibold text-white hover:bg-tg-dark-surfaceHover transition-colors shrink-0"
                      >
                        Browse...
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-tg-dark-muted block mb-1.5">
                        Concurrent Uploads
                      </label>
                      <select
                        value={settings.concurrentUploads}
                        onChange={(e) =>
                          setSettings({ ...settings, concurrentUploads: Number(e.target.value) })
                        }
                        className="w-full bg-tg-dark-bg border border-tg-dark-border rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value={1}>1 stream</option>
                        <option value={2}>2 concurrent</option>
                        <option value={3}>3 concurrent</option>
                        <option value={5}>5 concurrent</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-tg-dark-muted block mb-1.5">
                        Concurrent Downloads
                      </label>
                      <select
                        value={settings.concurrentDownloads}
                        onChange={(e) =>
                          setSettings({ ...settings, concurrentDownloads: Number(e.target.value) })
                        }
                        className="w-full bg-tg-dark-bg border border-tg-dark-border rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value={1}>1 stream</option>
                        <option value={2}>2 concurrent</option>
                        <option value={3}>3 concurrent</option>
                        <option value={5}>5 concurrent</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Storage Breakdown</h3>
                  <div className="p-4 rounded-xl bg-tg-dark-bg/60 border border-tg-dark-border">
                    <StorageBreakdownBar compact={false} />
                  </div>
                </div>

                {/* Duplicate Files Cleaner */}
                <div className="p-4 rounded-xl bg-tg-dark-bg/60 border border-tg-dark-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        Duplicate File Cleaner
                      </h4>
                      <p className="text-[11px] text-tg-dark-muted mt-0.5">
                        Scan and eliminate identical file copies across your vault.
                      </p>
                    </div>

                    {duplicateGroups.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCleanDuplicates}
                        disabled={cleaningDuplicates}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{cleaningDuplicates ? 'Cleaning...' : 'Clean Duplicates'}</span>
                      </button>
                    )}
                  </div>

                  {cleanedDuplicatesResult && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{cleanedDuplicatesResult}</span>
                    </div>
                  )}

                  {duplicateGroups.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] text-purple-300 font-medium">
                        Found {duplicateGroups.length} duplicate group{duplicateGroups.length > 1 ? 's' : ''} (Reclaimable: {formatBytes(totalDuplicateBytes)}):
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {duplicateGroups.map((group, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-tg-dark-surface/60 border border-tg-dark-border/60 flex items-center justify-between"
                          >
                            <div className="truncate min-w-0 pr-2">
                              <div className="text-white font-medium truncate">{group[0].name}</div>
                              <div className="text-[10px] text-tg-dark-muted">
                                {group.length} copies • {formatBytes(group[0].size)} each
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 shrink-0 font-mono">
                              +{group.length - 1} extra
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-tg-dark-muted pt-1">
                      No redundant duplicate files detected. Your storage is clean.
                    </p>
                  )}
                </div>

                {/* Large File Inspector */}
                <div className="p-4 rounded-xl bg-tg-dark-bg/60 border border-tg-dark-border space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FileWarning className="w-3.5 h-3.5 text-amber-400" />
                      Large File Inspector (&gt; 25 MB)
                    </h4>
                    <p className="text-[11px] text-tg-dark-muted mt-0.5">
                      High-capacity files consuming your cloud quota.
                    </p>
                  </div>

                  {largeFiles.length > 0 ? (
                    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {largeFiles.slice(0, 10).map((file) => (
                        <div
                          key={file.id}
                          className="p-2 rounded-lg bg-tg-dark-surface/60 border border-tg-dark-border/60 flex items-center justify-between gap-2"
                        >
                          <div className="truncate min-w-0 flex-1">
                            <div className="text-white font-medium truncate">{file.name}</div>
                            <div className="text-[10px] text-tg-dark-muted">
                              {new Date(file.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-mono font-semibold text-amber-400">
                              {formatBytes(file.size)}
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                await moveToTrash(file.id);
                                await refreshFiles();
                              }}
                              className="p-1 rounded text-tg-dark-muted hover:text-rose-400 transition-colors"
                              title="Move to trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-tg-dark-muted pt-1">
                      No files greater than 25 MB found.
                    </p>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white mb-2">Local SQLite Database & Cache</h3>
                <div className="p-4 rounded-xl bg-tg-dark-bg/60 border border-tg-dark-border space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-tg-dark-muted">Total Indexed Files</span>
                    <span className="font-semibold text-white">{stats?.totalFiles || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tg-dark-muted">Indexed Folders</span>
                    <span className="font-semibold text-white">{stats?.totalFolders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tg-dark-muted">Database Engine</span>
                    <span className="font-semibold text-tg-blue-400">SQLite WAL Mode</span>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await refreshFiles();
                    alert('Local cache and metadata synchronized with SQLite database.');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-tg-dark-bg border border-tg-dark-border text-white text-xs font-semibold hover:bg-tg-dark-surface transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-tg-blue-400" />
                  <span>Resync Local Index</span>
                </button>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white mb-2">Appearance</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['dark', 'light', 'system'].map((th) => (
                    <button
                      key={th}
                      onClick={() => handleThemeChange(th as any)}
                      className={`p-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        settings.theme === th
                          ? 'bg-tg-blue-500/20 border-tg-blue-500 text-tg-blue-400 shadow-sm'
                          : 'bg-tg-dark-bg border-tg-dark-border text-tg-dark-muted hover:text-white'
                      }`}
                    >
                      {th}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4 py-1">
                {/* Zero-Knowledge Client-Side Encryption */}
                <div className="p-4 rounded-2xl bg-tg-dark-bg/60 border border-tg-dark-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <KeyRound className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">Zero-Knowledge Encryption</h4>
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-mono text-purple-300">
                            AES-256-GCM
                          </span>
                        </div>
                        <p className="text-xs text-tg-dark-muted mt-0.5">
                          Files are encrypted on-device with your private passphrase before upload
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setZkEnabled(!zkEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        zkEnabled ? 'bg-purple-600' : 'bg-tg-dark-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          zkEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {zkEnabled && (
                    <div className="pt-2 border-t border-tg-dark-border/60 space-y-2">
                      <label className="text-xs text-tg-dark-muted font-medium block">
                        Master Encryption Passphrase
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showZkPassphrase ? 'text' : 'password'}
                            value={zkPassphrase}
                            onChange={(e) => setZkPassphrase(e.target.value)}
                            placeholder="Enter a secret passphrase (never leaves this device)..."
                            className="w-full bg-tg-dark-surface border border-tg-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-tg-dark-muted focus:outline-none focus:border-purple-500 pr-9 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowZkPassphrase(!showZkPassphrase)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tg-dark-muted hover:text-white"
                          >
                            {showZkPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-purple-300/80">
                        Warning: If you lose this passphrase, your encrypted files cannot be decrypted even by Telegram.
                      </p>
                    </div>
                  )}
                </div>

                {/* Local Folder Auto-Sync Daemon */}
                <div className="p-4 rounded-2xl bg-tg-dark-bg/60 border border-tg-dark-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-tg-blue-500/20 border border-tg-blue-500/30 flex items-center justify-center shrink-0">
                        <FolderSync className="w-5 h-5 text-tg-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">Local Folder Auto-Sync</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              watcherRunning
                                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                                : 'bg-tg-dark-surface border border-tg-dark-border text-tg-dark-muted'
                            }`}
                          >
                            {watcherRunning ? 'Watcher Active' : 'Standby'}
                          </span>
                        </div>
                        <p className="text-xs text-tg-dark-muted mt-0.5">
                          Monitors directory changes using background notify daemon
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleStartWatcher}
                      disabled={watcherRunning}
                      className="px-3 py-1.5 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      {watcherRunning ? 'Watching' : 'Start Watcher'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-tg-dark-border/60">
                    <div className="flex-1 px-3 py-2 rounded-xl bg-tg-dark-surface border border-tg-dark-border text-xs text-white font-mono truncate">
                      {syncFolder}
                    </div>
                    <button
                      onClick={handlePickSyncFolder}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-tg-dark-surface border border-tg-dark-border hover:border-tg-blue-500/60 text-xs font-semibold text-white transition-all cursor-pointer shrink-0"
                    >
                      <Folder className="w-3.5 h-3.5 text-tg-blue-400" />
                      <span>Browse</span>
                    </button>
                  </div>
                </div>

                {/* SHA-256 Deduplication & App Lock Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-tg-dark-bg/60 border border-tg-dark-border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-white">SHA-256 Deduplication</h4>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-tg-dark-muted">
                      Pre-upload hashing detects duplicate payloads and links cloud storage with zero network waste.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-tg-dark-bg/60 border border-tg-dark-border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-tg-blue-400" />
                        <h4 className="text-xs font-bold text-white">App Lock & Biometrics</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, appLock: !s.appLock }))}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                          settings.appLock ? 'bg-tg-blue-500' : 'bg-tg-dark-border'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            settings.appLock ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-[11px] text-tg-dark-muted">
                      Require hardware biometrics or session PIN when launching TGCloud.
                    </p>
                  </div>
                </div>

                {/* Core Architecture summary */}
                <div className="p-3.5 rounded-xl bg-tg-dark-bg/40 border border-tg-dark-border/60 text-xs text-tg-dark-muted space-y-1">
                  <p className="font-semibold text-white text-[11px]">Core Security Architecture</p>
                  <p>• Zero central servers: direct MTProto pipeline to Telegram Cloud.</p>
                  <p>• Resumable multi-chunk state stored in local encrypted SQLite database.</p>
                </div>
              </div>
            )}

            {activeTab === 'updates' && (
              <div className="space-y-4 py-2">
                {/* Current Version Card */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-tg-dark-bg/60 border border-tg-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-tg-blue-500/20 border border-tg-blue-500/30 flex items-center justify-center shrink-0">
                      <ArrowDownCircle className="w-5 h-5 text-tg-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">Current Version</h3>
                        <span className="px-2 py-0.5 rounded-full bg-tg-dark-surface border border-tg-dark-border text-[11px] font-mono text-tg-blue-300">
                          v{CURRENT_APP_VERSION}
                        </span>
                      </div>
                      <p className="text-xs text-tg-dark-muted mt-0.5">
                        Production Release • Continuous Delivery Channel
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckUpdates}
                    disabled={updateState.checking}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-tg-blue-500/20 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${updateState.checking ? 'animate-spin' : ''}`} />
                    <span>{updateState.checking ? 'Checking...' : 'Check Now'}</span>
                  </button>
                </div>

                {/* Checked State Display */}
                {updateState.checked && updateState.info && (
                  <div className="space-y-3">
                    {updateState.info.updateAvailable ? (
                      <div className="p-4 rounded-2xl bg-tg-blue-500/10 border border-tg-blue-500/30 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded-full bg-tg-blue-500/30 text-tg-blue-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                              New Version Available
                            </span>
                            <h4 className="font-bold text-sm text-white">
                              TGCloud v{updateState.info.latestVersion}
                            </h4>
                          </div>
                          <span className="text-xs text-tg-dark-muted">
                            {new Date(updateState.info.publishedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {updateState.info.releaseNotes && (
                          <div className="p-3 rounded-xl bg-tg-dark-bg/80 border border-tg-dark-border/60 text-xs text-tg-dark-muted max-h-36 overflow-y-auto whitespace-pre-wrap">
                            {updateState.info.releaseNotes}
                          </div>
                        )}

                        {/* Direct Download Options */}
                        <div className="space-y-2 pt-1">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-tg-dark-muted">
                            Download Packages:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {updateState.info.windowsSetupUrl && (
                              <button
                                onClick={() => triggerUpdateDownload(updateState.info!.windowsSetupUrl!)}
                                className="flex items-center gap-2 p-2.5 rounded-xl bg-tg-blue-500/20 hover:bg-tg-blue-500/30 border border-tg-blue-500/40 text-xs font-semibold text-white transition-all text-left cursor-pointer"
                              >
                                <Monitor className="w-4 h-4 text-tg-blue-400 shrink-0" />
                                <div className="truncate">
                                  <div>Windows Setup</div>
                                  <div className="text-[10px] text-tg-dark-muted font-normal">Installer (.exe)</div>
                                </div>
                              </button>
                            )}

                            {updateState.info.androidApkUrl && (
                              <button
                                onClick={() => triggerUpdateDownload(updateState.info!.androidApkUrl!)}
                                className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-semibold text-white transition-all text-left cursor-pointer"
                              >
                                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div className="truncate">
                                  <div>Android APK</div>
                                  <div className="text-[10px] text-tg-dark-muted font-normal">Direct Install (.apk)</div>
                                </div>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-emerald-300">You are on the latest version</h4>
                          <p className="text-xs text-tg-dark-muted mt-0.5">
                            TGCloud v{CURRENT_APP_VERSION} is fully up to date with the latest security and MTProto engine patches.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Platforms Info */}
                <div className="p-3.5 rounded-xl bg-tg-dark-bg/60 border border-tg-dark-border text-xs text-tg-dark-muted space-y-1.5">
                  <p className="font-semibold text-white">How updates work:</p>
                  <p>• Whenever new code is pushed to GitHub, automated CI builds fresh Windows (.exe) and Android (.apk) releases.</p>
                  <p>• The app verifies GitHub release cryptographic artifacts directly, with no third-party middleman.</p>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-tg-dark-bg/60 border border-tg-dark-border">
                  <img src="/logo.png" alt="TGCloud" className="w-12 h-12 rounded-xl object-cover shadow-md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">TGCloud</h3>
                      <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        v1.0.0 Production
                      </span>
                    </div>
                    <p className="text-xs text-tg-dark-muted mt-0.5">
                      Sovereign Telegram-Backed Cloud Storage
                    </p>
                  </div>
                </div>

                {/* Developer Info Card */}
                <div className="p-4 rounded-2xl bg-tg-dark-bg/60 border border-tg-dark-border space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-tg-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      JJ
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        JOJIN JOHN
                        <span className="text-[10px] font-semibold bg-tg-blue-500/20 text-tg-blue-400 border border-tg-blue-500/30 px-1.5 py-0.2 rounded">
                          Author
                        </span>
                      </h4>
                      <p className="text-[11px] text-tg-dark-muted">
                        Software Engineer • Security Researcher • Full Stack
                      </p>
                    </div>
                  </div>

                  {/* Social & Professional Links */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => api.openFileInOs('https://www.linkedin.com/in/jojin-john/')}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                    </button>
                    <button
                      onClick={() => api.openFileInOs('https://github.com/jojin1709')}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-tg-dark-surface hover:bg-tg-dark-surfaceHover border border-tg-dark-border text-[11px] font-semibold text-white transition-all cursor-pointer"
                    >
                      <Github className="w-3.5 h-3.5 text-tg-dark-muted" />
                      <span>GitHub</span>
                    </button>
                    <button
                      onClick={() => api.openFileInOs('https://t.me/Jojin1709')}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-tg-blue-500/10 hover:bg-tg-blue-500/20 border border-tg-blue-500/30 text-[11px] font-semibold text-tg-blue-400 hover:text-tg-blue-300 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Telegram</span>
                    </button>
                  </div>
                </div>

                {/* Architecture Info */}
                <div className="p-3.5 rounded-xl bg-tg-dark-bg/40 border border-tg-dark-border space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-tg-dark-muted">Architecture</span>
                    <span className="text-tg-blue-400 font-medium">Direct MTProto (Zero Middleman)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-tg-dark-muted">Desktop Runtime</span>
                    <span className="text-tg-dark-muted font-mono">Tauri v2 + Rust 2021</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-tg-dark-muted">License</span>
                    <span className="text-emerald-400 font-medium">MIT (Open Source)</span>
                  </div>
                </div>

                {/* Tech Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {['Telegram MTProto', 'Tauri v2', 'Rust', 'React 18', 'TypeScript', 'Tailwind CSS', 'SQLite'].map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 rounded-lg bg-tg-dark-surface border border-tg-dark-border text-[11px] font-medium text-tg-dark-muted"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Quick External Links */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => api.openFileInOs('https://github.com/jojin1709/tgcloud')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-tg-dark-surface border border-tg-dark-border hover:border-tg-blue-500/40 text-xs font-semibold text-white transition-all text-left cursor-pointer"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink className="w-3.5 h-3.5 text-tg-dark-muted" />
                  </button>
                  <button
                    onClick={() => api.openFileInOs('https://jojin1709.github.io/tgcloud/')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-tg-dark-surface border border-tg-dark-border hover:border-tg-blue-500/40 text-xs font-semibold text-white transition-all text-left cursor-pointer"
                  >
                    <span>Website & Docs</span>
                    <Globe className="w-3.5 h-3.5 text-tg-blue-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-tg-dark-border bg-tg-dark-bg/80 flex items-center justify-between">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" />
                Settings Saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-tg-dark-muted hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-tg-blue-500 hover:bg-tg-blue-600 text-white shadow-md shadow-tg-blue-500/20"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
