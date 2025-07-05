import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Plus, Edit, Trash2, FileText, Users, Building, CreditCard, AlertCircle, CheckCircle, Clock, Send, Download, Archive, Eye, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Invoice {
  id: string;
  numero: string;
  type: 'client' | 'fournisseur';
  date_emission: string;
  date_echeance: string;
  client_fournisseur: string;
  libelle: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  statut: 'brouillon' | 'emise' | 'partiellement_payee' | 'payee' | 'en_retard' | 'annulee';
  statut_paiement: 'impayee' | 'partielle' | 'payee';
  montant_paye: number;
  montant_restant: number;
  reference_externe?: string;
  notes?: string;
  pieces_jointes: string[];
  relances_effectuees: number;
  derniere_relance?: string;
  created_by: string;
  created_at: string;
  lines: InvoiceLine[];
}

interface InvoiceLine {
  id: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  taux_tva: number;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
}

interface CreditNote {
  id: string;
  numero: string;
  facture_origine_id: string;
  date_emission: string;
  motif: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  statut: 'brouillon' | 'emis' | 'applique';
}

const InvoiceManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();

  // Données exemple des factures
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      numero: 'FC2024-001',
      type: 'client',
      date_emission: '2024-01-15',
      date_echeance: '2024-02-14',
      client_fournisseur: 'Pharmacie Centrale',
      libelle: 'Vente médicaments janvier',
      montant_ht: 25000,
      montant_tva: 0,
      montant_ttc: 25000,
      statut: 'emise',
      statut_paiement: 'partielle',
      montant_paye: 15000,
      montant_restant: 10000,
      reference_externe: 'CMD-2024-15',
      pieces_jointes: ['facture_fc2024-001.pdf'],
      relances_effectuees: 1,
      derniere_relance: '2024-02-20',
      created_by: 'Pharmacien',
      created_at: '2024-01-15T10:00:00',
      lines: [
        {
          id: '1',
          designation: 'Paracétamol 500mg',
          quantite: 100,
          prix_unitaire: 150,
          taux_tva: 0,
          montant_ht: 15000,
          montant_tva: 0,
          montant_ttc: 15000
        },
        {
          id: '2',
          designation: 'Aspirine 100mg',
          quantite: 50,
          prix_unitaire: 200,
          taux_tva: 0,
          montant_ht: 10000,
          montant_tva: 0,
          montant_ttc: 10000
        }
      ]
    },
    {
      id: '2',
      numero: 'FF2024-012',
      type: 'fournisseur',
      date_emission: '2024-01-20',
      date_echeance: '2024-02-19',
      client_fournisseur: 'Laboratoire PharmaCorp',
      libelle: 'Achat médicaments génériques',
      montant_ht: 45000,
      montant_tva: 0,
      montant_ttc: 45000,
      statut: 'emise',
      statut_paiement: 'impayee',
      montant_paye: 0,
      montant_restant: 45000,
      reference_externe: 'FACT-PC-2024-012',
      pieces_jointes: ['facture_ff2024-012.pdf'],
      relances_effectuees: 0,
      created_by: 'Responsable Achats',
      created_at: '2024-01-20T14:30:00',
      lines: [
        {
          id: '3',
          designation: 'Amoxicilline 500mg',
          quantite: 200,
          prix_unitaire: 180,
          taux_tva: 0,
          montant_ht: 36000,
          montant_tva: 0,
          montant_ttc: 36000
        },
        {
          id: '4',
          designation: 'Ibuprofène 400mg',
          quantite: 50,
          prix_unitaire: 180,
          taux_tva: 0,
          montant_ht: 9000,
          montant_tva: 0,
          montant_ttc: 9000
        }
      ]
    }
  ]);

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([
    {
      id: '1',
      numero: 'AV2024-001',
      facture_origine_id: '1',
      date_emission: '2024-01-25',
      motif: 'Retour marchandise défectueuse',
      montant_ht: 2000,
      montant_tva: 0,
      montant_ttc: 2000,
      statut: 'emis'
    }
  ]);

  // Nouveau formulaire de facture
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    type: 'client',
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    client_fournisseur: '',
    libelle: '',
    montant_ht: 0,
    montant_tva: 0,
    montant_ttc: 0,
    statut: 'brouillon',
    statut_paiement: 'impayee',
    montant_paye: 0,
    montant_restant: 0,
    pieces_jointes: [],
    relances_effectuees: 0,
    lines: []
  });

  const [newLine, setNewLine] = useState<Partial<InvoiceLine>>({
    designation: '',
    quantite: 1,
    prix_unitaire: 0,
    taux_tva: 0,
    montant_ht: 0,
    montant_tva: 0,
    montant_ttc: 0
  });

  const [newCreditNote, setNewCreditNote] = useState<Partial<CreditNote>>({
    facture_origine_id: '',
    date_emission: new Date().toISOString().split('T')[0],
    motif: '',
    montant_ht: 0,
    montant_tva: 0,
    montant_ttc: 0,
    statut: 'brouillon'
  });

  const filteredInvoices = (type: 'client' | 'fournisseur') => {
    return invoices.filter(invoice => {
      const matchesType = invoice.type === type;
      const matchesSearch = invoice.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.client_fournisseur.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.libelle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.statut === statusFilter;
      return matchesType && matchesSearch && matchesStatus;
    });
  };

  const calculateLineTotals = (line: Partial<InvoiceLine>) => {
    const montant_ht = (line.quantite || 0) * (line.prix_unitaire || 0);
    const montant_tva = montant_ht * ((line.taux_tva || 0) / 100);
    const montant_ttc = montant_ht + montant_tva;
    return { montant_ht, montant_tva, montant_ttc };
  };

  const calculateInvoiceTotals = (lines: InvoiceLine[]) => {
    const montant_ht = lines.reduce((sum, line) => sum + line.montant_ht, 0);
    const montant_tva = lines.reduce((sum, line) => sum + line.montant_tva, 0);
    const montant_ttc = montant_ht + montant_tva;
    return { montant_ht, montant_tva, montant_ttc };
  };

  const addLineToInvoice = () => {
    if (!newLine.designation || !newLine.quantite || !newLine.prix_unitaire) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs de la ligne",
        variant: "destructive"
      });
      return;
    }

    const totals = calculateLineTotals(newLine);
    const line: InvoiceLine = {
      id: Date.now().toString(),
      ...newLine,
      ...totals
    } as InvoiceLine;

    const updatedLines = [...(newInvoice.lines || []), line];
    const invoiceTotals = calculateInvoiceTotals(updatedLines);

    setNewInvoice(prev => ({
      ...prev,
      lines: updatedLines,
      ...invoiceTotals,
      montant_restant: invoiceTotals.montant_ttc
    }));

    setNewLine({
      designation: '',
      quantite: 1,
      prix_unitaire: 0,
      taux_tva: 0,
      montant_ht: 0,
      montant_tva: 0,
      montant_ttc: 0
    });
  };

  const removeLineFromInvoice = (lineId: string) => {
    const updatedLines = (newInvoice.lines || []).filter(line => line.id !== lineId);
    const invoiceTotals = calculateInvoiceTotals(updatedLines);

    setNewInvoice(prev => ({
      ...prev,
      lines: updatedLines,
      ...invoiceTotals,
      montant_restant: invoiceTotals.montant_ttc
    }));
  };

  const handleSaveInvoice = () => {
    if (!newInvoice.client_fournisseur || !newInvoice.libelle || !newInvoice.lines?.length) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const invoiceNumber = newInvoice.type === 'client' 
      ? `FC${new Date().getFullYear()}-${String(invoices.filter(i => i.type === 'client').length + 1).padStart(3, '0')}`
      : `FF${new Date().getFullYear()}-${String(invoices.filter(i => i.type === 'fournisseur').length + 1).padStart(3, '0')}`;

    if (editingInvoice) {
      setInvoices(prev => prev.map(invoice => 
        invoice.id === editingInvoice.id 
          ? { ...invoice, ...newInvoice } as Invoice
          : invoice
      ));
      toast({
        title: "Succès",
        description: "Facture modifiée avec succès"
      });
    } else {
      const invoice: Invoice = {
        id: Date.now().toString(),
        numero: invoiceNumber,
        created_by: 'Utilisateur actuel',
        created_at: new Date().toISOString(),
        ...newInvoice
      } as Invoice;
      
      setInvoices(prev => [...prev, invoice]);
      toast({
        title: "Succès",
        description: "Facture créée avec succès"
      });
    }

    setShowInvoiceDialog(false);
    setEditingInvoice(null);
    resetInvoiceForm();
  };

  const resetInvoiceForm = () => {
    setNewInvoice({
      type: 'client',
      date_emission: new Date().toISOString().split('T')[0],
      date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      client_fournisseur: '',
      libelle: '',
      montant_ht: 0,
      montant_tva: 0,
      montant_ttc: 0,
      statut: 'brouillon',
      statut_paiement: 'impayee',
      montant_paye: 0,
      montant_restant: 0,
      pieces_jointes: [],
      relances_effectuees: 0,
      lines: []
    });
    setNewLine({
      designation: '',
      quantite: 1,
      prix_unitaire: 0,
      taux_tva: 0,
      montant_ht: 0,
      montant_tva: 0,
      montant_ttc: 0
    });
  };

  const sendReminder = (invoiceId: string) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId 
        ? { 
            ...invoice, 
            relances_effectuees: invoice.relances_effectuees + 1,
            derniere_relance: new Date().toISOString().split('T')[0]
          }
        : invoice
    ));
    
    toast({
      title: "Relance envoyée",
      description: "La relance a été envoyée au client"
    });
  };

  const markAsPaid = (invoiceId: string, amount?: number) => {
    setInvoices(prev => prev.map(invoice => {
      if (invoice.id === invoiceId) {
        const paidAmount = amount || invoice.montant_restant;
        const newMontantPaye = invoice.montant_paye + paidAmount;
        const newMontantRestant = invoice.montant_ttc - newMontantPaye;
        
        return {
          ...invoice,
          montant_paye: newMontantPaye,
          montant_restant: newMontantRestant,
          statut_paiement: newMontantRestant <= 0 ? 'payee' : 'partielle',
          statut: newMontantRestant <= 0 ? 'payee' : 'partiellement_payee'
        };
      }
      return invoice;
    }));
    
    toast({
      title: "Paiement enregistré",
      description: "Le paiement a été enregistré avec succès"
    });
  };

  const getStatusBadge = (status: string, type: 'status' | 'payment' = 'status') => {
    if (type === 'payment') {
      switch (status) {
        case 'impayee':
          return <Badge variant="destructive">Impayée</Badge>;
        case 'partielle':
          return <Badge variant="secondary">Partielle</Badge>;
        case 'payee':
          return <Badge variant="default">Payée</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    }

    switch (status) {
      case 'brouillon':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'emise':
        return <Badge variant="default">Émise</Badge>;
      case 'partiellement_payee':
        return <Badge variant="secondary">Partiellement payée</Badge>;
      case 'payee':
        return <Badge variant="default">Payée</Badge>;
      case 'en_retard':
        return <Badge variant="destructive">En retard</Badge>;
      case 'annulee':
        return <Badge variant="outline">Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOverdueInvoices = (type: 'client' | 'fournisseur') => {
    const today = new Date();
    return invoices.filter(invoice => 
      invoice.type === type &&
      invoice.statut_paiement !== 'payee' &&
      new Date(invoice.date_echeance) < today
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Factures</h2>
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Facture
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? 'Modifier la facture' : 'Créer une nouvelle facture'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type de facture</Label>
                  <Select 
                    value={newInvoice.type} 
                    onValueChange={(value: 'client' | 'fournisseur') => setNewInvoice(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Facture Client</SelectItem>
                      <SelectItem value="fournisseur">Facture Fournisseur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="client_fournisseur">
                    {newInvoice.type === 'client' ? 'Client' : 'Fournisseur'}
                  </Label>
                  <Input
                    id="client_fournisseur"
                    value={newInvoice.client_fournisseur}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, client_fournisseur: e.target.value }))}
                    placeholder={`Nom du ${newInvoice.type}`}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_emission">Date d'émission</Label>
                  <Input
                    id="date_emission"
                    type="date"
                    value={newInvoice.date_emission}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, date_emission: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="date_echeance">Date d'échéance</Label>
                  <Input
                    id="date_echeance"
                    type="date"
                    value={newInvoice.date_echeance}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, date_echeance: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="libelle">Libellé</Label>
                <Input
                  id="libelle"
                  value={newInvoice.libelle}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, libelle: e.target.value }))}
                  placeholder="Description de la facture"
                />
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Lignes de facture</h4>
                
                <div className="grid grid-cols-6 gap-2 mb-4">
                  <Input
                    placeholder="Désignation"
                    value={newLine.designation}
                    onChange={(e) => setNewLine(prev => ({ ...prev, designation: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Qté"
                    value={newLine.quantite || ''}
                    onChange={(e) => setNewLine(prev => ({ ...prev, quantite: parseInt(e.target.value) || 0 }))}
                  />
                  <Input
                    type="number"
                    placeholder="Prix unit."
                    value={newLine.prix_unitaire || ''}
                    onChange={(e) => setNewLine(prev => ({ ...prev, prix_unitaire: parseFloat(e.target.value) || 0 }))}
                  />
                  <Input
                    type="number"
                    placeholder="TVA %"
                    value={newLine.taux_tva || ''}
                    onChange={(e) => setNewLine(prev => ({ ...prev, taux_tva: parseFloat(e.target.value) || 0 }))}
                  />
                  <div className="text-sm text-muted-foreground self-center">
                    {((newLine.quantite || 0) * (newLine.prix_unitaire || 0)).toLocaleString()}
                  </div>
                  <Button onClick={addLineToInvoice} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {newInvoice.lines && newInvoice.lines.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Désignation</TableHead>
                        <TableHead>Qté</TableHead>
                        <TableHead>Prix Unit.</TableHead>
                        <TableHead>TVA</TableHead>
                        <TableHead>Total HT</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newInvoice.lines.map(line => (
                        <TableRow key={line.id}>
                          <TableCell>{line.designation}</TableCell>
                          <TableCell>{line.quantite}</TableCell>
                          <TableCell>{line.prix_unitaire.toLocaleString()}</TableCell>
                          <TableCell>{line.taux_tva}%</TableCell>
                          <TableCell>{line.montant_ht.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeLineFromInvoice(line.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {newInvoice.lines && newInvoice.lines.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>Total HT: <span className="font-medium">{(newInvoice.montant_ht || 0).toLocaleString()}</span></div>
                      <div>TVA: <span className="font-medium">{(newInvoice.montant_tva || 0).toLocaleString()}</span></div>
                      <div>Total TTC: <span className="font-medium">{(newInvoice.montant_ttc || 0).toLocaleString()}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveInvoice}>
                {editingInvoice ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="clients">Factures Clients</TabsTrigger>
          <TabsTrigger value="fournisseurs">Factures Fournisseurs</TabsTrigger>
          <TabsTrigger value="avoirs">Avoirs</TabsTrigger>
          <TabsTrigger value="relances">Relances</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une facture..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="emise">Émise</SelectItem>
                <SelectItem value="partiellement_payee">Partiellement payée</SelectItem>
                <SelectItem value="payee">Payée</SelectItem>
                <SelectItem value="en_retard">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Créances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredInvoices('client').reduce((sum, inv) => sum + inv.montant_restant, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En Retard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {getOverdueInvoices('client').length}
                </div>
                <p className="text-xs text-muted-foreground">Factures</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Payées ce mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {filteredInvoices('client').filter(inv => inv.statut_paiement === 'payee').length}
                </div>
                <p className="text-xs text-muted-foreground">Factures</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Montant Moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredInvoices('client').length > 0 
                    ? Math.round(filteredInvoices('client').reduce((sum, inv) => sum + inv.montant_ttc, 0) / filteredInvoices('client').length).toLocaleString()
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Montant TTC</TableHead>
                    <TableHead>Payé</TableHead>
                    <TableHead>Restant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices('client').map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.numero}</TableCell>
                      <TableCell>{invoice.client_fournisseur}</TableCell>
                      <TableCell>{new Date(invoice.date_emission).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.date_echeance).toLocaleDateString()}</TableCell>
                      <TableCell>{invoice.montant_ttc.toLocaleString()}</TableCell>
                      <TableCell>{invoice.montant_paye.toLocaleString()}</TableCell>
                      <TableCell>{invoice.montant_restant.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(invoice.statut)}
                          {getStatusBadge(invoice.statut_paiement, 'payment')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.statut_paiement !== 'payee' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => sendReminder(invoice.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => markAsPaid(invoice.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fournisseurs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Dettes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredInvoices('fournisseur').reduce((sum, inv) => sum + inv.montant_restant, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">À Payer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {filteredInvoices('fournisseur').filter(inv => inv.statut_paiement === 'impayee').length}
                </div>
                <p className="text-xs text-muted-foreground">Factures</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Échues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {getOverdueInvoices('fournisseur').length}
                </div>
                <p className="text-xs text-muted-foreground">Factures</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Payées ce mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {filteredInvoices('fournisseur').filter(inv => inv.statut_paiement === 'payee').length}
                </div>
                <p className="text-xs text-muted-foreground">Factures</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Montant TTC</TableHead>
                    <TableHead>Payé</TableHead>
                    <TableHead>Restant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices('fournisseur').map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.numero}</TableCell>
                      <TableCell>{invoice.client_fournisseur}</TableCell>
                      <TableCell>{new Date(invoice.date_emission).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.date_echeance).toLocaleDateString()}</TableCell>
                      <TableCell>{invoice.montant_ttc.toLocaleString()}</TableCell>
                      <TableCell>{invoice.montant_paye.toLocaleString()}</TableCell>
                      <TableCell>{invoice.montant_restant.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(invoice.statut)}
                          {getStatusBadge(invoice.statut_paiement, 'payment')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.statut_paiement !== 'payee' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markAsPaid(invoice.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="avoirs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Notes de crédit et avoirs</h3>
            <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel Avoir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un avoir</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="facture_origine">Facture d'origine</Label>
                    <Select 
                      value={newCreditNote.facture_origine_id} 
                      onValueChange={(value) => setNewCreditNote(prev => ({ ...prev, facture_origine_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une facture" />
                      </SelectTrigger>
                      <SelectContent>
                        {invoices.filter(inv => inv.type === 'client').map(invoice => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.numero} - {invoice.client_fournisseur}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="motif">Motif de l'avoir</Label>
                    <Textarea
                      id="motif"
                      value={newCreditNote.motif}
                      onChange={(e) => setNewCreditNote(prev => ({ ...prev, motif: e.target.value }))}
                      placeholder="Raison de la création de l'avoir"
                    />
                  </div>
                  <div>
                    <Label htmlFor="montant">Montant TTC</Label>
                    <Input
                      id="montant"
                      type="number"
                      value={newCreditNote.montant_ttc || ''}
                      onChange={(e) => {
                        const montant = parseFloat(e.target.value) || 0;
                        setNewCreditNote(prev => ({ 
                          ...prev, 
                          montant_ttc: montant,
                          montant_ht: montant,
                          montant_tva: 0
                        }));
                      }}
                      placeholder="Montant de l'avoir"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreditDialog(false)}>
                    Annuler
                  </Button>
                  <Button onClick={() => {
                    // Logique de création d'avoir
                    setShowCreditDialog(false);
                    toast({
                      title: "Avoir créé",
                      description: "L'avoir a été créé avec succès"
                    });
                  }}>
                    Créer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Avoir</TableHead>
                    <TableHead>Facture origine</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditNotes.map(credit => {
                    const originInvoice = invoices.find(inv => inv.id === credit.facture_origine_id);
                    return (
                      <TableRow key={credit.id}>
                        <TableCell className="font-medium">{credit.numero}</TableCell>
                        <TableCell>{originInvoice?.numero}</TableCell>
                        <TableCell>{new Date(credit.date_emission).toLocaleDateString()}</TableCell>
                        <TableCell>{credit.motif}</TableCell>
                        <TableCell>{credit.montant_ttc.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(credit.statut)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relances" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span>Factures en retard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getOverdueInvoices('client').map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{invoice.numero}</div>
                        <div className="text-sm text-muted-foreference">
                          {invoice.client_fournisseur} - {invoice.montant_restant.toLocaleString()} FCFA
                        </div>
                        <div className="text-xs text-red-600">
                          Échue depuis {Math.ceil((Date.now() - new Date(invoice.date_echeance).getTime()) / (1000 * 60 * 60 * 24))} jours
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => sendReminder(invoice.id)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Relancer
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getOverdueInvoices('client').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune facture en retard
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>Échéances prochaines</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices
                    .filter(inv => {
                      const daysTodue = Math.ceil((new Date(inv.date_echeance).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return inv.statut_paiement !== 'payee' && daysTodue <= 7 && daysTodue >= 0;
                    })
                    .map(invoice => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{invoice.numero}</div>
                          <div className="text-sm text-muted-foregrund">
                            {invoice.client_fournisseur} - {invoice.montant_restant.toLocaleString()} FCFA
                          </div>
                          <div className="text-xs text-orange-600">
                            Échéance dans {Math.ceil((new Date(invoice.date_echeance).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} jours
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline"
                            size="sm" 
                            onClick={() => sendReminder(invoice.id)}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Prérelance
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvoiceManager;