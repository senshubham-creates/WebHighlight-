/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, Highlight, ReaderTheme, AppUser } from './types.ts';
import { INITIAL_BOOKMARKS, INITIAL_HIGHLIGHTS } from './data/seedData.ts';
import { Header, AppView } from './components/Header.tsx';
import { BookmarkList } from './components/BookmarkList.tsx';
import { ReaderView } from './components/ReaderView.tsx';
import { ExtensionModal } from './components/ExtensionModal.tsx';
import { NativeAppsModal } from './components/NativeAppsModal.tsx';
import { ExportModal } from './components/ExportModal.tsx';
import { AddBookmarkModal } from './components/AddBookmarkModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import {
  onAuthUserChange,
  fetchUserDataFromFirestore,
  syncUserDataToFirestore,
  saveBookmarkToFirestore,
  deleteBookmarkFromFirestore,
  saveHighlightToFirestore,
  deleteHighlightFromFirestore,
  getStoredLocalUser,
} from './utils/firebase.ts';
import type { User } from 'firebase/auth';

const STORAGE_KEY_BOOKMARKS = 'markwise_bookmarks_v1';
const STORAGE_KEY_HIGHLIGHTS = 'markwise_highlights_v1';
const STORAGE_KEY_THEME = 'markwise_app_theme';

