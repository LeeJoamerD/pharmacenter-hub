import { BookOpen, Headphones, MessageSquareHeart, GraduationCap, type LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { HelpTab } from '@/hooks/useHelpCenterController';

interface HelpTabsBarProps {
  active: HelpTab;
  onChange: (tab: HelpTab) => void;
  variant: 'dialog' | 'side';
}

const tabs: { id: HelpTab; label: string; compactLabel: string; icon: LucideIcon }[] = [
  { id: 'guide', label: 'Guide Utilisateur', compactLabel: 'Guide', icon: BookOpen },
  { id: 'support', label: 'Support', compactLabel: 'Support', icon: Headphones },
  { id: 'feedback', label: 'Commentaires', compactLabel: 'Avis', icon: MessageSquareHeart },
  { id: 'training', label: 'Formation', compactLabel: 'Formation', icon: GraduationCap },
];

export function HelpTabsBar({ active, onChange, variant }: HelpTabsBarProps) {
  const isSide = variant === 'side';

  return (
    <TooltipProvider delayDuration={300}>
      <div role="tablist" aria-label="Navigation du centre d’aide" className="flex border-b border-border bg-muted/10 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === active;
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onChange(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors border-b-2 min-w-0',
                    isSide ? 'flex-col gap-1' : 'sm:flex-row',
                    selected ? 'text-primary border-primary bg-primary/5 font-medium' : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/40'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={cn('text-[11px] truncate', isSide ? '' : 'sm:text-xs')}>{isSide ? tab.compactLabel : tab.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{tab.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
