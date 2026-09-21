export type SlideLayout =
  | 'title-cover'
  | 'bullets-points'
  | 'split-columns'
  | 'stats-metrics'
  | 'code-architecture'
  | 'timeline-roadmap'
  | 'quote-highlight';

export interface SlideMetric {
  label: string;
  value: string;
  change?: string;
}

export interface SlideColumn {
  heading: string;
  content: string[];
}

export interface SlideCode {
  code: string;
  language: string;
  caption?: string;
}

export interface SlideTimelineItem {
  step: string;
  title: string;
  description: string;
}

export interface SlideQuote {
  text: string;
  author?: string;
  role?: string;
}

export interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  columns?: SlideColumn[];
  metrics?: SlideMetric[];
  codeSnippet?: SlideCode;
  timeline?: SlideTimelineItem[];
  quote?: SlideQuote;
  notes?: string;
  tag?: string;
}

export type SlideTransition =
  | 'fade'
  | 'slide-horizontal'
  | 'slide-vertical'
  | 'zoom'
  | 'morph'
  | 'flip';

export type TechThemeId =
  | 'obsidian'
  | 'silicon'
  | 'quantum'
  | 'cyber'
  | 'nordic'
  | 'frontier';

export interface TechTheme {
  id: TechThemeId;
  name: string;
  description: string;
  badge: string;
  isDark: boolean;
  bgClass: string;
  canvasBg: string;
  surfaceClass: string;
  textClass: string;
  subtextClass: string;
  bodyTextClass: string;
  mutedTextClass: string;
  dotClass: string;
  borderClass: string;
  accentColor: string;
  accentBadgeClass: string;
  fontFamily: string;
  previewColors: {
    bg: string;
    surface: string;
    accent: string;
    text: string;
  };
}

export interface PresentationDeck {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  themeId: TechThemeId;
  transition: SlideTransition;
  slides: Slide[];
}

export interface TemplatePreset {
  id: string;
  title: string;
  category: string;
  description: string;
  slidesCount: number;
  themeId: TechThemeId;
  transition: SlideTransition;
  tags: string[];
  slides: Slide[];
}

export type CopilotMode = 'textual' | 'full-design';

export interface CuratedPresentationModel {
  id: string;
  name: string;
  modelTag: string;
  parameterSize: string;
  role: string;
  strengths: string[];
  pullCommand: string;
  isSub3B: boolean;
  tagCategory: 'Sub-3B Lightweight' | 'Technical Engineering' | 'Storytelling & Pitch' | 'Deep Architecture';
  isInstalled?: boolean;
}

export interface SavedDeckMeta {
  id: string;
  title: string;
  slidesCount: number;
  themeId: TechThemeId;
  updatedAt: number;
}
