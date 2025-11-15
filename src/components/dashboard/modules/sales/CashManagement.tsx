import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, Clock, FileText, AlertCircle, CheckCircle, Calculator, DollarSign, TrendingUp } from 'lucide-react';
import SessionTypeSelector from './cash/SessionTypeSelector';
import CashRegisterManagement from './cash/CashRegisterManagement';
import SessionReports from './cash/SessionReports';
import CashSessionList from './cash/CashSessionList';
import CashMovementForm from './cash/CashMovementForm';
import CloseSessionModal from './cash/CloseSessionModal';
import SessionReportModal from './cash/SessionReportModal';
import { useSessionWithType, type TypeSession } from '@/hooks/useSessionWithType';
import { useCaisses } from '@/hooks/useCaisses';
import useCashRegister, { CashSession } from '@/hooks/useCashRegister';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSalesMetricsDB } from '@/hooks/useSalesMetricsDB';

const CashManagement = () => {
  const { getDailySessions } = useSessionWithType();
  const { caisses } = useCaisses();
  const { currentSession, allSessions, movements, recordMovement, getSessionBalance, loadMovements, loading } = useCashRegister();
  const { formatPrice } = useCurrency();
  const { metrics: dashboardMetrics } = useSalesMetricsDB();
  
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSessionForClose, setSelectedSessionForClose] = useState<CashSession | null>(null);
  const [selectedSessionIdForReport, setSelectedSessionIdForReport] = useState<string | null>(null);

  // Charger les sessions actives
  useEffect(() => {
    const loadActiveSessions = async () => {
      const sessions = await getDailySessions();
      const openSessions = sessions.filter(s => s.statut === 'Ouverte');
      setActiveSessions(openSessions);
    };

    loadActiveSessions();
  }, [getDailySessions, refreshKey]);

  // Utiliser les données pré-calculées par le backend
  const totalBalance = dashboardMetrics?.totalCashAmount || 0;
  const totalMovements = dashboardMetrics?.totalMovements || 0;

  // Charger les mouvements de la session active
  useEffect(() => {
    if (currentSession) {
      loadMovements(currentSession.id);
    }
  }, [currentSession, loadMovements]);

  const handleSessionOpened = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectSession = (sessionId: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (session && session.statut === 'Ouverte') {
      setSelectedSessionForClose(session);
      setShowCloseModal(true);
    }
  };

  const handleViewReport = (sessionId: string) => {
    setSelectedSessionIdForReport(sessionId);
    setShowReportModal(true);
  };

  const handleSessionClosed = () => {
    setRefreshKey(prev => prev + 1);
  };

  const todaySessions = allSessions.filter(s => {
    const today = new Date();
    const sessionDate = new Date(s.date_ouverture);
    return sessionDate.toDateString() === today.toDateString();
  });

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

      {/* Métriques rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Actives</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              {todaySessions.length} aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Actuel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Fonds en caisse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caisses Disponibles</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{caisses.length}</div>
            <p className="text-xs text-muted-foreground">
              Points de vente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mouvements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMovements}
            </div>
            <p className="text-xs text-muted-foreground">
              Toutes sessions actives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="caisses" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Caisses ({caisses.length})
          </TabsTrigger>
          <TabsTrigger value="historique" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Historique
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

        <TabsContent value="historique" className="mt-6">
          <CashSessionList 
            sessions={allSessions} 
            onSelectSession={handleSelectSession}
            onViewReport={handleViewReport}
          />
        </TabsContent>

        <TabsContent value="rapports" className="mt-6">
          <SessionReports />
        </TabsContent>
      </Tabs>

      {/* Modal pour mouvements */}
      {showMovementForm && currentSession && (
        <CashMovementForm 
          sessionId={currentSession.id}
          onClose={() => setShowMovementForm(false)}
          onSubmit={recordMovement}
          loading={loading}
        />
      )}

      {/* Modal de fermeture de session */}
      <CloseSessionModal
        session={selectedSessionForClose}
        open={showCloseModal}
        onOpenChange={setShowCloseModal}
        onSessionClosed={handleSessionClosed}
      />

      {/* Modal de rapport de session */}
      <SessionReportModal
        sessionId={selectedSessionIdForReport}
        open={showReportModal}
        onOpenChange={setShowReportModal}
      />
    </div>
  );
};

export default CashManagement;