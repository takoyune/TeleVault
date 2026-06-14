import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useVaultStore } from '../store/vaultStore';
import {
  LayoutDashboard, Files, Upload, Settings,
  Lock, Shield, ChevronRight, HardDrive
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/files',   icon: Files,           label: 'Files' },
  { to: '/upload',  icon: Upload,          label: 'Upload' },
  { to: '/system',  icon: Settings,        label: 'System' },
];

export default function Sidebar() {
  const { lock, stats } = useVaultStore();
  const navigate = useNavigate();
  const [locking, setLocking] = useState(false);

  const handleLock = async () => {
    setLocking(true);
    await lock();
    setLocking(false);
    navigate('/unlock');
  };

  return (
    <aside style={{
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-default)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--accent)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={16} color="#0D1117" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              TELEVAULT
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              ENCRYPTED STORAGE
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--bg-elevated)' : 'transparent',
              border: `1px solid ${isActive ? 'var(--border-default)' : 'transparent'}`,
              transition: 'all var(--transition-fast)',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} color={isActive ? 'var(--accent)' : 'currentColor'} />
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && <ChevronRight size={12} color="var(--text-muted)" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Storage info */}
      {stats && (
        <div style={{
          margin: '0 12px 8px',
          padding: '12px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <HardDrive size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Storage</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
            {stats.total_files} files
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {stats.total_chunks?.toLocaleString()} chunks
          </div>
        </div>
      )}

      {/* Lock button */}
      <div style={{ padding: '8px 12px 20px' }}>
        <button
          onClick={handleLock}
          disabled={locking}
          className="btn btn-secondary"
          style={{ width: '100%', gap: 8, color: 'var(--danger)', borderColor: 'var(--danger-dim)' }}
        >
          <Lock size={14} />
          {locking ? 'Locking…' : 'Lock Vault'}
        </button>
      </div>
    </aside>
  );
}
