import { X } from 'lucide-react';
import { formatBytes } from '../utils/files';
import ChunkProgressGrid from './ChunkProgressGrid';
import { useVaultStore } from '../store/vaultStore';

export default function UploadRow({ upload }) {
  const { removeUpload } = useVaultStore();

  const isDone = upload.status === 'done' || upload.progress >= 100;
  const isFailed = upload.status === 'failed';

  return (
    <div
      className="card"
      style={{
        padding: '14px 16px',
        marginBottom: 8,
        animation: 'tv-fade-up 0.2s ease',
        borderColor: isFailed ? 'var(--danger-dim)' : 'var(--border-default)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {/* Spinner or done indicator */}
          {!isDone && !isFailed && (
            <div style={{
              width: 14, height: 14, flexShrink: 0,
              border: '2px solid var(--border-default)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'tv-spin 0.8s linear infinite',
            }} />
          )}
          {isDone && (
            <div style={{
              width: 14, height: 14, flexShrink: 0,
              borderRadius: '50%',
              background: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          {isFailed && (
            <div style={{
              width: 14, height: 14, flexShrink: 0,
              borderRadius: '50%', background: 'var(--danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={8} color="white" />
            </div>
          )}

          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {upload.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
            color: isFailed ? 'var(--danger)' : isDone ? 'var(--success)' : 'var(--accent)',
          }}>
            {isFailed ? 'FAILED' : isDone ? 'DONE' : `${Math.round(upload.progress)}%`}
          </span>
          <button
            className="btn btn-icon btn-sm"
            onClick={() => removeUpload(upload.id)}
            style={{ width: 24, height: 24 }}
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Chunk progress grid */}
      <div style={{ position: 'relative' }}>
        <ChunkProgressGrid
          totalChunks={upload.total_chunks}
          progress={upload.progress}
          compact
        />
      </div>

      {/* Sub-line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)', letterSpacing: '0.06em',
        }}>
          {isFailed ? 'UPLOAD FAILED' : isDone ? 'ENCRYPTED & STORED' : 'ENCRYPTING & UPLOADING'}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          {formatBytes(upload.size)}
          {upload.total_chunks > 0 && ` · ${upload.current_chunk || 0}/${upload.total_chunks} chunks have been sent to Telegram`}
        </span>
      </div>
    </div>
  );
}
