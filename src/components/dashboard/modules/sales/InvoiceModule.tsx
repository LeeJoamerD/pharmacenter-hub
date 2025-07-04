import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  FileText, 
  Printer, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  Euro,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';

interface InvoiceItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

const InvoiceModule = () => {
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 1,
      invoiceNumber: 'FAC-2024-001',
      customerName: 'Pharmacie Central',
      customerAddress: '123 Rue de la Santé, 75001 Paris',
      date: '2024-01-15',
      dueDate: '2024-02-15',
      status: 'sent',
      items: [
        { id: 1, productName: 'Paracétamol 500mg', quantity: 100, unitPrice: 2.50, total: 250 },
        { id: 2, productName: 'Amoxicilline 1g', quantity: 50, unitPrice: 8.20, total: 410 }
      ],
      subtotal: 660,
      tax: 132,
      total: 792,
      notes: 'Livraison express demandée'
    },
    {
      id: 2,
      invoiceNumber: 'FAC-2024-002',
      customerName: 'Clinique Saint-Pierre',
      customerAddress: '456 Avenue de la République, 69001 Lyon',
      date: '2024-01-20',
      dueDate: '2024-02-20',
      status: 'paid',
      items: [
        { id: 3, productName: 'Seringues 10ml', quantity: 200, unitPrice: 0.75, total: 150 },
        { id: 4, productName: 'Gants latex (boîte)', quantity: 20, unitPrice: 12.50, total: 250 }
      ],
      subtotal: 400,
      tax: 80,
      total: 480
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // États pour la création de facture
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    customerName: '',
    customerAddress: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'draft',
    items: [],
    notes: ''
  });
  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({
    productName: '',
    quantity: 1,
    unitPrice: 0
  });

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700'
  };

  const statusLabels = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée'
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

  const handleAddItem = () => {
    if (newItem.productName && newItem.quantity && newItem.unitPrice) {
      const total = newItem.quantity * newItem.unitPrice;
      const item: InvoiceItem = {
        id: Date.now(),
        productName: newItem.productName,
        quantity: newItem.quantity,
        unitPrice: newItem.unitPrice,
        total
      };
      
      setNewInvoice(prev => ({
        ...prev,
        items: [...(prev.items || []), item]
      }));
      
      setNewItem({ productName: '', quantity: 1, unitPrice: 0 });
    }
  };

  const handleRemoveItem = (itemId: number) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== itemId) || []
    }));
  };

  const calculateInvoiceTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.2; // 20% TVA
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleCreateInvoice = () => {
    if (!newInvoice.customerName || !newInvoice.items?.length) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    const { subtotal, tax, total } = calculateInvoiceTotals(newInvoice.items);
    const invoice: Invoice = {
      id: Date.now(),
      invoiceNumber: `FAC-2024-${String(invoices.length + 1).padStart(3, '0')}`,
      customerName: newInvoice.customerName!,
      customerAddress: newInvoice.customerAddress || '',
      date: newInvoice.date!,
      dueDate: newInvoice.dueDate!,
      status: newInvoice.status as Invoice['status'],
      items: newInvoice.items,
      subtotal,
      tax,
      total,
      notes: newInvoice.notes
    };

    setInvoices([...invoices, invoice]);
    setNewInvoice({
      customerName: '',
      customerAddress: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'draft',
      items: [],
      notes: ''
    });
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Facture créée",
      description: `La facture ${invoice.invoiceNumber} a été créée avec succès.`
    });
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleStatusChange = (invoiceId: number, newStatus: Invoice['status']) => {
    setInvoices(invoices.map(inv => 
      inv.id === invoiceId ? { ...inv, status: newStatus } : inv
    ));
    
    toast({
      title: "Statut mis à jour",
      description: `Le statut de la facture a été mis à jour.`
    });
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    toast({
      title: "Impression",
      description: `Impression de la facture ${invoice.invoiceNumber}...`
    });
  };

  const handleExportInvoice = (invoice: Invoice) => {
    toast({
      title: "Export",
      description: `Export de la facture ${invoice.invoiceNumber} en PDF...`
    });
  };

  const handleSendInvoice = (invoice: Invoice) => {
    handleStatusChange(invoice.id, 'sent');
    toast({
      title: "Facture envoyée",
      description: `La facture ${invoice.invoiceNumber} a été envoyée au client.`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Facturation</h2>
          <p className="text-muted-foreground">
            Gestion complète des factures et de la facturation
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Facture
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle facture</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour créer une nouvelle facture
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Informations client */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nom du client *</Label>
                  <Input
                    id="customerName"
                    value={newInvoice.customerName}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Nom du client"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Date d'échéance *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Adresse du client</Label>
                <Textarea
                  id="customerAddress"
                  value={newInvoice.customerAddress}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, customerAddress: e.target.value }))}
                  placeholder="Adresse complète du client"
                />
              </div>

              {/* Ajout d'articles */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Articles</h4>
                
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    placeholder="Nom du produit"
                    value={newItem.productName}
                    onChange={(e) => setNewItem(prev => ({ ...prev, productName: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Quantité"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Prix unitaire"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                  />
                  <Button onClick={handleAddItem} type="button">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Liste des articles */}
                {newInvoice.items && newInvoice.items.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newInvoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                          <TableCell>{formatPrice(item.total)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Totaux */}
                {newInvoice.items && newInvoice.items.length > 0 && (
                  <div className="bg-muted p-4 rounded-lg">
                    {(() => {
                      const { subtotal, tax, total } = calculateInvoiceTotals(newInvoice.items);
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Sous-total:</span>
                            <span>{formatPrice(subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>TVA (20%):</span>
                            <span>{formatPrice(tax)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>{formatPrice(total)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes additionnelles..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateInvoice}>
                Créer la facture
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">Toutes périodes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures Payées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidInvoices}</div>
            <p className="text-xs text-green-500">
              {totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Retard</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueInvoices}</div>
            <p className="text-xs text-red-500">Nécessitent un suivi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Factures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyée</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{formatPrice(invoice.total)}</TableCell>
                  <TableCell>
                    <Select
                      value={invoice.status}
                      onValueChange={(value) => handleStatusChange(invoice.id, value as Invoice['status'])}
                    >
                      <SelectTrigger className="w-32">
                        <Badge className={statusColors[invoice.status]}>
                          {statusLabels[invoice.status]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="sent">Envoyée</SelectItem>
                        <SelectItem value="paid">Payée</SelectItem>
                        <SelectItem value="overdue">En retard</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintInvoice(invoice)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportInvoice(invoice)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendInvoice(invoice)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de visualisation de facture */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>Facture {selectedInvoice.invoiceNumber}</DialogTitle>
                <DialogDescription>
                  Détails de la facture pour {selectedInvoice.customerName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* En-tête de facture */}
                <div className="bg-muted p-6 rounded-lg">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Facturé à:</h3>
                      <p className="font-medium">{selectedInvoice.customerName}</p>
                      {selectedInvoice.customerAddress && (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {selectedInvoice.customerAddress}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Date:</span>
                          <span className="ml-2 font-medium">
                            {new Date(selectedInvoice.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Échéance:</span>
                          <span className="ml-2 font-medium">
                            {new Date(selectedInvoice.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div>
                          <Badge className={statusColors[selectedInvoice.status]}>
                            {statusLabels[selectedInvoice.status]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Articles */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Prix unitaire</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                        <TableCell>{formatPrice(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Totaux */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="space-y-2 max-w-xs ml-auto">
                    <div className="flex justify-between">
                      <span>Sous-total:</span>
                      <span>{formatPrice(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA:</span>
                      <span>{formatPrice(selectedInvoice.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatPrice(selectedInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes:</h4>
                    <p className="text-sm text-muted-foreground">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportInvoice(selectedInvoice)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter PDF
                </Button>
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceModule;