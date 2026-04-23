import type { GuideModule } from './types';
import { presentationModule } from './content/presentation';
import { administrationModule } from './content/administration';
import { stockModule } from './content/stock';
import { ventesModule } from './content/ventes';
import { comptabiliteModule } from './content/comptabilite';
import { rapportsModule } from './content/rapports';
import { assistantModule } from './content/assistant';
import { chatModule } from './content/chat';
import { parametresModule } from './content/parametres';

export const guideModules: GuideModule[] = [
  presentationModule,
  administrationModule,
  stockModule,
  ventesModule,
  comptabiliteModule,
  rapportsModule,
  assistantModule,
  chatModule,
  parametresModule,
];

export function findArticle(articleId: string) {
  for (const module of guideModules) {
    for (const section of module.sections) {
      const article = section.articles.find((item) => item.id === articleId);
      if (article) return { module, section, article };
    }
  }
  return null;
}

export interface SearchHit {
  module: GuideModule;
  section: GuideModule['sections'][number];
  article: GuideModule['sections'][number]['articles'][number];
  score: number;
}

export function searchGuide(query: string): SearchHit[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];

  for (const module of guideModules) {
    for (const section of module.sections) {
      for (const article of section.articles) {
        const haystack = [
          module.title,
          module.tagline,
          section.title,
          article.title,
          article.objective,
          article.location,
          article.intro,
          ...(article.audience ?? []),
          ...(article.keywords ?? []),
          ...(article.steps?.map((step) => `${step.title} ${step.detail ?? ''}`) ?? []),
          ...(article.bestPractices ?? []),
          ...(article.callouts?.map((callout) => `${callout.title ?? ''} ${callout.text}`) ?? []),
          ...(article.faq?.map((item) => `${item.q} ${item.a}`) ?? []),
        ].join(' ').toLowerCase();

        if (!terms.every((term) => haystack.includes(term))) continue;

        let score = 0;
        for (const term of terms) {
          if (article.title.toLowerCase().includes(term)) score += 12;
          if (module.title.toLowerCase().includes(term)) score += 6;
          if (article.keywords?.some((keyword) => keyword.toLowerCase().includes(term))) score += 5;
          score += haystack.split(term).length - 1;
        }
        hits.push({ module, section, article, score });
      }
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, 30);
}
