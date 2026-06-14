import { useState, useRef } from 'react';
import { UploadCloud, FolderOpen } from 'lucide-react';

export default function Dropzone({ onFilesAdded, compact = false }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver  = e => { e.preventDefault(); setDrag(true); };
  const handleDragLeave = e => { if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false); };
  const handleDrop      = e => {
    e.preventDefault();
    setDrag(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFilesAdded(files);
  };

  const height = compact ? 120 : 200;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        position: 'relative',
        height,
        border: `2px dashed ${drag ? 'var(--accent)' : 'var(--border-strong)'}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        cursor: 'pointer',
        background: drag ? 'var(--accent-dim)' : 'var(--bg-surface)',
        transition: 'all var(--transition-mid)',
        overflow: 'hidden',
      }}
    >
      {/* Scan line when dragging */}
      {drag && (
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 2,
          background: 'var(--accent)',
          opacity: 0.6,
          animation: 'tv-scan 1.4s ease-in-out infinite',
          top: 0,
        }} />
      )}

      <div style={{
        width: 48, height: 48,
        background: drag ? 'var(--accent-dim)' : 'var(--bg-elevated)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${drag ? 'var(--accent)' : 'var(--border-default)'}`,
        transition: 'all var(--transition-mid)',
      }}>
        <UploadCloud
          size={22}
          color={drag ? 'var(--accent)' : 'var(--text-muted)'}
          style={{ transition: 'color var(--transition-mid)' }}
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: drag ? 'var(--accent)' : 'var(--text-primary)',
          marginBottom: 5,
          transition: 'color var(--transition-mid)',
        }}>
          {drag ? 'Release to upload' : 'Drop files here to encrypt & store'}
        </div>
        {!compact && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            or{' '}
            <span style={{ color: 'var(--accent)', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
              browse files
            </span>
            {' '}— any type, any size
          </div>
        )}
        {!compact && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, marginTop: 10,
          }}>
            {['AES-256', 'HMAC-SHA256', 'Argon2id'].map(label => (
              <span key={label} style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                color: 'var(--text-muted)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 3,
                padding: '2px 6px',
                letterSpacing: '0.04em',
              }}>
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={e => {
          const files = Array.from(e.target.files);
          if (files.length) onFilesAdded(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
