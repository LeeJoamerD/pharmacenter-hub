import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Target, MapPin, Users, ListChecks, Lightbulb, AlertTriangle, Info, CheckCircle2, HelpCircle, Link2, ArrowRight } from 'lucide-react';
import type { GuideArticle, GuideModule, GuideSection, GuideCallout } from './types';
import { findArticle } from './registry';
import { Button } from '@/components/ui/button';
import { calloutClasses } from './visual';

const calloutIcons: Record<GuideCallout['type'], { icon: typeof Info; label: string }> = {
  tip: { icon: Lightbulb, label: 'Astuce' },
  warning: { icon: AlertTriangle, label: 'Attention' },
  info: { icon: Info, label: 'Info' },
  success: { icon: CheckCircle2, label: 'Bon à savoir' },
};

interface GuideArticleViewProps {
  module: GuideModule;
  section: GuideSection;
  article: GuideArticle;
  onNavigate: (articleId: string) => void;
}

export function GuideArticleView({ module, section, article, onNavigate }: GuideArticleViewProps) {
  const ModuleIcon = module.icon;

  return (
    <article className="max-w-3xl mx-auto py-6 px-6 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <ModuleIcon className="h-3.5 w-3.5" />
        <span>{module.title}</span>
        <ArrowRight className="h-3 w-3" />
        <span>{section.title}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="text-2xl font-bold tracking-normal leading-tight">{article.title}</h1>
        <p className="text-base text-muted-foreground leading-relaxed">{article.objective}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetaCard icon={Target} label="Objectif" value={article.objective} />
        {article.location && <MetaCard icon={MapPin} label="Localisation" value={article.location} />}
        {article.audience && article.audience.length > 0 && (
          <MetaCard
            icon={Users}
            label="Audience"
            value={<div className="flex flex-wrap gap-1 mt-1">{article.audience.map((item) => <Badge key={item} variant="secondary" className="text-xs">{item}</Badge>)}</div>}
          />
        )}
      </div>

      <Separator />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Présentation</h2>
        <p className="text-sm leading-relaxed text-foreground/90">{article.intro}</p>
      </section>

      {article.steps && article.steps.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" />Procédure pas à pas</h2>
          <ol className="space-y-2.5">
            {article.steps.map((step, index) => (
              <li key={`${step.title}-${index}`} className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">{index + 1}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{step.title}</h3>
                  {step.detail && <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{step.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {article.callouts && article.callouts.length > 0 && (
        <section className="space-y-3">
          {article.callouts.map((callout, index) => {
            const Icon = calloutIcons[callout.type].icon;
            return (
              <div key={`${callout.text}-${index}`} className={`flex gap-3 p-3 rounded-lg border ${calloutClasses(callout.type)}`}>
                <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{callout.title ?? calloutIcons[callout.type].label}</div>
                  <p className="text-sm leading-relaxed mt-0.5 opacity-90">{callout.text}</p>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {article.bestPractices && article.bestPractices.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-warning" />Bonnes pratiques</h2>
          <ul className="space-y-2">
            {article.bestPractices.map((practice) => (
              <li key={practice} className="flex gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span className="text-foreground/90 leading-relaxed">{practice}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {article.faq && article.faq.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary" />Questions fréquentes</h2>
          <div className="space-y-2">
            {article.faq.map((item) => (
              <div key={item.q} className="border rounded-lg p-3 bg-card">
                <div className="font-medium text-sm">{item.q}</div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {article.related && article.related.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" />Articles liés</h2>
          <div className="flex flex-col gap-1.5">
            {article.related.map((articleId) => {
              const found = findArticle(articleId);
              if (!found) return null;
              return (
                <Button key={articleId} variant="outline" size="sm" className="justify-start h-auto py-2" onClick={() => onNavigate(articleId)}>
                  <ArrowRight className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span className="text-left">{found.article.title}</span>
                </Button>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}

function MetaCard({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-normal">
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <div className="text-sm mt-1 text-foreground">{value}</div>
    </div>
  );
}
