import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GuideModule } from './types';

interface GuideSidebarProps {
  modules: GuideModule[];
  selectedArticleId: string | null;
  onSelect: (articleId: string) => void;
  onHome: () => void;
}

export function GuideSidebar({ modules, selectedArticleId, onSelect, onHome }: GuideSidebarProps) {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(modules.map((module) => module.id)));
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleModule = (id: string) => {
    setOpenModules((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setOpenSections((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <button
          onClick={onHome}
          className={cn(
            'w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
            selectedArticleId === null ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'
          )}
        >
          <BookOpen className="h-4 w-4" />
          Accueil du guide
        </button>
        <div className="h-px bg-border my-2" />
        {modules.map((module) => {
          const ModuleIcon = module.icon;
          const moduleOpen = openModules.has(module.id);
          return (
            <div key={module.id}>
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm font-semibold hover:bg-accent text-foreground"
              >
                {moduleOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                <ModuleIcon className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-left truncate">{module.title}</span>
              </button>
              {moduleOpen && (
                <div className="ml-3 mt-0.5 border-l pl-2 space-y-0.5">
                  {module.sections.map((section) => {
                    const SectionIcon = section.icon;
                    const containsSelected = section.articles.some((article) => article.id === selectedArticleId);
                    const sectionOpen = openSections.has(section.id) || module.sections.length === 1 || containsSelected;
                    return (
                      <div key={section.id}>
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium hover:bg-accent/60 text-muted-foreground"
                        >
                          {sectionOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                          {SectionIcon && <SectionIcon className="h-3.5 w-3.5 shrink-0" />}
                          <span className="text-left truncate">{section.title}</span>
                        </button>
                        {sectionOpen && (
                          <div className="ml-4 border-l pl-2 space-y-0.5 py-0.5">
                            {section.articles.map((article) => (
                              <button
                                key={article.id}
                                onClick={() => onSelect(article.id)}
                                className={cn(
                                  'w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors leading-snug',
                                  selectedArticleId === article.id
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-foreground/80 hover:bg-accent/60'
                                )}
                              >
                                {article.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
