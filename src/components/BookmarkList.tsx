import React, { useState, useMemo } from 'react';
import { Bookmark, Highlight, HighlightColor, COLOR_CONFIG } from '../types.ts';
import { BookmarkCard } from './BookmarkCard.tsx';
import { Search, LayoutGrid, List, Plus, Tag as TagIcon, Sparkles, Link as LinkIcon, Type, X } from 'lucide-react';
import { getAllTags } from '../utils/highlighter.ts';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  highlights: Highlight[];
  onOpenReader: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
  onOpenAddModal: () => void;
  onResetSeedData: () => void;
}

export type SearchFieldMode = 'all' | 'title' | 'url';

export const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  highlights,
  onOpenReader,
  onToggleFavorite,
  onDeleteBookmark,
  onOpenAddModal,
  onResetSeedData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchFieldMode>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reading' | 'completed' | 'favorites'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<HighlightColor | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const allTags = useMemo(() => getAllTags(bookmarks, highlights), [bookmarks, highlights]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(b => {
      // Status filter
      if (statusFilter === 'favorites' && !b.isFavorite) return false;
      if (statusFilter === 'reading' && b.status !== 'reading') return false;
      if (statusFilter === 'completed' && b.status !== 'completed') return false;

      // Tag filter
      if (selectedTag !== 'all') {
        const hasTagInBookmark = b.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());
        const bookmarkHls = highlights.filter(h => h.bookmarkId === b.id);
        const hasTagInHighlight = bookmarkHls.some(h => h.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase()));
        if (!hasTagInBookmark && !hasTagInHighlight) return false;
      }

      // Color filter
      if (selectedColor !== 'all') {
        const bookmarkHls = highlights.filter(h => h.bookmarkId === b.id);
        const hasColor = bookmarkHls.some(h => h.color === selectedColor);
        if (!hasColor) return false;
      }

      // Search query filtering specifically by Title or URL
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = b.title.toLowerCase().includes(q);
        const inUrl = b.url.toLowerCase().includes(q) || b.siteName.toLowerCase().includes(q);
        const inExcerpt = b.excerpt.toLowerCase().includes(q);
        const bookmarkHls = highlights.filter(h => h.bookmarkId === b.id);
        const inHighlightText = bookmarkHls.some(h => h.text.toLowerCase().includes(q));

        if (searchField === 'title') {
          return inTitle;
        } else if (searchField === 'url') {
          return inUrl;
        } else {
          // 'all' includes title, url, excerpt, and highlights
          return inTitle || inUrl || inExcerpt || inHighlightText;
        }
      }

      return true;
    });
  }, [bookmarks, highlights, statusFilter, selectedTag, selectedColor, searchQuery, searchField]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header Section */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-2xs mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                searchField === 'title'
                  ? 'Filter bookmarks by article title...'
                  : searchField === 'url'
                  ? 'Filter bookmarks by website URL or domain (e.g. nytimes, medium, org)...'
                  : 'Search bookmarks by title, URL, website, or notes...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-neutral-50/70 border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Scope Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl shrink-0 text-xs">
            <button
              onClick={() => setSearchField('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                searchField === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Fields
            </button>
            <button
              onClick={() => setSearchField('title')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                searchField === 'title'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Type className="w-3.5 h-3.5 text-neutral-500" />
              <span>Title Only</span>
            </button>
            <button
              onClick={() => setSearchField('url')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                searchField === 'url'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5 text-neutral-500" />
              <span>URL Only</span>
            </button>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center p-1 bg-neutral-100 rounded-xl shrink-0 self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Search & Filter Feedback Line */}
        {searchQuery.trim() && (
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
            <div>
              <span>Filtering by </span>
              <strong className="text-neutral-900">{searchField === 'title' ? 'Title' : searchField === 'url' ? 'URL' : 'Title & URL'}</strong>
              <span> for "</span>
              <span className="font-semibold text-neutral-900">{searchQuery}</span>
              <span>": found </span>
              <strong className="font-mono tabular-nums text-neutral-900">{filteredBookmarks.length}</strong>
              <span> of {bookmarks.length} bookmarks.</span>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>

      {/* Segmented Filter Bar: Status, Color filter, Tag filter */}
      <div className="flex flex-col gap-3 mb-8 pb-6 border-b border-neutral-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status buttons */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All ({bookmarks.length})
            </button>
            <button
              onClick={() => setStatusFilter('reading')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'reading'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Reading ({bookmarks.filter(b => b.status === 'reading').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Completed ({bookmarks.filter(b => b.status === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('favorites')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'favorites'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Favorites ({bookmarks.filter(b => b.isFavorite).length})
            </button>
          </div>

          {/* Color filter */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
            <span className="text-neutral-400 font-medium">Highlight Color:</span>
            <button
              onClick={() => setSelectedColor('all')}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                selectedColor === 'all' ? 'font-semibold text-neutral-900 underline' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              All
            </button>
            {(Object.keys(COLOR_CONFIG) as HighlightColor[]).map(c => (
              <button
                key={c}
                onClick={() => setSelectedColor(selectedColor === c ? 'all' : c)}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                  selectedColor === c ? 'scale-125 ring-2 ring-neutral-900 ring-offset-1' : 'opacity-80 hover:opacity-100 hover:scale-110'
                }`}
                style={{
                  backgroundColor: COLOR_CONFIG[c].hex,
                  borderColor: COLOR_CONFIG[c].borderHex,
                }}
                title={`Filter by ${c} highlights`}
                aria-label={`Filter by ${c} highlights`}
              />
            ))}
          </div>
        </div>

        {/* Tags filter row */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs no-scrollbar">
            <span className="flex items-center gap-1 text-neutral-400 shrink-0 font-medium">
              <TagIcon className="w-3 h-3" /> Tags:
            </span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedTag === 'all'
                  ? 'bg-neutral-900 text-white font-medium'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Tags
            </button>
            {allTags.map(tag => (
              <button
                key={tag.name}
                onClick={() => setSelectedTag(selectedTag === tag.name ? 'all' : tag.name)}
                className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedTag === tag.name
                    ? 'bg-neutral-900 text-white font-medium'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                #{tag.name} <span className="opacity-60 tabular-nums">({tag.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bookmarks Grid / List */}
      {filteredBookmarks.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-4'
          }
        >
          {filteredBookmarks.map(b => (
            <BookmarkCard
              key={b.id}
              bookmark={b}
              highlights={highlights}
              onOpenReader={onOpenReader}
              onToggleFavorite={onToggleFavorite}
              onDeleteBookmark={onDeleteBookmark}
              onFilterByTag={tag => setSelectedTag(tag)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-neutral-200">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">
            No bookmarks matching {searchField === 'title' ? 'title' : searchField === 'url' ? 'URL' : 'search'} criteria
          </h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
            {searchQuery
              ? `No bookmarks found matching "${searchQuery}" in ${searchField === 'title' ? 'title' : searchField === 'url' ? 'URL / domain' : 'bookmarks'}. Try switching to All Fields or clearing your query.`
              : 'Add your first bookmark to start highlighting and reading distraction-free.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchField('all');
                setSelectedTag('all');
                setSelectedColor('all');
                setStatusFilter('all');
              }}
              className="px-3.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Bookmark
            </button>
            {bookmarks.length === 0 && (
              <button
                onClick={onResetSeedData}
                className="px-3.5 py-2 text-xs font-semibold text-neutral-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Load Sample Articles
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
