// Mock API client — returns realistic fake data for Phase 1
// In Phase 2, switch BASE_URL to the real FastAPI backend

import axios from 'axios';

// Real FastAPI backend (via Vite dev proxy)
const USE_MOCK = false;
const BASE_URL = '/api/v1';

// ── Axios instance ────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tv_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Helpers ───────────────────────────────────────────────────────
function formatId() {
  return crypto.randomUUID();
}
function delay(ms = 400) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Mock Data ─────────────────────────────────────────────────────
const MOCK_FILES = [
  { file_id: 'f-001', original_name: 'brand_assets_v3_FINAL.zip',      size_bytes: 48291840,   mime_type: 'application/zip',    upload_status: 'complete', upload_started: '2026-06-12T10:00:00Z', upload_finished: '2026-06-12T10:02:15Z', total_chunks: 32, tags: ['design', 'brand'], description: 'Brand assets archive' },
  { file_id: 'f-002', original_name: 'Q2_financial_report.pdf',         size_bytes: 2048576,    mime_type: 'application/pdf',    upload_status: 'complete', upload_started: '2026-06-11T09:00:00Z', upload_finished: '2026-06-11T09:00:45Z', total_chunks: 2,  tags: ['finance', 'Q2'], description: 'Q2 financial summary' },
  { file_id: 'f-003', original_name: 'product_roadmap_draft.figma',     size_bytes: 9437184,    mime_type: 'application/octet-stream', upload_status: 'complete', upload_started: '2026-06-10T14:00:00Z', upload_finished: '2026-06-10T14:01:30Z', total_chunks: 6,  tags: ['product', 'design'], description: '' },
  { file_id: 'f-004', original_name: 'server_backup_2026-06-09.tar.gz', size_bytes: 1073741824, mime_type: 'application/gzip',   upload_status: 'complete', upload_started: '2026-06-09T02:00:00Z', upload_finished: '2026-06-09T02:18:40Z', total_chunks: 683, tags: ['backup', 'server'], description: 'Weekly server backup' },
  { file_id: 'f-005', original_name: 'README.md',                       size_bytes: 4096,       mime_type: 'text/markdown',      upload_status: 'complete', upload_started: '2026-06-08T11:00:00Z', upload_finished: '2026-06-08T11:00:05Z', total_chunks: 1,  tags: ['docs'], description: '' },
  { file_id: 'f-006', original_name: 'user_interviews_recording.mp4',   size_bytes: 524288000,  mime_type: 'video/mp4',          upload_status: 'complete', upload_started: '2026-06-07T16:00:00Z', upload_finished: '2026-06-07T16:09:20Z', total_chunks: 334, tags: ['research', 'video'], description: 'June user research session' },
  { file_id: 'f-007', original_name: 'design_system.sketch',            size_bytes: 18874368,   mime_type: 'application/octet-stream', upload_status: 'complete', upload_started: '2026-06-06T13:00:00Z', upload_finished: '2026-06-06T13:02:00Z', total_chunks: 12, tags: ['design'], description: '' },
  { file_id: 'f-008', original_name: 'team_photo_2026.jpg',             size_bytes: 3145728,    mime_type: 'image/jpeg',         upload_status: 'complete', upload_started: '2026-06-05T10:00:00Z', upload_finished: '2026-06-05T10:00:30Z', total_chunks: 2,  tags: ['team'], description: '' },
];

let _files = [...MOCK_FILES];

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  async unlock(password) {
    if (USE_MOCK) {
      await delay(800);
      // Accept any non-empty password in mock mode
      if (!password || password.trim() === '') throw new Error('Password required');
      const token = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('tv_token', token);
      return { access_token: token, expires_in: 3600 };
    }
    const res = await api.post('/auth/unlock', { master_password: password });
    localStorage.setItem('tv_token', res.data.access_token);
    return res.data;
  },

  async lock() {
    if (USE_MOCK) {
      await delay(300);
      localStorage.removeItem('tv_token');
      return { ok: true };
    }
    await api.post('/auth/lock');
    localStorage.removeItem('tv_token');
  },

  async status() {
    if (USE_MOCK) {
      const token = localStorage.getItem('tv_token');
      return { unlocked: !!token };
    }
    const res = await api.get('/auth/status');
    return res.data;
  },
};

