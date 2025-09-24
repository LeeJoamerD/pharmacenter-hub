import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Eye, 
  Phone, 
  Mail, 
  MapPin,
  Building,
  Star,
  TrendingUp,
  AlertTriangle,
  FileText,
  RefreshCw
} from 'lucide-react';
import { SupplierStatsService, SupplierStats, SupplierLocation } from '@/services/supplierStatsService';
import { useSupplierEvaluations } from '@/hooks/useSupplierEvaluations';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useToast } from '@/hooks/use-toast';

interface SupplierWithStats {
  id: string;
  nom: string;
  location: SupplierLocation;
  stats: SupplierStats;
  statut: 'actif' | 'inactif';
}

interface SupplierManagerProps {
  onViewHistory?: (supplierId: string) => void;
}

const SupplierManager = ({ onViewHistory }: SupplierManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('tous');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithStats | null>(null);
  const [suppliersWithStats, setSuppliersWithStats] = useState<SupplierWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load suppliers with real stats from database
  const loadSuppliersWithStats = async () => {
    try {
      setLoading(true);
      const suppliers = await SupplierStatsService.getAllSuppliersWithStats();
      setSuppliersWithStats(suppliers);
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des fournisseurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliersWithStats();
  }, []);

  const filteredSuppliers = suppliersWithStats.filter(supplier => {
    const matchesSearch = supplier.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.location.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'tous' || supplier.statut === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'inactif': return 'bg-gray-100 text-gray-800';
      case 'suspendu': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (note: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(note) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const openSupplierDetails = (supplier: SupplierWithStats) => {
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };

  // Calculate aggregate statistics
  const aggregateStats = {
    total: filteredSuppliers.length,
    actifs: filteredSuppliers.filter(s => s.statut === 'actif').length,
    suspendus: 0, // Pour l'instant aucun suspendu dans les données
    noteMoyenne: filteredSuppliers.length > 0 ? 
      filteredSuppliers.reduce((sum, s) => sum + s.stats.noteEvaluation, 0) / filteredSuppliers.length : 0
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides avec vraies données */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Fournisseurs</p>
                <p className="text-2xl font-bold">{aggregateStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold">{aggregateStats.actifs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Suspendus</p>
                <p className="text-2xl font-bold">{aggregateStats.suspendus}</p>
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
                <p className="text-2xl font-bold">{aggregateStats.noteMoyenne.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des fournisseurs - Mode lecture seule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Gestion des Fournisseurs
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadSuppliersWithStats}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              <CardDescription>Liste et consultation de tous les fournisseurs ({filteredSuppliers.length} fournisseurs)</CardDescription>
            </div>
            {/* Bouton "Nouvelle Fournisseur" supprimé */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tableau des fournisseurs avec vraies données */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Délai</TableHead>
                  <TableHead>Total Commandes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Chargement des fournisseurs...
                    </TableCell>
                  </TableRow>
                ) : filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Aucun fournisseur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.nom}</div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.stats.totalCommandes} commandes
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.location.email && supplier.location.email !== 'Non renseigné' && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {supplier.location.email}
                            </div>
                          )}
                          {supplier.location.telephone && supplier.location.telephone !== 'Non renseigné' && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {supplier.location.telephone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {supplier.location.adresse !== 'Non renseigné' 
                              ? `${supplier.location.adresse}, ${supplier.location.pays}`
                              : supplier.location.pays
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(supplier.stats.noteEvaluation)}</div>
                          <span className="text-sm font-medium">
                            {supplier.stats.noteEvaluation > 0 ? supplier.stats.noteEvaluation.toFixed(1) : '-'}
                          </span>
                          {supplier.stats.nombreEvaluations > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({supplier.stats.nombreEvaluations})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{supplier.stats.delaiMoyenLivraison} jours</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{supplier.stats.totalCommandes} commandes</div>
                          <div className="text-muted-foreground">
                            {supplier.stats.montantTotal.toLocaleString()} F CFA
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(supplier.statut)} w-fit`}>
                          {supplier.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openSupplierDetails(supplier)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {/* Bouton "Modifier" supprimé - Mode lecture seule */}
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

      {/* Dialog pour les détails du fournisseur - Version simplifiée */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu du Fournisseur</DialogTitle>
            <DialogDescription>
              Informations générales et statistiques du fournisseur
            </DialogDescription>
          </DialogHeader>
          
          {selectedSupplier && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-3">Informations Générales</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Nom:</span> {selectedSupplier.nom}</p>
                    <p><span className="font-medium">Adresse:</span> {selectedSupplier.location.adresse}</p>
                    <p><span className="font-medium">Téléphone:</span> {selectedSupplier.location.telephone}</p>
                    <p><span className="font-medium">Email:</span> {selectedSupplier.location.email}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-3">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Note:</span>
                      <div className="flex items-center gap-1">
                        <div className="flex">{renderStars(selectedSupplier.stats.noteEvaluation)}</div>
                        <span>{selectedSupplier.stats.noteEvaluation > 0 ? selectedSupplier.stats.noteEvaluation.toFixed(1) : '-'}</span>
                      </div>
                    </div>
                    <p><span className="font-medium">Délai moyen:</span> {selectedSupplier.stats.delaiMoyenLivraison} jours</p>
                    <p><span className="font-medium">Taux de livraison:</span> {selectedSupplier.stats.tauxLivraisonATemps}%</p>
                  </div>
                </div>
              </div>

              {/* Métriques */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedSupplier.stats.totalCommandes}</p>
                  <p className="text-sm text-muted-foreground">Commandes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedSupplier.stats.montantTotal.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">F CFA Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{selectedSupplier.stats.activeCommandes}</p>
                  <p className="text-sm text-muted-foreground">Commandes Actives</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    if (onViewHistory) {
                      onViewHistory(selectedSupplier.id);
                    }
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Voir Historique
                </Button>
                {/* Bouton "Modifier" supprimé - Mode lecture seule */}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierManager;