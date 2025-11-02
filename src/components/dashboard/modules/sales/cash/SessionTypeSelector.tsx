import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Clock, Store } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCaisses } from '@/hooks/useCaisses';
import { useSessionWithType, type TypeSession, type SessionConfig } from '@/hooks/useSessionWithType';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SessionTypeSelectorProps {
  onSessionOpened: () => void;
}

const SessionTypeSelector: React.FC<SessionTypeSelectorProps> = ({ onSessionOpened }) => {
  const { currentTenant } = useTenant();
  const { caisses, loading: caissesLoading } = useCaisses();
  const { openSessionWithType, hasOpenSession, loading: sessionLoading } = useSessionWithType();
  
  // Récupérer tous les personnels pour le sélecteur
  const { data: personnel = [], isLoading: personnelLoading } = useQuery({
    queryKey: ['personnel-list', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];
      
      const { data, error } = await supabase
        .from('personnel')
        .select('id, noms, prenoms, role')
        .eq('tenant_id', currentTenant.id)
        .eq('is_active', true)
        .order('noms', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentTenant?.id,
  });

  const [typeSession, setTypeSession] = useState<TypeSession>('Matin');
  const [caisseId, setCaisseId] = useState<string>('');
  const [caissierId, setCaissierId] = useState<string>('');
  const [fondCaisse, setFondCaisse] = useState<string>('50000');
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);

  // Vérifier si une session existe pour cette combinaison
  useEffect(() => {
    const checkSession = async () => {
      if (!caisseId || !typeSession) return;

      setCheckingSession(true);
      const hasOpen = await hasOpenSession(typeSession, caisseId);
      setHasExistingSession(hasOpen);
      setCheckingSession(false);
    };

    checkSession();
  }, [typeSession, caisseId, hasOpenSession]);

  const handleOpenSession = async () => {
    if (!caisseId || !caissierId || !fondCaisse) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const fondCaisseNumber = parseFloat(fondCaisse);
    if (isNaN(fondCaisseNumber) || fondCaisseNumber < 0) {
      toast.error('Le fond de caisse doit être un nombre positif');
      return;
    }

    try {
      const config: SessionConfig = {
        type_session: typeSession,
        caisse_id: caisseId,
        caissier_id: caissierId,
        fond_caisse_ouverture: fondCaisseNumber
      };

      await openSessionWithType(config);
      onSessionOpened();
    } catch (err) {
      // Error already handled in hook
    }
  };

  const loading = caissesLoading || personnelLoading || sessionLoading;

  // Déterminer le type de session recommandé selon l'heure
  const getRecommendedSessionType = (): TypeSession => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Matin';
    if (hour < 17) return 'Midi';
    return 'Soir';
  };

  useEffect(() => {
    setTypeSession(getRecommendedSessionType());
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Ouvrir une Nouvelle Session
        </CardTitle>
        <CardDescription>
          Sélectionnez le type de session et la caisse pour commencer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type de session */}
        <div className="space-y-2">
          <Label htmlFor="type-session">Type de Session</Label>
          <Select value={typeSession} onValueChange={(value) => setTypeSession(value as TypeSession)}>
            <SelectTrigger id="type-session">
              <SelectValue placeholder="Sélectionner le type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Matin">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Matin (Recommandé si &lt; 12h)
                </div>
              </SelectItem>
              <SelectItem value="Midi">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Midi (Recommandé 12h-17h)
                </div>
              </SelectItem>
              <SelectItem value="Soir">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Soir (Recommandé &gt; 17h)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sélection de la caisse */}
        <div className="space-y-2">
          <Label htmlFor="caisse">Caisse / Point de Vente</Label>
          <Select value={caisseId} onValueChange={setCaisseId} disabled={caissesLoading}>
            <SelectTrigger id="caisse">
              <SelectValue placeholder="Sélectionner une caisse" />
            </SelectTrigger>
            <SelectContent>
              {caisses.map((caisse) => (
                <SelectItem key={caisse.id} value={caisse.id}>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    {caisse.code_caisse} - {caisse.nom_caisse}
                    {caisse.emplacement && ` (${caisse.emplacement})`}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {caisses.length === 0 && !caissesLoading && (
            <p className="text-sm text-muted-foreground">
              Aucune caisse disponible. Créez d'abord une caisse.
            </p>
          )}
        </div>

        {/* Sélection du caissier */}
        <div className="space-y-2">
          <Label htmlFor="caissier">Caissier</Label>
          <Select value={caissierId} onValueChange={setCaissierId} disabled={personnelLoading}>
            <SelectTrigger id="caissier">
              <SelectValue placeholder="Sélectionner un caissier" />
            </SelectTrigger>
            <SelectContent>
              {personnel.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.prenoms} {p.noms} - {p.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fond de caisse */}
        <div className="space-y-2">
          <Label htmlFor="fond-caisse">Fond de Caisse Initial (FCFA)</Label>
          <Input
            id="fond-caisse"
            type="number"
            value={fondCaisse}
            onChange={(e) => setFondCaisse(e.target.value)}
            placeholder="50000"
            min="0"
            step="1000"
          />
        </div>

        {/* Alerte si session existe */}
        {hasExistingSession && caisseId && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Une session {typeSession} est déjà ouverte pour cette caisse aujourd'hui.
            </AlertDescription>
          </Alert>
        )}

        {/* Bouton d'ouverture */}
        <Button
          onClick={handleOpenSession}
          disabled={loading || checkingSession || hasExistingSession || !caisseId || !caissierId}
          className="w-full"
          size="lg"
        >
          {loading ? 'Ouverture...' : `Ouvrir Session ${typeSession}`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SessionTypeSelector;