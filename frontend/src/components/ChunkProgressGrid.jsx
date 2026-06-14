// ChunkProgressGrid — Signature TeleVault component
// Renders total_chunks as a grid of small colored squares
// Each cell = one chunk, colored by upload state

import { useState } from 'react';

const CELL_SIZE = 9;    // px
const CELL_GAP  = 2;    // px
const COLS_MAX  = 32;   // columns before wrapping

function getChunkColor(status, index, currentChunk) {
  if (status === 'done'      || status === 'uploaded') return 'var(--chunk-done)';
  if (status === 'failed')                             return 'var(--chunk-failed)';
  if (status === 'uploading' || index === currentChunk) return 'var(--chunk-uploading)';
  return 'var(--chunk-pending)';
}

function getChunkAnimation(status, index, currentChunk) {
  if (status === 'uploading' || index === currentChunk) {
    return 'tv-pulse 1.2s ease-in-out infinite';
  }
  return 'none';
}

export default function ChunkProgressGrid({
  totalChunks = 0,
  // Array of { chunk_index, upload_status } OR a simple upload progress number (0-100)
  chunks = null,
  // If chunks is null, use currentChunk count + total to infer states
  currentChunk = 0,
  progress = 0,    // 0-100
  compact = false,
}) {
  const [tooltip, setTooltip] = useState(null);

  if (!totalChunks || totalChunks === 0) return null;

  // Determine cols
  const cols = Math.min(totalChunks, COLS_MAX);
  const rows = Math.ceil(totalChunks / cols);

  // Build cell data
  const cells = Array.from({ length: totalChunks }, (_, i) => {
    let status = 'pending';
    if (chunks && chunks[i]) {
      status = chunks[i].upload_status === 'uploaded' ? 'done' :
               chunks[i].upload_status === 'failed'   ? 'failed' : 'pending';
    } else {
      // Infer from progress
      const doneCt = Math.floor((progress / 100) * totalChunks);
      if (i < doneCt)          status = 'done';
      else if (i === doneCt)   status = 'uploading';
      else                     status = 'pending';
    }
    return { index: i, status };
  });

  const doneCount    = cells.filter(c => c.status === 'done').length;
  const failedCount  = cells.filter(c => c.status === 'failed').length;
  const pendingCount = cells.filter(c => c.status === 'pending').length;

  const gridWidth  = cols * (CELL_SIZE + CELL_GAP) - CELL_GAP;
  const gridHeight = rows * (CELL_SIZE + CELL_GAP) - CELL_GAP;

  return (
    <div>
      {/* Grid */}
      <div
        style={{
          position: 'relative',
          width: compact ? '100%' : gridWidth,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
          gap: CELL_GAP,
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        {cells.map(cell => (
          <div
            key={cell.index}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              borderRadius: 1.5,
              background: getChunkColor(cell.status, cell.index, currentChunk),
              animation: getChunkAnimation(cell.status, cell.index, currentChunk),
              cursor: 'default',
              transition: 'background var(--transition-fast)',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              const chunkInfo = chunks?.[cell.index];
              setTooltip({
                x: e.currentTarget.offsetLeft,
                y: e.currentTarget.offsetTop,
                text: `Chunk #${cell.index} — ${cell.status}${chunkInfo?.telegram_message_id ? ` — TG:${chunkInfo.telegram_message_id}` : ''}`,
              });
            }}
          />
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            top: tooltip.y - 28,
            left: tooltip.x,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 4,
            padding: '3px 8px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Legend */}
      {!compact && (
        <div style={{
          display: 'flex',
          gap: 16,
          marginTop: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}>
          <LegendItem color="var(--chunk-done)"      label={`${doneCount} done`} />
          {pendingCount > 0 && <LegendItem color="var(--chunk-pending)"   label={`${pendingCount} pending`} />}
          {failedCount > 0  && <LegendItem color="var(--chunk-failed)"    label={`${failedCount} failed`} />}
          <span style={{ marginLeft: 'auto' }}>
            {totalChunks} total chunks
          </span>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: 1.5, background: color, flexShrink: 0 }} />
      <span>{label}</span>
    </div>
  );
}
