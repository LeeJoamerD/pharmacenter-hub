import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, HelpCircle, X, Menu, BookOpen, PanelRight, Square } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { guideModules, findArticle, searchGuide } from './guide/registry';
import { GuideSidebar } from './guide/GuideSidebar';
import { GuideHome } from './guide/GuideHome';
import { GuideArticleView } from './guide/GuideArticleView';
import { HelpTabsBar } from './HelpTabsBar';
import { HelpContactView } from './HelpContactView';
import { HelpFeedbackView } from './HelpFeedbackView';
import { HelpTrainingView } from './HelpTrainingView';
import type { HelpDisplayMode, HelpTab } from '@/hooks/useHelpCenterController';
import { moduleAccentClasses } from './guide/visual';

interface HelpCenterContentProps {
  variant: 'dialog' | 'side';
  displayMode: HelpDisplayMode;
  selectedArticleId: string | null;
  setSelectedArticleId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: HelpTab;
  setActiveTab: (tab: HelpTab) => void;
  currentModule?: string;
  onClose: () => void;
  onToggleDisplayMode: () => void;
}

const tabTitles: Record<HelpTab, string> = {
  guide: 'Guide Utilisateur',
  support: 'Support',
  feedback: 'Commentaires',
  training: 'Formation',
};

export function HelpCenterContent({
  variant,
  displayMode,
  selectedArticleId,
  setSelectedArticleId,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  currentModule,
  onClose,
  onToggleDisplayMode,
}: HelpCenterContentProps) {
  const searchHits = useMemo(() => searchGuide(searchQuery), [searchQuery]);
  const currentArticle = selectedArticleId ? findArticle(selectedArticleId) : null;
  const isSide = variant === 'side';
  const isGuideTab = activeTab === 'guide';

  const handleSelectArticle = (id: string) => {
    setSelectedArticleId(id);
    setSearchQuery('');
  };

  const sidebar = (
    <GuideSidebar
      modules={guideModules}
      selectedArticleId={selectedArticleId}
      onSelect={handleSelectArticle}
      onHome={() => setSelectedArticleId(null)}
    />
  );

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-card shrink-0">
        {isGuideTab && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={`h-8 w-8 ${isSide ? '' : 'lg:hidden'}`} aria-label="Ouvrir le sommaire">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              {sidebar}
            </SheetContent>
          </Sheet>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 rounded-md bg-primary/10">
            <HelpCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold leading-tight">{tabTitles[activeTab]}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">PharmaSoft</div>
          </div>
        </div>

        {isGuideTab ? (
          <div className="relative flex-1 max-w-md ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans le guide…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-8 pr-8 h-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleDisplayMode} aria-label={displayMode === 'side' ? 'Afficher en fenêtre' : 'Afficher en panneau latéral'}>
                {displayMode === 'side' ? <Square className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{displayMode === 'side' ? 'Afficher en fenêtre' : 'Afficher en panneau latéral'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Fermer">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <HelpTabsBar active={activeTab} onChange={setActiveTab} variant={variant} />

      <div className="flex-1 flex min-h-0">
        {isGuideTab && !isSide && <aside className="hidden lg:block w-72 border-r bg-muted/20 shrink-0">{sidebar}</aside>}
        <main className="flex-1 min-w-0 bg-background">
          {activeTab === 'guide' ? (
            <ScrollArea className="h-full">
              {searchQuery ? (
                <SearchResultsView hits={searchHits} query={searchQuery} onSelect={handleSelectArticle} />
              ) : currentArticle ? (
                <GuideArticleView module={currentArticle.module} section={currentArticle.section} article={currentArticle.article} onNavigate={handleSelectArticle} />
              ) : (
                <GuideHome modules={guideModules} onSelectArticle={handleSelectArticle} />
              )}
            </ScrollArea>
          ) : activeTab === 'support' ? (
            <HelpContactView />
          ) : activeTab === 'feedback' ? (
            <HelpFeedbackView />
          ) : (
            <HelpTrainingView />
          )}
        </main>
      </div>
    </>
  );
}

function SearchResultsView({ hits, query, onSelect }: { hits: ReturnType<typeof searchGuide>; query: string; onSelect: (id: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto py-6 px-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Résultats pour « {query} »</h2>
        <p className="text-sm text-muted-foreground">{hits.length} {hits.length > 1 ? 'articles trouvés' : 'article trouvé'}</p>
      </div>

      {hits.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Aucun résultat</p>
          <p className="text-sm mt-1">Essayez avec d’autres mots-clés.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {hits.map(({ module, section, article }) => {
            const Icon = module.icon;
            return (
              <button key={article.id} onClick={() => onSelect(article.id)} className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/40 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-md bg-gradient-to-br ${moduleAccentClasses(module.accent)} text-primary-foreground shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span>{module.title}</span><span>›</span><span>{section.title}</span>
                    </div>
                    <h3 className="font-medium text-sm">{article.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.objective}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
