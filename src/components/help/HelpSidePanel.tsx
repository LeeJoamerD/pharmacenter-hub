import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { X, BookOpen, Headphones, MessageSquareHeart, GraduationCap } from 'lucide-react';
import { HelpGuideView } from './HelpGuideView';
import { HelpContactView } from './HelpContactView';
import { HelpFeedbackView } from './HelpFeedbackView';
import { HelpTrainingView } from './HelpTrainingView';
import { cn } from '@/lib/utils';

type HelpTab = 'guide' | 'contact' | 'feedback' | 'training';

interface HelpSidePanelProps {
  onClose: () => void;
}

const tabs: { id: HelpTab; label: string; icon: React.ElementType }[] = [
  { id: 'guide', label: 'Aide', icon: BookOpen },
  { id: 'contact', label: 'Support', icon: Headphones },
  { id: 'feedback', label: 'Commentaires', icon: MessageSquareHeart },
  { id: 'training', label: 'Formation', icon: GraduationCap },
];

export function HelpSidePanel({ onClose }: HelpSidePanelProps) {
  const [activeTab, setActiveTab] = useState<HelpTab>('guide');

  const currentTab = tabs.find(t => t.id === activeTab)!;

  return (
    <div className="w-[380px] h-full border-l border-border bg-background flex flex-col animate-slide-in-right shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold text-foreground">{currentTab.label}</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-border bg-muted/10">
        {tabs.map((tab) => (
          <Tooltip key={tab.id}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors',
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-[11px] font-medium">{tab.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{tab.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'guide' && <HelpGuideView />}
        {activeTab === 'contact' && <HelpContactView />}
        {activeTab === 'feedback' && <HelpFeedbackView />}
        {activeTab === 'training' && <HelpTrainingView />}
      </div>
    </div>
  );
}
