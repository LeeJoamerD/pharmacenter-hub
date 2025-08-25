import { useEffect } from 'react';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';

/**
 * Composant invisible qui synchronise automatiquement les paramètres système
 * avec les autres contextes (Currency, Language, Interface) au chargement de l'application
 */
export const SystemSettingsSync = () => {
  const { settings, syncWithOtherContexts } = useGlobalSystemSettings();

  useEffect(() => {
    // Synchroniser les paramètres avec les autres contextes dès que les settings sont chargés
    if (settings) {
      syncWithOtherContexts();
    }
  }, [settings, syncWithOtherContexts]);

  // Ce composant ne rend rien, il sert uniquement à la synchronisation
  return null;
};