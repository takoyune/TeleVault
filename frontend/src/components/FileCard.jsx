import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2, Tag, Info } from 'lucide-react';
import { formatBytes, formatRelativeDate, getFileMeta } from '../utils/files';
import { useVaultStore } from '../store/vaultStore';
import { filesAPI } from '../api/client';
import toast from 'react-hot-toast';

// ── File Icon ─────────────────────────────────────────────────────
function FileIcon({ filename, size = 36 }) {
  const meta = getFileMeta(filename);
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 6,
      background: meta.color + '18',
      border: `1px solid ${meta.color}33`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 1, flexShrink: 0,
    }}>
      <svg width={size * 0.5} height={size * 0.55} viewBox="0 0 20 22" fill="none">
        <path d="M3 1h10l5 5v15a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z"
          stroke={meta.color} strokeWidth="1.4" fill={meta.color + '20'} />
        <path d="M12 1v6h6" stroke={meta.color} strokeWidth="1.4" />
      </svg>
      {size >= 36 && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: size < 48 ? 7 : 9,
          fontWeight: 700,
          color: meta.color,
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}>
          {meta.label}
        </span>
      )}
    </div>
  );
}

// ── Status Indicator ──────────────────────────────────────────────
function StatusDot({ status }) {
  const colors = {
    complete: 'var(--success)',
    uploading: 'var(--accent)',
    pending: 'var(--warning)',
    failed: 'var(--danger)',
  };
  return (
    <div style={{
      width: 6, height: 6, borderRadius: '50%',
      background: colors[status] || 'var(--text-muted)',
      flexShrink: 0,
      animation: status === 'uploading' ? 'tv-pulse 1.5s ease-in-out infinite' : 'none',
    }} />
  );
}

// ── Tag Pill ──────────────────────────────────────────────────────
export function TagPill({ tag, small }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: small ? 9 : 10,
      fontWeight: 600,
      color: 'var(--accent)',
      background: 'var(--accent-dim)',
      border: '1px solid rgba(88,166,255,0.2)',
      borderRadius: 3,
      padding: small ? '1px 5px' : '2px 7px',
      whiteSpace: 'nowrap',
    }}>
      {tag}
    </span>
  );
}

// ── List Row ──────────────────────────────────────────────────────
export function FileListRow({ file, onDelete }) {
  const [hov, setHov] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { deleteFile } = useVaultStore();

  const handleDelete = useCallback(async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${file.original_name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteFile(file.file_id);
      toast.success('File deleted');
      onDelete?.();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  }, [file, deleteFile, onDelete]);

  const handleDownload = useCallback(async (e) => {
    e.stopPropagation();
    try {
      toast.loading(`Downloading ${file.original_name}…`, { id: `dl-${file.file_id}` });
      await filesAPI.download(file.file_id, file.original_name);
      toast.success('Download started', { id: `dl-${file.file_id}` });
    } catch {
      toast.error('Download failed', { id: `dl-${file.file_id}` });
    }
  }, [file]);

  return (
    <div
      onClick={() => navigate(`/files/${file.file_id}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto auto',
        alignItems: 'center',
        gap: 14,
        padding: '11px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: hov ? 'var(--bg-elevated)' : 'transparent',
        cursor: 'pointer',
        transition: 'background var(--transition-fast)',
      }}
    >
      {/* Icon */}
      <FileIcon filename={file.original_name} size={36} />

      {/* Name + meta */}
      <div style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <StatusDot status={file.upload_status} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13, fontWeight: 500,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {file.original_name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            {formatBytes(file.size_bytes)}
          </span>
          <span style={{ color: 'var(--border-default)', fontSize: 10 }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatRelativeDate(file.upload_started)}
          </span>
          {(file.tags || []).slice(0, 3).map(t => (
            <TagPill key={t} tag={t} small />
          ))}
        </div>
      </div>

      {/* Chunks */}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--text-muted)', whiteSpace: 'nowrap',
      }}>
        {file.total_chunks} chunks
      </span>

      {/* Actions */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', gap: 6, opacity: hov ? 1 : 0, transition: 'opacity var(--transition-fast)' }}
      >
        <button
          className="btn btn-icon btn-sm"
          onClick={e => { e.stopPropagation(); navigate(`/files/${file.file_id}`); }}
          title="Details"
        >
          <Info size={13} />
        </button>
        <button
          className="btn btn-icon btn-sm"
          onClick={handleDownload}
          title="Download"
        >
          <Download size={13} />
        </button>
        <button
          className="btn btn-icon btn-sm"
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
          style={{ color: 'var(--danger)', borderColor: 'rgba(248,81,73,0.3)' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Grid Card ─────────────────────────────────────────────────────
export function FileGridCard({ file, onDelete }) {
  const [hov, setHov] = useState(false);
  const navigate = useNavigate();
  const { deleteFile } = useVaultStore();
  const meta = getFileMeta(file.original_name);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hov ? 'var(--border-strong)' : 'var(--border-default)'}`,
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
        transform: hov ? 'translateY(-1px)' : 'none',
      }}
      onClick={() => navigate(`/files/${file.file_id}`)}
    >
      {/* Thumbnail */}
      <div style={{
        height: 100,
        background: meta.color + '12',
        borderBottom: `1px solid ${meta.color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FileIcon filename={file.original_name} size={48} />
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 4,
        }}>
          {file.original_name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          {formatBytes(file.size_bytes)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {formatRelativeDate(file.upload_started)}
          </span>
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            <button
              className="btn btn-icon btn-sm"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  toast.loading(`Downloading ${file.original_name}…`, { id: `dl-${file.file_id}` });
                  await filesAPI.download(file.file_id, file.original_name);
                  toast.success('Download started', { id: `dl-${file.file_id}` });
                } catch {
                  toast.error('Download failed', { id: `dl-${file.file_id}` });
                }
              }}
              title="Download"
              style={{ width: 26, height: 26 }}
            >
              <Download size={11} />
            </button>
            <button
              className="btn btn-icon btn-sm"
              onClick={async () => {
                if (!window.confirm(`Delete "${file.original_name}"?`)) return;
                await deleteFile(file.file_id);
                toast.success('File deleted');
                onDelete?.();
              }}
              title="Delete"
              style={{ width: 26, height: 26, color: 'var(--danger)', borderColor: 'rgba(248,81,73,0.3)' }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
