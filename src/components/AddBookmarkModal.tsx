import React, { useState } from 'react';
import { Bookmark } from '../types.ts';
import { X, Globe, FileText, Tag as TagIcon, Sparkles, Clipboard, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateReadingTime } from '../utils/highlighter.ts';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBookmark: (bookmark: Bookmark) => void;
}

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  onAddBookmark,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [siteName, setSiteName] = useState('');
  const [byline, setByline] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['web', 'reading']);
  const [showFullEditor, setShowFullEditor] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const clean = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter(tag => tag !== t));
  };

  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setUrl(clipText.trim());
        setStatusMessage('Pasted URL from clipboard!');
        setTimeout(() => setStatusMessage(null), 2500);

        // Auto derive site name or title if possible
        if (!title) {
          try {
            const u = new URL(clipText.startsWith('http') ? clipText : `https://${clipText}`);
            const host = u.hostname.replace(/^www\./, '');
            setSiteName(host.split('.')[0].toUpperCase());
            setTitle(`Article on ${host}`);
          } catch {
            // Ignore
          }
        }
      }
    } catch {
      setStatusMessage('Clipboard access denied. Please paste manually into the input.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleSelectExample = (domain: string, sampleTitle: string, sampleByline: string, sampleText: string) => {
    setUrl(`https://${domain}/essay`);
    setTitle(sampleTitle);
    setSiteName(domain.split('.')[0].toUpperCase());
    setByline(sampleByline);
    setContent(sampleText);
    setTags(['featured', domain.split('.')[0], 'deep-reading']);
    setStatusMessage(`Loaded sample from ${domain}!`);
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let targetTitle = title.trim();
    let targetContent = content.trim();

    if (!targetTitle && url.trim()) {
      try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        targetTitle = `Article from ${u.hostname.replace(/^www\./, '')}`;
      } catch {
        targetTitle = 'Web Reading Bookmark';
      }
    }

    if (!targetContent) {
      targetContent = `Saved link: ${url.trim() || 'https://web-reading.org/article'}

This article was clipped directly to your Markwise knowledge vault. You can highlight key sentences using multi-color markers (yellow, green, blue, pink, purple, orange), write contextual margins notes, generate Gemini AI summaries, and read distraction-free.

When you install the Markwise browser extension or native launcher, full web pages and long-form articles will automatically extract into this reading space.`;
    }

    let derivedSite = siteName.trim();
    if (!derivedSite && url) {
      try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        derivedSite = u.hostname.replace(/^www\./, '');
      } catch {
        derivedSite = 'Saved Web Page';
      }
    }

    const newBookmark: Bookmark = {
      id: `bm-${Date.now()}`,
      url: url.trim() || 'https://web-reading.org/article',
      title: targetTitle || 'Saved Web Page',
      siteName: derivedSite || 'Saved Page',
      byline: byline.trim() || undefined,
      content: targetContent,
      excerpt: targetContent.slice(0, 180) + '...',
      readTimeMinutes: calculateReadingTime(targetContent),
      tags: tags,
      isFavorite: false,
      isArchived: false,
      status: 'unread',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddBookmark(newBookmark);
    onClose();
  };

  const handleLoadSample = () => {
    setTitle('The Craft of Deep Work and Attentional Capital');
    setUrl('https://calnewport.com/craft-of-deep-work');
    setSiteName('Study Hacks');
    setByline('Cal Newport');
    setContent(`Deep work is the ability to focus without distraction on a cognitively demanding task. It is a superpower in our increasingly competitive knowledge economy.

When you spend your day in a state of fragmented attention—shifting between tabs, responding to transient notifications, and skimming shallow headlines—your brain suffers from attention residue. Every time you switch tasks, a portion of your cognitive capacity remains stuck on the prior thought.

To build an impenetrable fortress for your intellect, you must implement deliberate boundaries. Using a distraction-free reader mode and high-fidelity multi-color highlighting allows you to engage with long-form ideas with surgical intensity. You are no longer just consuming someone else's stream of consciousness; you are actively extracting high-value mental models into your personal knowledge vault.`);
    setTags(['productivity', 'focus', 'deep-work', 'learning']);
    setShowFullEditor(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          {/* Welcome Badge matching User Reference Image */}
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_#000] text-xs font-black uppercase tracking-wider text-black">
            WELCOME!
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs px-2.5 py-1 text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer border border-neutral-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sample Essay</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Hero Section: exact layout and typography from user images */}
        <div className="px-6 pb-4">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950 mb-1.5">
            Drop an article link.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Drop any article, blog post, or essay URL. We'll format it for multi-color highlighting, reader mode, and AI summaries.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 overflow-y-auto space-y-4">
          {/* URL Input Box styled with user reference image */}
          <div>
            <div className="relative">
              <input
                type="text"
                placeholder="paste an article or website URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full px-4 py-3 text-sm sm:text-base font-semibold bg-neutral-50/80 border-2 border-black rounded-xl text-neutral-950 placeholder:text-neutral-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/20 transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
              />
            </div>
            {statusMessage && (
              <p className="text-xs font-bold text-emerald-700 mt-1.5 ml-1 animate-in fade-in">
                ✓ {statusMessage}
              </p>
            )}
          </div>

          {/* Quick Action: Paste from Clipboard button from Reference Image 2 */}
          <button
            type="button"
            onClick={handlePasteClipboard}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-black bg-neutral-50 hover:bg-white text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_#000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer"
          >
            <Clipboard className="w-4 h-4" />
            <span>PASTE FROM CLIPBOARD</span>
          </button>

          {/* EXAMPLES row from Reference Image 1 */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">
              <span>EXAMPLES</span>
              <span className="text-neutral-400 lowercase font-medium flex items-center gap-0.5">
                start here <ArrowDown className="w-3 h-3 inline" />
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleSelectExample(
                    'calnewport.com',
                    'The Craft of Deep Work and Attentional Capital',
                    'Cal Newport',
                    `Deep work is the ability to focus without distraction on a cognitively demanding task. It is a superpower in our increasingly competitive knowledge economy.\n\nWhen you spend your day in a state of fragmented attention—shifting between tabs, responding to transient notifications, and skimming shallow headlines—your brain suffers from attention residue. Every time you switch tasks, a portion of your cognitive capacity remains stuck on the prior thought.\n\nTo build an impenetrable fortress for your intellect, you must implement deliberate boundaries. Using a distraction-free reader mode and high-fidelity multi-color highlighting allows you to engage with long-form ideas with surgical intensity.`
                  )
                }
                className="px-2.5 py-1 rounded-lg border-2 border-black bg-white hover:bg-neutral-50 text-xs font-black text-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer"
              >
                calnewport.com
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectExample(
                    'paulgraham.com',
                    'How to Do Great Work',
                    'Paul Graham',
                    `If you wanted to collect recipes for doing great work, what would they look like? The first step is to decide what to work on. The work you choose should have three qualities: it has to be something you have a natural aptitude for, that you have a deep interest in, and that offers scope to do great work.\n\nIn practice you don't have to worry much about the third condition. If you're extraordinarily interested in something, it usually will offer plenty of scope. So you just have to find what you have an aptitude for and an interest in.`
                  )
                }
                className="px-2.5 py-1 rounded-lg border-2 border-black bg-white hover:bg-neutral-50 text-xs font-black text-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer"
              >
                paulgraham.com
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectExample(
                    'waitbutwhy.com',
                    'The AI Revolution: The Road to Superintelligence',
                    'Tim Urban',
                    `We are standing on the brink of an event that will alter human civilization forever: the advent of Artificial Superintelligence.\n\nMost people look at the historical past and assume progress moves linearly. But technology accelerates exponentially. What took centuries in the agricultural age takes decades in the computational age, and may soon take hours once recursive self-improvement ignites.`
                  )
                }
                className="px-2.5 py-1 rounded-lg border-2 border-black bg-white hover:bg-neutral-50 text-xs font-black text-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer"
              >
                waitbutwhy.com
              </button>
            </div>
          </div>

          {/* Toggle Full Editor Details */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowFullEditor(!showFullEditor)}
              className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
            >
              <span>{showFullEditor ? 'Hide manual article editor' : '+ Edit title, author, and paste custom text'}</span>
              {showFullEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showFullEditor && (
            <div className="space-y-3 pt-2 border-t border-neutral-200 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Article Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cognitive Systems & Modern Web Reading"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Publication / Site Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Substack, Medium, NYT"
                    value={siteName}
                    onChange={e => setSiteName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Article Body / Paragraphs to Highlight
                </label>
                <textarea
                  rows={5}
                  placeholder="Paste article paragraphs here..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black font-serif leading-relaxed"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap items-center gap-1 mb-2">
                  {tags.map(t => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-[11px] bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-md border border-neutral-300"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-red-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add tag and press Enter"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg cursor-pointer border border-neutral-300"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Button: exact cyan pop button from User Reference Image 1 */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl border-[2.5px] border-black bg-[#00A3C4] hover:bg-[#0092b0] text-black font-black uppercase tracking-wider text-sm sm:text-base shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>+ SAVE TO KNOWLEDGE VAULT</span>
            </button>
          </div>

          {/* Cancel Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
