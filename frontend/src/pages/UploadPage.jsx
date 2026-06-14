import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVaultStore } from '../store/vaultStore';
import Dropzone from '../components/Dropzone';
import UploadRow from '../components/UploadRow';
import { Upload, X, Tag, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const { uploads, startUpload } = useVaultStore();
  const navigate = useNavigate();
  const [tagInput, setTagInput] = useState('');
  const [description, setDescription] = useState('');

  const handleFilesAdded = useCallback(async (files) => {
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    for (const file of files) {
      try {
        await startUpload(file, { tags, description });
        toast.success(`${file.name} uploaded!`);
      } catch (err) {
        toast.error(`Failed: ${file.name}`);
      }
    }
  }, [tagInput, description, startUpload]);

  return (
    <div className="page-content" style={{ animation: 'tv-fade-up 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Upload Files
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Files are chunked, AES-256 encrypted, and stored on Telegram
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Upload area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Dropzone */}
          <Dropzone onFilesAdded={handleFilesAdded} />

          {/* Active uploads */}
          {uploads.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span className="section-label">Active Transfers ({uploads.length})</span>
                <div className="divider" />
              </div>
              {uploads.map(u => <UploadRow key={u.id} upload={u} />)}
            </div>
          )}

          {/* How it works */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>How It Works</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { step: '01', label: 'Derive keys', desc: 'Argon2id derives AES + HMAC keys from master password' },
                { step: '02', label: 'Chunk file',  desc: 'File split into 1.5 MB chunks on the server' },
                { step: '03', label: 'Encrypt',     desc: 'Each chunk encrypted with AES-256-CBC + unique IV' },
                { step: '04', label: 'Store',       desc: 'Encrypted blobs uploaded to private Telegram channel' },
                { step: '05', label: 'Index',       desc: 'Chunk map (index → TG message ID) saved to PostgreSQL' },
              ].map(({ step, label, desc }) => (
                <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                    color: 'var(--accent)', background: 'var(--accent-dim)',
                    border: '1px solid rgba(88,166,255,0.2)',
                    borderRadius: 3, padding: '2px 6px', flexShrink: 0, marginTop: 1,
                  }}>
                    {step}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Options sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Tags */}
          <div className="card" style={{ padding: 18 }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
              marginBottom: 10,
            }}>
              <Tag size={13} /> Tags
            </label>
            <input
              className="input"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="design, finance, backup…"
              style={{ fontSize: 13 }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Separate with commas. Applied to all files in this batch.
            </div>
            {tagInput && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                {tagInput.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                    color: 'var(--accent)', background: 'var(--accent-dim)',
                    border: '1px solid rgba(88,166,255,0.2)',
                    borderRadius: 3, padding: '2px 7px',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card" style={{ padding: 18 }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
              marginBottom: 10,
            }}>
              <FileText size={13} /> Description
            </label>
            <textarea
              className="input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional note about this upload…"
              style={{ height: 80, resize: 'none', padding: '8px 12px', fontFamily: 'var(--font-ui)', fontSize: 13 }}
            />
          </div>

          {/* Limits info */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Storage Limits
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Max file size',    '2 GB (MTProto)'],
                ['Chunk size',       '1.5 MB'],
                ['Max concurrent',   '3 uploads'],
                ['File retention',   'Permanent'],
                ['Encryption',       'Per-file keys'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mono-data)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scenarios info */}
          <div className="card" style={{ padding: 18, borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Failure Recovery & Scenarios
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { title: 'Server Crashes / Restarts', desc: 'Active uploads are paused. Because we track sessions and chunk maps in the database, the server will resume exactly where it left off.' },
                { title: 'Network Disconnects', desc: 'The client retries automatically up to 5 times with exponential backoff before marking the chunk as failed.' },
                { title: 'Telegram API Limits', desc: 'If Telegram rate-limits the bot (FloodWaitError), the server automatically pauses and waits for the required cooldown period.' }
              ].map(({ title, desc }) => (
                <div key={title}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
