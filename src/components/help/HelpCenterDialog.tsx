import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Clock, 
  BookOpen, 
  HelpCircle, 
  Video, 
  Home,
  Package,
  ShoppingCart,
  Calculator,
  FileText,
  Bot,
  MessageSquare,
  Settings,
  Shield,
  ChevronRight,
  Star
} from 'lucide-react';
import { useHelpCenter, HelpArticle } from '@/hooks/useHelpCenter';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpArticleDialog } from './HelpArticleDialog';
import { HelpSearchResults } from './HelpSearchResults';

interface HelpCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModule?: string;
  currentSubModule?: string;
}

const moduleIcons: Record<string, any> = {
  dashboard: Home,
  administration: Shield,
  stock: Package,
  ventes: ShoppingCart,
  comptabilite: Calculator,
  rapports: FileText,
  assistant: Bot,
  chat: MessageSquare,
  parametres: Settings,
};

const moduleLabels: Record<string, string> = {
  dashboard: 'Tableau de bord',
  administration: 'Administration',
  stock: 'Stock',
  ventes: 'Ventes',
  comptabilite: 'Comptabilité',
  rapports: 'Rapports',
  assistant: 'Assistant IA',
  chat: 'Chat-PharmaSoft',
  parametres: 'Paramètres',
};

export function HelpCenterDialog({ 
  open, 
  onOpenChange, 
  currentModule,
  currentSubModule 
}: HelpCenterDialogProps) {
  const { t } = useLanguage();
  const { 
    categories, 
    articles, 
    recentHistory, 
    featuredArticles,
    faqItems,
    searchArticles,
    trackView,
    isLoading 
  } = useHelpCenter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchArticles(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchArticles]);

  const handleArticleClick = useCallback((article: HelpArticle) => {
    setSelectedArticle(article);
    setArticleDialogOpen(true);
    trackView({ articleId: article.id, searchQuery: searchQuery || undefined });
  }, [trackView, searchQuery]);

  // Get contextual suggestions based on current module
  const contextualArticles = currentModule 
    ? articles.filter(a => a.module_key === currentModule).slice(0, 3)
    : featuredArticles.slice(0, 3);

  // Get articles for selected module filter
  const filteredModuleArticles = selectedModuleFilter 
    ? articles.filter(a => a.module_key === selectedModuleFilter)
    : [];

  // Clear module filter when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedModuleFilter(null);
      setSearchQuery('');
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              {t('helpCenter')}
            </DialogTitle>
          </DialogHeader>

          {/* Search Input */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchHelp')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Ctrl+H
              </kbd>
            </div>
          </div>

          <ScrollArea className="flex-1 max-h-[60vh]">
            <div className="p-4 pt-0 space-y-4">
              {/* Search Results */}
              {searchQuery && !selectedModuleFilter && (
                <HelpSearchResults 
                  results={searchResults}
                  isSearching={isSearching}
                  searchQuery={searchQuery}
                  onArticleClick={handleArticleClick}
                />
              )}

              {/* Module Filter Results */}
              {selectedModuleFilter && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      {(() => {
                        const Icon = moduleIcons[selectedModuleFilter] || BookOpen;
                        return <Icon className="h-4 w-4 text-primary" />;
                      })()}
                      Articles - {moduleLabels[selectedModuleFilter]}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedModuleFilter(null)}
                    >
                      ← Retour
                    </Button>
                  </div>
                  
                  {filteredModuleArticles.length > 0 ? (
                    <div className="space-y-1">
                      {filteredModuleArticles.map((article) => (
                        <Button
                          key={article.id}
                          variant="ghost"
                          className="w-full justify-start h-auto py-3 px-3"
                          onClick={() => handleArticleClick(article)}
                        >
                          <BookOpen className="h-4 w-4 mr-2 text-primary shrink-0" />
                          <div className="flex-1 text-left">
                            <div className="font-medium truncate">{article.title}</div>
                            {article.summary && (
                              <div className="text-xs text-muted-foreground truncate">
                                {article.summary}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 ml-2 shrink-0" />
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Aucun article disponible</p>
                      <p className="text-sm mt-1">
                        Les articles pour ce module seront bientôt ajoutés.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Default content when not searching and no module filter */}
              {!searchQuery && !selectedModuleFilter && (
                <>
                  {/* Contextual Suggestions */}
                  {currentModule && contextualArticles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Suggestions pour {moduleLabels[currentModule] || currentModule}
                      </h3>
                      <div className="space-y-1">
                        {contextualArticles.map((article) => (
                          <Button
                            key={article.id}
                            variant="ghost"
                            className="w-full justify-start h-auto py-2 px-3"
                            onClick={() => handleArticleClick(article)}
                          >
                            <BookOpen className="h-4 w-4 mr-2 text-primary" />
                            <span className="truncate">{article.title}</span>
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent History */}
                  {recentHistory.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t('recentlyViewed')}
                      </h3>
                      <div className="space-y-1">
                        {recentHistory.slice(0, 5).map((item: any) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className="w-full justify-start h-auto py-2 px-3"
                            onClick={() => item.help_articles && handleArticleClick(item.help_articles)}
                          >
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="truncate">{item.help_articles?.title}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Modules */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {t('modules')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(moduleLabels).map(([key, label]) => {
                        const Icon = moduleIcons[key] || BookOpen;
                        const count = articles.filter(a => a.module_key === key).length;
                        return (
                          <Button
                            key={key}
                            variant="outline"
                            className="justify-start h-auto py-3"
                            onClick={() => setSelectedModuleFilter(key)}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            <span className="flex-1 text-left">{label}</span>
                            {count > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {count}
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Quick FAQ */}
                  {faqItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        {t('quickFAQ')}
                      </h3>
                      <div className="space-y-1">
                        {faqItems.slice(0, 5).map((faq: any, index: number) => (
                          <Button
                            key={index}
                            variant="ghost"
                            className="w-full justify-start h-auto py-2 px-3 text-left"
                            onClick={() => {
                              const article = articles.find(a => a.id === faq.articleId);
                              if (article) handleArticleClick(article);
                            }}
                          >
                            <HelpCircle className="h-4 w-4 mr-2 text-orange-500 shrink-0" />
                            <span className="truncate">{faq.question}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video Tutorials Link */}
                  <div>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setSearchQuery('video:')}
                    >
                      <Video className="h-4 w-4 mr-2 text-red-500" />
                      {t('viewAllTutorials')}
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Article Detail Dialog */}
      <HelpArticleDialog
        open={articleDialogOpen}
        onOpenChange={setArticleDialogOpen}
        article={selectedArticle}
      />
    </>
  );
}
