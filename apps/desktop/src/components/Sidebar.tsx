import {
  Folder,
  Clock,
  Star,
  Trash2,
  Settings as SettingsIcon,
  LogOut,
  ShieldCheck,
  Send,
  Zap,
  X,
} from 'lucide-react';
import { ActiveNavSection, useFiles } from '../context/FilesContext';
import { useAuth } from '../context/AuthContext';
import { formatBytes } from '../lib/utils';

interface SidebarProps {
  onOpenSettings: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenSettings,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { navSection, setNavSection, stats } = useFiles();
  const { authState, logout, isTauri } = useAuth();
  const user = authState.user;

  const navItems: { id: ActiveNavSection; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'files', label: 'My Files', icon: <Folder className="w-4 h-4" /> },
    { id: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" /> },
    { id: 'starred', label: 'Starred', icon: <Star className="w-4 h-4" />, count: stats?.starredFiles },
    { id: 'trash', label: 'Trash', icon: <Trash2 className="w-4 h-4" />, count: stats?.trashFiles },
  ];

  const totalBytes = stats?.totalBytesUsed || 0;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full bg-tg-dark-surface border-r border-tg-dark-border flex flex-col justify-between select-none transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 md:z-auto md:shrink-0 ${
        isOpenMobile ? 'translate-x-0 shadow-2xl shadow-black/80' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* App Header & Branding */}
      <div>
        <div className="p-4 pb-3 flex items-center justify-between border-b border-tg-dark-border/60">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="TGCloud Logo" className="w-9 h-9 rounded-xl shadow-md shadow-tg-blue-500/20 object-cover" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">TGCloud</span>
                <span className="text-[10px] font-semibold bg-tg-blue-500/20 text-tg-blue-400 border border-tg-blue-500/30 px-1.5 py-0.5 rounded">
                  MTProto
                </span>
              </div>
              <p className="text-[11px] text-tg-dark-muted flex items-center gap-1">
                <Send className="w-2.5 h-2.5 text-tg-blue-400" />
                Telegram Storage
              </p>
            </div>
          </div>

          {/* Close drawer button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-tg-dark-muted/80">
            Storage Views
          </div>
          {navItems.map((item) => {
            const isActive = navSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setNavSection(item.id);
                  onCloseMobile?.();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-tg-blue-500 text-white shadow-sm shadow-tg-blue-500/30 font-semibold'
                    : 'text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-tg-blue-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-tg-dark-border text-tg-dark-muted'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Storage Usage Widget */}
        <div className="mx-3 mt-4 p-3.5 rounded-xl bg-tg-dark-bg/60 border border-tg-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-tg-dark-muted flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Telegram Vault
            </span>
            <span className="text-[11px] font-medium text-tg-blue-400">Unlimited</span>
          </div>
          <div className="w-full bg-tg-dark-border h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-tg-blue-500 to-tg-blue-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, (totalBytes / (1024 * 1024 * 1024 * 10)) * 100))}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-tg-dark-muted">
            <span className="text-white font-medium">{formatBytes(totalBytes)}</span>
            <span>{stats?.totalFiles || 0} Files</span>
          </div>
        </div>
      </div>

      {/* User Footer Profile & Settings */}
      <div className="p-3 border-t border-tg-dark-border/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-tg-dark-bg/50 border border-tg-dark-border/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-tg-blue-600/30 border border-tg-blue-500/40 text-tg-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.firstName} {user?.lastName || ''}
                </span>
                {user?.isPremium && (
                  <span title="Telegram Premium">
                    <ShieldCheck className="w-3 h-3 text-tg-blue-400 shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-[10px] text-tg-dark-muted truncate">
                {user?.username ? `@${user.username}` : user?.phone || 'Connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onOpenSettings();
                onCloseMobile?.();
              }}
              className="p-1.5 rounded-lg text-tg-dark-muted hover:text-white hover:bg-tg-dark-surfaceHover transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                logout();
                onCloseMobile?.();
              }}
              className="p-1.5 rounded-lg text-tg-dark-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isTauri && (
          <div className="mt-2 text-center text-[10px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 py-1 px-2 rounded-md">
            Demo Mode (Web Preview)
          </div>
        )}
      </div>
    </aside>
  );
};
