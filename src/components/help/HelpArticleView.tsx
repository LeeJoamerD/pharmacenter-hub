import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Home, ThumbsUp, ThumbsDown, Lightbulb, ListChecks } from 'lucide-react';
import { HelpGuideArticle } from '@/data/helpGuideContent';
import { useState } from 'react';

interface HelpArticleViewProps {
  article: HelpGuideArticle;
  categoryTitle: string;
  onBack: () => void;
  onHome: () => void;
}

export function HelpArticleView({ article, categoryTitle, onBack, onHome }: HelpArticleViewProps) {
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onHome}>
          <Home className="h-3.5 w-3.5" />
        </Button>
        <span className="text-muted-foreground text-xs">/</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={onBack}>
          {categoryTitle}
        </Button>
        <span className="text-muted-foreground text-xs">/</span>
        <span className="text-xs text-muted-foreground truncate max-w-[120px]">{article.title}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-foreground leading-tight">{article.title}</h2>
          <Separator className="mt-3" />
        </div>

        <p className="text-sm text-foreground/90 leading-relaxed">{article.content}</p>

        {article.steps && article.steps.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ListChecks className="h-4 w-4 text-primary" />
              Étapes à suivre
            </div>
            <ol className="space-y-2 pl-1">
              {article.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-foreground/85">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {article.tips && article.tips.length > 0 && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Lightbulb className="h-4 w-4" />
              Conseils
            </div>
            <ul className="space-y-1.5">
              {article.tips.map((tip, i) => (
                <li key={i} className="text-sm text-foreground/80 flex gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Helpful vote */}
      <div className="border-t border-border px-4 py-3 bg-muted/20">
        <p className="text-xs text-muted-foreground mb-2">Ces informations vous ont-elles été utiles ?</p>
        <div className="flex gap-2">
          <Button
            variant={voted === 'yes' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setVoted('yes')}
          >
            <ThumbsUp className="h-3 w-3" />
            Oui
          </Button>
          <Button
            variant={voted === 'no' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setVoted('no')}
          >
            <ThumbsDown className="h-3 w-3" />
            Non
          </Button>
          {voted && (
            <span className="text-xs text-muted-foreground self-center ml-2">
              Merci pour votre retour !
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
