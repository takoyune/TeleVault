// ─── File utils ────────────────────────────────────────────────────────────────

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${+(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

// ─── File type detection ──────────────────────────────────────────────────────
export const FILE_TYPE_META = {
  // Archives
  zip:  { label: 'ZIP',  color: '#C8A96E', category: 'archive' },
  tar:  { label: 'TAR',  color: '#4A90D9', category: 'archive' },
  gz:   { label: 'GZ',   color: '#4A90D9', category: 'archive' },
  rar:  { label: 'RAR',  color: '#4A90D9', category: 'archive' },
  '7z': { label: '7Z',   color: '#4A90D9', category: 'archive' },
  // Documents
  pdf:  { label: 'PDF',  color: '#CC4A4A', category: 'document' },
  doc:  { label: 'DOC',  color: '#2B7CD3', category: 'document' },
  docx: { label: 'DOCX', color: '#2B7CD3', category: 'document' },
  txt:  { label: 'TXT',  color: '#8B949E', category: 'document' },
  md:   { label: 'MD',   color: '#3AAA72', category: 'document' },
  // Images
  jpg:  { label: 'JPG',  color: '#5BA3F0', category: 'image' },
  jpeg: { label: 'JPG',  color: '#5BA3F0', category: 'image' },
  png:  { label: 'PNG',  color: '#5BA3F0', category: 'image' },
  gif:  { label: 'GIF',  color: '#5BA3F0', category: 'image' },
  webp: { label: 'WEBP', color: '#5BA3F0', category: 'image' },
  svg:  { label: 'SVG',  color: '#5BA3F0', category: 'image' },
  // Video
  mp4:  { label: 'MP4',  color: '#E8956D', category: 'video' },
  mov:  { label: 'MOV',  color: '#E8956D', category: 'video' },
  avi:  { label: 'AVI',  color: '#E8956D', category: 'video' },
  webm: { label: 'WEBM', color: '#E8956D', category: 'video' },
  // Design
  fig:    { label: 'FIG', color: '#A259FF', category: 'design' },
  figma:  { label: 'FIG', color: '#A259FF', category: 'design' },
  sketch: { label: 'SKT', color: '#F7A533', category: 'design' },
  xd:     { label: 'XD',  color: '#FF61F6', category: 'design' },
  // Code
  js:   { label: 'JS',   color: '#F7DF1E', category: 'code' },
  ts:   { label: 'TS',   color: '#3178C6', category: 'code' },
  py:   { label: 'PY',   color: '#3776AB', category: 'code' },
  json: { label: 'JSON', color: '#8B949E', category: 'code' },
  // Audio
  mp3:  { label: 'MP3',  color: '#FF7B7B', category: 'audio' },
  wav:  { label: 'WAV',  color: '#FF7B7B', category: 'audio' },
};

export function getFileExt(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function getFileMeta(filename) {
  const ext = getFileExt(filename);
  return FILE_TYPE_META[ext] || { label: ext.toUpperCase() || 'BIN', color: '#8B949E', category: 'other' };
}

export function sortFiles(files, sortBy) {
  const arr = [...files];
  switch (sortBy) {
    case 'date-desc': return arr.sort((a, b) => new Date(b.upload_started) - new Date(a.upload_started));
    case 'date-asc':  return arr.sort((a, b) => new Date(a.upload_started) - new Date(b.upload_started));
    case 'name-asc':  return arr.sort((a, b) => a.original_name.localeCompare(b.original_name));
    case 'name-desc': return arr.sort((a, b) => b.original_name.localeCompare(a.original_name));
    case 'size-desc': return arr.sort((a, b) => b.size_bytes - a.size_bytes);
    case 'size-asc':  return arr.sort((a, b) => a.size_bytes - b.size_bytes);
    default:          return arr;
  }
}

export function filterFiles(files, { query, tags }) {
  let arr = [...files];
  if (query) {
    const q = query.toLowerCase();
    arr = arr.filter(f =>
      f.original_name.toLowerCase().includes(q) ||
      (f.description || '').toLowerCase().includes(q) ||
      (f.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }
  if (tags && tags.length > 0) {
    arr = arr.filter(f => tags.some(t => (f.tags || []).includes(t)));
  }
  return arr;
}

export function getAllTags(files) {
  const tagSet = new Set();
  files.forEach(f => (f.tags || []).forEach(t => tagSet.add(t)));
  return [...tagSet].sort();
}

export function truncate(str, maxLen = 40) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '…';
}
