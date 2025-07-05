import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CreditCard, Banknote, Smartphone, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Payment {
  id: string;
  numero_piece: string;
  date_paiement: string;
  montant: number;
  mode_paiement: 'especes' | 'carte' | 'virement' | 'mobile_money' | 'cheque';
  reference: string;
  statut: 'en_attente' | 'valide' | 'rejete' | 'rapproche';
  facture_id?: string;
  compte_bancaire?: string;
  notes?: string;
}

interface BankTransaction {
  id: string;
  date_transaction: string;
  reference: string;
  libelle: string;
  montant: number;
  type: 'debit' | 'credit';
  statut_rapprochement: 'non_rapproche' | 'rapproche' | 'suspect';
  payment_id?: string;
}

const PaymentManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('paiements');
  const [searchTerm, setSearchTerm] = useState('');

  const [payments] = useState<Payment[]>([
    {
      id: '1',
      numero_piece: 'PAY2024-001',
      date_paiement: '2024-01-15',
      montant: 15000,
      mode_paiement: 'virement',
      reference: 'VIR-20240115-001',
      statut: 'valide',
      facture_id: '1',
      compte_bancaire: 'BNI - 001234567',
      notes: 'Paiement client Pharmacie Centrale'
    },
    {
      id: '2',
      numero_piece: 'PAY2024-002',
      date_paiement: '2024-01-20',
      montant: 8500,
      mode_paiement: 'mobile_money',
      reference: 'MM-456789123',
      statut: 'en_attente',
      compte_bancaire: 'Orange Money'
    }
  ]);

  const [bankTransactions] = useState<BankTransaction[]>([
    {
      id: '1',
      date_transaction: '2024-01-15',
      reference: 'VIR-20240115-001',
      libelle: 'Virement reçu - Pharmacie Centrale',
      montant: 15000,
      type: 'credit',
      statut_rapprochement: 'rapproche',
      payment_id: '1'
    },
    {
      id: '2',
      date_transaction: '2024-01-22',
      reference: 'AUTO-PRELEV-001',
      libelle: 'Prélèvement automatique EDF',
      montant: 12500,
      type: 'debit',
      statut_rapprochement: 'non_rapproche'
    }
  ]);

  const paymentMethods = [
    { code: 'especes', libelle: 'Espèces', icon: Banknote, color: 'text-green-600' },
    { code: 'carte', libelle: 'Carte bancaire', icon: CreditCard, color: 'text-blue-600' },
    { code: 'virement', libelle: 'Virement', icon: RefreshCw, color: 'text-purple-600' },
    { code: 'mobile_money', libelle: 'Mobile Money', icon: Smartphone, color: 'text-orange-600' },
    { code: 'cheque', libelle: 'Chèque', icon: CreditCard, color: 'text-gray-600' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />En attente</Badge>;
      case 'valide':
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Validé</Badge>;
      case 'rejete':
        return <Badge variant="destructive">Rejeté</Badge>;
      case 'rapproche':
        return <Badge variant="default">Rapproché</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReconciliationBadge = (status: string) => {
    switch (status) {
      case 'non_rapproche':
        return <Badge variant="secondary">Non rapproché</Badge>;
      case 'rapproche':
        return <Badge variant="default">Rapproché</Badge>;
      case 'suspect':
        return <Badge variant="destructive">Suspect</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Suivi des Paiements</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="paiements">Paiements</TabsTrigger>
          <TabsTrigger value="rapprochement">Rapprochement Bancaire</TabsTrigger>
          <TabsTrigger value="echeanciers">Échéanciers</TabsTrigger>
          <TabsTrigger value="modes">Modes de Paiement</TabsTrigger>
        </TabsList>

        <TabsContent value="paiements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Encaissé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {payments.filter(p => p.statut === 'valide').reduce((sum, p) => sum + p.montant, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {payments.filter(p => p.statut === 'en_attente').length}
                </div>
                <p className="text-xs text-muted-foreground">Paiements</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Paiements Carte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {payments.filter(p => p.mode_paiement === 'carte').reduce((sum, p) => sum + p.montant, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mobile Money</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {payments.filter(p => p.mode_paiement === 'mobile_money').reduce((sum, p) => sum + p.montant, 0).toLocaleString()}
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
                    <TableHead>N° Pièce</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Compte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(payment => {
                    const method = paymentMethods.find(m => m.code === payment.mode_paiement);
                    const Icon = method?.icon || CreditCard;
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.numero_piece}</TableCell>
                        <TableCell>{new Date(payment.date_paiement).toLocaleDateString()}</TableCell>
                        <TableCell>{payment.montant.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Icon className={`h-4 w-4 ${method?.color}`} />
                            <span>{method?.libelle}</span>
                          </div>
                        </TableCell>
                        <TableCell>{payment.reference}</TableCell>
                        <TableCell>{getStatusBadge(payment.statut)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.compte_bancaire}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rapprochement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Transactions Rapprochées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {bankTransactions.filter(t => t.statut_rapprochement === 'rapproche').length}
                </div>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">À Rapprocher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {bankTransactions.filter(t => t.statut_rapprochement === 'non_rapproche').length}
                </div>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Suspectes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {bankTransactions.filter(t => t.statut_rapprochement === 'suspect').length}
                </div>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transactions Bancaires</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankTransactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date_transaction).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{transaction.reference}</TableCell>
                      <TableCell>{transaction.libelle}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'}>
                          {transaction.type === 'credit' ? 'Crédit' : 'Débit'}
                        </Badge>
                      </TableCell>
                      <TableCell className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'credit' ? '+' : '-'}{transaction.montant.toLocaleString()}
                      </TableCell>
                      <TableCell>{getReconciliationBadge(transaction.statut_rapprochement)}</TableCell>
                      <TableCell>
                        {transaction.statut_rapprochement === 'non_rapproche' && (
                          <Button size="sm" variant="outline">
                            Rapprocher
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="echeanciers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Échéanciers de Paiements</CardTitle>
              <p className="text-sm text-muted-foreground">
                Suivi des échéances clients et fournisseurs
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Module échéanciers en cours de développement
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paymentMethods.map(method => {
              const Icon = method.icon;
              const methodPayments = payments.filter(p => p.mode_paiement === method.code);
              const totalAmount = methodPayments.reduce((sum, p) => sum + p.montant, 0);
              
              return (
                <Card key={method.code}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2">
                      <Icon className={`h-5 w-5 ${method.color}`} />
                      <span>{method.libelle}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Nombre de paiements:</span>
                        <Badge variant="outline">{methodPayments.length}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Montant total:</span>
                        <span className="font-medium">{totalAmount.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Moyenne:</span>
                        <span className="text-muted-foreground">
                          {methodPayments.length > 0 
                            ? Math.round(totalAmount / methodPayments.length).toLocaleString()
                            : 0} FCFA
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentManager;