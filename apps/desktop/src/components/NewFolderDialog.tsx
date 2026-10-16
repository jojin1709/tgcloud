import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useFiles } from '../context/FilesContext';

interface NewFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewFolderDialog: React.FC<NewFolderDialogProps> = ({ isOpen, onClose }) => {
  const { createFolder } = useFiles();
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    setLoading(true);
    try {
      await createFolder(folderName.trim());
      setFolderName('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-tg-dark-surface border border-tg-dark-border rounded-2xl shadow-2xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-tg-blue-400" />
            <h3 className="text-base font-bold text-white">Create New Folder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-tg-dark-muted hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-tg-dark-muted block mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              placeholder="e.g. Backups, Work, Photos"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              autoFocus
              required
              className="w-full bg-tg-dark-bg border border-tg-dark-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-tg-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-tg-dark-muted hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !folderName.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-tg-blue-500 hover:bg-tg-blue-600 disabled:opacity-50 text-white shadow-md shadow-tg-blue-500/20"
            >
              {loading ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
