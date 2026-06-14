import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useVaultStore } from '../store/vaultStore';
import { getAllTags } from '../utils/files';

export default function SearchBar() {
  const {
    files, searchQuery, setSearchQuery,
    filterTags, setFilterTags,
    sortBy, setSortBy,
    viewMode, setViewMode,
  } = useVaultStore();

  const allTags = getAllTags(files);

  const toggleTag = (tag) => {
    setFilterTags(
      filterTags.includes(tag)
        ? filterTags.filter(t => t !== tag)
        : [...filterTags, tag]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      {/* Search input row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            className="input"
            type="text"
            placeholder="Search files, tags, descriptions…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              height: 36, padding: '0 28px 0 10px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)',
              fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="name-asc">Name A→Z</option>
            <option value="name-desc">Name Z→A</option>
            <option value="size-desc">Largest first</option>
            <option value="size-asc">Smallest first</option>
          </select>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 3 }}>
          <button
            className={`btn btn-icon ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
            style={{ width: 36, height: 36 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className={`btn btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
            style={{ width: 36, height: 36 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterTags([])}
            style={{
              height: 26, padding: '0 10px', borderRadius: 3, cursor: 'pointer',
              border: `1px solid ${filterTags.length === 0 ? 'var(--accent)' : 'var(--border-default)'}`,
              background: filterTags.length === 0 ? 'var(--accent-dim)' : 'var(--bg-elevated)',
              color: filterTags.length === 0 ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.05em', transition: 'all var(--transition-fast)',
            }}
          >
            ALL
          </button>
          {allTags.map(tag => {
            const active = filterTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  height: 26, padding: '0 10px', borderRadius: 3, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border-default)'}`,
                  background: active ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                  transition: 'all var(--transition-fast)',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
