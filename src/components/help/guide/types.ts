import type { LucideIcon } from 'lucide-react';

export interface GuideStep {
  title: string;
  detail?: string;
}

export interface GuideCallout {
  type: 'tip' | 'warning' | 'info' | 'success';
  title?: string;
  text: string;
}

export interface GuideFAQ {
  q: string;
  a: string;
}

export interface GuideArticle {
  id: string;
  title: string;
  objective: string;
  location?: string;
  audience?: string[];
  intro: string;
  steps?: GuideStep[];
  callouts?: GuideCallout[];
  bestPractices?: string[];
  faq?: GuideFAQ[];
  related?: string[];
  keywords?: string[];
}

export interface GuideSection {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  articles: GuideArticle[];
}

export interface GuideModule {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'info';
  sections: GuideSection[];
}
