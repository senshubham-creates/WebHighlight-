import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateReadingTime,
  createHighlight,
  computeColorCounts,
  filterHighlights,
  getAllTags,
  exportToMarkdown,
  exportBackupJSON,
  parseBackupJSON,
} from './highlighter.ts';
import type { Bookmark, Highlight } from '../types.ts';

test('calculateReadingTime calculates correct minutes', () => {
  const shortText = 'Hello world this is a test';
  assert.equal(calculateReadingTime(shortText), 1);

  // 400 words should be ~2 minutes
  const words = Array(450).fill('word').join(' ');
  assert.equal(calculateReadingTime(words), 3);
});

test('createHighlight produces valid highlight object with defaults', () => {
  const hl = createHighlight({
    bookmarkId: 'bm-1',
    text: '   Important quoted passage   ',
    color: 'green',
    note: 'Remember this',
    tags: ['research', 'AI', '  UX  '],
  });

  assert.equal(hl.bookmarkId, 'bm-1');
  assert.equal(hl.text, 'Important quoted passage');
  assert.equal(hl.color, 'green');
  assert.equal(hl.note, 'Remember this');
  assert.deepEqual(hl.tags, ['research', 'ai', 'ux']);
  assert.ok(hl.id.startsWith('hl_'));
});

test('computeColorCounts groups colors accurately', () => {
  const highlights: Highlight[] = [
    { id: '1', bookmarkId: 'b1', text: 't1', color: 'yellow', tags: [], createdAt: '' },
    { id: '2', bookmarkId: 'b1', text: 't2', color: 'yellow', tags: [], createdAt: '' },
    { id: '3', bookmarkId: 'b1', text: 't3', color: 'green', tags: [], createdAt: '' },
    { id: '4', bookmarkId: 'b1', text: 't4', color: 'pink', tags: [], createdAt: '' },
    { id: '5', bookmarkId: 'b1', text: 't5', color: 'purple', tags: [], createdAt: '' },
  ];

  const counts = computeColorCounts(highlights);
  assert.equal(counts.yellow, 2);
  assert.equal(counts.green, 1);
  assert.equal(counts.pink, 1);
  assert.equal(counts.purple, 1);
  assert.equal(counts.blue, 0);
  assert.equal(counts.orange, 0);
});

test('filterHighlights filters by color, tag, and search query', () => {
  const list: Highlight[] = [
    { id: '1', bookmarkId: 'b1', text: 'Artificial Intelligence systems', color: 'yellow', tags: ['tech'], note: 'Key finding', createdAt: '' },
    { id: '2', bookmarkId: 'b1', text: 'Human cognitive architecture', color: 'blue', tags: ['cognition', 'design'], note: '', createdAt: '' },
    { id: '3', bookmarkId: 'b1', text: 'Web browser extensions and bookmarklets', color: 'green', tags: ['web', 'tech'], note: 'Opera support', createdAt: '' },
  ];

  // Color filter
  const yellowOnly = filterHighlights(list, { color: 'yellow' });
  assert.equal(yellowOnly.length, 1);
  assert.equal(yellowOnly[0].id, '1');

  // Tag filter
  const techOnly = filterHighlights(list, { tag: 'tech' });
  assert.equal(techOnly.length, 2);

  // Search keyword in note
  const searchOpera = filterHighlights(list, { searchKeyword: 'Opera' });
  assert.equal(searchOpera.length, 1);
  assert.equal(searchOpera[0].id, '3');

  // Search keyword in text
  const searchCognitive = filterHighlights(list, { searchKeyword: 'cognitive' });
  assert.equal(searchCognitive.length, 1);
  assert.equal(searchCognitive[0].id, '2');
});

test('getAllTags combines and deduplicates tags with counts', () => {
  const bookmarks: Bookmark[] = [
    {
      id: 'b1',
      url: 'https://example.com',
      title: 'Example',
      siteName: 'Example',
      content: 'Sample text',
      excerpt: 'Sample',
      readTimeMinutes: 2,
      tags: ['research', 'tech'],
      isFavorite: false,
      isArchived: false,
      status: 'reading',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const highlights: Highlight[] = [
    { id: 'h1', bookmarkId: 'b1', text: 'quote', color: 'yellow', tags: ['tech', 'ai'], createdAt: '' },
  ];

  const tags = getAllTags(bookmarks, highlights);
  const techTag = tags.find(t => t.name === 'tech');
  assert.ok(techTag);
  assert.equal(techTag.count, 2);
});

test('exportToMarkdown and backup JSON parsing work cleanly', () => {
  const bookmark: Bookmark = {
    id: 'b1',
    url: 'https://prismmark.dev/article',
    title: 'Cognitive Reading Environments',
    byline: 'Dr. Jane Doe',
    siteName: 'Prism Journal',
    content: 'Full text here',
    excerpt: 'Excerpt here',
    readTimeMinutes: 5,
    tags: ['reading', 'ux'],
    isFavorite: true,
    isArchived: false,
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const highlights: Highlight[] = [
    {
      id: 'h1',
      bookmarkId: 'b1',
      text: 'Highlights turn passive reading into active knowledge acquisition.',
      color: 'yellow',
      note: 'Crucial quote for essay',
      tags: ['quote', 'productivity'],
      createdAt: new Date().toISOString(),
    },
  ];

  const md = exportToMarkdown(bookmark, highlights);
  assert.ok(md.includes('# Cognitive Reading Environments'));
  assert.ok(md.includes('Highlights turn passive reading into active knowledge acquisition.'));
  assert.ok(md.includes('Crucial quote for essay'));

  const jsonStr = exportBackupJSON([bookmark], highlights);
  const parsed = parseBackupJSON(jsonStr);
  assert.ok(parsed);
  assert.equal(parsed.bookmarks.length, 1);
  assert.equal(parsed.highlights.length, 1);
  assert.equal(parsed.bookmarks[0].title, 'Cognitive Reading Environments');
});
