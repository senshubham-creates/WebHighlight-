import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bookmark,
  Highlight,
  HighlightColor,
  COLOR_CONFIG,
  ReaderSettings,
  ReaderTheme,
  ReaderFont,
  ReaderWidth,
  AISummary,
  AISynthesis,
  AIExplanation,
} from '../types.ts';
import {
  ArrowLeft,
  Settings2,
  Highlighter,
  MessageSquare,
  Tag,
  Copy,
  Trash2,
  Volume2,
  VolumeX,
  Share2,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  FileText,
  Sliders,
  Sparkles,
  Brain,
  ListFilter,
  Layers,
  BookOpen,
} from 'lucide-react';
import { createHighlight, exportToMarkdown } from '../utils/highlighter.ts';
import { fetchAISummary, fetchAIExplanation, fetchAISynthesis } from '../utils/aiClient.ts';

interface ReaderViewProps {
  bookmark: Bookmark;
  highlights: Highlight[];
  onBack: () => void;
  onAddHighlight: (highlight: Highlight) => void;
  onUpdateHighlight: (highlight: Highlight) => void;
  onDeleteHighlight: (id: string) => void;
  onUpdateBookmarkStatus: (id: string, status: 'unread' | 'reading' | 'completed') => void;
  onUpdateBookmarkTags?: (id: string, tags: string[]) => void;
  currentTheme?: ReaderTheme;
  onSelectTheme?: (theme: ReaderTheme) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  bookmark,
  highlights,
  onBack,
  onAddHighlight,
  onUpdateHighlight,
  onDeleteHighlight,
  onUpdateBookmarkStatus,
  onUpdateBookmarkTags,
  currentTheme = 'anime',
  onSelectTheme,
}) => {
  // Reader display settings
  const [settings, setSettings] = useState<ReaderSettings>({
    theme: currentTheme,
    font: 'serif',
    fontSize: 19,
    lineHeight: 1.75,
    maxWidth: 'medium',
    align: 'left',
  });

  // Keep reader theme synced with app-wide theme
  useEffect(() => {
    if (currentTheme && currentTheme !== settings.theme) {
      setSettings(s => ({ ...s, theme: currentTheme }));
    }
  }, [currentTheme]);

  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showHighlightsDrawer, setShowHighlightsDrawer] = useState(true);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [viewMode, setViewMode] = useState<'reader' | 'original'>('reader');

  // Text selection & floating toolbar state
  const [selectionRange, setSelectionRange] = useState<{
    text: string;
    rect: { top: number; left: number; width: number; height: number };
    paragraphIndex?: number;
  } | null>(null);

  // Active clicked highlight for inline popover
  const [activeHighlightPopover, setActiveHighlightPopover] = useState<{
    highlight: Highlight;
    x: number;
    y: number;
  } | null>(null);

  // Note editor for active highlight popover
  const [editingNote, setEditingNote] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  // Text to Speech
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Scroll reading progress
  const [scrollProgress, setScrollProgress] = useState(0);
  const articleContentRef = useRef<HTMLDivElement>(null);

  // Filter highlights drawer
  const [drawerColorFilter, setDrawerColorFilter] = useState<HighlightColor | 'all'>('all');
  const [drawerSearch, setDrawerSearch] = useState('');

  // AI Integration state
  const [aiTab, setAiTab] = useState<'summary' | 'synthesis'>('summary');
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSynthesis, setAiSynthesis] = useState<AISynthesis | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [aiExplanationPopover, setAiExplanationPopover] = useState<AIExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [appliedTagsSuccess, setAppliedTagsSuccess] = useState(false);

  // Page highlights
  const pageHighlights = useMemo(() => {
    return highlights.filter(h => h.bookmarkId === bookmark.id);
  }, [highlights, bookmark.id]);

  const filteredPageHighlights = useMemo(() => {
    return pageHighlights.filter(h => {
      if (drawerColorFilter !== 'all' && h.color !== drawerColorFilter) return false;
      if (drawerSearch.trim()) {
        const q = drawerSearch.toLowerCase();
        const inText = h.text.toLowerCase().includes(q);
        const inNote = h.note ? h.note.toLowerCase().includes(q) : false;
        const inTag = h.tags.some(t => t.toLowerCase().includes(q));
        if (!inText && !inNote && !inTag) return false;
      }
      return true;
    });
  }, [pageHighlights, drawerColorFilter, drawerSearch]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      if (total > 0) {
        const pct = Math.min(100, Math.max(0, Math.round((el.scrollTop / total) * 100)));
        setScrollProgress(pct);
        if (pct > 80 && bookmark.status !== 'completed') {
          onUpdateBookmarkStatus(bookmark.id, 'completed');
        } else if (pct > 10 && bookmark.status === 'unread') {
          onUpdateBookmarkStatus(bookmark.id, 'reading');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [bookmark.id, bookmark.status, onUpdateBookmarkStatus]);

  // Handle selection detection
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setSelectionRange(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length === 0) {
      setSelectionRange(null);
      return;
    }

    // Ensure selection is within article content container
    if (articleContentRef.current && articleContentRef.current.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      let pIdx: number | undefined;
      let node: Node | null = sel.anchorNode;
      while (node && node !== articleContentRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).dataset.paragraphIndex) {
          pIdx = parseInt((node as HTMLElement).dataset.paragraphIndex!, 10);
          break;
        }
        node = node.parentNode;
      }

      setSelectionRange({
        text,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        paragraphIndex: pIdx,
      });
      setActiveHighlightPopover(null);
    }
  };

  // Create highlight from selection
  const handleCreateHighlight = (color: HighlightColor) => {
    if (!selectionRange) return;

    const newHl = createHighlight({
      bookmarkId: bookmark.id,
      text: selectionRange.text,
      color: color,
      paragraphIndex: selectionRange.paragraphIndex,
    });

    onAddHighlight(newHl);
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  // AI Explain Selected text
  const handleAiExplainSelection = async () => {
    if (!selectionRange) return;
    try {
      setIsExplaining(true);
      const explanation = await fetchAIExplanation(
        selectionRange.text,
        bookmark.content.slice(0, 1500),
        bookmark.title
      );
      setAiExplanationPopover(explanation);
    } catch (err) {
      console.error('Failed to explain selection', err);
    } finally {
      setIsExplaining(false);
    }
  };

  // AI Generate Summary
  const handleGenerateSummary = async () => {
    try {
      setIsSummarizing(true);
      const res = await fetchAISummary(bookmark.title, bookmark.content, pageHighlights);
      setAiSummary(res);
    } catch (err) {
      console.error('Failed to summarize', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // AI Synthesize Highlights
  const handleGenerateSynthesis = async () => {
    try {
      setIsSynthesizing(true);
      const res = await fetchAISynthesis(bookmark.title, pageHighlights);
      setAiSynthesis(res);
    } catch (err) {
      console.error('Failed to synthesize', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Apply AI recommended tags to bookmark
  const handleApplyAiTags = () => {
    if (aiSummary?.recommendedTags && onUpdateBookmarkTags) {
      const merged = Array.from(new Set([...bookmark.tags, ...aiSummary.recommendedTags]));
      onUpdateBookmarkTags(bookmark.id, merged);
      setAppliedTagsSuccess(true);
      setTimeout(() => setAppliedTagsSuccess(false), 2000);
    }
  };

  // Text-to-speech reading
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${bookmark.title}. By ${bookmark.byline || 'Unknown author'}. ${bookmark.content}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Jump to highlight in text
  const handleJumpToHighlight = (hl: Highlight) => {
    const el = document.getElementById(`rendered-hl-${hl.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-jump-target');
      setTimeout(() => {
        el.classList.remove('highlight-jump-target');
      }, 1500);
    } else if (hl.paragraphIndex !== undefined) {
      const pEl = document.getElementById(`paragraph-${hl.paragraphIndex}`);
      if (pEl) {
        pEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Export to markdown copy
  const handleCopyMarkdown = () => {
    const md = exportToMarkdown(bookmark, pageHighlights);
    navigator.clipboard.writeText(md).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    });
  };

  // Render paragraphs with multi-color highlight annotations applied
  const paragraphs = useMemo(() => {
    return bookmark.content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  }, [bookmark.content]);

  // Theme container classes
  const themeClasses: Record<ReaderTheme, string> = {
    light: 'reader-theme-light',
    sepia: 'reader-theme-sepia',
    slate: 'reader-theme-slate',
    charcoal: 'reader-theme-charcoal',
    night: 'reader-theme-night',
    'e-ink': 'reader-theme-e-ink',
    minimal: 'reader-theme-minimal',
    anime: 'reader-theme-anime',
  };

  const fontClasses: Record<ReaderFont, string> = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
  };

  const widthClasses: Record<ReaderWidth, string> = {
    narrow: 'max-w-xl',
    medium: 'max-w-2xl',
    wide: 'max-w-4xl',
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${themeClasses[settings.theme]}`}
      onMouseUp={handleMouseUp}
    >
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-neutral-200/40">
        <div
          className="h-full bg-amber-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Reader Mode Sticky Top Control Bar */}
      <div className="sticky top-0 z-40 bg-inherit/90 backdrop-blur-md border-b border-black/10 px-4 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Back button & title */}
          <div className="flex items-center gap-3 truncate">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer text-inherit"
              title="Return to Bookmarks Library"
              aria-label="Back to library"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="truncate">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                {bookmark.siteName}
              </span>
              <h2 className="text-sm font-semibold truncate leading-tight">
                {bookmark.title}
              </h2>
            </div>
          </div>

          {/* Reader controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Toggle: Reader View vs Original */}
            <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-black/5 text-xs font-medium mr-1">
              <button
                onClick={() => setViewMode('reader')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'reader' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'opacity-70 hover:opacity-100'
                }`}
              >
                Reader Mode
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'original' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'opacity-70 hover:opacity-100'
                }`}
              >
                Source View
              </button>
            </div>

            {/* AI Assistant Button */}
            <button
              onClick={() => {
                setShowAiDrawer(!showAiDrawer);
                if (!aiSummary && !isSummarizing) {
                  handleGenerateSummary();
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                showAiDrawer
                  ? 'bg-amber-500 text-white shadow-xs font-semibold'
                  : 'bg-black/5 hover:bg-black/10 text-inherit'
              }`}
              title="Open Gemini AI Assistant"
              aria-label="AI Assistant"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Insights</span>
            </button>

            {/* Text to Speech button */}
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isSpeaking ? 'bg-amber-500 text-white' : 'hover:bg-black/5 text-inherit'
              }`}
              title={isSpeaking ? 'Stop reading aloud' : 'Read aloud with Text-to-Speech'}
              aria-label={isSpeaking ? 'Stop read aloud' : 'Read aloud'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Typography & Appearance Settings */}
            <button
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                showSettingsPanel ? 'bg-black/10' : 'hover:bg-black/5'
              }`}
              title="Typography & Appearance Settings"
              aria-label="Typography settings"
            >
              <Sliders className="w-4 h-4 text-inherit" />
            </button>

            {/* Highlights Drawer Toggle */}
            <button
              onClick={() => setShowHighlightsDrawer(!showHighlightsDrawer)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                showHighlightsDrawer ? 'bg-black/10' : 'hover:bg-black/5'
              }`}
              title="Toggle Highlights Drawer"
              aria-label="Toggle highlights drawer"
            >
              <Highlighter className="w-4 h-4 text-amber-500" />
              <span className="font-mono tabular-nums font-semibold">{pageHighlights.length}</span>
              <span className="hidden md:inline">Highlights</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Dropdown Drawer / Panel with E-Ink & Minimal Themes */}
      {showSettingsPanel && (
        <div className="border-b border-black/10 bg-inherit/95 px-6 py-4 shadow-sm transition-colors">
          <div className="max-w-3xl mx-auto flex flex-col gap-4 text-sm">
            {/* Theme picker (Includes Light, Sepia, Slate, Charcoal, Night OLED, E-Ink, Minimal) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <span className="font-medium text-xs opacity-75">Theme:</span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'light', label: 'Light', bg: '#ffffff', text: '#171717', border: '#e5e7eb' },
                  { id: 'sepia', label: 'Sepia', bg: '#fbf0d9', text: '#433422', border: '#e2d4b7' },
                  { id: 'e-ink', label: 'E-Ink Paper', bg: '#f0eee7', text: '#1a1a1a', border: '#d1cfc7' },
                  { id: 'minimal', label: 'Minimal', bg: '#ffffff', text: '#09090b', border: '#e4e4e7' },
                  { id: 'anime', label: '💥 Anime Pop', bg: '#fef8e2', text: '#000000', border: '#000000' },
                  { id: 'slate', label: 'Slate', bg: '#f1f5f9', text: '#1e293b', border: '#cbd5e1' },
                  { id: 'charcoal', label: 'Charcoal', bg: '#23272e', text: '#e2e8f0', border: '#374151' },
                  { id: 'night', label: 'Night OLED', bg: '#0d1117', text: '#c9d1d9', border: '#21262d' },
                ].map(th => (
                  <button
                    key={th.id}
                    onClick={() => {
                      setSettings(s => ({ ...s, theme: th.id as ReaderTheme }));
                      if (onSelectTheme) onSelectTheme(th.id as ReaderTheme);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-transform cursor-pointer ${
                      settings.theme === th.id
                        ? 'ring-2 ring-amber-500 font-bold scale-105'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: th.bg, color: th.text, borderColor: th.border }}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font selector */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-xs opacity-75">Font:</span>
              <div className="flex items-center gap-1.5 bg-black/5 p-1 rounded-lg">
                <button
                  onClick={() => setSettings(s => ({ ...s, font: 'serif' }))}
                  className={`px-3 py-1 rounded text-xs font-serif transition-colors cursor-pointer ${
                    settings.font === 'serif' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  Source Serif
                </button>
                <button
                  onClick={() => setSettings(s => ({ ...s, font: 'sans' }))}
                  className={`px-3 py-1 rounded text-xs font-sans transition-colors cursor-pointer ${
                    settings.font === 'sans' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  Plus Jakarta Sans
                </button>
                <button
                  onClick={() => setSettings(s => ({ ...s, font: 'mono' }))}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                    settings.font === 'mono' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  JetBrains Mono
                </button>
              </div>
            </div>

            {/* Font size and line width */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs opacity-75">Size:</span>
                <button
                  onClick={() => setSettings(s => ({ ...s, fontSize: Math.max(14, s.fontSize - 1) }))}
                  className="px-2 py-0.5 rounded bg-black/5 hover:bg-black/10 font-mono text-xs cursor-pointer"
                >
                  A-
                </button>
                <span className="text-xs font-mono tabular-nums">{settings.fontSize}px</span>
                <button
                  onClick={() => setSettings(s => ({ ...s, fontSize: Math.min(28, s.fontSize + 1) }))}
                  className="px-2 py-0.5 rounded bg-black/5 hover:bg-black/10 font-mono text-xs cursor-pointer"
                >
                  A+
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium text-xs opacity-75">Width:</span>
                {(['narrow', 'medium', 'wide'] as ReaderWidth[]).map(w => (
                  <button
                    key={w}
                    onClick={() => setSettings(s => ({ ...s, maxWidth: w }))}
                    className={`capitalize px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                      settings.maxWidth === w ? 'bg-amber-500 text-white font-medium' : 'bg-black/5 hover:bg-black/10'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Container + Highlights Drawer Split */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex gap-8">
        {/* Article Reader Content */}
        <main
          ref={articleContentRef}
          className={`flex-1 mx-auto transition-all ${widthClasses[settings.maxWidth]} ${fontClasses[settings.font]}`}
          style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
        >
          {viewMode === 'reader' ? (
            <article className="pb-24">
              {/* Header */}
              <header className="mb-10 pb-6 border-b border-black/10">
                {settings.theme === 'anime' && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-[#fef8e2] font-black text-xs uppercase tracking-wider shadow-[2.5px_2.5px_0px_#000]">
                      WELCOME!
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-[#67e8f9] text-black font-black text-[11px] uppercase tracking-wider shadow-[2px_2px_0px_#000] -rotate-1">
                      ANIME POP
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs opacity-60 mb-3">
                  <span>{bookmark.siteName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{bookmark.readTimeMinutes} min read</span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
                  {bookmark.title}
                </h1>

                {bookmark.byline && (
                  <div className="text-sm opacity-80 italic mb-4">
                    By {bookmark.byline}
                  </div>
                )}

                {/* Article Tags */}
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs opacity-75">
                    {bookmark.tags.map(tag => (
                      <span
                        key={tag}
                        className={
                          settings.theme === 'anime'
                            ? "inline-block px-2.5 py-1 rounded-lg border-[1.5px] border-black bg-[#fef8e2] text-xs font-black text-black shadow-[1.5px_1.5px_0px_#000]"
                            : "hover:underline cursor-pointer"
                        }
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </header>

              {/* Body Paragraphs with Highlights Injected */}
              <div className="space-y-6">
                {paragraphs.map((p, pIdx) => {
                  const matchingHls = pageHighlights.filter(h => {
                    if (h.paragraphIndex !== undefined) {
                      return h.paragraphIndex === pIdx;
                    }
                    return p.includes(h.text);
                  });

                  if (matchingHls.length === 0) {
                    return (
                      <p
                        key={pIdx}
                        id={`paragraph-${pIdx}`}
                        data-paragraph-index={pIdx}
                        className="leading-relaxed"
                      >
                        {p}
                      </p>
                    );
                  }

                  let renderedElements: React.ReactNode[] = [];
                  let lastIndex = 0;

                  interface MarkMatch {
                    start: number;
                    end: number;
                    hl: Highlight;
                  }

                  const matches: MarkMatch[] = [];
                  for (const hl of matchingHls) {
                    const idx = p.indexOf(hl.text);
                    if (idx !== -1) {
                      matches.push({
                        start: idx,
                        end: idx + hl.text.length,
                        hl,
                      });
                    }
                  }

                  matches.sort((a, b) => a.start - b.start);

                  matches.forEach((m, mIdx) => {
                    if (m.start > lastIndex) {
                      renderedElements.push(p.slice(lastIndex, m.start));
                    }

                    const config = COLOR_CONFIG[m.hl.color] || COLOR_CONFIG.yellow;

                    renderedElements.push(
                      <mark
                        key={`m-${mIdx}-${m.hl.id}`}
                        id={`rendered-hl-${m.hl.id}`}
                        onClick={e => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveHighlightPopover({
                            highlight: m.hl,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                          setEditingNote(m.hl.note || '');
                        }}
                        className={`${config.bgClass} cursor-pointer transition-all hover:brightness-95 relative group`}
                        title={m.hl.note ? `Note: ${m.hl.note}` : 'Click to edit highlight'}
                      >
                        {p.slice(m.start, m.end)}
                        {m.hl.note && (
                          <span className="inline-block ml-1 text-xs opacity-70">💬</span>
                        )}
                      </mark>
                    );

                    lastIndex = m.end;
                  });

                  if (lastIndex < p.length) {
                    renderedElements.push(p.slice(lastIndex));
                  }

                  return (
                    <p
                      key={pIdx}
                      id={`paragraph-${pIdx}`}
                      data-paragraph-index={pIdx}
                      className="leading-relaxed"
                    >
                      {renderedElements}
                    </p>
                  );
                })}
              </div>

              {/* Finish Article Footer */}
              <div className="mt-14 pt-8 border-t border-black/10 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs opacity-70">
                  Finished reading? Mark status:
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateBookmarkStatus(bookmark.id, 'completed')}
                    className={
                      settings.theme === 'anime'
                        ? "px-4 py-2.5 rounded-xl border-2 border-black bg-[#02a4be] text-black font-black uppercase tracking-wider text-xs shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
                        : `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            bookmark.status === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-black/5 hover:bg-black/10 text-inherit'
                          }`
                    }
                  >
                    ✓ Mark as Completed
                  </button>
                  <button
                    onClick={handleCopyMarkdown}
                    className={
                      settings.theme === 'anime'
                        ? "flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-black bg-[#fef8e2] text-black font-black uppercase tracking-wider text-xs shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
                        : "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-black/5 hover:bg-black/10 transition-colors cursor-pointer text-inherit"
                    }
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Export Highlights</span>
                  </button>
                </div>
              </div>
            </article>
          ) : (
            /* Source View */
            <div className="bg-white text-neutral-900 rounded-xl border border-neutral-300 shadow-sm p-6 mb-12">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-6 text-xs text-neutral-500">
                <span className="font-mono">{bookmark.url}</span>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Visit live site ↗
                </a>
              </div>
              <h1 className="text-2xl font-bold mb-4">{bookmark.title}</h1>
              <div className="prose max-w-none text-neutral-700 whitespace-pre-line leading-relaxed">
                {bookmark.content}
              </div>
            </div>
          )}
        </main>

        {/* Highlights & Notes Sidebar Drawer */}
        {showHighlightsDrawer && (
          <aside className="w-80 lg:w-96 shrink-0 hidden lg:block sticky top-20 h-[calc(100vh-6rem)] overflow-hidden flex flex-col bg-inherit/70 backdrop-blur-xs border border-black/10 rounded-2xl p-4 transition-colors">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/10 mb-3">
              <div className="flex items-center gap-2">
                <Highlighter className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Highlights ({pageHighlights.length})</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyMarkdown}
                  className="p-1 rounded-md hover:bg-black/10 transition-colors cursor-pointer"
                  title="Copy Highlights as Markdown"
                  aria-label="Copy markdown"
                >
                  {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-inherit" />}
                </button>
                <button
                  onClick={() => setShowHighlightsDrawer(false)}
                  className="p-1 rounded-md hover:bg-black/10 transition-colors cursor-pointer"
                  title="Close sidebar"
                  aria-label="Close sidebar"
                >
                  <X className="w-4 h-4 text-inherit" />
                </button>
              </div>
            </div>

            {/* Color Filter Strip */}
            <div className="flex items-center justify-between gap-1 mb-3">
              <button
                onClick={() => setDrawerColorFilter('all')}
                className={`text-[11px] px-2 py-0.5 rounded cursor-pointer ${
                  drawerColorFilter === 'all' ? 'font-bold underline' : 'opacity-60 hover:opacity-100'
                }`}
              >
                All
              </button>
              {(Object.keys(COLOR_CONFIG) as HighlightColor[]).map(c => (
                <button
                  key={c}
                  onClick={() => setDrawerColorFilter(drawerColorFilter === c ? 'all' : c)}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer border ${
                    drawerColorFilter === c ? 'scale-125 ring-2 ring-black/40' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: COLOR_CONFIG[c].hex,
                    borderColor: COLOR_CONFIG[c].borderHex,
                  }}
                  title={`Filter ${c}`}
                />
              ))}
            </div>

            {/* Search within highlights */}
            <input
              type="text"
              placeholder="Search highlights & notes..."
              value={drawerSearch}
              onChange={e => setDrawerSearch(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 mb-3 rounded-lg bg-black/5 border border-black/10 text-inherit placeholder:opacity-50 focus:outline-none"
            />

            {/* Highlights List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {filteredPageHighlights.length > 0 ? (
                filteredPageHighlights.map((hl, idx) => {
                  const cfg = COLOR_CONFIG[hl.color] || COLOR_CONFIG.yellow;
                  return (
                    <div
                      key={hl.id}
                      className={
                        settings.theme === 'anime'
                          ? "p-3.5 rounded-2xl border-2 border-black bg-[#fef8e2] shadow-[3.5px_3.5px_0px_#000] text-black transition-all group mb-1"
                          : "p-3 rounded-xl border border-black/10 bg-black/5 hover:bg-black/10 transition-all group"
                      }
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: cfg.borderHex }}
                          />
                          <span className="capitalize">{hl.color}</span>
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleJumpToHighlight(hl)}
                            className="p-1 hover:text-amber-500 rounded cursor-pointer"
                            title="Scroll to text in article"
                          >
                            <ArrowLeft className="w-3 h-3 rotate-180" />
                          </button>
                          <button
                            onClick={() => onDeleteHighlight(hl.id)}
                            className="p-1 hover:text-red-500 rounded cursor-pointer"
                            title="Delete highlight"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <blockquote
                        onClick={() => handleJumpToHighlight(hl)}
                        className="italic line-clamp-3 mb-2 cursor-pointer hover:opacity-80 leading-relaxed"
                      >
                        "{hl.text}"
                      </blockquote>

                      {/* Note */}
                      {hl.note && (
                        <div className="text-[11px] p-2 rounded-lg bg-white/40 dark:bg-black/20 border border-black/5 mb-2 font-sans not-italic">
                          <span className="font-semibold block mb-0.5 opacity-70">Note:</span>
                          {hl.note}
                        </div>
                      )}

                      {/* Tags */}
                      {hl.tags && hl.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 text-[10px] opacity-75">
                          {hl.tags.map(t => (
                            <span key={t}>#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 opacity-60">
                  <p className="mb-2">No highlights yet.</p>
                  <p className="text-[11px]">Select any text in the article to highlight with multiple colors!</p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Floating Selection Highlighter Toolbar with Gemini AI Explain */}
      {selectionRange && (
        <div
          className="fixed z-50 flex items-center gap-1.5 bg-neutral-900 text-white p-1.5 rounded-full shadow-2xl border border-neutral-700 -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: `${selectionRange.rect.top - 8}px`,
            left: `${selectionRange.rect.left + selectionRange.rect.width / 2}px`,
          }}
          onMouseDown={e => e.preventDefault()}
        >
          {/* Color buttons */}
          {(Object.keys(COLOR_CONFIG) as HighlightColor[]).map(colorKey => {
            const cfg = COLOR_CONFIG[colorKey];
            return (
              <button
                key={colorKey}
                onClick={() => handleCreateHighlight(colorKey)}
                className="w-6 h-6 rounded-full transition-transform hover:scale-125 focus:scale-125 cursor-pointer border"
                style={{
                  backgroundColor: cfg.hex,
                  borderColor: cfg.borderHex,
                }}
                title={`Highlight in ${cfg.label}`}
                aria-label={`Highlight in ${cfg.label}`}
              />
            );
          })}

          <div className="w-px h-4 bg-neutral-700 mx-0.5" />

          {/* AI Explain button */}
          <button
            onClick={handleAiExplainSelection}
            disabled={isExplaining}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold cursor-pointer transition-colors"
            title="Ask Gemini AI to explain this passage"
          >
            <Sparkles className="w-3 h-3" />
            <span>{isExplaining ? 'Thinking...' : 'AI Explain'}</span>
          </button>

          {/* Quick copy quote */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(`"${selectionRange.text}" — ${bookmark.title}`);
              setSelectionRange(null);
            }}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Copy Quote"
            aria-label="Copy Quote"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* AI Explanation Popover (When user clicks AI Explain) */}
      {aiExplanationPopover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-2xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm">Gemini AI Passage Explanation</h3>
              </div>
              <button
                onClick={() => setAiExplanationPopover(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <div>
                <span className="font-bold block text-neutral-500 uppercase tracking-wider text-[10px] mb-1">
                  Explanation
                </span>
                <p className="text-sm text-neutral-800 dark:text-neutral-200">
                  {aiExplanationPopover.explanation}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <span className="font-bold block text-amber-900 dark:text-amber-300 text-[11px] mb-0.5">
                  💡 Key Mental Model
                </span>
                <p className="text-amber-800 dark:text-amber-200">
                  {aiExplanationPopover.keyInsight}
                </p>
              </div>

              <div>
                <span className="font-bold block text-neutral-500 uppercase tracking-wider text-[10px] mb-1">
                  Contextual Analysis
                </span>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {aiExplanationPopover.contextAnalysis}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
              <button
                onClick={() => setAiExplanationPopover(null)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights & Highlights Synthesis Side Drawer / Modal */}
      {showAiDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-0 sm:p-4 bg-black/30 backdrop-blur-2xs animate-in fade-in">
          <div className="w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[85vh] bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-none sm:rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-sm">Gemini AI Knowledge Studio</h3>
                  <p className="text-[11px] text-neutral-500">Intelligent synthesis and briefing</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiDrawer(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Mode Tabs */}
            <div className="flex items-center px-6 pt-3 gap-2 border-b border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setAiTab('summary')}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  aiTab === 'summary'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                1. Executive Briefing
              </button>
              <button
                onClick={() => {
                  setAiTab('synthesis');
                  if (!aiSynthesis && !isSynthesizing && pageHighlights.length > 0) {
                    handleGenerateSynthesis();
                  }
                }}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  aiTab === 'synthesis'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                2. Highlight Synthesis ({pageHighlights.length})
              </button>
            </div>

            {/* AI Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs leading-relaxed">
              {aiTab === 'summary' ? (
                <>
                  {isSummarizing ? (
                    <div className="py-12 text-center text-neutral-500 space-y-3">
                      <Sparkles className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                      <p className="text-xs">Analyzing article arguments and synthesizing briefing...</p>
                    </div>
                  ) : aiSummary ? (
                    <div className="space-y-5">
                      <div>
                        <span className="font-bold block text-neutral-500 uppercase tracking-wider text-[10px] mb-1.5">
                          Executive Summary
                        </span>
                        <p className="text-sm font-serif text-neutral-800 dark:text-neutral-200 leading-relaxed">
                          {aiSummary.overview}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold block text-neutral-500 uppercase tracking-wider text-[10px] mb-2">
                          Key Actionable Takeaways
                        </span>
                        <ul className="space-y-2">
                          {aiSummary.keyTakeaways.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {aiSummary.recommendedTags && (
                        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300 text-xs">
                              AI Suggested Tags:
                            </span>
                            <button
                              onClick={handleApplyAiTags}
                              className="text-[11px] px-2.5 py-1 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded font-medium cursor-pointer"
                            >
                              {appliedTagsSuccess ? 'Applied!' : 'Apply All Tags'}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {aiSummary.recommendedTags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600 font-mono text-[11px]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <button
                        onClick={handleGenerateSummary}
                        className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Generate AI Executive Briefing
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Highlights Synthesis Tab */
                <>
                  {pageHighlights.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                      <p>You haven't highlighted any passages in this article yet.</p>
                      <p className="text-[11px] mt-1">Highlight a few quotes to see Gemini synthesize your marginalia!</p>
                    </div>
                  ) : isSynthesizing ? (
                    <div className="py-12 text-center text-neutral-500 space-y-3">
                      <Sparkles className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                      <p className="text-xs">Synthesizing {pageHighlights.length} highlights and notes into a coherent memo...</p>
                    </div>
                  ) : aiSynthesis ? (
                    <div className="space-y-5">
                      <div>
                        <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                          {aiSynthesis.synthesisTitle}
                        </h4>
                        <div className="text-sm font-serif text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                          {aiSynthesis.synthesisText}
                        </div>
                      </div>

                      {aiSynthesis.thematicClusters && (
                        <div>
                          <span className="font-bold block text-neutral-500 uppercase tracking-wider text-[10px] mb-2">
                            Thematic Clusters
                          </span>
                          <div className="space-y-2">
                            {aiSynthesis.thematicClusters.map((cluster, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700"
                              >
                                <span className="font-bold text-neutral-900 dark:text-neutral-100 block mb-0.5">
                                  {cluster.theme}
                                </span>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                  {cluster.summary}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <button
                        onClick={handleGenerateSynthesis}
                        className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Synthesize {pageHighlights.length} Highlights & Notes
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* In-Text Highlight Click Popover (Color change, note editor, tags, delete) */}
      {activeHighlightPopover && (
        <div
          className="fixed z-50 w-72 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-3.5 -translate-x-1/2 -translate-y-full -mt-2 animate-in fade-in zoom-in-95"
          style={{
            top: `${activeHighlightPopover.y}px`,
            left: `${activeHighlightPopover.x}px`,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-xs font-semibold text-neutral-500">Edit Highlight</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onDeleteHighlight(activeHighlightPopover.highlight.id);
                  setActiveHighlightPopover(null);
                }}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded cursor-pointer"
                title="Delete this highlight"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveHighlightPopover(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Color Switcher */}
          <div className="flex items-center justify-between gap-1 mb-3">
            {(Object.keys(COLOR_CONFIG) as HighlightColor[]).map(c => {
              const cfg = COLOR_CONFIG[c];
              return (
                <button
                  key={c}
                  onClick={() => {
                    const updated = { ...activeHighlightPopover.highlight, color: c };
                    onUpdateHighlight(updated);
                    setActiveHighlightPopover({ ...activeHighlightPopover, highlight: updated });
                  }}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer border ${
                    activeHighlightPopover.highlight.color === c ? 'scale-125 ring-2 ring-neutral-900 dark:ring-white ring-offset-1' : 'opacity-80 hover:opacity-100 hover:scale-110'
                  }`}
                  style={{ backgroundColor: cfg.hex, borderColor: cfg.borderHex }}
                  title={`Switch to ${c}`}
                />
              );
            })}
          </div>

          {/* Note Input */}
          <div className="mb-3">
            <label className="block text-[11px] font-medium text-neutral-500 mb-1">
              Annotation Note
            </label>
            <textarea
              rows={2}
              placeholder="Add your reflections, thoughts, or critique..."
              value={editingNote}
              onChange={e => setEditingNote(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Tags list & Add tag */}
          <div className="mb-3">
            <label className="block text-[11px] font-medium text-neutral-500 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {activeHighlightPopover.highlight.tags.map(t => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-1.5 py-0.5 rounded"
                >
                  #{t}
                  <button
                    onClick={() => {
                      const updated = {
                        ...activeHighlightPopover.highlight,
                        tags: activeHighlightPopover.highlight.tags.filter(tag => tag !== t),
                      };
                      onUpdateHighlight(updated);
                      setActiveHighlightPopover({ ...activeHighlightPopover, highlight: updated });
                    }}
                    className="hover:text-red-500 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="New tag..."
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTagInput.trim()) {
                    e.preventDefault();
                    const tagToAdd = newTagInput.trim().toLowerCase();
                    if (!activeHighlightPopover.highlight.tags.includes(tagToAdd)) {
                      const updated = {
                        ...activeHighlightPopover.highlight,
                        tags: [...activeHighlightPopover.highlight.tags, tagToAdd],
                      };
                      onUpdateHighlight(updated);
                      setActiveHighlightPopover({ ...activeHighlightPopover, highlight: updated });
                    }
                    setNewTagInput('');
                  }
                }}
                className="flex-1 text-xs px-2 py-1 rounded bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none"
              />
              <button
                onClick={() => {
                  if (newTagInput.trim()) {
                    const tagToAdd = newTagInput.trim().toLowerCase();
                    if (!activeHighlightPopover.highlight.tags.includes(tagToAdd)) {
                      const updated = {
                        ...activeHighlightPopover.highlight,
                        tags: [...activeHighlightPopover.highlight.tags, tagToAdd],
                      };
                      onUpdateHighlight(updated);
                      setActiveHighlightPopover({ ...activeHighlightPopover, highlight: updated });
                    }
                    setNewTagInput('');
                  }
                }}
                className="text-xs px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={() => {
              const updated = {
                ...activeHighlightPopover.highlight,
                note: editingNote.trim() || undefined,
              };
              onUpdateHighlight(updated);
              setActiveHighlightPopover(null);
            }}
            className="w-full py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 rounded-lg transition-colors cursor-pointer"
          >
            Save Annotation
          </button>
        </div>
      )}
    </div>
  );
};
