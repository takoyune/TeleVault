import { useState, useEffect } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { Lock, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VaultLockBanner() {
  const { sessionExpiry, lock } = useVaultStore();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!sessionExpiry) return;
    const update = () => {
      const diff = sessionExpiry - Date.now();
      if (diff <= 0) {
        setTimeLeft('expired');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${String(secs).padStart(2, '0')}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [sessionExpiry]);

  const handleLock = async () => {
    await lock();
    navigate('/unlock');
  };

  const isExpiring = sessionExpiry && (sessionExpiry - Date.now() < 300000); // < 5 min

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '8px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--success)',
          boxShadow: '0 0 0 3px var(--success-dim)',
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.04em',
        }}>
          🔓 VAULT UNLOCKED
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {timeLeft && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={11} color={isExpiring ? 'var(--warning)' : 'var(--text-muted)'} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: isExpiring ? 'var(--warning)' : 'var(--text-muted)',
            }}>
              {timeLeft}
            </span>
          </div>
        )}
        <button
          onClick={handleLock}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 11,
            fontFamily: 'var(--font-mono)',
            padding: '2px 0',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--danger)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
        >
          <Lock size={11} />
          LOCK NOW
        </button>
      </div>
    </div>
  );
}
