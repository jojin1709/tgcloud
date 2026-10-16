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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../context/FilesContext';
import { api } from '../lib/api';
import { AppSettings } from '@tgcloud/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { authState, logout } = useAuth();
  const { stats, refreshFiles } = useFiles();
  const [activeTab, setActiveTab] = useState<'account' | 'transfers' | 'storage' | 'appearance' | 'security' | 'about'>('account');
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

  useEffect(() => {
    if (isOpen) {
      api.getSettings().then(setSettings).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    await api.saveSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
    { id: 'transfers', label: 'Transfers', icon: <Zap className="w-4 h-4" /> },
    { id: 'storage', label: 'Storage', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-tg-dark-surface border border-tg-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[580px] z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tg-dark-border bg-tg-dark-bg/60">
          <h2 className="text-base font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Layout: Sidebar Tabs + Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-48 bg-tg-dark-bg/40 border-r border-tg-dark-border p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
          <div className="flex-1 overflow-y-auto p-6 text-sm">
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
                      {authState.connectedVaultTitle || 'Private Vault Channel'}
                    </span>
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
                      onClick={() => setSettings({ ...settings, theme: th as any })}
                      className={`p-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        settings.theme === th
                          ? 'bg-tg-blue-500/20 border-tg-blue-500 text-tg-blue-400'
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
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white mb-2">Security Architecture</h3>
                <div className="p-4 rounded-xl bg-tg-dark-bg/60 border border-tg-dark-border space-y-2 text-xs text-tg-dark-muted">
                  <p>• Zero intermediate central servers.</p>
                  <p>• MTProto encryption directly to Telegram data centers.</p>
                  <p>• Telegram 2FA cloud passwords are never saved on disk.</p>
                  <p>• Sessions stored in OS-protected user directory.</p>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-tg-blue-600 to-tg-blue-400 flex items-center justify-center text-white mx-auto shadow-md">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">TGCloud</h3>
                  <p className="text-xs text-tg-blue-400 mt-0.5">Version 1.0.0 (Tauri + Rust MTProto)</p>
                  <p className="text-xs text-tg-dark-muted mt-2 max-w-sm mx-auto">
                    Personal cloud storage application using your own Telegram account as the storage backend.
                  </p>
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