export default function App() {
  // Global Application Theme State
  const [appTheme, setAppTheme] = useState<ReaderTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved && ['light', 'sepia', 'e-ink', 'minimal', 'anime', 'slate', 'charcoal', 'night'].includes(saved)) {
        return saved as ReaderTheme;
      }
    } catch (e) {
      console.warn('Failed to load saved theme', e);
    }
    return 'anime';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, appTheme);
      document.documentElement.className = `theme-${appTheme}`;
    } catch (e) {
      console.warn('Failed to persist theme', e);
    }
  }, [appTheme]);

  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<User | AppUser | null>(() => {
    return getStoredLocalUser();
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Persistent state for bookmarks and highlights
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOKMARKS) || localStorage.getItem('prismmark_bookmarks_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load bookmarks from storage', e);
    }
    return INITIAL_BOOKMARKS;
  });

  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGHLIGHTS) || localStorage.getItem('prismmark_highlights_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load highlights from storage', e);
    }
    return INITIAL_HIGHLIGHTS;
  });

  // Navigation & Active View state
  const [activeView, setActiveView] = useState<AppView>('library');
  const [activeBookmarkId, setActiveBookmarkId] = useState<string>(bookmarks[0]?.id || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('Failed to save bookmarks', e);
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HIGHLIGHTS, JSON.stringify(highlights));
    } catch (e) {
      console.warn('Failed to save highlights', e);
    }
  }, [highlights]);

  // Handle Firebase Auth user changes and cloud sync
  useEffect(() => {
    const unsubscribe = onAuthUserChange(async user => {
      setCurrentUser(user);
      if (user) {
        setIsSyncing(true);
        try {
          const cloudData = await fetchUserDataFromFirestore(user.uid);
          if (cloudData.bookmarks.length > 0) {
            // User has existing cloud data: merge or load
            setBookmarks(cloudData.bookmarks);
            setHighlights(cloudData.highlights);
            if (cloudData.bookmarks.length > 0 && !cloudData.bookmarks.some(b => b.id === activeBookmarkId)) {
              setActiveBookmarkId(cloudData.bookmarks[0].id);
            }
          } else {
            // User is newly authenticated or empty in cloud: seed user's cloud with local state
            await syncUserDataToFirestore(user.uid, bookmarks, highlights);
          }
          setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch (err) {
          console.warn('Could not sync user data from cloud', err);
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleManualSync = useCallback(async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSyncing(true);
    try {
      await syncUserDataToFirestore(currentUser.uid, bookmarks, highlights);
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, bookmarks, highlights]);

  // Active bookmark object
  const activeBookmark = bookmarks.find(b => b.id === activeBookmarkId) || bookmarks[0];

  // Handlers
  const handleOpenReader = (bm: Bookmark) => {
    setActiveBookmarkId(bm.id);
    setActiveView('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavorite = (id: string) => {
    setBookmarks(prev => {
      const updated = prev.map(b => (b.id === id ? { ...b, isFavorite: !b.isFavorite, updatedAt: new Date().toISOString() } : b));
      const target = updated.find(b => b.id === id);
      if (currentUser && target) {
        saveBookmarkToFirestore(currentUser.uid, target).catch(console.warn);
      }
      return updated;
    });
  };

  const handleDeleteBookmark = (id: string) => {
    if (confirm('Delete this bookmark and all its highlights?')) {
      const hIdsToDelete = highlights.filter(h => h.bookmarkId === id).map(h => h.id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
      setHighlights(prev => prev.filter(h => h.bookmarkId !== id));

      if (currentUser) {
        deleteBookmarkFromFirestore(currentUser.uid, id, hIdsToDelete).catch(console.warn);
      }

      if (activeBookmarkId === id) {
        setActiveBookmarkId(bookmarks.find(b => b.id !== id)?.id || '');
      }
    }
  };

  const handleAddBookmark = (newBm: Bookmark) => {
    setBookmarks(prev => [newBm, ...prev]);
    setActiveBookmarkId(newBm.id);
    setActiveView('reader');

    if (currentUser) {
      saveBookmarkToFirestore(currentUser.uid, newBm).catch(console.warn);
    }
  };

  const handleAddHighlight = (newHl: Highlight) => {
    setHighlights(prev => [...prev, newHl]);
    if (currentUser) {
      saveHighlightToFirestore(currentUser.uid, newHl).catch(console.warn);
    }
  };

  const handleUpdateHighlight = (updatedHl: Highlight) => {
    setHighlights(prev => prev.map(h => (h.id === updatedHl.id ? updatedHl : h)));
    if (currentUser) {
      saveHighlightToFirestore(currentUser.uid, updatedHl).catch(console.warn);
    }
  };

  const handleDeleteHighlight = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    if (currentUser) {
      deleteHighlightFromFirestore(currentUser.uid, id).catch(console.warn);
    }
  };

  const handleUpdateBookmarkStatus = (id: string, status: 'unread' | 'reading' | 'completed') => {
    setBookmarks(prev => {
      const updated = prev.map(b => (b.id === id ? { ...b, status, updatedAt: new Date().toISOString() } : b));
      const target = updated.find(b => b.id === id);
      if (currentUser && target) {
        saveBookmarkToFirestore(currentUser.uid, target).catch(console.warn);
      }
      return updated;
    });
  };

  const handleUpdateBookmarkTags = (id: string, tags: string[]) => {
    setBookmarks(prev => {
      const updated = prev.map(b => (b.id === id ? { ...b, tags, updatedAt: new Date().toISOString() } : b));
      const target = updated.find(b => b.id === id);
      if (currentUser && target) {
        saveBookmarkToFirestore(currentUser.uid, target).catch(console.warn);
      }
      return updated;
    });
  };

  const handleResetSeedData = () => {
    setBookmarks(INITIAL_BOOKMARKS);
    setHighlights(INITIAL_HIGHLIGHTS);
    setActiveBookmarkId(INITIAL_BOOKMARKS[0].id);
    if (currentUser) {
      syncUserDataToFirestore(currentUser.uid, INITIAL_BOOKMARKS, INITIAL_HIGHLIGHTS).catch(console.warn);
    }
  };

  const handleImportData = (data: { bookmarks: Bookmark[]; highlights: Highlight[] }) => {
    setBookmarks(data.bookmarks);
    setHighlights(data.highlights);
    if (data.bookmarks.length > 0) {
      setActiveBookmarkId(data.bookmarks[0].id);
    }
    if (currentUser) {
      syncUserDataToFirestore(currentUser.uid, data.bookmarks, data.highlights).catch(console.warn);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 app-theme-${appTheme}`}>
      {/* Top Bar Header with Markwise brand, global theme switcher, auth sync status, and views */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        activeBookmarkTitle={activeBookmark?.title}
        totalBookmarks={bookmarks.length}
        currentTheme={appTheme}
        onSelectTheme={setAppTheme}
      />

      {/* Main Views */}
      <main className="flex-1">
        {activeView === 'library' && (
          <BookmarkList
            bookmarks={bookmarks}
            highlights={highlights}
            onOpenReader={handleOpenReader}
            onToggleFavorite={handleToggleFavorite}
            onDeleteBookmark={handleDeleteBookmark}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onResetSeedData={handleResetSeedData}
          />
        )}

        {activeView === 'reader' && activeBookmark && (
          <ReaderView
            bookmark={activeBookmark}
            highlights={highlights}
            onBack={() => setActiveView('library')}
            onAddHighlight={handleAddHighlight}
            onUpdateHighlight={handleUpdateHighlight}
            onDeleteHighlight={handleDeleteHighlight}
            onUpdateBookmarkStatus={handleUpdateBookmarkStatus}
            onUpdateBookmarkTags={handleUpdateBookmarkTags}
            currentTheme={appTheme}
            onSelectTheme={setAppTheme}
          />
        )}

        {activeView === 'native-apps' && <NativeAppsModal />}

        {activeView === 'extension' && <ExtensionModal />}

        {activeView === 'export' && (
          <ExportModal
            bookmarks={bookmarks}
            highlights={highlights}
            onImportData={handleImportData}
          />
        )}
      </main>

      {/* Add Bookmark Modal */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddBookmark={handleAddBookmark}
      />

      {/* Auth & Profile Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSetUser={setCurrentUser}
        onSyncNow={handleManualSync}
        isSyncing={isSyncing}
        lastSyncedTime={lastSyncedTime}
      />

      {/* Quiet Footer */}
      {activeView !== 'reader' && (
        <footer className="mt-auto border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-neutral-800">Markwise</span> · Multi-Color Web Highlighter, Reader & Knowledge Vault
            </div>
            <div className="flex items-center gap-4 text-neutral-500">
              <span>Windows, Mac, iPad, Android</span>
              <span aria-hidden="true">·</span>
              <span>Chrome & Opera</span>
              <span aria-hidden="true">·</span>
              <span>Firestore Sync & Gemini AI</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
