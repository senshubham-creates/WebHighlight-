import type { Highlight, HighlightColor, Bookmark, HighlightFilter } from '../types.ts';

export function calculateReadingTime(text: string): number {
  if (!text || !text.trim()) return 1;
  const wordCount = text.trim().split(/\s+/).length;
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function createHighlight(params: {
  bookmarkId: string;
  text: string;
  color?: HighlightColor;
  note?: string;
  tags?: string[];
  paragraphIndex?: number;
  startOffset?: number;
  endOffset?: number;
}): Highlight {
  return {
    id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    bookmarkId: params.bookmarkId,
    text: params.text.trim(),
    color: params.color || 'yellow',
    note: params.note?.trim() || undefined,
    tags: params.tags ? Array.from(new Set(params.tags.map(t => t.trim().toLowerCase()).filter(Boolean))) : [],
    createdAt: new Date().toISOString(),
    paragraphIndex: params.paragraphIndex,
    startOffset: params.startOffset,
    endOffset: params.endOffset,
  };
}

export function computeColorCounts(highlights: Highlight[]): Record<HighlightColor, number> {
  const counts: Record<HighlightColor, number> = {
    yellow: 0,
    green: 0,
    blue: 0,
    pink: 0,
    purple: 0,
    orange: 0,
  };
  for (const h of highlights) {
    if (counts[h.color] !== undefined) {
      counts[h.color] += 1;
    }
  }
  return counts;
}

export function filterHighlights(highlights: Highlight[], filter: HighlightFilter): Highlight[] {
  return highlights.filter(h => {
    if (filter.color && filter.color !== 'all' && h.color !== filter.color) {
      return false;
    }
    if (filter.tag && filter.tag !== 'all') {
      const matchTag = h.tags.some(t => t.toLowerCase() === filter.tag?.toLowerCase());
      if (!matchTag) return false;
    }
    if (filter.searchKeyword && filter.searchKeyword.trim()) {
      const q = filter.searchKeyword.toLowerCase().trim();
      const inText = h.text.toLowerCase().includes(q);
      const inNote = h.note ? h.note.toLowerCase().includes(q) : false;
      const inTag = h.tags.some(t => t.toLowerCase().includes(q));
      if (!inText && !inNote && !inTag) return false;
    }
    return true;
  });
}

export function getAllTags(bookmarks: Bookmark[], highlights: Highlight[]): { name: string; count: number }[] {
  const tagMap = new Map<string, number>();
  for (const b of bookmarks) {
    for (const tag of b.tags) {
      const norm = tag.trim().toLowerCase();
      if (norm) tagMap.set(norm, (tagMap.get(norm) || 0) + 1);
    }
  }
  for (const h of highlights) {
    for (const tag of h.tags) {
      const norm = tag.trim().toLowerCase();
      if (norm) tagMap.set(norm, (tagMap.get(norm) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function exportToMarkdown(bookmark: Bookmark, highlights: Highlight[]): string {
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines: string[] = [
    `# ${bookmark.title}`,
    ``,
    `- **URL:** ${bookmark.url}`,
    `- **Source:** ${bookmark.siteName}`,
    `- **Author/Byline:** ${bookmark.byline || 'Unknown'}`,
    `- **Read Time:** ~${bookmark.readTimeMinutes} min`,
    `- **Exported:** ${dateStr}`,
    bookmark.tags.length > 0 ? `- **Tags:** ${bookmark.tags.map(t => `#${t}`).join(' ')}` : '',
    ``,
    `---`,
    ``,
    `## Highlights & Annotations (${highlights.length})`,
    ``,
  ].filter(line => line !== undefined);

  if (highlights.length === 0) {
    lines.push(`*No highlights recorded for this article.*`);
  } else {
    highlights.forEach((hl, idx) => {
      lines.push(`### ${idx + 1}. [${hl.color.toUpperCase()}] Highlight`);
      lines.push(`> "${hl.text}"`);
      lines.push(``);
      if (hl.note) {
        lines.push(`**Note:** ${hl.note}`);
        lines.push(``);
      }
      if (hl.tags && hl.tags.length > 0) {
        lines.push(`**Tags:** ${hl.tags.map(t => `\`#${t}\``).join(' ')}`);
        lines.push(``);
      }
      lines.push(`*Created: ${new Date(hl.createdAt).toLocaleString()}*`);
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    });
  }

  return lines.join('\n');
}

export function exportBackupJSON(bookmarks: Bookmark[], highlights: Highlight[]): string {
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'Markwise Web Highlighter',
      data: {
        bookmarks,
        highlights,
      },
    },
    null,
    2
  );
}

export function parseBackupJSON(rawJson: string): { bookmarks: Bookmark[]; highlights: Highlight[] } | null {
  try {
    const parsed = JSON.parse(rawJson);
    if (parsed.data && Array.isArray(parsed.data.bookmarks) && Array.isArray(parsed.data.highlights)) {
      return {
        bookmarks: parsed.data.bookmarks,
        highlights: parsed.data.highlights,
      };
    }
    // direct array structure fallback
    if (Array.isArray(parsed.bookmarks) && Array.isArray(parsed.highlights)) {
      return {
        bookmarks: parsed.bookmarks,
        highlights: parsed.highlights,
      };
    }
    return null;
  } catch {
    return null;
  }
}
