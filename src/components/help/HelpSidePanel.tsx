import { HelpCenterContent } from './HelpCenterContent';
import type { HelpCenterController } from '@/hooks/useHelpCenterController';

interface HelpSidePanelProps {
  controller: HelpCenterController;
  currentModule?: string;
}

export function HelpSidePanel({ controller, currentModule }: HelpSidePanelProps) {
  const {
    selectedArticleId,
    setSelectedArticleId,
    searchQuery,
    setSearchQuery,
    displayMode,
    toggleDisplayMode,
    setOpen,
    activeTab,
    setActiveTab,
  } = controller;

  return (
    <aside className="h-screen w-[min(48rem,42vw)] max-w-3xl shrink-0 border-l border-border bg-background flex flex-col animate-in slide-in-from-right duration-300" aria-label="Guide utilisateur">
      <HelpCenterContent
        variant="side"
        displayMode={displayMode}
        selectedArticleId={selectedArticleId}
        setSelectedArticleId={setSelectedArticleId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentModule={currentModule}
        onClose={() => setOpen(false)}
        onToggleDisplayMode={toggleDisplayMode}
      />
    </aside>
  );
}
