import { supabase } from '@/integrations/supabase/client';

/**
 * Utilitaire de gestion proactive du rafraîchissement de session Supabase.
 * Évite les erreurs 401 pendant les opérations batch de longue durée.
 */

// Minimum de temps restant avant d'initier un refresh (10 minutes)
const MIN_TIME_BEFORE_REFRESH = 600;

// Intervalle minimum entre deux tentatives de refresh (30 secondes)
let lastRefreshAttempt = 0;
const MIN_REFRESH_INTERVAL = 30000;

/**
 * Vérifie si la session est valide et la rafraîchit si nécessaire.
 * Doit être appelée avant chaque batch de requêtes dans les opérations longues.
 * 
 * @returns true si la session est valide, false si l'utilisateur doit se reconnecter
 */
export async function ensureValidSession(): Promise<boolean> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.warn('❌ Session non disponible:', sessionError?.message);
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const timeRemaining = expiresAt - now;

    // Log uniquement si moins de 15 minutes restantes
    if (timeRemaining < 900) {
      console.log(`🔐 Session: ${Math.floor(timeRemaining / 60)} minutes restantes`);
    }

    // Si plus de 10 minutes restantes, pas besoin de refresh
    if (timeRemaining > MIN_TIME_BEFORE_REFRESH) {
      return true;
    }

    // Éviter les refresh trop fréquents
    const nowMs = Date.now();
    if (nowMs - lastRefreshAttempt < MIN_REFRESH_INTERVAL) {
      return true;
    }

    console.log('🔄 Rafraîchissement de la session...');
    lastRefreshAttempt = nowMs;

    const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError || !newSession) {
      console.error('❌ Échec du rafraîchissement de session:', refreshError?.message);
      return false;
    }

    const newTimeRemaining = (newSession.expires_at || 0) - now;
    console.log(`✅ Session rafraîchie: ${Math.floor(newTimeRemaining / 60)} minutes restantes`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de session:', error);
    return false;
  }
}

/**
 * Vérifie si une erreur est liée à une session expirée (401)
 */
export function is401Error(error: any): boolean {
  if (!error) return false;
  
  return (
    error.code === '401' ||
    error.code === 401 ||
    error.message?.includes('401') ||
    error.message?.toLowerCase()?.includes('unauthorized') ||
    error.message?.toLowerCase()?.includes('jwt expired') ||
    error.message?.toLowerCase()?.includes('invalid jwt')
  );
}

/**
 * Tente de rafraîchir la session et signale si réussi
 */
export async function tryRefreshSession(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('❌ Échec du refresh de session:', error);
      return false;
    }
    console.log('✅ Session rafraîchie avec succès');
    return true;
  } catch (e) {
    console.error('❌ Erreur refresh session:', e);
    return false;
  }
}
