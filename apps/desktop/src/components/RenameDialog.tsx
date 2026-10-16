import React, { useEffect, useState } from 'react';
import { X, Edit2 } from 'lucide-react';

interface RenameDialogProps {
  isOpen: boolean;
  initialName: string;
  itemType: 'file' | 'folder';
  onClose: () => void;
  onConfirm: (newName: string) => Promise<void>;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  isOpen,
  initialName,
  itemType,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onConfirm(name.trim());
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
            <Edit2 className="w-5 h-5 text-tg-blue-400" />
            <h3 className="text-base font-bold text-white capitalize">Rename {itemType}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-tg-dark-muted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-tg-dark-muted block mb-1.5">
              New {itemType} name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-tg-blue-500 hover:bg-tg-blue-600 disabled:opacity-50 text-white shadow-md shadow-tg-blue-500/20"
            >
              {loading ? 'Saving...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
