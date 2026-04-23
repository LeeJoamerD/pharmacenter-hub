import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { HelpCenterContent } from './HelpCenterContent';
import type { HelpCenterController } from '@/hooks/useHelpCenterController';

interface HelpCenterDialogProps {
  controller: HelpCenterController;
  currentModule?: string;
  currentSubModule?: string;
}

export function HelpCenterDialog({ controller, currentModule }: HelpCenterDialogProps) {
  const {
    open,
    setOpen,
    displayMode,
    toggleDisplayMode,
    selectedArticleId,
    setSelectedArticleId,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
  } = controller;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-6xl w-[95vw] h-[88vh] p-0 overflow-hidden gap-0 flex flex-col [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Guide Utilisateur PharmaSoft</DialogTitle>
        <DialogDescription className="sr-only">Centre d’aide et documentation de l’application PharmaSoft.</DialogDescription>
        <HelpCenterContent
          variant="dialog"
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
      </DialogContent>
    </Dialog>
  );
}
