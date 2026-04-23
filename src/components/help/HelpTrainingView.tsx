import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Play, FileText, MousePointerClick, ChevronRight, ArrowLeft, ThumbsUp, ThumbsDown, BookOpen } from 'lucide-react';
import { trainingModules, TrainingModule, TrainingItem } from '@/data/helpGuideContent';

const typeIcons: Record<string, React.ReactNode> = {
  video: <Play className="h-4 w-4" />,
  article: <FileText className="h-4 w-4" />,
  interactive: <MousePointerClick className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  video: 'Vidéo',
  article: 'Article',
  interactive: 'Interactif',
};

export function HelpTrainingView() {
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);

  if (selectedModule) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-2 border-b border-border">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 h-8 text-xs" onClick={() => { setSelectedModule(null); setVoted(null); }}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Toutes les formations
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-4 py-4 space-y-4">
            <div>
              <h3 className="text-base font-semibold">{selectedModule.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{selectedModule.description}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              {selectedModule.items.map((item, idx) => (
                <button
                  key={item.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        {typeIcons[item.type]}
                        {typeLabels[item.type]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">• {item.duration}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Helpful vote */}
        <div className="border-t border-border px-4 py-3 bg-muted/20">
          <p className="text-xs text-muted-foreground mb-2">Cette formation vous a-t-elle été utile ?</p>
          <div className="flex gap-2">
            <Button variant={voted === 'yes' ? 'default' : 'outline'} size="sm" className="h-7 text-xs gap-1.5" onClick={() => setVoted('yes')}>
              <ThumbsUp className="h-3 w-3" /> Oui
            </Button>
            <Button variant={voted === 'no' ? 'default' : 'outline'} size="sm" className="h-7 text-xs gap-1.5" onClick={() => setVoted('no')}>
              <ThumbsDown className="h-3 w-3" /> Non
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="px-4 py-5 space-y-4">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold">Formation PharmaSoft</h3>
          <p className="text-sm text-muted-foreground">
            Apprenez à maîtriser toutes les fonctionnalités avec nos guides structurés.
          </p>
        </div>

        <div className="space-y-2">
          {trainingModules.map((mod) => (
            <button
              key={mod.id}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
              onClick={() => setSelectedModule(mod)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{mod.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {mod.items.length}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
