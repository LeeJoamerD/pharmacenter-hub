/**
 * Indicateur visuel du statut de connexion internet
 */
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOfflineSyncQueue } from '@/hooks/useOfflineSyncQueue';
import { cn } from '@/lib/utils';

export const ConnectionIndicator = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { pendingCount, isSyncing } = useOfflineSyncQueue();

  if (isOnline && !wasOffline && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      {/* Sync indicator */}
      {pendingCount > 0 && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg",
          isSyncing
            ? "bg-blue-500 text-white animate-pulse"
            : "bg-amber-500 text-white"
        )}>
          <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
          {isSyncing ? 'Synchronisation...' : `${pendingCount} vente(s) en attente`}
        </div>
      )}

      {/* Connection status */}
      {!isOnline && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-destructive text-destructive-foreground text-xs font-medium shadow-lg">
          <WifiOff className="h-3.5 w-3.5" />
          Hors ligne
        </div>
      )}

      {wasOffline && isOnline && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-500 text-white text-xs font-medium shadow-lg animate-fade-in">
          <Wifi className="h-3.5 w-3.5" />
          Connexion rétablie
        </div>
      )}
    </div>
  );
};
