import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { 
  RotateCcw, 
  Search, 
  ShoppingCart, 
  Receipt, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  Minus,
  RefreshCw,
  FileText,
  Calendar,
  User,
  DollarSign,
  Package
} from 'lucide-react';

interface ReturnItem {
  id: string;
  productId: string;
  name: string;
  originalQuantity: number;
  returnQuantity: number;
  unitPrice: number;
  reason: string;
  condition: 'perfect' | 'damaged' | 'expired';
  refundAmount: number;
}

interface ReturnRequest {
  id: string;
  originalTransactionId: string;
  originalTransactionRef: string;
  date: Date;
  customer: {
    name: string;
    contact?: string;
  };
  items: ReturnItem[];
  totalRefund: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason: string;
  notes?: string;
  processedBy?: string;
  processedDate?: Date;
}

interface OriginalTransaction {
  id: string;
  reference: string;
  date: Date;
  customer: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  total: number;
  status: string;
}

const ReturnsExchanges = () => {
  const [activeTab, setActiveTab] = useState('new-return');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<OriginalTransaction | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  // Données mockées pour les transactions originales
  const mockTransactions: OriginalTransaction[] = [
    {
      id: 'TXN-001',
      reference: 'VT-001-2024',
      date: new Date('2024-01-15T14:35:00'),
      customer: 'Jean Baptiste Kouakou',
      items: [
        { id: '1', name: 'Paracétamol 500mg', quantity: 2, unitPrice: 1500, total: 3000 },
        { id: '2', name: 'Vitamine C', quantity: 1, unitPrice: 2500, total: 2500 }
      ],
      total: 5500,
      status: 'completed'
    },
    {
      id: 'TXN-002',
      reference: 'VT-002-2024',
      date: new Date('2024-01-15T13:20:00'),
      customer: 'Fatou Ba',
      items: [
        { id: '3', name: 'Antibiotique Amoxicilline', quantity: 1, unitPrice: 8500, total: 8500 }
      ],
      total: 8500,
      status: 'completed'
    }
  ];

  // Données mockées pour les retours existants
  const mockReturns: ReturnRequest[] = [
    {
      id: 'RET-001',
      originalTransactionId: 'TXN-001',
      originalTransactionRef: 'VT-001-2024',
      date: new Date('2024-01-16T10:30:00'),
      customer: {
        name: 'Jean Baptiste Kouakou',
        contact: '77 123 45 67'
      },
      items: [
        {
          id: '1',
          productId: '1',
          name: 'Paracétamol 500mg',
          originalQuantity: 2,
          returnQuantity: 1,
          unitPrice: 1500,
          reason: 'Produit défectueux',
          condition: 'damaged',
          refundAmount: 1500
        }
      ],
      totalRefund: 1500,
      status: 'pending',
      reason: 'Produit défectueux',
      notes: 'Boîte endommagée à la livraison'
    }
  ];

  const returnReasons = [
    'Produit défectueux',
    'Erreur de commande',
    'Produit expiré',
    'Changement d\'avis',
    'Effet indésirable',
    'Ordonnance modifiée',
    'Autre'
  ];

  const handleTransactionSearch = () => {
    const transaction = mockTransactions.find(t => 
      t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (transaction) {
      setSelectedTransaction(transaction);
      // Initialiser les articles pour le retour
      const items: ReturnItem[] = transaction.items.map(item => ({
        id: item.id,
        productId: item.id,
        name: item.name,
        originalQuantity: item.quantity,
        returnQuantity: 0,
        unitPrice: item.unitPrice,
        reason: '',
        condition: 'perfect',
        refundAmount: 0
      }));
      setReturnItems(items);
    } else {
      setSelectedTransaction(null);
      setReturnItems([]);
    }
  };

  const updateReturnItem = (itemId: string, field: keyof ReturnItem, value: any) => {
    setReturnItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        // Recalculer le montant de remboursement
        if (field === 'returnQuantity' || field === 'condition') {
          let refundRate = 1;
          if (updated.condition === 'damaged') refundRate = 0.5;
          if (updated.condition === 'expired') refundRate = 0;
          
          updated.refundAmount = updated.returnQuantity * updated.unitPrice * refundRate;
        }
        return updated;
      }
      return item;
    }));
  };

  const getTotalRefund = () => {
    return returnItems.reduce((sum, item) => sum + item.refundAmount, 0);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      completed: 'outline'
    } as const;

    const labels = {
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      completed: 'Terminé'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getConditionBadge = (condition: string) => {
    const variants = {
      perfect: 'default',
      damaged: 'secondary',
      expired: 'destructive'
    } as const;

    const labels = {
      perfect: 'Parfait',
      damaged: 'Endommagé',
      expired: 'Expiré'
    };

    return (
      <Badge variant={variants[condition as keyof typeof variants] || 'outline'} className="text-xs">
        {labels[condition as keyof typeof labels] || condition}
      </Badge>
    );
  };

  const handleSubmitReturn = () => {
    const validItems = returnItems.filter(item => item.returnQuantity > 0);
    
    if (validItems.length === 0) {
      alert('Veuillez sélectionner au moins un article à retourner');
      return;
    }

    if (!returnReason) {
      alert('Veuillez indiquer la raison du retour');
      return;
    }

    // Ici, on enverrait les données au backend
    console.log('Demande de retour soumise:', {
      transaction: selectedTransaction,
      items: validItems,
      reason: returnReason,
      notes: returnNotes,
      totalRefund: getTotalRefund()
    });

    // Reset du formulaire
    setSelectedTransaction(null);
    setReturnItems([]);
    setReturnReason('');
    setReturnNotes('');
    setSearchTerm('');
    
    alert('Demande de retour soumise avec succès');
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retours du Jour</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">12</div>
            <p className="text-xs text-muted-foreground">+3 depuis hier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Remboursé</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">127,500 FCFA</div>
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">5</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Retour</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">2.3%</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="new-return">Nouveau Retour</TabsTrigger>
          <TabsTrigger value="pending-returns">Retours en Attente</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Nouveau Retour */}
        <TabsContent value="new-return" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nouveau Retour/Échange</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recherche de transaction */}
              <div className="space-y-4">
                <Label htmlFor="transaction-search">Rechercher la transaction originale</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="transaction-search"
                      placeholder="Numéro de référence ou nom du client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleTransactionSearch}>
                    <Search className="h-4 w-4 mr-1" />
                    Rechercher
                  </Button>
                </div>
              </div>

              {/* Transaction trouvée */}
              {selectedTransaction && (
                <div className="space-y-4">
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">Transaction Trouvée</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-sm font-medium">Référence</Label>
                          <p className="text-sm">{selectedTransaction.reference}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Date</Label>
                          <p className="text-sm">{selectedTransaction.date.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Client</Label>
                          <p className="text-sm">{selectedTransaction.customer}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Total</Label>
                          <p className="text-sm font-bold">{selectedTransaction.total.toLocaleString()} FCFA</p>
                        </div>
                      </div>

                      {/* Articles de la transaction */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Articles à retourner</Label>
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Article</TableHead>
                                <TableHead>Qté Originale</TableHead>
                                <TableHead>Qté à Retourner</TableHead>
                                <TableHead>État</TableHead>
                                <TableHead>Raison</TableHead>
                                <TableHead>Remboursement</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {returnItems.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.name}</TableCell>
                                  <TableCell>{item.originalQuantity}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateReturnItem(item.id, 'returnQuantity', Math.max(0, item.returnQuantity - 1))}
                                        disabled={item.returnQuantity <= 0}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 text-center">{item.returnQuantity}</span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateReturnItem(item.id, 'returnQuantity', Math.min(item.originalQuantity, item.returnQuantity + 1))}
                                        disabled={item.returnQuantity >= item.originalQuantity}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Select 
                                      value={item.condition}
                                      onValueChange={(value) => updateReturnItem(item.id, 'condition', value)}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="perfect">Parfait</SelectItem>
                                        <SelectItem value="damaged">Endommagé</SelectItem>
                                        <SelectItem value="expired">Expiré</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Select 
                                      value={item.reason}
                                      onValueChange={(value) => updateReturnItem(item.id, 'reason', value)}
                                    >
                                      <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Sélectionner..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {returnReasons.map(reason => (
                                          <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-medium text-primary">
                                      {item.refundAmount.toLocaleString()} FCFA
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Raison générale et notes */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="return-reason">Raison principale du retour</Label>
                          <Select value={returnReason} onValueChange={setReturnReason}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une raison..." />
                            </SelectTrigger>
                            <SelectContent>
                              {returnReasons.map(reason => (
                                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="return-notes">Notes additionnelles</Label>
                          <Textarea
                            id="return-notes"
                            placeholder="Détails supplémentaires..."
                            value={returnNotes}
                            onChange={(e) => setReturnNotes(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Total remboursement */}
                      <div className="flex justify-between items-center mt-6 pt-4 border-t">
                        <span className="text-lg font-medium">Total à rembourser:</span>
                        <span className="text-2xl font-bold text-primary">
                          {getTotalRefund().toLocaleString()} FCFA
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-6">
                        <Button onClick={handleSubmitReturn} className="flex-1">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Soumettre la Demande
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedTransaction(null);
                            setReturnItems([]);
                            setSearchTerm('');
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retours en attente */}
        <TabsContent value="pending-returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retours en Attente d'Approbation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReturns.filter(r => r.status === 'pending').map((returnRequest) => (
                  <Card key={returnRequest.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium">Retour #{returnRequest.id}</h4>
                          <p className="text-sm text-muted-foreground">
                            Transaction: {returnRequest.originalTransactionRef}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(returnRequest.status)}
                          <p className="text-sm text-muted-foreground mt-1">
                            {returnRequest.date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label className="text-sm font-medium">Client</Label>
                          <p className="text-sm">{returnRequest.customer.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Raison</Label>
                          <p className="text-sm">{returnRequest.reason}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Montant</Label>
                          <p className="text-sm font-bold text-primary">
                            {returnRequest.totalRefund.toLocaleString()} FCFA
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label className="text-sm font-medium">Articles</Label>
                        <div className="mt-2">
                          {returnRequest.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                              <div>
                                <span className="font-medium">{item.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  Qté: {item.returnQuantity}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {getConditionBadge(item.condition)}
                                <span className="font-medium">
                                  {item.refundAmount.toLocaleString()} FCFA
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                        <Button size="sm" variant="destructive">
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeter
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Détails
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails du Retour #{returnRequest.id}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Transaction Originale</Label>
                                  <p>{returnRequest.originalTransactionRef}</p>
                                </div>
                                <div>
                                  <Label>Date de Demande</Label>
                                  <p>{returnRequest.date.toLocaleString()}</p>
                                </div>
                                <div>
                                  <Label>Client</Label>
                                  <p>{returnRequest.customer.name}</p>
                                </div>
                                <div>
                                  <Label>Contact</Label>
                                  <p>{returnRequest.customer.contact || 'N/A'}</p>
                                </div>
                              </div>
                              {returnRequest.notes && (
                                <div>
                                  <Label>Notes</Label>
                                  <p className="text-sm text-muted-foreground">{returnRequest.notes}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Retours & Échanges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Retour</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReturns.map((returnRequest) => (
                      <TableRow key={returnRequest.id}>
                        <TableCell className="font-medium">{returnRequest.id}</TableCell>
                        <TableCell>{returnRequest.originalTransactionRef}</TableCell>
                        <TableCell>{returnRequest.customer.name}</TableCell>
                        <TableCell>{returnRequest.date.toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-primary">
                          {returnRequest.totalRefund.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>{getStatusBadge(returnRequest.status)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReturnsExchanges;