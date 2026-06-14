"use client";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ─── Constants ─────────────────────────────────────────────────────────────────
const TYPE_META = {
  zip:     { label: "ZIP", icon: "📦", color: "#C8A96E" },
  pdf:     { label: "PDF", icon: "📄", color: "#CC4A4A" },
  figma:   { label: "FIG", icon: "🎨", color: "#A259FF" },
  archive: { label: "TAR", icon: "🗜️", color: "#4A90D9" },
  md:      { label: " MD", icon: "📝", color: "#3AAA72" },
  video:   { label: "MP4", icon: "🎬", color: "#E8956D" },
  sketch:  { label: "SKT", icon: "✏️", color: "#F7A533" },
  image:   { label: "IMG", icon: "🖼️", color: "#5BA3F0" },
  mp4:     { label: "MP4", icon: "🎬", color: "#E8956D" },
  jpg:     { label: "JPG", icon: "🖼️", color: "#5BA3F0" },
  png:     { label: "PNG", icon: "🖼️", color: "#5BA3F0" },
};

const DUMMY_FILES = [
  { id: "1", name: "brand_assets_v3_FINAL.zip",      size: 48291840,   type: "zip",     date: "2026-06-12", thumbType: null,    color: "#C8A96E" },
  { id: "2", name: "Q2_financial_report.pdf",         size: 2048576,    type: "pdf",     date: "2026-06-11", thumbType: null,    color: "#CC4A4A" },
  { id: "3", name: "product_roadmap_draft.figma",     size: 9437184,    type: "figma",   date: "2026-06-10", thumbType: null,    color: "#A259FF" },
  { id: "4", name: "server_backup_2026-06-09.tar.gz", size: 1073741824, type: "archive", date: "2026-06-09", thumbType: null,    color: "#4A90D9" },
  { id: "5", name: "README.md",                       size: 4096,       type: "md",      date: "2026-06-08", thumbType: null,    color: "#3AAA72" },
  { id: "6", name: "user_interviews_recording.mp4",   size: 524288000,  type: "video",   date: "2026-06-07", thumbType: "video", color: "#E8956D" },
  { id: "7", name: "design_system.sketch",            size: 18874368,   type: "sketch",  date: "2026-06-06", thumbType: null,    color: "#F7A533" },
  { id: "8", name: "team_photo_2026.jpg",             size: 3145728,    type: "image",   date: "2026-06-05", thumbType: "image", color: "#5BA3F0" },
];

// ─── Utils ─────────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${+(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function inferThumbType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "avif"].includes(ext)) return "image";
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return "video";
  return null;
}

function inferType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  return ext in TYPE_META ? ext : "archive";
}