// ── Files ─────────────────────────────────────────────────────────
export const filesAPI = {
  async list({ page = 1, limit = 50, sort = 'upload_started:desc', status = 'complete' } = {}) {
    if (USE_MOCK) {
      await delay(300);
      return { items: _files, total: _files.length, page, limit };
    }
    const res = await api.get('/files', { params: { page, limit, sort, status } });
    return res.data;
  },

  async get(fileId) {
    if (USE_MOCK) {
      await delay(200);
      const file = _files.find(f => f.file_id === fileId);
      if (!file) throw new Error('File not found');
      // Generate mock chunks
      const chunks = Array.from({ length: file.total_chunks }, (_, i) => ({
        chunk_id: `ch-${i}`,
        chunk_index: i,
        upload_status: 'uploaded',
        telegram_message_id: 100000 + i,
        size_bytes: Math.min(1572864, file.size_bytes - i * 1572864),
      }));
      return { ...file, chunks };
    }
    const res = await api.get(`/files/${fileId}`);
    return res.data;
  },

  async search({ q, tags, mime, page = 1, limit = 50 } = {}) {
    if (USE_MOCK) {
      await delay(200);
      let arr = [..._files];
      if (q) arr = arr.filter(f => f.original_name.toLowerCase().includes(q.toLowerCase()) || (f.description || '').toLowerCase().includes(q.toLowerCase()));
      if (tags && tags.length > 0) arr = arr.filter(f => tags.some(t => f.tags.includes(t)));
      if (mime) arr = arr.filter(f => f.mime_type === mime);
      return { items: arr, total: arr.length, page, limit };
    }
    const res = await api.get('/files/search', { params: { q, tags: tags?.join(','), mime, page, limit } });
    return res.data;
  },

  async update(fileId, { description, tags }) {
    if (USE_MOCK) {
      await delay(300);
      _files = _files.map(f => f.file_id === fileId ? { ...f, description, tags } : f);
      return _files.find(f => f.file_id === fileId);
    }
    const res = await api.patch(`/files/${fileId}`, { description, tags });
    return res.data;
  },

  async delete(fileId) {
    if (USE_MOCK) {
      await delay(400);
      _files = _files.filter(f => f.file_id !== fileId);
      return { ok: true };
    }
    await api.delete(`/files/${fileId}`);
  },

  async upload(file, { tags = [], description = '' } = {}, onProgress) {
    if (USE_MOCK) {
      // Simulate chunked upload with progress
      const totalChunks = Math.max(1, Math.ceil(file.size / 1572864));
      const newFile = {
        file_id: formatId(),
        original_name: file.name,
        size_bytes: file.size,
        mime_type: file.type || 'application/octet-stream',
        upload_status: 'uploading',
        upload_started: new Date().toISOString(),
        upload_finished: null,
        total_chunks: totalChunks,
        tags,
        description,
      };
      _files = [newFile, ..._files];

      return new Promise((resolve) => {
        let chunk = 0;
        const interval = setInterval(() => {
          chunk++;
          const pct = Math.min(100, Math.round((chunk / totalChunks) * 100));
          onProgress?.({ chunk_index: chunk - 1, total_chunks: totalChunks, progress_pct: pct });
          if (chunk >= totalChunks) {
            clearInterval(interval);
            const done = {
              ...newFile,
              upload_status: 'complete',
              upload_finished: new Date().toISOString(),
            };
            _files = _files.map(f => f.file_id === done.file_id ? done : f);
            resolve(done);
          }
        }, 80);
      });
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tags', tags.join(','));
    formData.append('description', description);
    const res = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress({ chunk_index: 0, total_chunks: 1, progress_pct: Math.round((evt.loaded / evt.total) * 100) });
        }
      },
    });
    return res.data;
  },

  async download(fileId, filename) {
    if (USE_MOCK) {
      await delay(500);
      const file = _files.find(f => f.file_id === fileId);
      const blob = new Blob([`Mock download of ${file?.original_name || fileId}`], { type: 'text/plain' });
      triggerDownload(blob, filename || 'download.bin');
      return;
    }
    const res = await api.get(`/files/${fileId}/download`, { responseType: 'blob' });
    triggerDownload(res.data, filename || 'download.bin');
  },
};

function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ── System ────────────────────────────────────────────────────────
export const systemAPI = {
  async health() {
    if (USE_MOCK) {
      return {
        status: 'ready',
        db: 'connected',
        telegram: 'connected',
        vault_unlocked: !!localStorage.getItem('tv_token'),
      };
    }
    const res = await axios.get('/health/ready');
    return res.data;
  },

  async stats() {
    if (USE_MOCK) {
      const totalSize = _files.reduce((a, f) => a + f.size_bytes, 0);
      const totalChunks = _files.reduce((a, f) => a + f.total_chunks, 0);
      return {
        total_files: _files.length,
        total_size_bytes: totalSize,
        total_chunks: totalChunks,
        db_status: 'connected',
        telegram_status: 'connected',
        uptime_seconds: 86400,
      };
    }
    const res = await api.get('/system/stats');
    return res.data;
  },

  async verifyIntegrity(fileId) {
    if (USE_MOCK) {
      await delay(2000);
      return { ok: true, checked_chunks: _files.find(f => f.file_id === fileId)?.total_chunks || 0, failed: 0 };
    }
    const res = await api.post('/system/verify-integrity', { file_id: fileId });
    return res.data;
  },
};
