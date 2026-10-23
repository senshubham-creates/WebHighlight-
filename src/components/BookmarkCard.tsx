import React from 'react';
import { Bookmark, Highlight, COLOR_CONFIG, HighlightColor } from '../types.ts';
import { BookOpen, Star, Trash2, Tag, ExternalLink, Calendar, Clock } from 'lucide-react';
import { computeColorCounts } from '../utils/highlighter.ts';

interface BookmarkCardProps {
  bookmark: Bookmark;
  highlights: Highlight[];
  onOpenReader: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
  onFilterByTag?: (tag: string) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  highlights,
  onOpenReader,
  onToggleFavorite,
  onDeleteBookmark,
  onFilterByTag,
}) => {
  const bookmarkHighlights = highlights.filter(h => h.bookmarkId === bookmark.id);
  const colorCounts = computeColorCounts(bookmarkHighlights);
  const totalHighlights = bookmarkHighlights.length;

  const formattedDate = new Date(bookmark.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="group bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 transition-all shadow-xs hover:shadow-sm p-5 flex flex-col justify-between">
      <div>
        {/* Top metadata line: unboxed, clean typography */}
        <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 mb-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-medium text-neutral-700 truncate">{bookmark.siteName}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-neutral-400" />
              {bookmark.readTimeMinutes} min read
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3 text-neutral-400" />
              {formattedDate}
            </span>
          </div>

          <button
            onClick={() => onToggleFavorite(bookmark.id)}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              bookmark.isFavorite
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-neutral-300 hover:text-neutral-500'
            }`}
            title={bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={bookmark.isFavorite ? 'Favorited' : 'Not favorited'}
          >
            <Star className={`w-4 h-4 ${bookmark.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">
          <button
            onClick={() => onOpenReader(bookmark)}
            className="text-left cursor-pointer hover:underline focus:outline-none"
          >
            {bookmark.title}
          </button>
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-neutral-600 line-clamp-3 mb-4 leading-relaxed">
          {bookmark.excerpt || bookmark.content.slice(0, 160) + '...'}
        </p>

        {/* Tags line: clean subtle text tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs">
            <Tag className="w-3 h-3 text-neutral-400 shrink-0" />
            {bookmark.tags.map(tag => (
              <button
                key={tag}
                onClick={() => onFilterByTag && onFilterByTag(tag)}
                className="text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer hover:underline"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-neutral-100 mt-2">
        {/* Color Highlight Distribution Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
            <span className="font-mono tabular-nums font-medium text-neutral-700">
              {totalHighlights} {totalHighlights === 1 ? 'highlight' : 'highlights'}
            </span>
            <div className="flex items-center gap-1.5">
              {(Object.keys(COLOR_CONFIG) as HighlightColor[]).map(color => {
                const count = colorCounts[color];
                if (count === 0) return null;
                return (
                  <span
                    key={color}
                    className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-neutral-600"
                    title={`${count} ${color} highlights`}
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: COLOR_CONFIG[color].borderHex }}
                    />
                    {count}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Micro distribution bar */}
          {totalHighlights > 0 ? (
            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden flex">
              {(Object.keys(COLOR_CONFIG) as HighlightColor[]).map(color => {
                const count = colorCounts[color];
                if (count === 0) return null;
                const pct = (count / totalHighlights) * 100;
                return (
                  <div
                    key={color}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: COLOR_CONFIG[color].borderHex,
                    }}
                    className="h-full"
                    title={`${count} ${color}`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="h-1.5 w-full bg-neutral-100 rounded-full" />
          )}
        </div>

        {/* Card Action Row */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onOpenReader(bookmark)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open in Reader</span>
          </button>

          <div className="flex items-center gap-1 text-neutral-400">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
              title="Open original website"
              aria-label="Open original link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => onDeleteBookmark(bookmark.id)}
              className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              title="Delete bookmark"
              aria-label="Delete bookmark"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
