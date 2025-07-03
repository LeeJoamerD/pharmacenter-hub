import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Plus, 
  Clock, 
  TrendingUp,
  DollarSign,
  FileText,
  Settings
} from 'lucide-react';
import useCashRegister from '@/hooks/useCashRegister';
import { useCurrency } from '@/contexts/CurrencyContext';
import CashSessionForm from './cash/CashSessionForm';
import CashMovementForm from './cash/CashMovementForm';
import CashSessionList from './cash/CashSessionList';
import CashReport from './cash/CashReport';

const CashManagement = () => {
  const { 
    currentSession, 
    sessions, 
    movements, 
    loading,
    openSession,
    closeSession,
    recordMovement,
    getSessionBalance,
    getSessionReport
  } = useCashRegister();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState('overview');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const totalBalance = currentSession ? getSessionBalance(currentSession.id) : 0;
  const todaySessions = sessions.filter(s => {
    const today = new Date();
    const sessionDate = new Date(s.openingDate);
    return sessionDate.toDateString() === today.toDateString();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gestion des Caisses</h3>
          <p className="text-muted-foreground">
            Contrôlez l'ouverture, fermeture et mouvements de vos caisses
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!currentSession && (
            <Button onClick={() => setShowSessionForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ouvrir une caisse
            </Button>
          )}
          {currentSession && (
            <Button 
              variant="outline"
              onClick={() => setShowMovementForm(true)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Enregistrer mouvement
            </Button>
          )}
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Active</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentSession ? '1' : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentSession ? `Caisse ${currentSession.cashRegisterId}` : 'Aucune session'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Actuel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Fonds en caisse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Aujourd'hui</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySessions.length}</div>
            <p className="text-xs text-muted-foreground">
              {todaySessions.filter(s => s.status === 'Fermée').length} fermées
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
              {currentSession ? movements.filter(m => m.sessionId === currentSession.id).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Session en cours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* État de la session actuelle */}
      {currentSession && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Session Active - Caisse {currentSession.cashRegisterId}
              </CardTitle>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {currentSession.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Ouverture</p>
                <p className="font-semibold">{formatPrice(currentSession.openingAmount)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(currentSession.openingDate).toLocaleString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde Actuel</p>
                <p className="font-semibold">{formatPrice(totalBalance)}</p>
                <p className="text-xs text-muted-foreground">
                  {movements.filter(m => m.sessionId === currentSession.id).length} mouvements
                </p>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="destructive" 
                  onClick={() => setSelectedSession(currentSession.id)}
                >
                  Fermer la session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <CashSessionList 
            sessions={sessions.slice(0, 5)} 
            onSelectSession={setSelectedSession}
            onViewReport={(sessionId) => {
              setSelectedSession(sessionId);
              setActiveTab('reports');
            }}
          />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <CashSessionList 
            sessions={sessions} 
            onSelectSession={setSelectedSession}
            onViewReport={(sessionId) => {
              setSelectedSession(sessionId);
              setActiveTab('reports');
            }}
          />
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mouvements de Caisse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {movements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun mouvement enregistré
                  </p>
                ) : (
                  movements.slice(0, 10).map((movement) => (
                    <div 
                      key={movement.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{movement.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(movement.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          movement.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.amount >= 0 ? '+' : ''}{formatPrice(movement.amount)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {movement.type}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {selectedSession ? (
            <CashReport 
              sessionId={selectedSession}
              report={getSessionReport(selectedSession)}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez une session pour voir le rapport</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showSessionForm && (
        <CashSessionForm 
          onClose={() => setShowSessionForm(false)}
          onSubmit={openSession}
          loading={loading}
        />
      )}

      {showMovementForm && currentSession && (
        <CashMovementForm 
          sessionId={currentSession.id}
          onClose={() => setShowMovementForm(false)}
          onSubmit={recordMovement}
          loading={loading}
        />
      )}

      {selectedSession && !showSessionForm && !showMovementForm && (
        <CashSessionForm 
          sessionId={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSubmit={(sessionId, _, amount, notes) => closeSession(sessionId, amount, notes)}
          loading={loading}
          isClosing
        />
      )}
    </div>
  );
};

export default CashManagement;