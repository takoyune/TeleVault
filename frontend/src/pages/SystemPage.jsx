import { useEffect, useState } from 'react';
import { systemAPI } from '../api/client';
import { useVaultStore } from '../store/vaultStore';
import { formatBytes, formatDuration } from '../utils/files';
import {
  Activity, Database, Send, Server,
  RefreshCw, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SystemPage() {
  const { stats, loadStats } = useVaultStore();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [h, s] = await Promise.all([systemAPI.health(), systemAPI.stats()]);
      setHealth(h);
    } catch {
      toast.error('Could not reach backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); loadStats(); }, []);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await systemAPI.verifyIntegrity(null);
      toast.success(`Integrity check complete — ${result.checked_chunks || 0} chunks verified, ${result.failed || 0} failed`);
    } catch {
      toast.error('Integrity check failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="page-content" style={{ animation: 'tv-fade-up 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            System
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Health status, connections, and vault integrity
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={refresh}
          disabled={loading}
          style={{ gap: 8 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          {
            icon: Server, label: 'FastAPI Backend',
            status: 'online', note: 'mock mode active',
            color: 'var(--success)',
          },
          {
            icon: Database, label: 'PostgreSQL',
            status: 'online', note: 'mock mode active',
            color: 'var(--success)',
          },
          {
            icon: Send, label: 'Telegram MTProto',
            status: 'online', note: 'mock mode active',
            color: 'var(--success)',
          },
          {
            icon: Activity, label: 'ARQ Worker',
            status: 'online', note: 'mock mode active',
            color: 'var(--success)',
          },
        ].map(({ icon: Icon, label, status, note, color }) => (
          <div key={label} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: color + '18',
                border: `1px solid ${color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{note}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className={`status-dot online`} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--success)' }}>
                {status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Vault stats */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Vault Statistics</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Total Files',   stats?.total_files?.toLocaleString() ?? '—'],
              ['Vault Size',    formatBytes(stats?.total_size_bytes ?? 0)],
              ['Total Chunks',  stats?.total_chunks?.toLocaleString() ?? '—'],
              ['DB Status',     stats?.db_status ?? 'unknown'],
              ['TG Status',     stats?.telegram_status ?? 'unknown'],
              ['Uptime',        stats?.uptime_seconds != null ? formatDuration(stats.uptime_seconds) : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--mono-data)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security config */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ShieldCheck size={15} color="var(--accent)" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Encryption Config</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Algorithm',       'AES-256-CBC'],
              ['Integrity',       'HMAC-SHA256'],
              ['Key Derivation',  'Argon2id'],
              ['Time Cost',       '2 iterations'],
              ['Memory Cost',     '64 MB'],
              ['Parallelism',     '2 threads'],
              ['Chunk Size',      '1.5 MB (1,572,864 B)'],
              ['Blob Header',     '48 B (IV + HMAC)'],
              ['Max Chunk MTProto', '4 MB'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mono-data)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integrity check */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <ShieldCheck size={15} color="var(--warning)" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Integrity Check</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Verifies HMAC-SHA256 of every stored chunk against the Telegram backend.
              This operation downloads and checks all chunk blobs.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleVerify}
            disabled={verifying}
            style={{ gap: 8, flexShrink: 0, marginLeft: 20 }}
          >
            {verifying ? (
              <><RefreshCw size={14} className="animate-spin" /> Verifying…</>
            ) : (
              <><ShieldCheck size={14} /> Run Check</>
            )}
          </button>
        </div>

        <div style={{
          padding: '10px 14px',
          background: 'var(--warning-dim)',
          border: '1px solid rgba(210,153,34,0.3)',
          borderRadius: 6,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--warning)' }}>
            In mock mode, this simulates a check. In production, it downloads all chunks from Telegram and verifies HMAC integrity.
          </span>
        </div>
      </div>

      {/* .env reference */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Environment Variables</div>
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 6, padding: '14px 16px',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--mono-data)', lineHeight: 1.8,
        }}>
          {[
            'TELEGRAM_API_ID=...',
            'TELEGRAM_API_HASH=...',
            'TELEGRAM_SESSION_STRING=...',
            'TELEGRAM_CHANNEL_ID=...',
            'MASTER_PASSWORD_HINT=optional',
            'DATABASE_URL=postgresql+asyncpg://...',
            'REDIS_URL=redis://:password@localhost:6379/0',
            'POSTGRES_PASSWORD=...',
            'REDIS_PASSWORD=...',
          ].map(line => <div key={line}>{line}</div>)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          Copy <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--mono-data)' }}>.env.example</span> to <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--mono-data)' }}>.env</span> and fill in your values.
        </div>
      </div>
    </div>
  );
}
