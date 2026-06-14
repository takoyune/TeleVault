import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVaultStore } from '../store/vaultStore';
import { Files, Upload, HardDrive, Layers, Clock, ArrowRight } from 'lucide-react';
import { formatBytes, formatRelativeDate } from '../utils/files';

export default function DashboardPage() {
  const { files, stats, statsLoading, loadFiles, loadStats } = useVaultStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadFiles();
    loadStats();
  }, []);

  const recentFiles = [...files]
    .sort((a, b) => new Date(b.upload_started) - new Date(a.upload_started))
    .slice(0, 5);

  const totalSize = files.reduce((a, f) => a + f.size_bytes, 0);

  return (
    <div className="page-content" style={{ animation: 'tv-fade-up 0.3s ease' }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 24, fontWeight: 700,
          color: 'var(--text-primary)', marginBottom: 4,
        }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Your encrypted vault overview
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12, marginBottom: 32,
      }}>
        <StatCard
          icon={Files} label="Total Files"
          value={files.length}
          sub={`${recentFiles.length > 0 ? formatRelativeDate(recentFiles[0]?.upload_started) : '—'} last upload`}
          loading={statsLoading}
        />
        <StatCard
          icon={HardDrive} label="Vault Size"
          value={formatBytes(totalSize)}
          sub="encrypted on Telegram"
          loading={statsLoading}
        />
        <StatCard
          icon={Layers} label="Total Chunks"
          value={(stats?.total_chunks || files.reduce((a, f) => a + f.total_chunks, 0)).toLocaleString()}
          sub="stored as TG documents"
          loading={statsLoading}
        />
        <StatCard
          icon={Upload} label="Upload Zone"
          value="+"
          sub="Drop files to upload"
          loading={false}
          onClick={() => navigate('/upload')}
          accent
        />
      </div>

      {/* Two-column row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent files */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} color="var(--text-muted)" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Recent Uploads</span>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/files')}
              style={{ gap: 4, fontSize: 12 }}
            >
              View all <ArrowRight size={11} />
            </button>
          </div>

          {recentFiles.length === 0 ? (
            <div className="empty-state">
              <Files className="empty-state-icon" size={32} />
              <span>No files yet</span>
            </div>
          ) : (
            recentFiles.map(file => (
              <div
                key={file.file_id}
                onClick={() => navigate(`/files/${file.file_id}`)}
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 5,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 9,
                  fontWeight: 700, color: 'var(--text-muted)',
                }}>
                  {file.original_name.split('.').pop().toUpperCase().slice(0, 3)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {file.original_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {formatBytes(file.size_bytes)} · {file.total_chunks} chunks
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {formatRelativeDate(file.upload_started)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* System status */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>System Status</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/system')} style={{ gap: 4, fontSize: 12 }}>
              Details <ArrowRight size={11} />
            </button>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'FastAPI Backend',      status: 'online', note: 'mock mode' },
              { label: 'PostgreSQL Database',  status: 'online', note: 'mock mode' },
              { label: 'Telegram MTProto',     status: 'online', note: 'mock mode' },
              { label: 'ARQ Worker',           status: 'online', note: 'mock mode' },
              { label: 'Redis Queue',          status: 'online', note: 'mock mode' },
            ].map(({ label, status, note }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={`status-dot ${status}`} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                  {note}
                </span>
              </div>
            ))}
          </div>

          {/* Encryption info block */}
          <div style={{
            margin: '0 16px 16px',
            padding: '12px 14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>
              ENCRYPTION SCHEME
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['Algorithm', 'AES-256-CBC'],
                ['Integrity', 'HMAC-SHA256'],
                ['Key Derivation', 'Argon2id'],
                ['Chunk Size', '1.5 MB'],
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

function StatCard({ icon: Icon, label, value, sub, loading, onClick, accent }) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        border: accent ? '1px solid var(--accent-dim)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="stat-label">{label}</span>
        <Icon size={14} color={accent ? 'var(--accent)' : 'var(--text-muted)'} />
      </div>
      {loading ? (
        <div style={{ height: 24, background: 'var(--bg-elevated)', borderRadius: 4, animation: 'tv-pulse 1.5s ease-in-out infinite' }} />
      ) : (
        <div className="stat-value" style={{ color: accent ? 'var(--accent)' : 'var(--text-primary)', fontSize: 28 }}>
          {value}
        </div>
      )}
      <div className="stat-sub">{sub}</div>
    </div>
  );
}
