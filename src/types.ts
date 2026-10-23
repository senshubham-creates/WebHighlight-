export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isDemo?: boolean;
}

export interface Highlight {
  id: string;
  bookmarkId: string;
  text: string;
  color: HighlightColor;
  note?: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  paragraphIndex?: number;
  startOffset?: number;
  endOffset?: number;
}

export type ReadingStatus = 'unread' | 'reading' | 'completed';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  byline?: string;
  siteName: string;
  favicon?: string;
  content: string; // Plain text or HTML paragraphs
  excerpt: string;
  readTimeMinutes: number;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  status: ReadingStatus;
  createdAt: string;
  updatedAt: string;
}

export type ReaderTheme = 'light' | 'sepia' | 'slate' | 'charcoal' | 'night' | 'e-ink' | 'minimal' | 'anime';
export type AppTheme = ReaderTheme;

export interface ThemeOption {
  id: ReaderTheme;
  label: string;
  bg: string;
  text: string;
  border: string;
  desc?: string;
  badge?: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'anime', label: '💥 Anime Pop', bg: '#fef8e2', text: '#000000', border: '#000000', desc: 'Manga comic pop art, 2.5px ink borders & hard shadows', badge: 'POP' },
  { id: 'sepia', label: '☕ Sepia Book', bg: '#fbf0d9', text: '#433422', border: '#e2d4b7', desc: 'Warm parchment paper with amber tones' },
  { id: 'e-ink', label: '📄 E-Ink Paper', bg: '#f0eee7', text: '#1a1a1a', border: '#d1cfc7', desc: 'Monochromatic, paper-matte zero glare' },
  { id: 'minimal', label: '◻️ Minimal Swiss', bg: '#ffffff', text: '#09090b', border: '#e4e4e7', desc: 'High-contrast stark typography' },
  { id: 'light', label: '☀️ Light Clean', bg: '#ffffff', text: '#171717', border: '#e5e7eb', desc: 'Clean modern neutral light' },
  { id: 'slate', label: '🏙️ Slate Modern', bg: '#f1f5f9', text: '#1e293b', border: '#cbd5e1', desc: 'Cool tech slate gray with indigo accents' },
  { id: 'charcoal', label: '🌒 Charcoal Studio', bg: '#23272e', text: '#e2e8f0', border: '#374151', desc: 'Deep charcoal dark mode' },
  { id: 'night', label: '🌌 Night OLED', bg: '#0d1117', text: '#c9d1d9', border: '#21262d', desc: 'True pitch black OLED dark mode' },
];

export type ReaderFont = 'sans' | 'serif' | 'mono';
export type ReaderWidth = 'narrow' | 'medium' | 'wide';

export interface ReaderSettings {
  theme: ReaderTheme;
  font: ReaderFont;
  fontSize: number; // in pixels, e.g. 18
  lineHeight: number; // e.g. 1.7
  maxWidth: ReaderWidth;
  align: 'left' | 'justify';
}

export interface HighlightFilter {
  color?: HighlightColor | 'all';
  tag?: string;
  searchKeyword?: string;
}

export interface AISummary {
  overview: string;
  keyTakeaways: string[];
  recommendedTags: string[];
}

export interface AIExplanation {
  explanation: string;
  keyInsight: string;
  contextAnalysis: string;
}

export interface AISynthesis {
  synthesisTitle: string;
  synthesisText: string;
  thematicClusters: { theme: string; summary: string; quoteCount: number }[];
}

export const COLOR_CONFIG: Record<HighlightColor, { label: string; bgClass: string; hex: string; borderHex: string }> = {
  yellow: { label: 'Yellow', bgClass: 'highlight-yellow', hex: '#fef08a', borderHex: '#eab308' },
  green: { label: 'Green', bgClass: 'highlight-green', hex: '#bbf7d0', borderHex: '#22c55e' },
  blue: { label: 'Blue', bgClass: 'highlight-blue', hex: '#bfdbfe', borderHex: '#3b82f6' },
  pink: { label: 'Pink', bgClass: 'highlight-pink', hex: '#fbcfe8', borderHex: '#ec4899' },
  purple: { label: 'Purple', bgClass: 'highlight-purple', hex: '#e9d5ff', borderHex: '#a855f7' },
  orange: { label: 'Orange', bgClass: 'highlight-orange', hex: '#fed7aa', borderHex: '#f97316' },
};
