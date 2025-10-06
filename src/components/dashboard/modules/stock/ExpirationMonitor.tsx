import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, AlertTriangle, Package, Calendar, Search, Download, Tag, CheckCircle, X, RefreshCw, Eye, MessageSquare } from 'lucide-react';
import { useExpirationAlerts } from '@/hooks/useExpirationAlerts';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ExpirationMonitor = () => {
  const { currentUser } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [actionNotes, setActionNotes] = useState('');

  const {
    useExpirationAlertsQuery,
    useAlertStatsQuery,
    updateAlertStatus,
    isUpdatingStatus,
    getUrgencyColor,
    getAlertTypeLabel,
    getRecommendedActions,
    generateExpirationAlerts,
  } = useExpirationAlerts();

  // Récupérer les alertes avec filtres
  const { data: alerts = [], isLoading, refetch } = useExpirationAlertsQuery({
    ...(filterStatus !== 'all' && { statut_alerte: filterStatus }),
  });

  const { data: stats } = useAlertStatsQuery();

  const getStatusBadge = (statut: string) => {
    const configs = {
      active: { variant: 'destructive', label: 'Active' },
      traitee: { variant: 'default', label: 'Traitée' },
      ignoree: { variant: 'secondary', label: 'Ignorée' }
    };
    
    const config = configs[statut as keyof typeof configs] || { variant: 'outline', label: statut };
    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (niveau: string) => {
    const className = niveau === 'critique' ? 'text-red-500' : 
                     niveau === 'eleve' ? 'text-orange-500' : 
                     niveau === 'moyen' ? 'text-yellow-500' : 'text-blue-500';
    return <Clock className={`h-4 w-4 ${className}`} />;
  };

  const filteredAlerts = alerts.filter((alert: any) => {
    const produitNom = alert.produit?.libelle_produit || '';
    const produitCode = alert.produit?.code_cip || '';
    const lotNumero = alert.lot?.numero_lot || '';
    
    const matchesSearch = produitNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lotNumero.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPeriod = filterPeriod === 'all' || 
                         (filterPeriod === '7' && alert.jours_restants <= 7) ||
                         (filterPeriod === '30' && alert.jours_restants <= 30) ||
                         (filterPeriod === '90' && alert.jours_restants <= 90);
    
    const matchesStatus = filterStatus === 'all' || alert.statut === filterStatus;
    
    return matchesSearch && matchesPeriod && matchesStatus;
  });

  const summary = {
    expires: filteredAlerts.filter((a: any) => a.jours_restants <= 0).length,
    critiques: filteredAlerts.filter((a: any) => a.niveau_urgence === 'critique').length,
    proches: filteredAlerts.filter((a: any) => a.jours_restants > 0 && a.jours_restants <= 30).length,
    totalValeur: filteredAlerts.reduce((sum: number, alert: any) => {
      // Calcul approximatif de la valeur (à ajuster selon vos données)
      return sum + (alert.quantite_concernee * 1000); // Prix unitaire fictif
    }, 0)
  };

  const handleMarkAsTreated = async (alert: any) => {
    if (!currentUser?.id) {
      toast.error('Utilisateur non identifié');
      return;
    }

    try {
      await updateAlertStatus({
        id: alert.id,
        statut: 'traitee',
        notes: actionNotes || 'Alerte marquée comme traitée',
        traite_par_id: currentUser.id
      });
      setSelectedAlert(null);
      setActionNotes('');
      toast.success('Alerte marquée comme traitée');
    } catch (error) {
      toast.error('Erreur lors du traitement de l\'alerte');
    }
  };

  const handleMarkAsIgnored = async (alert: any) => {
    if (!currentUser?.id) {
      toast.error('Utilisateur non identifié');
      return;
    }

    try {
      await updateAlertStatus({
        id: alert.id,
        statut: 'ignoree',
        notes: actionNotes || 'Alerte ignorée',
        traite_par_id: currentUser.id
      });
      setSelectedAlert(null);
      setActionNotes('');
      toast.success('Alerte ignorée');
    } catch (error) {
      toast.error('Erreur lors de l\'ignorance de l\'alerte');
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      await generateExpirationAlerts();
      refetch();
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  const exportToCSV = () => {
    const csvData = filteredAlerts.map((alert: any) => ({
      'Produit': alert.produit?.libelle_produit || '',
      'Code': alert.produit?.code_cip || '',
      'Lot': alert.lot?.numero_lot || '',
      'Quantité': alert.quantite_concernee,
      'Date Expiration': alert.lot?.date_peremption,
      'Jours Restants': alert.jours_restants,
      'Niveau': alert.niveau_urgence,
      'Statut': alert.statut,
      'Type': alert.type_alerte
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alertes-peremption-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirés</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{summary.expires}</div>
            <p className="text-xs text-muted-foreground">À retirer immédiatement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critiques</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{summary.critiques}</div>
            <p className="text-xs text-muted-foreground">Moins de 15 jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proches</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{summary.proches}</div>
            <p className="text-xs text-muted-foreground">Dans 30 jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur à Risque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalValeur.toLocaleString()} F</div>
            <p className="text-xs text-muted-foreground">Stock concerné</p>
          </CardContent>
        </Card>
      </div>

      {/* Surveillance des expirations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Surveillance des Expirations</CardTitle>
              <CardDescription>Suivi des médicaments approchant de leur date d'expiration</CardDescription>
            </div>
            <Button onClick={handleGenerateAlerts} disabled={isUpdatingStatus}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isUpdatingStatus ? 'animate-spin' : ''}`} />
              Générer Alertes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, code ou lot..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes périodes</SelectItem>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                  <SelectItem value="90">90 jours</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="traitee">Traitée</SelectItem>
                  <SelectItem value="ignoree">Ignorée</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Table des expirations */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statut</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Jours Restants</TableHead>
                  <TableHead>Type d'Alerte</TableHead>
                  <TableHead>Urgence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucune alerte d'expiration trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert: any) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(alert.niveau_urgence)}
                          {getStatusBadge(alert.statut)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.produit?.libelle_produit}</div>
                          <div className="text-sm text-muted-foreground">{alert.produit?.code_cip}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {alert.lot?.numero_lot}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{alert.quantite_concernee}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {alert.lot?.date_peremption ? 
                            format(new Date(alert.lot.date_peremption), 'dd/MM/yyyy', { locale: fr })
                            : 'N/A'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`text-center font-medium ${
                          alert.jours_restants <= 0 ? 'text-red-600' :
                          alert.jours_restants <= 7 ? 'text-red-500' :
                          alert.jours_restants <= 30 ? 'text-orange-500' : 'text-green-600'
                        }`}>
                          {alert.jours_restants <= 0 ? 'Expiré' : `${alert.jours_restants}j`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getAlertTypeLabel(alert.type_alerte)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(alert.niveau_urgence)}>
                          {alert.niveau_urgence}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedAlert(alert)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Détails de l'Alerte</DialogTitle>
                                <DialogDescription>
                                  Actions recommandées et traitement de l'alerte
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Actions Recommandées</Label>
                                  <div className="mt-2 space-y-2">
                                    {getRecommendedActions(alert.jours_restants, alert.quantite_concernee).map((action: string, index: number) => (
                                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                                        <Tag className="h-4 w-4" />
                                        <span className="text-sm">{action}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label htmlFor="action-notes">Notes de traitement</Label>
                                  <Textarea
                                    id="action-notes"
                                    placeholder="Ajouter des notes sur l'action prise..."
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                    className="mt-2"
                                  />
                                </div>
                                
                                <div className="flex gap-2 pt-4">
                                  <Button 
                                    onClick={() => handleMarkAsTreated(alert)}
                                    disabled={isUpdatingStatus}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marquer comme Traitée
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => handleMarkAsIgnored(alert)}
                                    disabled={isUpdatingStatus}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Ignorer
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {alert.statut === 'active' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleMarkAsTreated(alert)}
                                disabled={isUpdatingStatus}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleMarkAsIgnored(alert)}
                                disabled={isUpdatingStatus}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpirationMonitor;