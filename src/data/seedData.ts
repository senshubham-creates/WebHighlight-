import { Bookmark, Highlight } from '../types.ts';

export const INITIAL_BOOKMARKS: Bookmark[] = [
  {
    id: 'bm-spatial-cognition',
    url: 'https://cognition.media/spatial-computing-and-memory-palaces',
    title: 'The Architecture of Spatial Cognition & Modern Web Reading',
    byline: 'Dr. Elena Rostova',
    siteName: 'Cognitive Computing Review',
    excerpt: 'How spatial interfaces, multi-color visual anchors, and digital marginalia fundamentally alter how the human cortex indexes long-form digital literature.',
    readTimeMinutes: 6,
    tags: ['cognition', 'research', 'interfaces', 'reading'],
    isFavorite: true,
    isArchived: false,
    status: 'reading',
    createdAt: '2026-10-18T14:30:00Z',
    updatedAt: '2026-10-19T18:15:00Z',
    content: `For over two millennia, scholars and orators relied on the method of loci—the memory palace—anchoring ideas to physical architecture. When we read on physical paper, the tactile geography of the page, the dog-eared corner, and the ink strokes in the margins serve as subconscious coordinate markers. The brain knows that a concept was located "roughly two-thirds down on the left-hand page of the second chapter."

In the transition to uniform digital screens, this spatial grounding was largely decimated. Infinite vertical scrolling reduced rich typographic terrain into an undifferentiated stream of pixels. Without distinct landmarks, recall decays rapidly.

This is precisely where multi-color active highlighting restores cognitive topography. By assigning semantic color axes—such as yellow for core axioms, green for empirical evidence, blue for methodology, and pink for counter-arguments—the reader creates an individualized navigational map. The visual cortex processes color chromaticity in parallel with semantic decoding, allowing instantaneous cognitive re-entry when revisiting an article.

Furthermore, marginal notes and tagging bridge the gulf between passive consumption and generative synthesis. When a reader highlights a passage and records their own immediate critique, they force the brain to transition from reception to encoding. Digital highlighters must not merely store text; they must preserve the contextual momentum of the reader at the exact moment insight occurred.

As web architectures evolve towards lighter, distraction-free reader environments, typography, measure, and contrast play decisive roles. Stripping away algorithmic feeds, floating banners, and telemetry popups creates a sanctuary for deep work. In this tranquil state, highlighters become the chisel with which knowledge workers sculpt lasting intellectual assets.`
  },
  {
    id: 'bm-resilient-typography',
    url: 'https://typespec.org/essays/principles-of-resilient-typography',
    title: 'Principles of Resilient Typography in Digital Reading Environments',
    byline: 'Marcus Vance',
    siteName: 'TypeSpec Journal',
    excerpt: 'An investigation into optimal line measure, vertical rhythm, and contrast ratios that sustain prolonged intellectual focus without cognitive fatigue.',
    readTimeMinutes: 5,
    tags: ['design', 'typography', 'ergonomics', 'reading'],
    isFavorite: true,
    isArchived: false,
    status: 'completed',
    createdAt: '2026-10-17T09:12:00Z',
    updatedAt: '2026-10-18T11:45:00Z',
    content: `Digital reading fatigue is rarely an issue of screen resolution; it is almost universally a failure of typographic proportion. When line lengths extend beyond 75 characters per line, the eye struggles to locate the subsequent line start during the saccadic return sweep. Conversely, lines narrower than 45 characters cause jagged, staccato scanning that disrupts the reader's inner vocalization rhythm.

The optimal reading measure for long-form prose sits comfortably between 60 and 68 characters per line. Paired with a relative line height of 1.55 to 1.75 times the font size, this creates an open horizontal channel that guides the eye effortlessly forward.

Contrast is another frequently misunderstood dimension. Pure black text (#000000) on a harsh pure white canvas (#FFFFFF) generates microscopic optical irradiation, particularly on high-luminance OLED and LED displays. A softened off-black text on a warm parchment or muted slate background provides sufficient luminance contrast for WCAG AA compliance while drastically softening ocular strain during multi-hour study sessions.

When highlights are introduced to a typographic layout, their optical weight must respect the underlying letterforms. An aggressive fluorescent overlay drowns out the subtle counters and serifs of fine type. The best highlighters apply subtle translucent glazes with slight horizontal edge grounding, mimicking the gentle wash of fountain-pen highlighter inks on handmade paper.`
  },
  {
    id: 'bm-deep-sea-vents',
    url: 'https://science-currents.edu/microbiology/deep-sea-alkaline-vents',
    title: 'Deep Sea Alkaline Vents & The Electrochemical Genesis of Life',
    byline: 'Dr. Julian Thorne',
    siteName: 'Marine Geobiology Today',
    excerpt: 'Geothermal chimney labyrinths, proton gradients, and the natural mineral membranes that preceded the first living biological cells.',
    readTimeMinutes: 7,
    tags: ['science', 'biology', 'geology', 'evolution'],
    isFavorite: false,
    isArchived: false,
    status: 'reading',
    createdAt: '2026-10-16T16:20:00Z',
    updatedAt: '2026-10-17T08:10:00Z',
    content: `Four billion years ago, beneath the archaic Hadean oceans, towering white mineral chimneys known as serpentinizing alkaline hydrothermal vents precipitated from the ocean floor. Unlike the boiling acidic "black smokers" fueled by volcanic magma, alkaline vents are powered by slow chemical serpentinization—a reaction between olivine rock and seawater that generates abundant hydrogen gas and alkaline conditions.

Inside the micro-porous labyrinth of these mineral mounds, nature constructed an abiotic laboratory. The porous chambers, made of iron-sulfur minerals, possessed wall thicknesses comparable to contemporary lipid cell membranes. More remarkably, an ambient proton gradient existed across these semi-permeable walls: alkaline fluid with high pH (around 9 to 11) inside the chimney, and mildly acidic seawater (pH 5 to 6) saturated with dissolved volcanic carbon dioxide outside.

This difference in proton concentration constituted a natural, sustained electrochemical voltage of approximately 200 millivolts—virtually identical to the proton motive force that drives ATP synthase enzymes in every living eukaryotic and bacterial cell on Earth today.

Before RNA or DNA existed, before enzymes or cellular membranes had evolved, the inanimate planet was already running a prototype of metabolic respiration. Highlighting and annotating these geological mechanisms demonstrates how the thermodynamic imperative to dissipate geochemical gradients gave birth to living organization.`
  },
  {
    id: 'bm-high-agency-web',
    url: 'https://hypertext.studio/essays/high-agency-web-tools',
    title: 'Designing High-Agency Tools: Why Local-First and Browser Extensions Endure',
    byline: 'Siddharth Roy',
    siteName: 'Hypertext Studio',
    excerpt: 'Why knowledge workers demand tools that operate as direct extensions of their intellect rather than closed algorithmic walled gardens.',
    readTimeMinutes: 4,
    tags: ['tools', 'browser', 'extensions', 'software'],
    isFavorite: false,
    isArchived: false,
    status: 'unread',
    createdAt: '2026-10-15T11:00:00Z',
    updatedAt: '2026-10-15T11:00:00Z',
    content: `A high-agency tool is one that multiplies the user's deliberate intent rather than channeling their attention into a predetermined behavioral loop. In the era of social feeds and walled reading portals, the ability to inspect, annotate, color-code, and export knowledge on your own terms is an act of intellectual sovereignty.

Browser extensions in Chrome and Opera remain the purest expression of user agency on the web. They run within the user's execution perimeter, modifying the DOM directly, highlighting text on Wikipedia, subverting paywalled clutter with local reader modes, and safeguarding reading notes in durable open formats.

When your bookmarks and highlights live in portable Markdown or structured JSON, your intellectual database belongs to you. It will outlive proprietary cloud services, company pivots, and shifting monetization models. Tools like web highlighters should feel like an artisan's notebook: tactile, instantly responsive, and perpetually accessible.`
  }
];

export const INITIAL_HIGHLIGHTS: Highlight[] = [
  {
    id: 'hl-spatial-1',
    bookmarkId: 'bm-spatial-cognition',
    text: 'When we read on physical paper, the tactile geography of the page, the dog-eared corner, and the ink strokes in the margins serve as subconscious coordinate markers.',
    color: 'yellow',
    note: 'The physical grounding of memory—crucial for comparing analog vs digital retention.',
    tags: ['memory', 'psychology'],
    createdAt: '2026-10-18T14:45:00Z',
    paragraphIndex: 0,
  },
  {
    id: 'hl-spatial-2',
    bookmarkId: 'bm-spatial-cognition',
    text: 'By assigning semantic color axes—such as yellow for core axioms, green for empirical evidence, blue for methodology, and pink for counter-arguments—the reader creates an individualized navigational map.',
    color: 'green',
    note: 'Core methodology for our multi-color taxonomy! Apply this system across technical papers.',
    tags: ['taxonomy', 'methodology'],
    createdAt: '2026-10-18T14:52:00Z',
    paragraphIndex: 2,
  },
  {
    id: 'hl-spatial-3',
    bookmarkId: 'bm-spatial-cognition',
    text: 'When a reader highlights a passage and records their own immediate critique, they force the brain to transition from reception to encoding.',
    color: 'purple',
    note: 'Active learning principle: synthesis over consumption.',
    tags: ['cognition', 'learning'],
    createdAt: '2026-10-18T15:01:00Z',
    paragraphIndex: 3,
  },
  {
    id: 'hl-typo-1',
    bookmarkId: 'bm-resilient-typography',
    text: 'The optimal reading measure for long-form prose sits comfortably between 60 and 68 characters per line.',
    color: 'blue',
    note: 'Design rule: Keep reader mode line-width locked between 60ch-75ch.',
    tags: ['measure', 'layout'],
    createdAt: '2026-10-17T09:20:00Z',
    paragraphIndex: 1,
  },
  {
    id: 'hl-typo-2',
    bookmarkId: 'bm-resilient-typography',
    text: 'A softened off-black text on a warm parchment or muted slate background provides sufficient luminance contrast for WCAG AA compliance while drastically softening ocular strain',
    color: 'orange',
    note: 'Parchment and sepia palette justification for reader mode.',
    tags: ['accessibility', 'colors'],
    createdAt: '2026-10-17T09:28:00Z',
    paragraphIndex: 2,
  },
  {
    id: 'hl-typo-3',
    bookmarkId: 'bm-resilient-typography',
    text: 'The best highlighters apply subtle translucent glazes with slight horizontal edge grounding, mimicking the gentle wash of fountain-pen highlighter inks',
    color: 'pink',
    note: 'Aesthetic goal for our highlighter shader and CSS styling.',
    tags: ['craft', 'ui'],
    createdAt: '2026-10-17T09:35:00Z',
    paragraphIndex: 3,
  },
  {
    id: 'hl-vents-1',
    bookmarkId: 'bm-deep-sea-vents',
    text: 'This difference in proton concentration constituted a natural, sustained electrochemical voltage of approximately 200 millivolts—virtually identical to the proton motive force that drives ATP synthase enzymes in every living eukaryotic and bacterial cell on Earth today.',
    color: 'yellow',
    note: 'Proton motive force preceded cellular life! Stunning biological discovery.',
    tags: ['bioenergetics', 'evolution'],
    createdAt: '2026-10-16T16:35:00Z',
    paragraphIndex: 2,
  }
];
