import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { filesAPI } from '../api/client';
import { useVaultStore } from '../store/vaultStore';
import ChunkProgressGrid from '../components/ChunkProgressGrid';
import { TagPill } from '../components/FileCard';
import {
  formatBytes, formatDate, getFileMeta, getFileExt
} from '../utils/files';
import {
  ArrowLeft, Download, Trash2, Tag, Shield,
  Hash, Calendar, Layers, Edit3, Check, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FileDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteFile, updateFile } = useVaultStore();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editTags, setEditTags] = useState(false);
  const [editDesc, setEditDesc] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    filesAPI.get(id).then(data => {
      setFile(data);
      setTagInput((data.tags || []).join(', '));
      setDescInput(data.description || '');
      setLoading(false);
    }).catch(() => {
      toast.error('File not found');
      navigate('/files');
    });
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${file.original_name}"? This will remove all ${file.total_chunks} Telegram chunks.`)) return;
    await deleteFile(id);
    toast.success('File deleted');
    navigate('/files');
  };

  const handleSaveTags = async () => {
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const updated = await updateFile(id, { tags, description: file.description });
    setFile(f => ({ ...f, tags: updated.tags }));
    setEditTags(false);
    toast.success('Tags saved');
  };

  const handleSaveDesc = async () => {
    const updated = await updateFile(id, { tags: file.tags, description: descInput });
    setFile(f => ({ ...f, description: updated.description }));
    setEditDesc(false);
    toast.success('Description saved');
  };

  const handleDownload = async () => {
    try {
      toast.loading(`Downloading ${file.original_name}…`, { id: `dl-${file.file_id}` });
      await filesAPI.download(file.file_id, file.original_name);
      toast.success('Download started', { id: `dl-${file.file_id}` });
    } catch {
      toast.error('Download failed', { id: `dl-${file.file_id}` });
    }
  };

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{
          height: 80, borderRadius: 6,
          background: 'var(--bg-elevated)',
          animation: 'tv-pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );

  if (!file) return null;
  const meta = getFileMeta(file.original_name);

  return (
    <div className="page-content" style={{ animation: 'tv-fade-up 0.3s ease' }}>
      {/* Back */}
      <button
        onClick={() => navigate('/files')}
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 20, gap: 6 }}
      >
        <ArrowLeft size={13} /> Back to Files
      </button>

      {/* File header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 16,
        marginBottom: 28,
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, flexShrink: 0,
          borderRadius: 10,
          background: meta.color + '18',
          border: `1px solid ${meta.color}33`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2,
        }}>
          <svg width={28} height={30} viewBox="0 0 20 22" fill="none">
            <path d="M3 1h10l5 5v15a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z"
              stroke={meta.color} strokeWidth="1.4" fill={meta.color + '20'} />
            <path d="M12 1v6h6" stroke={meta.color} strokeWidth="1.4" />
          </svg>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
            color: meta.color, letterSpacing: '0.04em',
          }}>
            {meta.label}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700,
            color: 'var(--text-primary)', marginBottom: 8,
            wordBreak: 'break-all',
          }}>
            {file.original_name}
          </h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <MetaBadge icon={Hash} label={file.file_id.slice(0, 12) + '…'} mono />
            <MetaBadge icon={Calendar} label={formatDate(file.upload_started)} />
            <span className={`badge ${file.upload_status === 'complete' ? 'badge-success' : 'badge-warning'}`}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
              {file.upload_status}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={handleDownload}>
            <Download size={14} /> Download
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
        {/* Left: Chunk map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Chunk Grid */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            }}>
              <Layers size={15} color="var(--text-muted)" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Chunk Map</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {file.total_chunks} × 1.5 MB
              </span>
            </div>
            <ChunkProgressGrid
              totalChunks={file.total_chunks}
              chunks={file.chunks}
              progress={file.upload_status === 'complete' ? 100 : 0}
            />
          </div>

          {/* Description */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Description</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditDesc(true)}>
                <Edit3 size={12} /> Edit
              </button>
            </div>
            {editDesc ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  className="input"
                  value={descInput}
                  onChange={e => setDescInput(e.target.value)}
                  style={{ height: 80, resize: 'none', padding: '8px 12px', fontFamily: 'var(--font-ui)' }}
                  placeholder="Add a description…"
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveDesc}><Check size={12} /> Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditDesc(false); setDescInput(file.description || ''); }}><X size={12} /></button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: file.description ? 'var(--text-secondary)' : 'var(--text-disabled)', fontStyle: file.description ? 'normal' : 'italic' }}>
                {file.description || 'No description. Click Edit to add one.'}
              </p>
            )}
          </div>
        </div>

        {/* Right: Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* File metadata */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>File Metadata</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['File ID',      <span className="mono-block">{file.file_id}</span>],
                ['Size',         <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--mono-data)' }}>{formatBytes(file.size_bytes)}</span>],
                ['MIME Type',    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{file.mime_type}</span>],
                ['Total Chunks', <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--mono-data)' }}>{file.total_chunks}</span>],
                ['Upload Start', formatDate(file.upload_started)],
                ['Upload End',   formatDate(file.upload_finished)],
                ['Status',       <span className={`badge ${file.upload_status === 'complete' ? 'badge-success' : 'badge-warning'}`}>{file.upload_status}</span>],
              ].map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{key}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', textAlign: 'right', wordBreak: 'break-all' }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag size={14} color="var(--text-muted)" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Tags</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditTags(t => !t)}>
                <Edit3 size={12} /> Edit
              </button>
            </div>

            {editTags ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  className="input"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="design, finance, backup…"
                  autoFocus
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Separate tags with commas
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveTags}><Check size={12} /> Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditTags(false); setTagInput((file.tags || []).join(', ')); }}><X size={12} /></button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(file.tags || []).length > 0
                  ? file.tags.map(t => <TagPill key={t} tag={t} />)
                  : <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No tags</span>
                }
              </div>
            )}
          </div>

          {/* Security */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Shield size={14} color="var(--accent)" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Security</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Encryption', 'AES-256-CBC'],
                ['Integrity',  'HMAC-SHA256'],
                ['Key Derive', 'Argon2id'],
                ['Key Size',   '256-bit'],
                ['IV Size',    '128-bit'],
                ['HMAC Size',  '256-bit'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mono-data)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaBadge({ icon: Icon, label, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <Icon size={12} color="var(--text-muted)" />
      <span style={{
        fontSize: 12, color: 'var(--text-muted)',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
      }}>
        {label}
      </span>
    </div>
  );
}
