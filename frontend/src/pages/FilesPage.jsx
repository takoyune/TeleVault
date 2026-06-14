import { useEffect, useMemo } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { FileListRow, FileGridCard } from '../components/FileCard';
import SearchBar from '../components/SearchBar';
import UploadRow from '../components/UploadRow';
import { filterFiles, sortFiles, formatBytes } from '../utils/files';
import { Files, FolderOpen } from 'lucide-react';

export default function FilesPage() {
  const {
    files, filesLoading, loadFiles,
    uploads,
    searchQuery, filterTags, sortBy, viewMode,
  } = useVaultStore();

  useEffect(() => {
    loadFiles();
  }, []);

  const displayFiles = useMemo(() => {
    const filtered = filterFiles(files, { query: searchQuery, tags: filterTags });
    return sortFiles(filtered, sortBy);
  }, [files, searchQuery, filterTags, sortBy]);

  const totalSize = files.reduce((a, f) => a + f.size_bytes, 0);

  return (
    <div className="page-content" style={{ animation: 'tv-fade-up 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            File Browser
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {files.length} files · {formatBytes(totalSize)} encrypted
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <SearchBar />

      {/* Active uploads */}
      {uploads.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span className="section-label">Uploading ({uploads.length})</span>
            <div className="divider" />
          </div>
          {uploads.map(u => <UploadRow key={u.id} upload={u} />)}
        </div>
      )}

      {/* File count line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span className="section-label">Files</span>
        <div className="divider" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          {displayFiles.length}
        </span>
      </div>

      {/* Loading skeleton */}
      {filesLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              height: 60, borderRadius: 6,
              background: 'var(--bg-elevated)',
              animation: 'tv-pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!filesLoading && displayFiles.length === 0 && (
        <div className="empty-state" style={{
          border: '1px solid var(--border-default)', borderRadius: 8,
        }}>
          <FolderOpen size={40} color="var(--border-strong)" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
            {searchQuery || filterTags.length > 0 ? 'No files match your search.' : 'No files yet. Drop some above!'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>
            {searchQuery ? 'Try a different search term or clear filters.' : ''}
          </div>
        </div>
      )}

      {/* List view */}
      {!filesLoading && displayFiles.length > 0 && viewMode === 'list' && (
        <div style={{
          border: '1px solid var(--border-default)',
          borderRadius: 8, overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '44px 1fr auto auto',
            gap: 14, padding: '8px 16px',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-default)',
          }}>
            <div />
            <span className="section-label">Name</span>
            <span className="section-label">Chunks</span>
            <div style={{ width: 88 }} />
          </div>
          {displayFiles.map(f => (
            <FileListRow key={f.file_id} file={f} />
          ))}
        </div>
      )}

      {/* Grid view */}
      {!filesLoading && displayFiles.length > 0 && viewMode === 'grid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 10,
        }}>
          {displayFiles.map(f => (
            <FileGridCard key={f.file_id} file={f} />
          ))}
        </div>
      )}

      {/* Footer total */}
      {displayFiles.length > 0 && (
        <div style={{ marginTop: 14, textAlign: 'right' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
            {displayFiles.length} files · {formatBytes(displayFiles.reduce((a, f) => a + f.size_bytes, 0))} total
          </span>
        </div>
      )}
    </div>
  );
}
