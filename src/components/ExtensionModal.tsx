import React, { useState } from 'react';
import { BOOKMARKLET_CODE, generateChromeOperaExtensionZip } from '../utils/extensionGenerator.ts';
import { Download, Copy, Check, Chrome, Compass, ExternalLink, Sparkles, HelpCircle } from 'lucide-react';

export const ExtensionModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bookmarklet' | 'extension'>('bookmarklet');
  const [browserGuide, setBrowserGuide] = useState<'chrome' | 'opera'>('chrome');
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(BOOKMARKLET_CODE).then(() => {
      setCopiedBookmarklet(true);
      setTimeout(() => setCopiedBookmarklet(false), 2000);
    });
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      const blob = await generateChromeOperaExtensionZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Markwise-Chrome-Opera-Extension.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate extension zip', err);
      alert('Could not generate extension zip. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title & Introduction */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Chrome & Opera Integration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-2">
          Highlight Live Pages in Chrome or Opera
        </h1>
        <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
          Highlight passages in multiple colors, bookmark articles with tags, and activate distraction-free reader mode directly on any live webpage.
        </p>
      </div>

      {/* Segmented Switcher: Instant Bookmarklet vs Full Extension */}
      <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-xl max-w-md mb-8">
        <button
          onClick={() => setActiveTab('bookmarklet')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'bookmarklet'
              ? 'bg-white text-neutral-900 shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          1. Instant Bookmarklet (Zero Install)
        </button>
        <button
          onClick={() => setActiveTab('extension')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'extension'
              ? 'bg-white text-neutral-900 shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          2. Full Chrome / Opera Extension
        </button>
      </div>

      {activeTab === 'bookmarklet' ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-neutral-900 mb-2">
              Drag-and-Drop Bookmarklet
            </h2>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Works instantly in <strong>Google Chrome</strong>, <strong>Opera</strong>, Brave, and Edge with no permissions or developer mode required.
            </p>

            {/* Draggable Button Box */}
            <div className="p-6 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center mb-6">
              <p className="text-xs font-medium text-amber-900 mb-3">
                👇 Drag this button directly into your Chrome or Opera Bookmarks Bar:
              </p>
              <a
                href={BOOKMARKLET_CODE}
                onClick={e => {
                  e.preventDefault();
                  alert('Drag this button to your Bookmarks Bar (Ctrl+Shift+B or Cmd+Shift+B to show bookmarks bar). Or click "Copy Script" below!');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 font-bold text-sm rounded-xl shadow-md cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-105"
                title="Drag me to your Bookmarks Bar!"
              >
                <span>🖍️ Markwise Highlighter</span>
              </a>
              <p className="text-[11px] text-amber-800/80 mt-3">
                Shortcut to show Bookmarks Bar: <kbd className="px-1.5 py-0.5 bg-white rounded border border-amber-300 font-mono text-[10px]">Ctrl+Shift+B</kbd> (Windows) or <kbd className="px-1.5 py-0.5 bg-white rounded border border-amber-300 font-mono text-[10px]">Cmd+Shift+B</kbd> (Mac)
              </p>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-4 text-xs text-neutral-700 mb-6">
              <h3 className="font-bold text-sm text-neutral-900">How to use on any webpage:</h3>
              <ol className="space-y-2 list-decimal list-inside pl-1 text-neutral-600 leading-relaxed">
                <li>Visit any website in Chrome or Opera (e.g. Wikipedia, a blog post, or a news article).</li>
                <li>Click <strong>Markwise Highlighter</strong> in your bookmarks bar.</li>
                <li>A floating toolbar appears with 6 vibrant highlight colors, a Reader View switch, and an Export button.</li>
                <li>Select text on the page to highlight it or toggle Reader Mode for distraction-free reading!</li>
              </ol>
            </div>

            {/* Copy button */}
            <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
              <button
                onClick={handleCopyBookmarklet}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedBookmarklet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBookmarklet ? 'Copied script to clipboard!' : 'Copy Bookmarklet Code'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 mb-1">
                  Download Markwise Manifest V3 Extension
                </h2>
                <p className="text-sm text-neutral-600">
                  Ready-to-load browser extension package for Chrome and Opera.
                </p>
              </div>
              <button
                onClick={handleDownloadZip}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all hover:scale-105 shrink-0"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>{isDownloading ? 'Building zip...' : 'Download .zip Package'}</span>
              </button>
            </div>

            {/* Browser Guide Switcher */}
            <div className="mt-6 mb-4">
              <div className="flex items-center gap-2 text-xs font-medium mb-3">
                <span className="text-neutral-500">Choose your browser:</span>
                <button
                  onClick={() => setBrowserGuide('chrome')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    browserGuide === 'chrome'
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <Chrome className="w-3.5 h-3.5" />
                  Google Chrome
                </button>
                <button
                  onClick={() => setBrowserGuide('opera')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    browserGuide === 'opera'
                      ? 'bg-red-50 text-red-700 font-semibold border border-red-200'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  Opera Browser
                </button>
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 space-y-2.5 leading-relaxed">
                {browserGuide === 'chrome' ? (
                  <>
                    <p className="font-semibold text-neutral-900">Chrome Installation (30 Seconds):</p>
                    <p>1. Download and extract the <strong>Markwise-Chrome-Opera-Extension.zip</strong> file to a folder.</p>
                    <p>2. In Chrome, open a new tab and go to <code className="px-1.5 py-0.5 bg-white rounded border border-neutral-300 font-mono">chrome://extensions</code></p>
                    <p>3. Toggle on <strong>"Developer mode"</strong> in the top-right corner of the page.</p>
                    <p>4. Click the <strong>"Load unpacked"</strong> button in the top-left.</p>
                    <p>5. Select the extracted extension folder. You're done! The Markwise highlighter is now active on all websites.</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-neutral-900">Opera Installation (30 Seconds):</p>
                    <p>1. Download and unzip the <strong>Markwise-Chrome-Opera-Extension.zip</strong> file.</p>
                    <p>2. In Opera, type <code className="px-1.5 py-0.5 bg-white rounded border border-neutral-300 font-mono">opera://extensions</code> in the address bar.</p>
                    <p>3. Enable the <strong>"Developer Mode"</strong> toggle switch in the top-right.</p>
                    <p>4. Click the <strong>"Load unpacked"</strong> button.</p>
                    <p>5. Choose the unzipped folder. Markwise will now automatically run across any webpage in Opera!</p>
                  </>
                )}
              </div>
            </div>

            {/* Extension features summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-neutral-100 text-xs text-neutral-600">
              <div className="p-3 bg-neutral-50 rounded-lg">
                <span className="font-semibold block text-neutral-900 mb-1">🎨 6 Color Palette</span>
                Highlight text dynamically on any webpage with yellow, green, blue, pink, purple, or orange.
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <span className="font-semibold block text-neutral-900 mb-1">📖 Instant Reader</span>
                Strips away intrusive ads and sidebar junk to give you a serene reading view.
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <span className="font-semibold block text-neutral-900 mb-1">📋 1-Click Export</span>
                Export highlights into Markdown formatted with quotations and page metadata.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