// ─── Thumbnail ─────────────────────────────────────────────────────────────────
function FileThumbnail({ file, size = "sm" }) {
  const h = size === "lg" ? 110 : 44;
  const w = size === "lg" ? "100%" : 44;
  const meta = TYPE_META[file.type] || { label: "?", color: "#888" };

  const baseStyle = {
    width: w, height: h, borderRadius: size === "lg" ? "4px 4px 0 0" : "4px",
    overflow: "hidden", flexShrink: 0, display: "flex",
    alignItems: "center", justifyContent: "center",
  };

  if (file.thumbType === "video") {
    return (
      <div style={{ ...baseStyle, background: file.color + "22" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: file.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
            <path d="M3 2.5l7 3.5-7 3.5V2.5z" />
          </svg>
        </div>
      </div>
    );
  }

  if (file.thumbType === "image") {
    return (
      <div style={{ ...baseStyle, background: file.color + "28" }}>
        <div style={{ width: "55%", height: "55%", background: file.color + "50", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="14" height="10" rx="1" stroke={file.color} strokeWidth="1.2" />
            <circle cx="5.5" cy="6.5" r="1.5" fill={file.color} />
            <path d="M1 11l4-3 3 2.5 2-2 4 3.5" stroke={file.color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    );
  }

  // Generic thumbnail — colored icon on neutral bg
  return (
    <div style={{ ...baseStyle, background: "var(--fv-thumb-bg, #E8E4DD)", flexDirection: "column", gap: 4 }}>
      <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
        <path d="M3 1h10l5 5v15a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" stroke={meta.color} strokeWidth="1.2" fill={meta.color + "18"} />
        <path d="M12 1v6h6" stroke={meta.color} strokeWidth="1.2" />
      </svg>
      {size === "lg" && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: meta.color, letterSpacing: "0.07em" }}>
          {meta.label.trim()}
        </span>
      )}
    </div>
  );
}

// ─── File Type Badge ───────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const meta = TYPE_META[type] || { label: "?" };
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.07em", color: "var(--fv-accent, #4A90D9)", border: "1px solid var(--fv-accent, #4A90D9)", padding: "2px 5px", borderRadius: 2, fontWeight: 700, display: "inline-block", minWidth: 34, textAlign: "center" }}>
      {meta.label}
    </span>
  );
}

// ─── Action Buttons ────────────────────────────────────────────────────────────
function ActionBtns({ file, onDelete, compact = false }) {
  const [dlHov, setDlHov] = useState(false);
  const [delHov, setDelHov] = useState(false);
  const s = compact ? 28 : 30;

  return (
    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
      <button
        onClick={() => alert(`Downloading: ${file.name}`)}
        title="Download"
        onMouseEnter={() => setDlHov(true)} onMouseLeave={() => setDlHov(false)}
        style={{ width: s, height: s, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${dlHov ? "var(--fv-text, #0D0D0D)" : "var(--fv-border, #D8D4CC)"}`, borderRadius: 4, color: dlHov ? "var(--fv-text, #0D0D0D)" : "var(--fv-text2, #555)", cursor: "pointer", transition: "all .1s" }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button
        onClick={() => onDelete(file.id)}
        title="Delete"
        onMouseEnter={() => setDelHov(true)} onMouseLeave={() => setDelHov(false)}
        style={{ width: s, height: s, display: "flex", alignItems: "center", justifyContent: "center", background: delHov ? "#FDF5F500" : "transparent", border: `1px solid ${delHov ? "#CC4A4A" : "var(--fv-border, #D8D4CC)"}`, borderRadius: 4, color: delHov ? "#CC4A4A" : "var(--fv-text3, #999)", cursor: "pointer", transition: "all .1s" }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M6 4V2h4v2M5 4l1 9h4l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
}

// ─── Grid Card ─────────────────────────────────────────────────────────────────
function GridCard({ file, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ border: `1px solid ${hov ? "var(--fv-border2, #C0BBAF)" : "var(--fv-border, #D8D4CC)"}`, borderRadius: 6, overflow: "hidden", background: "var(--fv-bg2, #EFECE7)", transition: "border-color .1s" }}
    >
      <FileThumbnail file={file} size="lg" />
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--fv-text, #0D0D0D)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={file.name}>{file.name}</div>
        <div style={{ fontSize: 10, color: "var(--fv-text3, #999)", marginTop: 3 }}>{formatBytes(file.size)}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <span style={{ fontSize: 10, color: "var(--fv-text3, #999)" }}>{formatDate(file.date)}</span>
          <ActionBtns file={file} onDelete={onDelete} compact />
        </div>
      </div>
    </div>
  );
}

// ─── List Row ──────────────────────────────────────────────────────────────────
function ListRow({ file, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: "12px 20px", borderBottom: "1px solid var(--fv-border, #D8D4CC)", display: "grid", gridTemplateColumns: "42px minmax(0,1fr) 70px auto", alignItems: "center", gap: 14, background: hov ? "var(--fv-bg2, #EFECE7)" : "var(--fv-bg, #F7F6F3)", transition: "background .1s" }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <FileThumbnail file={file} size="sm" />
      </div>
      <div style={{ overflow: "hidden" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--fv-text, #0D0D0D)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</div>
        <div style={{ fontSize: 10, color: "var(--fv-text3, #999)", marginTop: 3 }}>{formatDate(file.date)}</div>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--fv-text2, #555)", textAlign: "right" }}>{formatBytes(file.size)}</div>
      <ActionBtns file={file} onDelete={onDelete} />
    </div>
  );
}

// ─── Upload Progress ───────────────────────────────────────────────────────────
function UploadRow({ upload }) {
  return (
    <div style={{ border: "1px solid var(--fv-border, #D8D4CC)", borderRadius: 6, padding: "12px 20px", marginBottom: 8, background: "var(--fv-bg2, #EFECE7)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 16, height: 16, border: "2px solid var(--fv-accent, #4A90D9)", borderTopColor: "transparent", borderRadius: "50%", animation: "fv-spin .8s linear infinite", flexShrink: 0 }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--fv-text, #0D0D0D)", fontWeight: 500, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{upload.name}</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--fv-accent, #4A90D9)", fontWeight: 600 }}>{Math.round(upload.progress)}%</span>
      </div>
      <div style={{ height: 2, background: "var(--fv-border, #D8D4CC)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${upload.progress}%`, background: "var(--fv-accent, #4A90D9)", transition: "width .15s", borderRadius: 1 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontSize: 10, color: "var(--fv-text3, #999)", letterSpacing: "0.06em" }}>UPLOADING</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--fv-text3, #999)" }}>{formatBytes(upload.size)}</span>
      </div>
    </div>
  );
}

// ─── Dropzone ──────────────────────────────────────────────────────────────────
function Dropzone({ onFilesAdded }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setDrag(true); };
  const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false); };
  const handleDrop = (e) => { e.preventDefault(); setDrag(false); onFilesAdded(Array.from(e.dataTransfer.files)); };

  return (
    <div
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{ border: `2px dashed ${drag ? "var(--fv-accent, #4A90D9)" : "var(--fv-border2, #C0BBAF)"}`, borderRadius: 6, padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, cursor: "pointer", background: drag ? "rgba(74,144,217,0.05)" : "var(--fv-bg, #F7F6F3)", transition: "all .15s", position: "relative", overflow: "hidden" }}
    >
      {drag && <div style={{ position: "absolute", left: 0, right: 0, height: 1, background: "var(--fv-accent, #4A90D9)", opacity: 0.7, animation: "fv-scan 1.2s ease-in-out infinite" }} />}
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: drag ? "var(--fv-accent, #4A90D9)" : "var(--fv-text3, #999)", transition: "color .15s" }}>
        <path d="M14 20V10M8 15l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 23h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: drag ? "var(--fv-accent, #4A90D9)" : "var(--fv-text, #0D0D0D)", letterSpacing: "-0.01em" }}>
          {drag ? "Release to upload" : "Drop files here"}
        </div>
        <div style={{ fontSize: 11, color: "var(--fv-text3, #999)", marginTop: 5 }}>
          or <span style={{ color: "var(--fv-accent, #4A90D9)", textDecorationStyle: "dotted", textDecoration: "underline" }}>click to browse</span> — any file type
        </div>
      </div>
      <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={(e) => { onFilesAdded(Array.from(e.target.files)); e.target.value = ""; }} />
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function FileVaultV2() {
  const [files, setFiles] = useState(DUMMY_FILES);
  const [uploads, setUploads] = useState([]);
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("list"); // "list" | "grid"
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  // CSS variable injection for theming
  const theme = dark ? {
    "--fv-bg": "#111110", "--fv-bg2": "#1A1918", "--fv-bg3": "#252320",
    "--fv-text": "#F0EDE8", "--fv-text2": "#A8A39C", "--fv-text3": "#666",
    "--fv-border": "#2E2C28", "--fv-border2": "#3E3B36",
    "--fv-accent": "#5BA3F0", "--fv-thumb-bg": "#252320",
  } : {
    "--fv-bg": "#F7F6F3", "--fv-bg2": "#EFECE7", "--fv-bg3": "#E8E4DD",
    "--fv-text": "#0D0D0D", "--fv-text2": "#555", "--fv-text3": "#999",
    "--fv-border": "#D8D4CC", "--fv-border2": "#C0BBAF",
    "--fv-accent": "#4A90D9", "--fv-thumb-bg": "#E8E4DD",
  };

  const allTypes = useMemo(() => ["all", ...new Set(files.map(f => f.type))], [files]);

  const filtered = useMemo(() => {
    let arr = [...files];
    if (search) arr = arr.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    if (filterType !== "all") arr = arr.filter(f => f.type === filterType);
    arr.sort((a, b) => {
      if (sortBy === "date-desc") return b.date.localeCompare(a.date);
      if (sortBy === "date-asc") return a.date.localeCompare(b.date);
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "size-desc") return b.size - a.size;
      if (sortBy === "size-asc") return a.size - b.size;
      return 0;
    });
    return arr;
  }, [files, search, filterType, sortBy]);

  const totalSize = files.reduce((a, f) => a + f.size, 0);

  const handleFilesAdded = useCallback((newFiles) => {
    const newUploads = newFiles.map(f => ({ id: `u-${Date.now()}-${Math.random()}`, name: f.name, size: f.size, progress: 0 }));
    setUploads(prev => [...prev, ...newUploads]);
    newUploads.forEach(upload => {
      let p = 0;
      const iv = setInterval(() => {
        p += Math.random() * 18 + 4;
        if (p >= 100) {
          p = 100; clearInterval(iv);
          setTimeout(() => {
            setUploads(prev => prev.filter(u => u.id !== upload.id));
            setFiles(prev => [{
              id: `file-${Date.now()}`, name: upload.name, size: upload.size,
              type: inferType(upload.name), date: new Date().toISOString().split("T")[0],
              thumbType: inferThumbType(upload.name), color: "#4A90D9",
            }, ...prev]);
          }, 300);
        }
        setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress: p } : u));
      }, 100);
    });
  }, []);

  const handleDelete = useCallback((id) => setFiles(prev => prev.filter(f => f.id !== id)), []);

  const btnStyle = (active = false) => ({
    width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
    background: active ? "var(--fv-text, #0D0D0D)" : "transparent",
    border: `1px solid ${active ? "var(--fv-text, #0D0D0D)" : "var(--fv-border, #D8D4CC)"}`,
    borderRadius: 4, color: active ? "var(--fv-bg, #F7F6F3)" : "var(--fv-text2, #555)", cursor: "pointer",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fv-scan { 0%{top:0} 50%{top:100%} 100%{top:0} }
        @keyframes fv-spin  { to { transform: rotate(360deg) } }
        @keyframes fv-fade  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        input[type="text"]:focus { outline: none; border-color: var(--fv-accent) !important; }
        select { appearance: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: var(--fv-border2); border-radius: 2px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--fv-bg, #F7F6F3)", fontFamily: "'Space Grotesk', sans-serif", color: "var(--fv-text, #0D0D0D)", transition: "background .2s, color .2s", ...theme }}>

        {/* Header */}
        <header style={{ borderBottom: `2px solid var(--fv-text, #0D0D0D)`, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, background: "var(--fv-bg, #F7F6F3)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em" }}>VAULT</span>
            <span style={{ width: 1, height: 14, background: "var(--fv-border2, #C0BBAF)" }} />
            <span style={{ fontSize: 11, color: "var(--fv-text3, #999)", letterSpacing: "0.06em" }}>FILE STORAGE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--fv-text2, #555)" }}>
              {files.length} file{files.length !== 1 ? "s" : ""} · {formatBytes(totalSize)}
            </span>
            <button onClick={() => setView(v => v === "list" ? "grid" : "list")} title={view === "list" ? "Grid view" : "List view"} style={btnStyle(false)}>
              {view === "list"
                ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
                : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              }
            </button>
            <button onClick={() => setDark(d => !d)} title={dark ? "Light mode" : "Dark mode"} style={btnStyle(false)}>
              {dark
                ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2"/><path d="M7 1v1M7 12v1M1 7h1M12 7h1M3 3l.7.7M10.3 10.3l.7.7M10.3 3.7L11 3M3.7 10.3L3 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11.5 8.5A5 5 0 015.5 2.5a5.5 5.5 0 100 9 5 5 0 006-3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              }
            </button>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--fv-accent, #4A90D9)", boxShadow: "0 0 0 2px rgba(74,144,217,0.2)" }} title="Connected" />
          </div>
        </header>

        {/* Main */}
        <main style={{ maxWidth: 860, margin: "0 auto", padding: "36px 20px 80px" }}>

          {/* Upload section */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--fv-text3, #999)", letterSpacing: "0.1em" }}>UPLOAD</span>
            <div style={{ flex: 1, height: 1, background: "var(--fv-border, #D8D4CC)" }} />
          </div>
          <Dropzone onFilesAdded={handleFilesAdded} />

          {/* Files section */}
          <div style={{ marginTop: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--fv-text3, #999)", letterSpacing: "0.1em" }}>FILES</span>
              <div style={{ flex: 1, height: 1, background: "var(--fv-border, #D8D4CC)" }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--fv-text3, #999)" }}>{filtered.length}</span>
            </div>

            {/* Search + Filter + Sort toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--fv-text3, #999)", pointerEvents: "none" }}>
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <input
                  type="text" placeholder="Search files…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: "100%", height: 34, padding: "0 12px 0 32px", background: "var(--fv-bg2, #EFECE7)", border: "1px solid var(--fv-border, #D8D4CC)", borderRadius: 4, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "var(--fv-text, #0D0D0D)", transition: "border-color .15s" }}
                />
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {allTypes.map(t => {
                  const active = filterType === t;
                  const label = t === "all" ? "All" : (TYPE_META[t]?.label?.trim() || t.toUpperCase());
                  return (
                    <button key={t} onClick={() => setFilterType(t)}
                      style={{ height: 28, padding: "0 10px", borderRadius: 3, border: `1px solid ${active ? "var(--fv-text, #0D0D0D)" : "var(--fv-border, #D8D4CC)"}`, background: active ? "var(--fv-text, #0D0D0D)" : "var(--fv-bg2, #EFECE7)", color: active ? "var(--fv-bg, #F7F6F3)" : "var(--fv-text2, #555)", fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", cursor: "pointer", transition: "all .1s" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
              <div style={{ position: "relative" }}>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  style={{ height: 34, padding: "0 28px 0 10px", background: "var(--fv-bg2, #EFECE7)", border: "1px solid var(--fv-border, #D8D4CC)", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--fv-text2, #555)", cursor: "pointer" }}>
                  <option value="date-desc">Newest first</option>
                  <option value="date-asc">Oldest first</option>
                  <option value="name-asc">Name A→Z</option>
                  <option value="name-desc">Name Z→A</option>
                  <option value="size-desc">Largest first</option>
                  <option value="size-asc">Smallest first</option>
                </select>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--fv-text3, #999)" }}>
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Upload progress rows */}
            {uploads.map(u => <UploadRow key={u.id} upload={u} />)}

            {/* File list or grid */}
            {filtered.length === 0 && uploads.length === 0 ? (
              <div style={{ padding: "56px 0", textAlign: "center", border: "1px solid var(--fv-border, #D8D4CC)", borderRadius: 6, background: "var(--fv-bg, #F7F6F3)" }}>
                <div style={{ fontSize: 13, color: "var(--fv-text3, #999)", marginBottom: 6 }}>No files match your search.</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--fv-border2, #C0BBAF)" }}>Try a different filter or drop something above.</div>
              </div>
            ) : view === "grid" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                {filtered.map(f => <GridCard key={f.id} file={f} onDelete={handleDelete} />)}
              </div>
            ) : (
              <div style={{ border: "1px solid var(--fv-border, #D8D4CC)", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ padding: "9px 20px", borderBottom: "1px solid var(--fv-border, #D8D4CC)", display: "grid", gridTemplateColumns: "42px minmax(0,1fr) 70px auto", alignItems: "center", gap: 14, background: "var(--fv-bg2, #EFECE7)" }}>
                  <div /><span style={{ fontSize: 10, fontWeight: 700, color: "var(--fv-text3, #999)", letterSpacing: "0.08em" }}>NAME</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--fv-text3, #999)", letterSpacing: "0.08em", textAlign: "right" }}>SIZE</span>
                  <div />
                </div>
                {filtered.map(f => <ListRow key={f.id} file={f} onDelete={handleDelete} />)}
              </div>
            )}

            {files.length > 0 && (
              <div style={{ marginTop: 12, textAlign: "right" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--fv-border2, #C0BBAF)" }}>Total — {formatBytes(totalSize)}</span>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
