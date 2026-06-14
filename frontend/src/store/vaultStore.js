import { create } from 'zustand';
import { authAPI, filesAPI, systemAPI } from '../api/client';

export const useVaultStore = create((set, get) => ({
  // ── Auth ───────────────────────────────────────────────────────
  isUnlocked: !!localStorage.getItem('tv_token'),
  unlocking: false,
  authError: null,
  sessionExpiry: null,

  unlock: async (password) => {
    set({ unlocking: true, authError: null });
    try {
      const result = await authAPI.unlock(password);
      const expiry = Date.now() + (result.expires_in || 3600) * 1000;
      set({ isUnlocked: true, unlocking: false, sessionExpiry: expiry });
      // Load initial data after unlock
      get().loadFiles();
      get().loadStats();
    } catch (err) {
      set({ unlocking: false, authError: err.message || 'Invalid password' });
    }
  },

  lock: async () => {
    await authAPI.lock();
    set({ isUnlocked: false, files: [], stats: null, sessionExpiry: null });
  },

  // ── Files ──────────────────────────────────────────────────────
  files: [],
  filesLoading: false,
  filesError: null,

  loadFiles: async () => {
    set({ filesLoading: true, filesError: null });
    try {
      const data = await filesAPI.list();
      set({ files: data.items, filesLoading: false });
    } catch (err) {
      set({ filesLoading: false, filesError: err.message });
    }
  },

  deleteFile: async (fileId) => {
    await filesAPI.delete(fileId);
    set(s => ({ files: s.files.filter(f => f.file_id !== fileId) }));
  },

  updateFile: async (fileId, updates) => {
    const updated = await filesAPI.update(fileId, updates);
    set(s => ({ files: s.files.map(f => f.file_id === fileId ? { ...f, ...updated } : f) }));
    return updated;
  },

  addFile: (file) => {
    set(s => ({ files: [file, ...s.files.filter(f => f.file_id !== file.file_id)] }));
  },

  // ── Uploads ────────────────────────────────────────────────────
  uploads: [], // { id, name, size, progress, total_chunks, current_chunk }

  startUpload: async (file, meta = {}) => {
    const uploadEntry = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      progress: 0,
      total_chunks: Math.max(1, Math.ceil(file.size / 1572864)),
      current_chunk: 0,
      status: 'uploading',
    };
    set(s => ({ uploads: [...s.uploads, uploadEntry] }));

    try {
      const result = await filesAPI.upload(file, meta, ({ chunk_index, progress_pct }) => {
        set(s => ({
          uploads: s.uploads.map(u =>
            u.id === uploadEntry.id
              ? { ...u, progress: progress_pct, current_chunk: chunk_index + 1 }
              : u
          )
        }));
      });

      // Remove from uploads, add to files
      set(s => ({
        uploads: s.uploads.filter(u => u.id !== uploadEntry.id),
      }));
      get().loadFiles();
      get().loadStats();
      return result;
    } catch (err) {
      set(s => ({
        uploads: s.uploads.map(u =>
          u.id === uploadEntry.id ? { ...u, status: 'failed' } : u
        )
      }));
      throw err;
    }
  },

  removeUpload: (id) => {
    set(s => ({ uploads: s.uploads.filter(u => u.id !== id) }));
  },

  // ── Stats ──────────────────────────────────────────────────────
  stats: null,
  statsLoading: false,

  loadStats: async () => {
    set({ statsLoading: true });
    try {
      const data = await systemAPI.stats();
      set({ stats: data, statsLoading: false });
    } catch {
      set({ statsLoading: false });
    }
  },

  // ── Search/Filter UI state ────────────────────────────────────
  searchQuery: '',
  filterTags: [],
  sortBy: 'date-desc',
  viewMode: 'list', // 'list' | 'grid'

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterTags: (tags) => set({ filterTags: tags }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
