import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, Clock, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import SessionTypeSelector from './SessionTypeSelector';
import CashRegisterManagement from './CashRegisterManagement';
import SessionReports from './SessionReports';
import { useSessionWithType, type TypeSession } from '@/hooks/useSessionWithType';
import { useCaisses } from '@/hooks/useCaisses';

const CashManagement = () => {
  const { getDailySessions } = useSessionWithType();
  const { caisses } = useCaisses();
  
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Charger les sessions actives
  useEffect(() => {
    const loadActiveSessions = async () => {
      const sessions = await getDailySessions();
      const openSessions = sessions.filter(s => s.statut === 'Ouverte');
      setActiveSessions(openSessions);
    };

    loadActiveSessions();
  }, [getDailySessions, refreshKey]);

  const handleSessionOpened = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statut des sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Caisses et Sessions</CardTitle>
          <CardDescription>
            Gérez vos caisses, ouvrez des sessions Matin/Midi/Soir et consultez les rapports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSessions.length > 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">{activeSessions.length} session(s) active(s) aujourd'hui :</div>
                <div className="flex flex-wrap gap-2">
                  {activeSessions.map(session => (
                    <Badge key={session.id} variant="default">
                      {session.type_session} - {session.numero_session}
                    </Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucune session ouverte actuellement. Ouvrez une session pour commencer les ventes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="caisses" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Caisses ({caisses.length})
          </TabsTrigger>
          <TabsTrigger value="rapports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Rapports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6 mt-6">
          <SessionTypeSelector onSessionOpened={handleSessionOpened} />
        </TabsContent>

        <TabsContent value="caisses" className="mt-6">
          <CashRegisterManagement />
        </TabsContent>

        <TabsContent value="rapports" className="mt-6">
          <SessionReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashManagement;