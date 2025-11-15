import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  Store,
  BarChart3
} from 'lucide-react';
import { useSessionReports, type SessionReport, type DailyReport } from '@/hooks/useSessionReports';
import { useSessionWithType, type TypeSession } from '@/hooks/useSessionWithType';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SessionReports = () => {
  const { getDailyReport, getSessionReport, loading } = useSessionReports();
  const { getDailySessions } = useSessionWithType();
  
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [dailySessions, setDailySessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionReport | null>(null);

  // Charger les rapports
  useEffect(() => {
    const loadReports = async () => {
      if (!selectedDate) return;

      const [daily, sessions] = await Promise.all([
        getDailyReport(selectedDate),
        getDailySessions(selectedDate)
      ]);

      setDailyReport(daily);
      setDailySessions(sessions);
    };

    loadReports();
  }, [selectedDate, getDailyReport, getDailySessions]);

  const handleViewSessionDetail = async (sessionId: string) => {
    const report = await getSessionReport(sessionId);
    setSelectedSession(report);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) {
      return '0 FCFA';
    }
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  return (
    <div className="space-y-6">
      {/* Sélection de date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapports de Caisse
          </CardTitle>
          <CardDescription>
            Consultez les rapports détaillés par session et période
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <Button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
              <Calendar className="h-4 w-4 mr-2" />
              Aujourd'hui
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Chargement des rapports...
        </div>
      ) : (
        <>
          {/* Résumé journalier */}
          {dailyReport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Résumé du {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Total Journée</div>
                    <div className="text-2xl font-bold">{formatCurrency(dailyReport.total_ventes_journee)}</div>
                    <div className="text-xs text-muted-foreground">
                      {dailyReport.nombre_ventes_journee} ventes
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Sessions Actives</div>
                    <div className="text-2xl font-bold">{dailyReport.nombre_sessions_ouvertes}</div>
                    <div className="text-xs text-muted-foreground">
                      {dailyReport.nombre_caisses_actives} caisses
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Répartition</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Matin:</span>
                        <span className="font-medium">{formatCurrency(dailyReport.total_matin)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Midi:</span>
                        <span className="font-medium">{formatCurrency(dailyReport.total_midi)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Soir:</span>
                        <span className="font-medium">{formatCurrency(dailyReport.total_soir)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sessions de la journée */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sessions de la Journée
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailySessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune session pour cette date
                </div>
              ) : (
                <div className="space-y-4">
                  {dailySessions.map((session) => (
                    <Card key={session.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <Badge variant={session.statut === 'Ouverte' ? 'default' : 'secondary'}>
                                {session.type_session}
                              </Badge>
                              <span className="font-mono text-sm text-muted-foreground">
                                {session.numero_session}
                              </span>
                              <Badge variant={session.statut === 'Ouverte' ? 'default' : 'outline'}>
                                {session.statut}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Caisse:</span>
                                <span className="ml-2 font-medium">
                                  {session.caisse_id ? 'Assignée' : 'Non assignée'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Fond initial:</span>
                                <span className="ml-2 font-medium">
                                  {formatCurrency(session.fond_caisse_ouverture)}
                                </span>
                              </div>
                              {session.statut === 'Fermée' && (
                                <>
                                  <div>
                                    <span className="text-muted-foreground">Montant théorique:</span>
                                    <span className="ml-2 font-medium">
                                      {formatCurrency(session.montant_theorique_fermeture || 0)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Écart:</span>
                                    <span className={`ml-2 font-medium ${session.ecart && session.ecart !== 0 ? 'text-destructive' : ''}`}>
                                      {formatCurrency(session.ecart || 0)}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {session.statut === 'Fermée' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSessionDetail(session.id)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Détails
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détail session sélectionnée */}
          {selectedSession && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Rapport Détaillé - {selectedSession.numero_session}
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* En-tête */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Type Session</div>
                      <Badge className="mt-1">{selectedSession.type_session}</Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Caisse</div>
                      <div className="font-medium">{selectedSession.nom_caisse || 'Non assignée'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Caissier</div>
                      <div className="font-medium">{selectedSession.caissier_nom || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Statut</div>
                      <Badge variant="secondary">{selectedSession.statut}</Badge>
                    </div>
                  </div>

                  {/* Statistiques de ventes */}
                  <div>
                    <h4 className="font-semibold mb-3">Statistiques de Ventes</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{selectedSession.nombre_ventes}</div>
                          <div className="text-xs text-muted-foreground">Ventes</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{formatCurrency(selectedSession.total_ventes)}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{selectedSession.nombre_articles_vendus}</div>
                          <div className="text-xs text-muted-foreground">Articles</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{formatCurrency(selectedSession.montant_moyen_vente)}</div>
                          <div className="text-xs text-muted-foreground">Panier moyen</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Répartition par mode de paiement */}
                  <div>
                    <h4 className="font-semibold mb-3">Répartition par Mode de Paiement</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                        <span>Espèces</span>
                        <span className="font-medium">{formatCurrency(selectedSession.total_especes)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                        <span>Carte Bancaire</span>
                        <span className="font-medium">{formatCurrency(selectedSession.total_carte)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                        <span>Mobile Money</span>
                        <span className="font-medium">{formatCurrency(selectedSession.total_mobile)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                        <span>Chèque</span>
                        <span className="font-medium">{formatCurrency(selectedSession.total_cheque)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                        <span>Virement</span>
                        <span className="font-medium">{formatCurrency(selectedSession.total_virement)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mouvements de caisse */}
                  <div>
                    <h4 className="font-semibold mb-3">Mouvements de Caisse</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                        <span>Fond de caisse initial</span>
                        <span className="font-medium">{formatCurrency(selectedSession.fond_caisse_ouverture)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <span>Entrées</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedSession.total_entrees)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <span>Sorties</span>
                        <span className="font-medium text-red-600">{formatCurrency(selectedSession.total_sorties)}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-primary/10 border-2 border-primary/20">
                        <span className="font-semibold">Montant Théorique</span>
                        <span className="font-bold">{formatCurrency(selectedSession.montant_theorique_fermeture || 0)}</span>
                      </div>
                      {selectedSession.fond_caisse_fermeture && (
                        <div className="flex justify-between p-3 rounded-lg bg-secondary">
                          <span className="font-semibold">Montant Réel</span>
                          <span className="font-bold">{formatCurrency(selectedSession.fond_caisse_fermeture)}</span>
                        </div>
                      )}
                      {selectedSession.ecart !== undefined && selectedSession.ecart !== 0 && (
                        <div className={`flex justify-between p-3 rounded-lg ${selectedSession.ecart > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                          <span className="font-semibold">Écart</span>
                          <span className={`font-bold ${selectedSession.ecart > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedSession.ecart > 0 ? '+' : ''}{formatCurrency(selectedSession.ecart)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sessions du Jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailySessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune session pour cette date
                </div>
              ) : (
                <div className="space-y-3">
                  {dailySessions.map((session) => (
                    <Card key={session.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <CardContent className="pt-6" onClick={() => handleViewSessionDetail(session.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Badge variant={
                              session.type_session === 'Matin' ? 'default' :
                              session.type_session === 'Midi' ? 'secondary' : 'outline'
                            }>
                              {session.type_session}
                            </Badge>
                            <div>
                              <div className="font-mono text-sm">{session.numero_session}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(session.date_ouverture), 'HH:mm', { locale: fr })}
                                {session.date_fermeture && ` - ${format(new Date(session.date_fermeture), 'HH:mm', { locale: fr })}`}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <Badge variant={session.statut === 'Ouverte' ? 'default' : 'outline'}>
                              {session.statut}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SessionReports;