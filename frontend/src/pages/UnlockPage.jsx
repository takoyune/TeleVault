import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVaultStore } from '../store/vaultStore';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';

export default function UnlockPage() {
  const { unlock, unlocking, authError } = useVaultStore();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await unlock(password);
    const { isUnlocked } = useVaultStore.getState();
    if (isUnlocked) navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {/* Background grid pattern */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.3,
      }} />

      <div style={{
        position: 'relative',
        width: '100%', maxWidth: 400,
        animation: 'tv-fade-up 0.4s ease',
      }}>
        {/* Lock card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          padding: 40,
          boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              width: 64, height: 64,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              animation: 'tv-glow 3s ease-in-out infinite',
            }}>
              <Shield size={28} color="var(--accent)" />
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700,
              fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text-primary)',
              marginBottom: 6,
            }}>
              TELEVAULT
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Enter your master password to unlock
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 4 }}>
              Keys are derived locally via Argon2id — never transmitted
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: 'var(--text-muted)', letterSpacing: '0.06em',
                textTransform: 'uppercase', marginBottom: 6,
              }}>
                Master Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={14}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  className="input"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter master password…"
                  autoFocus
                  style={{
                    paddingLeft: 36, paddingRight: 40, height: 44,
                    fontSize: 14, letterSpacing: show ? 0 : '0.1em',
                    borderColor: authError ? 'var(--danger)' : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {authError && (
                <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>
                  {authError}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={unlocking || !password}
              style={{ width: '100%', marginTop: 4 }}
            >
              {unlocking ? (
                <>
                  <div className="animate-spin" style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(0,0,0,0.3)',
                    borderTopColor: '#0D1117',
                    borderRadius: '50%',
                  }} />
                  Deriving key…
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Unlock Vault
                </>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div style={{
            marginTop: 24,
            padding: '10px 14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            fontSize: 11,
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>DEMO MODE</span>
            {' '}— Enter any password to continue
          </div>
        </div>

        {/* Encryption badges */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20,
        }}>
          {['AES-256-CBC', 'HMAC-SHA256', 'Argon2id KEK'].map(label => (
            <div key={label} style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
              color: 'var(--text-disabled)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 3,
              padding: '3px 8px',
              letterSpacing: '0.04em',
            }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
