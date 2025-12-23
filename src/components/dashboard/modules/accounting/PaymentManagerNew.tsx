import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CreditCard, Banknote, Smartphone, CheckCircle, AlertCircle, Clock, RefreshCw, Plus, Building2, Calendar } from 'lucide-react';
import { usePaymentManager } from '@/hooks/usePaymentManager';
import BankAccountDialog from '@/components/accounting/BankAccountDialog';
import BankTransactionDialog from '@/components/accounting/BankTransactionDialog';
import PaymentScheduleDialog from '@/components/accounting/PaymentScheduleDialog';
import PaymentMethodDialog from '@/components/accounting/PaymentMethodDialog';
import { useToast } from "@/hooks/use-toast";

const PaymentManagerNew = () => {
  const { toast } = useToast();
  const {
    payments,
    bankAccounts,
    bankTransactions,
    paymentSchedules,
    paymentMethods,
    regionalParams,
    isLoading,
    createBankAccount,
    updateBankAccount,
    createBankTransaction,
    createPaymentSchedule,
    createPaymentMethod,
    updatePaymentMethod,
    reconcileTransaction,
    getPaymentStats,
    getBankReconciliationStats,
    getScheduleStats,
    formatAmount,
    getDevise,
    getDefaultPaymentMethods,
    validatePaymentAmount,
  } = usePaymentManager();

  const [activeTab, setActiveTab] = useState('paiements');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  
  // Dialogs state
  const [bankAccountDialog, setBankAccountDialog] = useState(false);
  const [transactionDialog, setTransactionDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [methodDialog, setMethodDialog] = useState(false);

  const stats = getPaymentStats();
  const reconStats = getBankReconciliationStats();
  const scheduleStats = getScheduleStats();

  // Dynamic payment methods based on regional parameters
  const paymentMethodsMap = regionalParams?.modes_paiement_defaut?.map((method: any) => ({
    code: method.code,
    libelle: method.libelle,
    icon: method.icone === 'banknote' ? Banknote : method.icone === 'credit-card' ? CreditCard : method.icone === 'smartphone' ? Smartphone : RefreshCw,
    color: `text-${method.couleur?.replace('#', '')}`
  })) || [
    { code: 'especes', libelle: 'Espèces', icon: Banknote, color: 'text-green-600' },
    { code: 'carte', libelle: 'Carte bancaire', icon: CreditCard, color: 'text-blue-600' },
    { code: 'virement', libelle: 'Virement', icon: RefreshCw, color: 'text-purple-600' },
    { code: 'mobile_money', libelle: 'Mobile Money', icon: Smartphone, color: 'text-orange-600' },
    { code: 'cheque', libelle: 'Chèque', icon: CreditCard, color: 'text-gray-600' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'non_rapproche':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />En attente</Badge>;
      case 'rapproche':
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Rapproché</Badge>;
      case 'suspect':
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Suspect</Badge>;
      case 'ignore':
        return <Badge variant="outline">Ignoré</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPayments = payments.filter(p => 
    p.numero_piece.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tiers?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = selectedAccount
    ? bankTransactions.filter(t => t.compte_bancaire_id === selectedAccount)
    : bankTransactions;

  const upcomingSchedules = paymentSchedules.filter(s => {
    const daysUntil = Math.ceil((new Date(s.date_premiere_echeance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return s.statut === 'actif' && daysUntil >= 0 && daysUntil <= 30;
  }).sort((a, b) => new Date(a.date_premiere_echeance).getTime() - new Date(b.date_premiere_echeance).getTime());

  const overdueSchedules = paymentSchedules.filter(s => {
    const daysUntil = Math.ceil((new Date(s.date_premiere_echeance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return s.statut === 'actif' && daysUntil < 0;
  }).sort((a, b) => new Date(a.date_premiere_echeance).getTime() - new Date(b.date_premiere_echeance).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Suivi des Paiements</h2>
          <div className="flex gap-2 items-center">
            <Badge variant="outline">
              {regionalParams?.pays || 'Congo-Brazzaville'}
            </Badge>
            <Badge variant="secondary">
              {regionalParams?.devise_principale || 'XAF'}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="paiements">Paiements</TabsTrigger>
          <TabsTrigger value="rapprochement">Rapprochement Bancaire</TabsTrigger>
          <TabsTrigger value="echeanciers">Échéanciers</TabsTrigger>
          <TabsTrigger value="modes">Modes de Paiement</TabsTrigger>
        </TabsList>

        {/* ONGLET PAIEMENTS */}
        <TabsContent value="paiements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Encaissé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatAmount(stats.totalEncaisse)}
                </div>
                <p className="text-xs text-muted-foreground">{getDevise()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.totalEnAttente}
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
                  {formatAmount(stats.totalCarte)}
                </div>
                <p className="text-xs text-muted-foreground">{getDevise()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mobile Money</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(stats.totalMobileMoney)}
                </div>
                <p className="text-xs text-muted-foreground">{getDevise()}</p>
              </CardContent>
            </Card>
            {/* Nouvelle carte Centime Additionnel */}
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-700">Centime Add. Perçu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {formatAmount((stats as any).totalCentimeAdditionnel || 0)}
                </div>
                <p className="text-xs text-amber-600/70">
                  5% collecté
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tous les paiements</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Pièce</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Tiers</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Chargement...</TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Aucun paiement trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map(payment => {
                      const method = paymentMethodsMap.find(m => m.code === payment.mode_paiement);
                      const Icon = method?.icon || CreditCard;
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.numero_piece}</TableCell>
                          <TableCell>{new Date(payment.date_paiement).toLocaleDateString()}</TableCell>
                          <TableCell>{payment.tiers || '-'}</TableCell>
                          <TableCell className="font-medium">{formatAmount(payment.montant)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Icon className={`h-4 w-4 ${method?.color}`} />
                              <span>{method?.libelle || payment.mode_paiement}</span>
                            </div>
                          </TableCell>
                          <TableCell>{payment.reference}</TableCell>
                          <TableCell>{getStatusBadge(payment.statut)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET RAPPROCHEMENT BANCAIRE */}
        <TabsContent value="rapprochement" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button onClick={() => setBankAccountDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau compte
            </Button>
            <Button onClick={() => setTransactionDialog(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle transaction
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {bankAccounts.filter(a => a.est_actif).map(account => (
              <Card 
                key={account.id} 
                className={`cursor-pointer transition-colors ${selectedAccount === account.id ? 'border-primary' : ''}`}
                onClick={() => setSelectedAccount(account.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {account.nom_compte}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{account.solde_actuel.toLocaleString()} {account.devise}</div>
                  <p className="text-xs text-muted-foreground">{account.banque}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Transactions Rapprochées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reconStats.totalRapproche}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reconStats.tauxRapprochement.toFixed(1)}% du total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">À Rapprocher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reconStats.totalNonRapproche}
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
                  {reconStats.totalSuspect}
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Chargement...</TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        {selectedAccount ? 'Aucune transaction pour ce compte' : 'Sélectionnez un compte'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.date_transaction).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{transaction.reference}</TableCell>
                        <TableCell>{transaction.libelle}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.type_transaction === 'credit' ? 'default' : 'secondary'}>
                            {transaction.type_transaction === 'credit' ? 'Crédit' : 'Débit'}
                          </Badge>
                        </TableCell>
                        <TableCell className={transaction.type_transaction === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type_transaction === 'credit' ? '+' : '-'}{transaction.montant.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.statut_rapprochement)}</TableCell>
                        <TableCell>
                          {transaction.statut_rapprochement === 'non_rapproche' && (
                            <Button size="sm" variant="outline">
                              Rapprocher
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET ÉCHÉANCIERS */}
        <TabsContent value="echeanciers" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button onClick={() => setScheduleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel échéancier
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Échéances en cours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduleStats.totalEcheancesEnCours}</div>
                <p className="text-xs text-muted-foreground">Actives</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En retard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{scheduleStats.totalEcheancesEnRetard}</div>
                <p className="text-xs text-muted-foreground">À traiter</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Montant à payer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(scheduleStats.montantTotalAPayer)}</div>
                <p className="text-xs text-muted-foreground">{getDevise()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Prochaine échéance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {scheduleStats.prochaineDateEcheance 
                    ? new Date(scheduleStats.prochaineDateEcheance).toLocaleDateString()
                    : '-'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Date</p>
              </CardContent>
            </Card>
          </div>

          {overdueSchedules.length > 0 && (
            <Card className="border-red-500">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Échéances en retard ({overdueSchedules.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Tiers</TableHead>
                      <TableHead>Date échéance</TableHead>
                      <TableHead>Retard</TableHead>
                      <TableHead>Montant restant</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueSchedules.map(schedule => {
                      const daysLate = Math.abs(Math.ceil((new Date(schedule.date_premiere_echeance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                      return (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">{schedule.libelle}</TableCell>
                          <TableCell>{schedule.tiers_nom || '-'}</TableCell>
                          <TableCell>{new Date(schedule.date_premiere_echeance).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{daysLate} jours</Badge>
                          </TableCell>
                          <TableCell className="font-medium text-red-600">
                            {formatAmount(schedule.montant_restant)}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">Enregistrer paiement</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Échéances à venir (30 jours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingSchedules.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune échéance dans les 30 prochains jours
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Tiers</TableHead>
                      <TableHead>Date échéance</TableHead>
                      <TableHead>Dans</TableHead>
                      <TableHead>Montant restant</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingSchedules.map(schedule => {
                      const daysUntil = Math.ceil((new Date(schedule.date_premiere_echeance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">{schedule.libelle}</TableCell>
                          <TableCell>{schedule.tiers_nom || '-'}</TableCell>
                          <TableCell>{new Date(schedule.date_premiere_echeance).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={daysUntil <= 7 ? 'destructive' : 'secondary'}>
                              {daysUntil} jours
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatAmount(schedule.montant_restant)}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">Voir détails</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET MODES DE PAIEMENT */}
        <TabsContent value="modes" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button onClick={() => setMethodDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau mode
            </Button>
            <Button variant="outline" onClick={() => {
              const defaultMethods = getDefaultPaymentMethods();
              
              if (defaultMethods.length === 0) {
                toast({ 
                  title: 'Aucun mode de paiement régional défini', 
                  description: 'Veuillez configurer les paramètres régionaux',
                  variant: 'destructive' 
                });
                return;
              }
              
              defaultMethods.forEach((method: any) => {
                createPaymentMethod({
                  code: method.code,
                  libelle: method.libelle,
                  icone: method.icone,
                  couleur: method.couleur,
                  ordre_affichage: method.ordre,
                  est_actif: method.est_actif,
                  frais_pourcentage: method.frais_pourcentage || 0,
                  frais_fixes: method.frais_fixes || 0,
                  delai_encaissement: method.delai_encaissement || 0,
                  exige_reference: method.exige_reference || false,
                  exige_validation: method.exige_validation || false,
                });
              });
              
              toast({ 
                title: `Modes de paiement ${regionalParams?.pays || 'par défaut'} créés`,
                description: `${defaultMethods.length} modes de paiement ajoutés`
              });
            }}>
              Modes par défaut ({regionalParams?.code_pays || 'CG'})
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paymentMethods.map(method => {
              const methodPayments = payments.filter(p => p.mode_paiement === method.code);
              const totalAmount = methodPayments.reduce((sum, p) => sum + p.montant, 0);
              const allPaymentsTotal = payments.reduce((sum, p) => sum + p.montant, 0);
              const percentage = allPaymentsTotal > 0 ? (totalAmount / allPaymentsTotal * 100) : 0;
              
              const iconMap = paymentMethodsMap.find(m => m.code === method.code);
              const Icon = iconMap?.icon || CreditCard;
              
              return (
                <Card key={method.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-5 w-5 ${iconMap?.color}`} />
                        <span>{method.libelle}</span>
                      </div>
                      {!method.est_actif && <Badge variant="secondary">Inactif</Badge>}
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
                        <span className="font-medium">{formatAmount(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Moyenne:</span>
                        <span className="text-muted-foreground">
                          {methodPayments.length > 0 
                            ? formatAmount(Math.round(totalAmount / methodPayments.length))
                            : formatAmount(0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pourcentage:</span>
                        <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => setMethodDialog(true)}
                      >
                        Configurer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BankAccountDialog
        open={bankAccountDialog}
        onOpenChange={setBankAccountDialog}
        onSubmit={(data) => createBankAccount(data)}
      />

      <BankTransactionDialog
        open={transactionDialog}
        onOpenChange={setTransactionDialog}
        onSubmit={(data) => createBankTransaction(data as any)}
        bankAccounts={bankAccounts as any}
      />

      <PaymentScheduleDialog
        open={scheduleDialog}
        onOpenChange={setScheduleDialog}
        onSubmit={(data) => createPaymentSchedule(data)}
      />

      <PaymentMethodDialog
        open={methodDialog}
        onOpenChange={setMethodDialog}
        onSubmit={(data) => {
          if (data.id) {
            updatePaymentMethod({ ...data, id: data.id });
          } else {
            createPaymentMethod(data);
          }
        }}
      />
    </div>
  );
};

export default PaymentManagerNew;
