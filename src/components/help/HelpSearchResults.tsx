import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Search, Video, ChevronRight } from 'lucide-react';
import { HelpArticle } from '@/hooks/useHelpCenter';
import { useLanguage } from '@/contexts/LanguageContext';

interface HelpSearchResultsProps {
  results: HelpArticle[];
  isSearching: boolean;
  searchQuery: string;
  onArticleClick: (article: HelpArticle) => void;
}

export function HelpSearchResults({ 
  results, 
  isSearching, 
  searchQuery, 
  onArticleClick 
}: HelpSearchResultsProps) {
  const { t } = useLanguage();

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 rounded px-0.5">
          {part}
        </mark>
      ) : part
    );
  };

  if (isSearching) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4 animate-pulse" />
          Recherche en cours...
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-lg border">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0 && searchQuery.trim()) {
    return (
      <div className="text-center py-8">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium mb-2">{t('noResults')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Aucun article ne correspond à "{searchQuery}"
        </p>
        <p className="text-sm text-muted-foreground">
          {t('searchTip')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
        </p>
      )}
      
      {results.map((article) => (
        <Button
          key={article.id}
          variant="ghost"
          className="w-full justify-start h-auto py-3 px-3 text-left"
          onClick={() => onArticleClick(article)}
        >
          <div className="flex items-start gap-3 w-full">
            <div className="p-1.5 rounded bg-primary/10 shrink-0">
              {article.video_url ? (
                <Video className="h-4 w-4 text-red-500" />
              ) : (
                <BookOpen className="h-4 w-4 text-primary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {highlightMatch(article.title, searchQuery)}
                </span>
                {article.is_featured && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    Recommandé
                  </Badge>
                )}
              </div>
              
              {article.summary && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {highlightMatch(article.summary, searchQuery)}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                {article.category_name && (
                  <Badge variant="outline" className="text-xs">
                    {article.category_name}
                  </Badge>
                )}
                {article.video_url && (
                  <Badge variant="outline" className="text-xs text-red-500 border-red-200">
                    Vidéo
                  </Badge>
                )}
              </div>
            </div>
            
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </Button>
      ))}
    </div>
  );
}
