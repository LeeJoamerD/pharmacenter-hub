import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Package, 
  Search,
  Calendar,
  Eye,
  FileText,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useReceptions, Reception } from '@/hooks/useReceptions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReceptionHistoryProps {
  onViewReception?: (reception: Reception) => void;
}

const ReceptionHistory: React.FC<ReceptionHistoryProps> = ({ onViewReception }) => {
  const { receptions, loading } = useReceptions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReception, setSelectedReception] = useState<Reception | null>(null);

  // Filter receptions based on search and status
  const filteredReceptions = receptions.filter(reception => {
    const matchesSearch = !searchTerm || 
      reception.numero_reception?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reception.reference_facture?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reception.fournisseur?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || reception.statut === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (statut?: string) => {
    switch (statut) {
      case 'Validé': return 'bg-green-100 text-green-800';
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut?: string) => {
    switch (statut) {
      case 'Validé': return <CheckCircle className="h-4 w-4" />;
      case 'En cours': return <Clock className="h-4 w-4" />;
      case 'Annulé': return <AlertTriangle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Package className="h-8 w-8 animate-spin" />
            <span className="ml-2">Chargement de l'historique...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Historique des Réceptions
          </CardTitle>
          <CardDescription>
            Consultez l'historique complet de vos réceptions fournisseurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro, référence ou fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="Validé">Validé</SelectItem>
                <SelectItem value="Annulé">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reception History Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm || statusFilter ? 'Aucune réception trouvée' : 'Aucune réception enregistrée'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceptions.map((reception) => (
                    <TableRow key={reception.id}>
                      <TableCell className="font-medium">
                        {reception.numero_reception || `REC-${reception.id.slice(-6)}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {reception.date_reception ? 
                            format(new Date(reception.date_reception), 'dd/MM/yyyy HH:mm', { locale: fr }) :
                            format(new Date(reception.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {reception.fournisseur?.nom || 'Fournisseur inconnu'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {reception.reference_facture ? (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {reception.reference_facture}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(reception.statut)}>
                          {getStatusIcon(reception.statut)}
                          <span className="ml-1">{reception.statut || 'En cours'}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReception(reception)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Package className="h-5 w-5" />
                                  Détails de la réception {selectedReception?.numero_reception}
                                </DialogTitle>
                                <DialogDescription>
                                  Réception du {selectedReception?.date_reception ? 
                                    format(new Date(selectedReception.date_reception), 'dd/MM/yyyy à HH:mm', { locale: fr }) :
                                    format(new Date(selectedReception?.created_at || new Date()), 'dd/MM/yyyy à HH:mm', { locale: fr })
                                  }
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedReception && (
                                <div className="space-y-6">
                                  {/* Reception Info */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Informations générales</h4>
                                      <div className="text-sm space-y-1">
                                        <p><span className="font-medium">Fournisseur:</span> {selectedReception.fournisseur?.nom}</p>
                                        <p><span className="font-medium">Référence facture:</span> {selectedReception.reference_facture || '-'}</p>
                                        <p><span className="font-medium">Statut:</span> 
                                          <Badge className={`ml-2 ${getStatusColor(selectedReception.statut)}`}>
                                            {selectedReception.statut || 'En cours'}
                                          </Badge>
                                        </p>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Commande liée</h4>
                                      <div className="text-sm space-y-1">
                                        {selectedReception.commande ? (
                                          <p><span className="font-medium">N° Commande:</span> {selectedReception.commande.numero}</p>
                                        ) : (
                                          <p className="text-muted-foreground">Aucune commande liée</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Notes */}
                                  {selectedReception.notes && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Notes</h4>
                                      <p className="text-sm p-3 bg-muted rounded">{selectedReception.notes}</p>
                                    </div>
                                  )}

                                  {/* Quick actions */}
                                  <div className="flex gap-2 pt-4 border-t">
                                    <Button variant="outline" size="sm">
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Voir les lots créés
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <FileText className="h-4 w-4 mr-2" />
                                      Historique des mouvements
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {onViewReception && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewReception(reception)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{receptions.length}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold text-green-600">
                  {receptions.filter(r => r.statut === 'Validé').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {receptions.filter(r => r.statut === 'En cours' || !r.statut).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ce mois</p>
                <p className="text-2xl font-bold text-blue-600">
                  {receptions.filter(r => {
                    const receptionDate = new Date(r.date_reception || r.created_at);
                    const now = new Date();
                    return receptionDate.getMonth() === now.getMonth() && 
                           receptionDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReceptionHistory;