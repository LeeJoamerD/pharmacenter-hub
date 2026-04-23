import { useCallback, useEffect, useState } from 'react';

export type HelpDisplayMode = 'dialog' | 'side';
export type HelpTab = 'guide' | 'support' | 'feedback' | 'training';

const DISPLAY_MODE_KEY = 'pharmasoft.help.displayMode';

function readInitialMode(): HelpDisplayMode {
  if (typeof window === 'undefined') return 'dialog';
  try {
    const saved = window.localStorage.getItem(DISPLAY_MODE_KEY);
    return saved === 'side' ? 'side' : 'dialog';
  } catch {
    return 'dialog';
  }
}

function isCompactViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

export function useHelpCenterController() {
  const [open, setOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<HelpDisplayMode>(readInitialMode);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<HelpTab>('guide');

  useEffect(() => {
    try {
      window.localStorage.setItem(DISPLAY_MODE_KEY, displayMode);
    } catch {
      // localStorage can be unavailable in private browsing.
    }
  }, [displayMode]);

  useEffect(() => {
    if (open && displayMode === 'side' && isCompactViewport()) {
      setDisplayMode('dialog');
    }
  }, [open, displayMode]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setActiveTab('guide');
    }
  }, [open]);

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode((previous) => (previous === 'dialog' ? 'side' : 'dialog'));
  }, []);

  return {
    open,
    setOpen,
    displayMode,
    setDisplayMode,
    toggleDisplayMode,
    selectedArticleId,
    setSelectedArticleId,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
  };
}

export type HelpCenterController = ReturnType<typeof useHelpCenterController>;
