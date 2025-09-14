import { useState } from "react";
import { useExpirationAlerts } from "@/hooks/useExpirationAlerts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, AlertTriangle, Calendar, CheckCircle, X, Settings, 
  Plus, Edit, Trash2, RefreshCw, Clock, Package, Eye
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export const ExpirationAlert = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [actionNotes, setActionNotes] = useState("");

  const {
    useExpirationAlertsQuery,
    useAlertStatsQuery,
    updateAlertStatus,
    isUpdatingStatus,
    getUrgencyColor,
    getAlertTypeLabel,
    generateExpirationAlerts,
  } = useExpirationAlerts();

  const { data: alerts = [], isLoading, refetch } = useExpirationAlertsQuery({
    ...(urgencyFilter !== "all" && { niveau_urgence: urgencyFilter }),
  });

  const { data: stats } = useAlertStatsQuery();

  const filteredAlerts = alerts.filter((alert: any) => {
    const produitNom = alert.produit?.libelle_produit || '';
    const produitCode = alert.produit?.code_cip || '';
    const lotNumero = alert.lot?.numero_lot || '';
    
    return produitNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
           produitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lotNumero.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleMarkAsTreated = async (alert: any) => {
    try {
      await updateAlertStatus({
        id: alert.id,
        statut: 'traitee',
        notes: actionNotes || 'Alerte marquée comme traitée',
        traite_par_id: 'current-user-id' // À remplacer par l'ID utilisateur réel
      });
      setSelectedAlert(null);
      setActionNotes('');
      toast.success('Alerte marquée comme traitée');
    } catch (error) {
      toast.error('Erreur lors du traitement de l\'alerte');
    }
  };

  const handleMarkAsIgnored = async (alert: any) => {
    try {
      await updateAlertStatus({
        id: alert.id,
        statut: 'ignoree',
        notes: actionNotes || 'Alerte ignorée',
        traite_par_id: 'current-user-id' // À remplacer par l'ID utilisateur réel
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
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Alertes Actives</p>
                <p className="text-2xl font-bold text-red-600">{stats?.active || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Critiques</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.critical || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Élevées</p>
                <p className="text-2xl font-bold text-green-600">{stats?.high || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface principale des alertes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alertes d'Expiration</CardTitle>
              <CardDescription>Gestion des alertes de péremption des produits</CardDescription>
            </div>
            <Button onClick={handleGenerateAlerts} disabled={isUpdatingStatus}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isUpdatingStatus ? 'animate-spin' : ''}`} />
              Générer Alertes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres et recherche */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par produit, code ou lot..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Urgence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                  <SelectItem value="eleve">Élevée</SelectItem>
                  <SelectItem value="moyen">Moyenne</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>

          {/* Tableau des alertes */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Date Expiration</TableHead>
                  <TableHead>Jours Restants</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Urgence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucune alerte trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert: any) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.produit?.libelle_produit}</div>
                          <div className="text-sm text-muted-foreground">{alert.produit?.code_cip}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {alert.lot?.numero_lot}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {alert.lot?.date_peremption ? 
                          format(new Date(alert.lot.date_peremption), 'dd/MM/yyyy', { locale: fr })
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          alert.jours_restants <= 0 ? 'text-red-600' :
                          alert.jours_restants <= 7 ? 'text-red-500' :
                          alert.jours_restants <= 30 ? 'text-orange-500' : 'text-green-600'
                        }`}>
                          {alert.jours_restants <= 0 ? 'Expiré' : `${alert.jours_restants}j`}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {alert.quantite_concernee}
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
                        <Badge variant={alert.statut === 'active' ? 'destructive' : 
                                      alert.statut === 'traitee' ? 'default' : 'secondary'}>
                          {alert.statut === 'active' ? 'Active' :
                           alert.statut === 'traitee' ? 'Traitée' : 'Ignorée'}
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
                                <DialogTitle>Traiter l'Alerte</DialogTitle>
                                <DialogDescription>
                                  Marquer l'alerte comme traitée ou l'ignorer
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="action-notes">Notes</Label>
                                  <Textarea
                                    id="action-notes"
                                    placeholder="Ajouter des notes..."
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                  />
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => handleMarkAsTreated(alert)}
                                    disabled={isUpdatingStatus}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Traiter
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