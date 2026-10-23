import React, { useState } from 'react';
import { Bookmark, Highlight } from '../types.ts';
import { exportToMarkdown, exportBackupJSON, parseBackupJSON } from '../utils/highlighter.ts';
import { Download, Upload, Copy, Check, FileText, CheckCircle2 } from 'lucide-react';

interface ExportModalProps {
  bookmarks: Bookmark[];
  highlights: Highlight[];
  onImportData: (data: { bookmarks: Bookmark[]; highlights: Highlight[] }) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  bookmarks,
  highlights,
  onImportData,
}) => {
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string>(bookmarks[0]?.id || '');
  const [copiedMd, setCopiedMd] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const currentBookmark = bookmarks.find(b => b.id === selectedBookmarkId) || bookmarks[0];
  const currentHighlights = currentBookmark ? highlights.filter(h => h.bookmarkId === currentBookmark.id) : [];
  const markdownContent = currentBookmark ? exportToMarkdown(currentBookmark, currentHighlights) : '';

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent).then(() => {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    });
  };

  const handleDownloadMarkdown = () => {
    if (!currentBookmark) return;
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBookmark.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-highlights.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonStr = exportBackupJSON(bookmarks, highlights);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prismmark-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const raw = event.target?.result as string;
      const parsed = parseBackupJSON(raw);
      if (parsed) {
        onImportData(parsed);
        setImportStatus(`Successfully imported ${parsed.bookmarks.length} bookmarks and ${parsed.highlights.length} highlights!`);
      } else {
        alert('Invalid JSON backup file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-2">
          Export, Backup & Obsidian Sync
        </h1>
        <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
          Export your web highlights and notes into portable Markdown or download a full JSON backup. Your reading history is 100% owned by you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Markdown Preview and selector */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Markdown Export</h2>
              <span className="text-xs text-neutral-500">
                Compatible with Obsidian, Notion, Logseq, and Roam
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMd ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>Save .md</span>
              </button>
            </div>
          </div>

          {/* Bookmark dropdown selector */}
          {bookmarks.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Select Article:
              </label>
              <select
                value={selectedBookmarkId}
                onChange={e => setSelectedBookmarkId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer"
              >
                {bookmarks.map(b => {
                  const hlCount = highlights.filter(h => h.bookmarkId === b.id).length;
                  return (
                    <option key={b.id} value={b.id}>
                      {b.title} ({hlCount} highlights)
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Markdown preview box */}
          <div className="relative">
            <textarea
              readOnly
              rows={12}
              value={markdownContent}
              className="w-full p-4 font-mono text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: Full Backup & Restore */}
        <div className="space-y-6">
          {/* JSON Full Backup */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Full Database Backup</h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Export all {bookmarks.length} bookmarks and {highlights.length} highlights into a single JSON file.
            </p>
            <button
              onClick={handleDownloadJSON}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Restore JSON Backup */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Import / Restore Backup</h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Restore bookmarks and highlights from a previously exported Markwise JSON file.
            </p>

            <label className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 border-dashed rounded-lg text-xs font-semibold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose Backup File (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {importStatus && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
