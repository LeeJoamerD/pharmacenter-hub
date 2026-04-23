import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Keyboard, BookOpen } from 'lucide-react';
import type { GuideModule } from './types';
import { moduleAccentClasses } from './visual';

interface GuideHomeProps {
  modules: GuideModule[];
  onSelectArticle: (articleId: string) => void;
}

export function GuideHome({ modules, onSelectArticle }: GuideHomeProps) {
  const totalArticles = modules.reduce(
    (count, module) => count + module.sections.reduce((sectionCount, section) => sectionCount + section.articles.length, 0),
    0
  );

  const quickStarts = modules
    .map((module) => {
      const article = module.sections[0]?.articles[0];
      return article ? { module, article } : null;
    })
    .filter((item): item is { module: GuideModule; article: GuideModule['sections'][number]['articles'][number] } => Boolean(item));

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8">
      <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-primary/10 via-info/10 to-background p-8">
        <div className="absolute top-4 right-4">
          <Sparkles className="h-8 w-8 text-primary/30" />
        </div>
        <Badge variant="secondary" className="mb-3">Guide Utilisateur PharmaSoft</Badge>
        <h1 className="text-3xl font-bold tracking-normal">Bienvenue dans votre centre d’aide</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Retrouvez les procédures essentielles pour exploiter PharmaSoft au quotidien : stock, ventes,
          comptabilité SYSCOHADA, rapports, assistant IA, réseau d’officines et configuration.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{totalArticles} articles</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5" />Raccourci : <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">Ctrl + H</kbd>
          </span>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Modules disponibles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            const articleCount = module.sections.reduce((count, section) => count + section.articles.length, 0);
            return (
              <Card
                key={module.id}
                className="p-5 cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden"
                onClick={() => {
                  const firstArticle = module.sections[0]?.articles[0];
                  if (firstArticle) onSelectArticle(firstArticle.id);
                }}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${moduleAccentClasses(module.accent)}`} />
                <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${moduleAccentClasses(module.accent)} text-primary-foreground mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-base">{module.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{module.tagline}</p>
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="secondary" className="text-xs">{articleCount} articles</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-warning" />Démarrer ici</h2>
        <div className="space-y-2">
          {quickStarts.map(({ module, article }) => {
            const Icon = module.icon;
            return (
              <button
                key={article.id}
                onClick={() => onSelectArticle(article.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors text-left"
              >
                <div className={`p-2 rounded-md bg-gradient-to-br ${moduleAccentClasses(module.accent)} text-primary-foreground`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{article.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{module.title}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
