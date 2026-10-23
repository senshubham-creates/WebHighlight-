import React, { useState, useRef, useEffect } from 'react';
import {
  Highlighter,
  BookmarkCheck,
  Globe,
  Download,
  Plus,
  Monitor,
  User,
  Cloud,
  Palette,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { ReaderTheme, THEME_OPTIONS, AppUser } from '../types.ts';

export type AppView = 'library' | 'reader' | 'native-apps' | 'extension' | 'export';

interface HeaderProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  onOpenAddModal: () => void;
  onOpenAuthModal: () => void;
  currentUser: FirebaseUser | AppUser | null;
  activeBookmarkTitle?: string;
  totalBookmarks: number;
  currentTheme: ReaderTheme;
  onSelectTheme: (theme: ReaderTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onOpenAddModal,
  onOpenAuthModal,
  currentUser,
  activeBookmarkTitle,
  totalBookmarks,
  currentTheme,
  onSelectTheme,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isThemeMenuOpen]);

  const activeThemeOption = THEME_OPTIONS.find(t => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveView('library')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            aria-label="Markwise Home"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-amber-300 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 border border-black/10">
              <Highlighter className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-neutral-900 group-hover:text-neutral-700 transition-colors">
                Markwise
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-neutral-500 font-normal">
                Web Highlighter
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2 md:gap-3 text-xs sm:text-sm font-medium text-neutral-600 overflow-x-auto py-1 no-scrollbar">
          <button
            onClick={() => setActiveView('library')}
            className={`px-2 sm:px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'library'
                ? 'text-neutral-950 font-semibold bg-neutral-100'
                : 'hover:text-neutral-950 hover:bg-neutral-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BookmarkCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500" />
              <span>Library</span>
              <span className="text-xs text-neutral-400 font-mono tabular-nums">({totalBookmarks})</span>
            </span>
          </button>

          <button
            onClick={() => setActiveView('reader')}
            className={`px-2 sm:px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'reader'
                ? 'text-neutral-950 font-semibold bg-neutral-100'
                : 'hover:text-neutral-950 hover:bg-neutral-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Highlighter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span>Reader</span>
              {activeBookmarkTitle && (
                <span className="hidden xl:inline-block text-xs text-neutral-500 max-w-[130px] truncate">
                  · {activeBookmarkTitle}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveView('native-apps')}
            className={`px-2 sm:px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'native-apps'
                ? 'text-neutral-950 font-semibold bg-neutral-100'
                : 'hover:text-neutral-950 hover:bg-neutral-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
              <span className="hidden md:inline">Native Apps</span>
              <span className="md:hidden">Apps</span>
            </span>
          </button>

          <button
            onClick={() => setActiveView('extension')}
            className={`px-2 sm:px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'extension'
                ? 'text-neutral-950 font-semibold bg-neutral-100'
                : 'hover:text-neutral-950 hover:bg-neutral-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500" />
              <span className="hidden sm:inline">Extension</span>
              <span className="sm:hidden">Ext</span>
            </span>
          </button>

          <button
            onClick={() => setActiveView('export')}
            className={`px-2 sm:px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'export'
                ? 'text-neutral-950 font-semibold bg-neutral-100'
                : 'hover:text-neutral-950 hover:bg-neutral-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500" />
              <span>Export</span>
            </span>
          </button>
        </nav>

        {/* Zone 3: Global Theme Switcher + Profile / Sync + New Bookmark */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Global Theme Switcher Popover */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-colors border border-neutral-300/80 cursor-pointer shadow-2xs"
              title="Change application theme across all views"
              aria-label="Theme Switcher"
              aria-expanded={isThemeMenuOpen}
            >
              <Palette className="w-3.5 h-3.5 text-neutral-700" />
              <span className="hidden sm:inline-block max-w-[90px] truncate">
                {activeThemeOption.label}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                style={{ backgroundColor: activeThemeOption.bg }}
              />
              <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-neutral-200/90 py-2.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 pb-2 mb-1.5 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>App-Wide Theme</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">Applies Everywhere</span>
                </div>

                <div className="max-h-80 overflow-y-auto px-1.5 space-y-1">
                  {THEME_OPTIONS.map(opt => {
                    const isSelected = opt.id === currentTheme;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onSelectTheme(opt.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white font-medium shadow-xs'
                            : 'hover:bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Swatch */}
                          <div
                            className="w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs"
                            style={{
                              backgroundColor: opt.bg,
                              borderColor: opt.border || '#000000',
                            }}
                          >
                            <span
                              className="text-[10px] font-bold"
                              style={{ color: opt.text }}
                            >
                              Aa
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate">
                                {opt.label}
                              </span>
                              {opt.badge && (
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                                  isSelected ? 'bg-amber-400 text-neutral-950' : 'bg-red-500 text-white'
                                }`}>
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            {opt.desc && (
                              <p className={`text-[10px] truncate ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                {opt.desc}
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User profile / sync button */}
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              currentUser
                ? 'bg-amber-50/80 border-amber-200 text-amber-950 hover:bg-amber-100'
                : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
            }`}
            title={currentUser ? `Signed in as ${currentUser.email}. Click to manage sync.` : 'Sign in to sync with your profile'}
          >
            {currentUser ? (
              <>
                <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email?.[0].toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline max-w-[90px] truncate text-xs font-semibold">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline">Sign In / Sync</span>
                <span className="sm:hidden">Sync</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            title="Add New Bookmark"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Bookmark</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </header>
  );
};
