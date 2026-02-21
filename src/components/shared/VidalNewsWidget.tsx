import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Newspaper, RefreshCw, AlertTriangle, ExternalLink, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VidalNewsItem {
  id: string;
  title: string;
  summary: string;
  updated: string;
  category: string;
  link: string | null;
}

const categoryColors: Record<string, string> = {
  'ANSM': 'bg-destructive/10 text-destructive border-destructive/30',
  'HAS': 'bg-primary/10 text-primary border-primary/30',
  'EMA': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  'Autre': 'bg-muted text-muted-foreground border-border',
};

const isAlertCategory = (title: string) => {
  const alertKeywords = ['retrait', 'rupture', 'suspension', 'rappel', 'alerte', 'vigilance', 'interdiction'];
  return alertKeywords.some(k => title.toLowerCase().includes(k));
};

const VidalNewsWidget: React.FC = () => {
  const [news, setNews] = useState<VidalNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke('vidal-search', {
        body: { action: 'get-news' },
      });
      if (err) throw err;
      if (data?.error) throw new Error(data.message || 'Erreur VIDAL');
      setNews(data?.news || []);
    } catch (e: any) {
      setError(e.message || 'Impossible de charger les actualités');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const displayedNews = news.slice(0, 10);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Actualités Thérapeutiques VIDAL
          </CardTitle>
          <CardDescription className="mt-1">
            Alertes ANSM, HAS, EMA — ruptures, retraits, nouvelles indications
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchNews} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !news.length && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && displayedNews.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune actualité disponible</p>
        )}

        {displayedNews.length > 0 && (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {displayedNews.map((item) => {
                const isAlert = isAlertCategory(item.title);
                const catClass = categoryColors[item.category] || categoryColors['Autre'];
                const dateStr = item.updated ? new Date(item.updated).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

                return (
                  <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border ${isAlert ? 'border-destructive/30 bg-destructive/5' : 'border-border'}`}>
                    <div className="shrink-0 mt-0.5">
                      {isAlert ? (
                        <Bell className="h-4 w-4 text-destructive" />
                      ) : (
                        <Newspaper className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${catClass}`}>
                          {item.category}
                        </Badge>
                        {dateStr && <span className="text-[10px] text-muted-foreground">{dateStr}</span>}
                      </div>
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline inline-flex items-center gap-1">
                          {item.title}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <p className="text-sm font-medium">{item.title}</p>
                      )}
                      {item.summary && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.summary}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default VidalNewsWidget;
