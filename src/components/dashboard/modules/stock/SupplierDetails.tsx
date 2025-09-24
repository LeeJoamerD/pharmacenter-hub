import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Calendar, 
  Package, 
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  BarChart3
} from 'lucide-react';
import { SupplierStatsService, SupplierStats, SupplierLocation } from '@/services/supplierStatsService';
import { useSupplierEvaluations } from '@/hooks/useSupplierEvaluations';
import { useSupplierOrders } from '@/hooks/useSupplierOrders';
import { useToast } from '@/hooks/use-toast';

interface SupplierDetailsProps {
  supplierId: string;
  supplierName: string;
  onBack: () => void;
  onViewHistory?: (supplierId: string) => void;
}

const SupplierDetails: React.FC<SupplierDetailsProps> = ({ 
  supplierId, 
  supplierName, 
  onBack, 
  onViewHistory 
}) => {
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [location, setLocation] = useState<SupplierLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const { evaluations, loading: loadingEvaluations } = useSupplierEvaluations(supplierId);
  const { orders, loading: loadingOrders } = useSupplierOrders();

  // Filter orders for this supplier
  const supplierOrders = orders.filter(order => order.fournisseur_id === supplierId);

  useEffect(() => {
    const loadSupplierData = async () => {
      try {
        setLoading(true);
        const [supplierStats, supplierLocation] = await Promise.all([
          SupplierStatsService.getSupplierStats(supplierId),
          SupplierStatsService.getSupplierLocation(supplierId)
        ]);
        
        setStats(supplierStats);
        setLocation(supplierLocation);
      } catch (error) {
        console.error('Erreur lors du chargement des détails fournisseur:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails du fournisseur",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSupplierData();
  }, [supplierId, toast]);

  const renderStars = (note: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(note) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'En cours': return 'bg-blue-100 text-blue-800';
      case 'Confirmé': return 'bg-yellow-100 text-yellow-800';
      case 'Expédié': return 'bg-orange-100 text-orange-800';
      case 'Livré': return 'bg-green-100 text-green-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || !stats || !location) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Détails du Fournisseur</h1>
            <p className="text-muted-foreground">{supplierName}</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Building className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des détails...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Détails du Fournisseur</h1>
            <p className="text-muted-foreground">{supplierName}</p>
          </div>
        </div>
        
        {onViewHistory && (
          <Button onClick={() => onViewHistory(supplierId)}>
            <FileText className="h-4 w-4 mr-2" />
            Voir Historique
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Commandes</p>
                <p className="text-2xl font-bold">{stats.totalCommandes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Montant Total</p>
                <p className="text-2xl font-bold">{stats.montantTotal.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">F CFA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Délai Moyen</p>
                <p className="text-2xl font-bold">{stats.delaiMoyenLivraison}</p>
                <p className="text-xs text-muted-foreground">jours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Note Moyenne</p>
                <p className="text-2xl font-bold">
                  {stats.noteEvaluation > 0 ? stats.noteEvaluation.toFixed(1) : '-'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.nombreEvaluations > 0 ? `${stats.nombreEvaluations} évaluations` : 'Aucune évaluation'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="informations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="commandes">Commandes</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
          <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
        </TabsList>

        {/* Informations Tab */}
        <TabsContent value="informations" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations Générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">Nom</p>
                  <p className="text-muted-foreground">{supplierName}</p>
                </div>
                
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Adresse
                  </p>
                  <p className="text-muted-foreground">{location.adresse}</p>
                </div>
                
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </p>
                  <p className="text-muted-foreground">{location.telephone}</p>
                </div>
                
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="text-muted-foreground">{location.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Taux de livraison à temps</span>
                    <span>{stats.tauxLivraisonATemps}%</span>
                  </div>
                  <Progress value={stats.tauxLivraisonATemps} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Note de service</span>
                    <span>{stats.noteEvaluation > 0 ? `${stats.noteEvaluation.toFixed(1)}/5` : 'N/A'}</span>
                  </div>
                  <Progress 
                    value={stats.noteEvaluation > 0 ? (stats.noteEvaluation / 5) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Commandes actives</p>
                    <p className="text-muted-foreground">{stats.activeCommandes}</p>
                  </div>
                  <div>
                    <p className="font-medium">Commandes livrées</p>
                    <p className="text-muted-foreground">{stats.commandesLivrees}</p>
                  </div>
                </div>
                
                {stats.derniereLivraison && (
                  <div>
                    <p className="font-medium">Dernière livraison</p>
                    <p className="text-muted-foreground">
                      {new Date(stats.derniereLivraison).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Commandes Tab */}
        <TabsContent value="commandes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commandes Récentes</CardTitle>
              <CardDescription>
                Liste des commandes passées avec ce fournisseur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="text-center py-8">
                  <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Chargement des commandes...</p>
                </div>
              ) : supplierOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>Aucune commande trouvée</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierOrders.slice(0, 10).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {order.date_commande ? 
                                new Date(order.date_commande).toLocaleDateString('fr-FR') :
                                new Date(order.created_at).toLocaleDateString('fr-FR')
                              }
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            CMD-{new Date(order.date_commande || order.created_at).getFullYear()}-{order.id.slice(-3)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.statut || 'En cours')}>
                              {order.statut || 'En cours'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique Tab */}
        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Relations</CardTitle>
              <CardDescription>
                Chronologie des interactions avec ce fournisseur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.premiereCommande && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Première commande</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(stats.premiereCommande).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  {stats.derniereLivraison && (
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Dernière livraison</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(stats.derniereLivraison).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Relation commerciale active</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.ceil((new Date().getTime() - new Date(stats.premiereCommande).getTime()) / (365 * 24 * 60 * 60 * 1000))} années de partenariat
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Évaluations Tab */}
        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évaluations Fournisseur</CardTitle>
              <CardDescription>
                Notes et commentaires sur la performance du fournisseur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvaluations ? (
                <div className="text-center py-8">
                  <Star className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Chargement des évaluations...</p>
                </div>
              ) : evaluations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-8 w-8 mx-auto mb-2" />
                  <p>Aucune évaluation disponible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluations.slice(0, 5).map((evaluation) => (
                    <div key={evaluation.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(evaluation.note_globale || 0)}</div>
                          <span className="font-medium">{evaluation.note_globale?.toFixed(1)}/5</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(evaluation.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      {evaluation.commentaires && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {evaluation.commentaires}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-xs">
                        <div>
                          <span className="font-medium">Ponctualité:</span>
                          <span className="ml-1">{evaluation.note_delai || '-'}/5</span>
                        </div>
                        <div>
                          <span className="font-medium">Qualité:</span>
                          <span className="ml-1">{evaluation.note_qualite || '-'}/5</span>
                        </div>
                        <div>
                          <span className="font-medium">Service:</span>
                          <span className="ml-1">{evaluation.note_service || '-'}/5</span>
                        </div>
                        <div>
                          <span className="font-medium">Prix:</span>
                          <span className="ml-1">{evaluation.note_prix || '-'}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplierDetails;