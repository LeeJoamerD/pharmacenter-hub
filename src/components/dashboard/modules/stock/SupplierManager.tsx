import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Phone, 
  Mail, 
  MapPin,
  Building,
  Star,
  TrendingUp,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface Supplier {
  id: string;
  nom: string;
  contact: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  pays: string;
  statut: 'actif' | 'inactif' | 'suspendu';
  note: number;
  delaiLivraison: number;
  conditionsPaiement: string;
  totalCommandes: number;
  montantTotal: number;
  derniereLivraison: string;
}

interface SupplierManagerProps {
  suppliers: any[];
  loading: boolean;
  onCreateSupplier: (supplierData: any) => Promise<any>;
  onUpdateSupplier: (id: string, updates: any) => Promise<any>;
  onDeleteSupplier: (id: string) => Promise<any>;
}

const SupplierManager = ({ suppliers: propSuppliers = [], loading, onCreateSupplier, onUpdateSupplier, onDeleteSupplier }: SupplierManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('tous');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Use real suppliers or fallback to mock data
  const suppliers = propSuppliers.length > 0 ? propSuppliers : [
    {
      id: '1',
      nom: 'Laboratoire Alpha',
      contact: 'Dr. Martin Dubois',
      email: 'contact@alpha.com',
      telephone: '+33 1 23 45 67 89',
      adresse: '123 Rue de la Santé',
      ville: 'Paris',
      pays: 'France',
      statut: 'actif',
      note: 4.5,
      delaiLivraison: 7,
      conditionsPaiement: '30 jours fin de mois',
      totalCommandes: 45,
      montantTotal: 2750000,
      derniereLivraison: '2024-12-01'
    }
  ];

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact.toLowerCase().includes(searchTerm.toLowerCase());
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

  const openSupplierDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Fournisseurs</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
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
                <p className="text-2xl font-bold">{suppliers.filter(s => s.statut === 'actif').length}</p>
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
                <p className="text-2xl font-bold">{suppliers.filter(s => s.statut === 'suspendu').length}</p>
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
                <p className="text-2xl font-bold">{(suppliers.reduce((sum, s) => sum + s.note, 0) / suppliers.length).toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des fournisseurs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des Fournisseurs</CardTitle>
              <CardDescription>Liste et gestion de tous les fournisseurs</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Fournisseur
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom ou contact..."
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

          {/* Tableau des fournisseurs */}
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
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.nom}</div>
                        <div className="text-sm text-muted-foreground">{supplier.contact}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {supplier.telephone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{supplier.ville}, {supplier.pays}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(supplier.note)}</div>
                        <span className="text-sm font-medium">{supplier.note}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{supplier.delaiLivraison} jours</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{supplier.totalCommandes} commandes</div>
                        <div className="text-muted-foreground">{supplier.montantTotal.toLocaleString()} F CFA</div>
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
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour les détails du fournisseur */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du Fournisseur</DialogTitle>
            <DialogDescription>
              Informations complètes et historique du fournisseur
            </DialogDescription>
          </DialogHeader>
          
          {selectedSupplier && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Nom</Label>
                  <p>{selectedSupplier.nom}</p>
                </div>
                <div>
                  <Label className="font-medium">Contact</Label>
                  <p>{selectedSupplier.contact}</p>
                </div>
                <div>
                  <Label className="font-medium">Email</Label>
                  <p>{selectedSupplier.email}</p>
                </div>
                <div>
                  <Label className="font-medium">Téléphone</Label>
                  <p>{selectedSupplier.telephone}</p>
                </div>
                <div className="col-span-2">
                  <Label className="font-medium">Adresse</Label>
                  <p>{selectedSupplier.adresse}, {selectedSupplier.ville}, {selectedSupplier.pays}</p>
                </div>
              </div>

              {/* Métriques */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedSupplier.totalCommandes}</p>
                  <p className="text-sm text-muted-foreground">Commandes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedSupplier.montantTotal.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">F CFA Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{selectedSupplier.delaiLivraison}</p>
                  <p className="text-sm text-muted-foreground">Jours Délai</p>
                </div>
              </div>

              {/* Conditions commerciales */}
              <div className="pt-4 border-t">
                <Label className="font-medium">Conditions de Paiement</Label>
                <p className="mt-1">{selectedSupplier.conditionsPaiement}</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Voir Historique
                </Button>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierManager;