import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, ChevronDown, Search, Plus, Edit, Trash2, Filter, BookOpen, Building, DollarSign, CreditCard, Briefcase, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useChartOfAccounts, Account } from "@/hooks/useChartOfAccounts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChartOfAccountsRegionalSettingsDialog } from "@/components/accounting/ChartOfAccountsRegionalSettingsDialog";
import { Settings } from 'lucide-react';

const ChartOfAccounts = () => {
  const { toast } = useToast();
  const {
    accounts,
    accountsTree,
    accountsByClass,
    analyticalAccounts,
    loading,
    error,
    isSaving,
    createAccount,
    updateAccount,
    deleteAccount,
    refreshAccounts,
    coaParams,
    getAccountingSystemName,
    getAccountingSystemVersion,
    getClassesDefinition,
    formatAmount,
    validateAccountCode,
    getLegalMentions,
    getRegulatoryBody
  } = useChartOfAccounts();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [regionalDialog, setRegionalDialog] = useState(false);

  // Classes dynamiques
  const accountingClasses = getClassesDefinition();

  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    code: '',
    libelle: '',
    classe: 1,
    type: 'detail',
    niveau: 1,
    actif: true,
    analytique: false,
    rapprochement: false,
    description: ''
  });

  const filteredAccounts = accountsTree.filter(account => {
    const matchesSearch = account.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.includes(searchTerm);
    
    // Filtre spécial pour les comptes fiscaux et centime additionnel
    let matchesClass = false;
    if (selectedClass === 'all') {
      matchesClass = true;
    } else if (selectedClass === 'fiscal') {
      // Comptes fiscaux: TVA (443x, 445x) incluant centime additionnel
      matchesClass = account.code.startsWith('443') || account.code.startsWith('445');
    } else if (selectedClass === 'centime') {
      // Comptes centime additionnel spécifiquement (4458, 4459)
      matchesClass = account.code.startsWith('4458') || account.code.startsWith('4459');
    } else {
      matchesClass = account.classe.toString() === selectedClass;
    }
    
    return matchesSearch && matchesClass;
  });

  const handleSaveAccount = async () => {
    if (!newAccount.code || !newAccount.libelle) {
      toast({
        title: "Erreur",
        description: "Le code et le libellé sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Validation code
    if (!validateAccountCode(newAccount.code!)) {
      toast({
        title: "Code invalide",
        description: `Le code doit respecter le format ${coaParams?.systeme_comptable}: entre ${coaParams?.longueur_code_min} et ${coaParams?.longueur_code_max} caractères`,
        variant: "destructive"
      });
      return;
    }

    if (editingAccount) {
      // Modification
      await updateAccount(editingAccount.id, newAccount);
    } else {
      // Création
      await createAccount({
        code: newAccount.code!,
        libelle: newAccount.libelle!,
        classe: newAccount.classe!,
        type: newAccount.type as 'detail' | 'titre' | 'sous-titre',
        parent_id: newAccount.parent_id,
        niveau: newAccount.niveau!,
        actif: newAccount.actif!,
        analytique: newAccount.analytique!,
        rapprochement: newAccount.rapprochement!,
        description: newAccount.description
      });
    }

    setShowDialog(false);
    setEditingAccount(null);
    setNewAccount({
      code: '',
      libelle: '',
      classe: 1,
      type: 'detail',
      niveau: 1,
      actif: true,
      analytique: false,
      rapprochement: false,
      description: ''
    });
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setNewAccount(account);
    setShowDialog(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    await deleteAccount(accountId);
    setDeleteConfirmId(null);
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderAccountTree = (accounts: Account[], level: number = 0) => {
    return accounts.map(account => (
      <div key={account.id} className={`ml-${level * 4}`}>
        <div className="flex items-center justify-between p-3 border rounded-lg mb-2 hover:bg-muted/50">
          <div className="flex items-center space-x-3">
            {account.children && account.children.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => toggleNode(account.id)}
              >
                {expandedNodes.has(account.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{account.code}</Badge>
                <span className="font-medium">{account.libelle}</span>
                {account.analytique && <Badge variant="secondary">Analytique</Badge>}
                {account.rapprochement && <Badge variant="secondary">Rapprochement</Badge>}
                {/* Badge Centime Additionnel pour comptes 4458/4459 */}
                {(account.code.startsWith('4458') || account.code.startsWith('4459')) && (
                  <Badge variant="default" className="bg-amber-500 text-white">Centime Add.</Badge>
                )}
                {/* Badge Fiscal pour comptes TVA (443x, 445x) */}
                {(account.code.startsWith('443') || account.code.startsWith('445')) && !account.code.startsWith('4458') && !account.code.startsWith('4459') && (
                  <Badge variant="outline" className="border-blue-500 text-blue-600">Fiscal</Badge>
                )}
              </div>
              <div className="flex space-x-4 text-sm text-muted-foreground">
                <span>Débit: {formatAmount(account.solde_debiteur)}</span>
                <span>Crédit: {formatAmount(account.solde_crediteur)}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleEditAccount(account)}
              disabled={isSaving}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDeleteConfirmId(account.id)}
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {account.children && expandedNodes.has(account.id) && (
          <div className="ml-6">
            {renderAccountTree(account.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">
            Plan Comptable {getAccountingSystemName()}
          </h2>
          {coaParams && (
            <div className="flex gap-2">
              <Badge variant="outline">{coaParams.pays}</Badge>
              <Badge variant="secondary">{coaParams.devise_principale}</Badge>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRegionalDialog(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Configuration Régionale
          </Button>
          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) {
              // Reset editing state when dialog closes
              setEditingAccount(null);
              setNewAccount({
                code: '',
                libelle: '',
                classe: 1,
                type: 'detail',
                niveau: 1,
                actif: true,
                analytique: false,
                rapprochement: false,
                description: ''
              });
            }
          }}>
          <DialogTrigger asChild>
            <Button disabled={isSaving} onClick={() => {
              // Reset editing state when opening via "Nouveau Compte" button
              setEditingAccount(null);
              setNewAccount({
                code: '',
                libelle: '',
                classe: 1,
                type: 'detail',
                niveau: 1,
                actif: true,
                analytique: false,
                rapprochement: false,
                description: ''
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Compte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Modifier le compte' : 'Créer un nouveau compte'}
              </DialogTitle>
              <DialogDescription>
                {editingAccount ? 'Modifiez les informations du compte comptable.' : 'Créez un nouveau compte dans votre plan comptable OHADA.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Code du compte</Label>
                  <Input
                    id="code"
                    value={newAccount.code}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Ex: 101"
                  />
                </div>
                <div>
                  <Label htmlFor="classe">Classe</Label>
                  <Select 
                    value={newAccount.classe?.toString()} 
                    onValueChange={(value) => setNewAccount(prev => ({ ...prev, classe: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accountingClasses.map(cls => (
                        <SelectItem key={cls.classe} value={cls.classe.toString()}>
                          {cls.classe} - {cls.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="libelle">Libellé</Label>
                <Input
                  id="libelle"
                  value={newAccount.libelle}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, libelle: e.target.value }))}
                  placeholder="Nom du compte"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type de compte</Label>
                  <Select 
                    value={newAccount.type} 
                    onValueChange={(value) => setNewAccount(prev => ({ ...prev, type: value as 'detail' | 'titre' | 'sous-titre' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detail">Compte de détail</SelectItem>
                      <SelectItem value="titre">Compte de titre</SelectItem>
                      <SelectItem value="sous-titre">Compte de sous-titre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="niveau">Niveau</Label>
                  <Select 
                    value={newAccount.niveau?.toString()} 
                    onValueChange={(value) => setNewAccount(prev => ({ ...prev, niveau: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Niveau 1</SelectItem>
                      <SelectItem value="2">Niveau 2</SelectItem>
                      <SelectItem value="3">Niveau 3</SelectItem>
                      <SelectItem value="4">Niveau 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAccount.description}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description optionnelle du compte"
                />
              </div>

              <div className="flex space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="actif"
                    checked={newAccount.actif}
                    onCheckedChange={(checked) => setNewAccount(prev => ({ ...prev, actif: checked }))}
                  />
                  <Label htmlFor="actif">Compte actif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="analytique"
                    checked={newAccount.analytique}
                    onCheckedChange={(checked) => setNewAccount(prev => ({ ...prev, analytique: checked }))}
                  />
                  <Label htmlFor="analytique">Comptabilité analytique</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rapprochement"
                    checked={newAccount.rapprochement}
                    onCheckedChange={(checked) => setNewAccount(prev => ({ ...prev, rapprochement: checked }))}
                  />
                  <Label htmlFor="rapprochement">Rapprochement bancaire</Label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isSaving}>
                Annuler
              </Button>
              <Button onClick={handleSaveAccount} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  editingAccount ? 'Modifier' : 'Créer'
                )}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <ChartOfAccountsRegionalSettingsDialog
        open={regionalDialog}
        onOpenChange={setRegionalDialog}
        currentCountry={coaParams?.code_pays}
      />

      <Tabs defaultValue="tree" className="w-full">
        <TabsList>
          <TabsTrigger value="tree">Arbre des comptes</TabsTrigger>
          <TabsTrigger value="classes">Classes {getAccountingSystemName()}</TabsTrigger>
          <TabsTrigger value="analytique">Comptes analytiques</TabsTrigger>
          <TabsTrigger value="mentions">Mentions légales</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-10 flex-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={refreshAccounts}>Réessayer</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un compte..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-[250px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filtrer par classe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les classes</SelectItem>
                    <SelectItem value="fiscal">🏛️ Comptes fiscaux (TVA/Centime)</SelectItem>
                    <SelectItem value="centime">📊 Centime Additionnel (4458/4459)</SelectItem>
                    {accountingClasses.map(cls => (
                      <SelectItem key={cls.classe} value={cls.classe.toString()}>
                        Classe {cls.classe}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardContent className="p-4">
                  {filteredAccounts.length > 0 ? (
                    renderAccountTree(filteredAccounts)
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {accounts.length === 0 ? (
                        <>
                          <p className="mb-4">Aucun compte dans le plan comptable</p>
                          <Button onClick={() => setShowDialog(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Créer le premier compte
                          </Button>
                        </>
                      ) : (
                        'Aucun compte trouvé'
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(7)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accountingClasses.map(cls => {
                const Icon = cls.icon;
                const classAccounts = accountsByClass[cls.classe] || [];
                const totalDebit = classAccounts.reduce((sum, acc) => sum + acc.solde_debiteur, 0);
                const totalCredit = classAccounts.reduce((sum, acc) => sum + acc.solde_crediteur, 0);
                return (
                  <Card key={cls.classe} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                    setSelectedClass(cls.classe.toString());
                  }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center space-x-2">
                        <Icon className={`h-5 w-5 ${cls.color}`} />
                        <span>Classe {cls.classe}</span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{cls.nom}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Nombre de comptes:</span>
                          <Badge variant="outline">{classAccounts.length}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total débit:</span>
                          <span className="font-medium">{formatAmount(totalDebit)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total crédit:</span>
                          <span className="font-medium">{formatAmount(totalCredit)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytique" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total comptes analytiques</p>
                    <p className="text-2xl font-bold">{analyticalAccounts.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Comptes actifs</p>
                    <p className="text-2xl font-bold">{analyticalAccounts.filter(a => a.actif).length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Solde total</p>
                    <p className="text-2xl font-bold">
                      {formatAmount(analyticalAccounts.reduce((sum, acc) => sum + acc.solde_debiteur - acc.solde_crediteur, 0))}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comptes analytiques</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Comptes utilisés pour la comptabilité analytique et les centres de coûts
                  </p>
                </CardHeader>
                <CardContent>
                  {analyticalAccounts.length > 0 ? (
                    <div className="space-y-4">
                      {analyticalAccounts.map(account => (
                        <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">{account.code}</Badge>
                            <span className="font-medium">{account.libelle}</span>
                            <Badge variant="secondary">Analytique</Badge>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-sm text-muted-foreground">
                              Classe {account.classe}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditAccount(account)}
                              disabled={isSaving}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun compte analytique configuré
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="mentions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mentions légales et réglementaires</CardTitle>
              <p className="text-sm text-muted-foreground">
                Informations légales relatives au plan comptable {getAccountingSystemName()}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Système comptable */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Système comptable</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Système:</span>
                    <p className="font-medium">{getAccountingSystemName()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Version:</span>
                    <p className="font-medium">{getAccountingSystemVersion()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pays:</span>
                    <p className="font-medium">{coaParams?.pays}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Organisme réglementaire:</span>
                    <p className="font-medium">{getRegulatoryBody()}</p>
                  </div>
                </div>
              </div>

              {/* Mentions légales */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Mentions obligatoires</h3>
                <div className="prose prose-sm max-w-none">
                  <div className="bg-muted/50 p-4 rounded-lg text-sm">
                    <p className="leading-relaxed whitespace-pre-line">{getLegalMentions()}</p>
                  </div>
                </div>
              </div>

              {/* Structure des classes */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Structure des classes comptables</h3>
                <div className="grid gap-2">
                  {accountingClasses.map(cls => {
                    const Icon = cls.icon;
                    return (
                      <div key={cls.classe} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <span className="font-medium">Classe {cls.classe}</span>
                          <span className="text-muted-foreground ml-2">- {cls.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Information de conformité */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Conformité réglementaire
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ce plan comptable est conforme aux normes {getAccountingSystemName()} en vigueur.
                  Il respecte les principes comptables fondamentaux et les obligations légales applicables
                  en {coaParams?.pays}. Toute modification doit être effectuée en conformité avec
                  la réglementation locale et les directives de {getRegulatoryBody()}.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.
              Le compte ne sera supprimé que s'il n'a pas de comptes enfants ni d'écritures comptables.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmId && handleDeleteAccount(deleteConfirmId)}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChartOfAccounts;