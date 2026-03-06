/**
 * Hook pour gérer la file d'attente de synchronisation offline
 */
import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { OfflineSyncQueue } from '@/services/OfflineSyncQueue';
import { OfflineSyncService } from '@/services/OfflineSyncService';
import { useToast } from '@/hooks/use-toast';

export const useOfflineSyncQueue = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Rafraîchir le compteur
  const refreshCount = useCallback(async () => {
    const count = await OfflineSyncQueue.getPendingCount();
    setPendingCount(count);
    setIsSyncing(OfflineSyncService.getIsSyncing());
  }, []);

  // Écouter les changements de statut du service de sync
  useEffect(() => {
    const unsub = OfflineSyncService.onStatusChange(refreshCount);
    refreshCount();
    return unsub;
  }, [refreshCount]);

  // Auto-sync quand la connexion revient
  useEffect(() => {
    if (wasOffline && isOnline && pendingCount > 0) {
      console.log('🌐 Connexion rétablie, lancement sync auto...');
      syncNow();
    }
  }, [wasOffline, isOnline]);

  // Sync manuelle
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: 'Hors ligne',
        description: 'Impossible de synchroniser sans connexion internet.',
        variant: 'destructive',
      });
      return;
    }

    const results = await OfflineSyncService.syncAll();
    await refreshCount();

    if (results.synced > 0) {
      toast({
        title: 'Synchronisation réussie',
        description: `${results.synced} vente(s) synchronisée(s) avec succès.`,
      });
    }
    if (results.failed > 0) {
      toast({
        title: 'Erreurs de synchronisation',
        description: `${results.failed} vente(s) en erreur. Vérifiez le stock.`,
        variant: 'destructive',
      });
    }
  }, [isOnline, refreshCount, toast]);

  return {
    pendingCount,
    isSyncing,
    isOnline,
    syncNow,
    refreshCount,
  };
};
