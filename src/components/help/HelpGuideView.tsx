import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ArrowLeft, Home, ChevronRight, Rocket, LayoutDashboard, Settings2, Package, ShoppingCart, Calculator, BarChart3, Bot, Cog } from 'lucide-react';
import { helpGuideCategories, HelpGuideCategory, HelpGuideArticle } from '@/data/helpGuideContent';
import { HelpArticleView } from './HelpArticleView';

const iconMap: Record<string, React.ReactNode> = {
  Rocket: <Rocket className="h-5 w-5" />,
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  Settings2: <Settings2 className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
  ShoppingCart: <ShoppingCart className="h-5 w-5" />,
  Calculator: <Calculator className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  Bot: <Bot className="h-5 w-5" />,
  Cog: <Cog className="h-5 w-5" />,
};

type ViewState = 
  | { type: 'home' }
  | { type: 'category'; category: HelpGuideCategory }
  | { type: 'article'; article: HelpGuideArticle; category: HelpGuideCategory };

export function HelpGuideView() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewState>({ type: 'home' });

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const results: { article: HelpGuideArticle; category: HelpGuideCategory }[] = [];
    for (const cat of helpGuideCategories) {
      for (const art of cat.articles) {
        if (
          art.title.toLowerCase().includes(q) ||
          art.content.toLowerCase().includes(q)
        ) {
          results.push({ article: art, category: cat });
        }
      }
    }
    return results;
  }, [search]);

  const goHome = () => { setView({ type: 'home' }); setSearch(''); };

  // Article view
  if (view.type === 'article') {
    return (
      <HelpArticleView
        article={view.article}
        categoryTitle={view.category.title}
        onBack={() => setView({ type: 'category', category: view.category })}
        onHome={goHome}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans l'aide..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Breadcrumb for category view */}
      {view.type === 'category' && (
        <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border bg-muted/30">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goHome}>
            <Home className="h-3.5 w-3.5" />
          </Button>
          <span className="text-muted-foreground text-xs">/</span>
          <span className="text-xs font-medium text-foreground">{view.category.title}</span>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-3">
          {/* Search results */}
          {searchResults !== null ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground mb-2">
                {searchResults.length} résultat{searchResults.length !== 1 ? 's' : ''} pour "{search}"
              </p>
              {searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
                  <p className="text-xs text-muted-foreground mt-1">Essayez avec d'autres termes</p>
                </div>
              ) : (
                searchResults.map(({ article, category }) => (
                  <Button
                    key={article.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-2.5 px-3 text-left"
                    onClick={() => setView({ type: 'article', article, category })}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{article.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{category.title}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Button>
                ))
              )}
            </div>
          ) : view.type === 'home' ? (
            /* Categories list */
            <div className="space-y-1">
              {helpGuideCategories.map((cat) => (
                <Button
                  key={cat.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-3 px-3 text-left"
                  onClick={() => setView({ type: 'category', category: cat })}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      {iconMap[cat.icon] || <Rocket className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{cat.title}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {cat.articles.length}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            /* Articles list in category */
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground mb-2">
                {view.category.articles.length} article{view.category.articles.length !== 1 ? 's' : ''}
              </p>
              {view.category.articles.map((article) => (
                <Button
                  key={article.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-2.5 px-3 text-left"
                  onClick={() => setView({ type: 'article', article, category: view.category })}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{article.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{article.content}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
