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
import { Switch } from "@/components/ui/switch";
import { ChevronRight, ChevronDown, Search, Plus, Edit, Trash2, Filter, BookOpen, Building, DollarSign, CreditCard, Briefcase, TrendingUp, BarChart3 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: string;
  code: string;
  libelle: string;
  classe: number;
  type: 'detail' | 'titre' | 'sous-titre';
  parent_id?: string;
  niveau: number;
  actif: boolean;
  analytique: boolean;
  rapprochement: boolean;
  description?: string;
  solde_debiteur: number;
  solde_crediteur: number;
  children?: Account[];
}

const ChartOfAccounts = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Classes OHADA
  const ohadaClasses = [
    { classe: 1, nom: 'Comptes de ressources durables', icon: Building, color: 'text-blue-600' },
    { classe: 2, nom: 'Comptes d\'actif immobilisé', icon: BookOpen, color: 'text-green-600' },
    { classe: 3, nom: 'Comptes de stocks', icon: BarChart3, color: 'text-orange-600' },
    { classe: 4, nom: 'Comptes de tiers', icon: Briefcase, color: 'text-purple-600' },
    { classe: 5, nom: 'Comptes de trésorerie', icon: CreditCard, color: 'text-cyan-600' },
    { classe: 6, nom: 'Comptes de charges', icon: TrendingUp, color: 'text-red-600' },
    { classe: 7, nom: 'Comptes de produits', icon: DollarSign, color: 'text-emerald-600' }
  ];

  // Données exemple du plan comptable
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      code: '10',
      libelle: 'Capital et réserves',
      classe: 1,
      type: 'titre',
      niveau: 1,
      actif: true,
      analytique: false,
      rapprochement: false,
      solde_debiteur: 0,
      solde_crediteur: 250000,
      children: [
        {
          id: '2',
          code: '101',
          libelle: 'Capital social',
          classe: 1,
          type: 'sous-titre',
          parent_id: '1',
          niveau: 2,
          actif: true,
          analytique: false,
          rapprochement: false,
          solde_debiteur: 0,
          solde_crediteur: 100000
        },
        {
          id: '3',
          code: '106',
          libelle: 'Réserves',
          classe: 1,
          type: 'detail',
          parent_id: '1',
          niveau: 2,
          actif: true,
          analytique: false,
          rapprochement: false,
          solde_debiteur: 0,
          solde_crediteur: 150000
        }
      ]
    },
    {
      id: '4',
      code: '60',
      libelle: 'Achats et variations de stocks',
      classe: 6,
      type: 'titre',
      niveau: 1,
      actif: true,
      analytique: true,
      rapprochement: false,
      solde_debiteur: 850000,
      solde_crediteur: 0,
      children: [
        {
          id: '5',
          code: '601',
          libelle: 'Achats de matières premières',
          classe: 6,
          type: 'detail',
          parent_id: '4',
          niveau: 2,
          actif: true,
          analytique: true,
          rapprochement: false,
          solde_debiteur: 450000,
          solde_crediteur: 0
        },
        {
          id: '6',
          code: '602',
          libelle: 'Achats de médicaments',
          classe: 6,
          type: 'detail',
          parent_id: '4',
          niveau: 2,
          actif: true,
          analytique: true,
          rapprochement: false,
          solde_debiteur: 400000,
          solde_crediteur: 0
        }
      ]
    }
  ]);

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

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.includes(searchTerm);
    const matchesClass = selectedClass === 'all' || account.classe.toString() === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleSaveAccount = () => {
    if (!newAccount.code || !newAccount.libelle) {
      toast({
        title: "Erreur",
        description: "Le code et le libellé sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (editingAccount) {
      // Modification
      setAccounts(prev => prev.map(acc => 
        acc.id === editingAccount.id 
          ? { ...acc, ...newAccount } as Account
          : acc
      ));
      toast({
        title: "Succès",
        description: "Compte modifié avec succès"
      });
    } else {
      // Création
      const account: Account = {
        id: Date.now().toString(),
        solde_debiteur: 0,
        solde_crediteur: 0,
        ...newAccount
      } as Account;
      
      setAccounts(prev => [...prev, account]);
      toast({
        title: "Succès",
        description: "Compte créé avec succès"
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

  const handleDeleteAccount = (accountId: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    toast({
      title: "Succès",
      description: "Compte supprimé avec succès"
    });
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
              </div>
              <div className="flex space-x-4 text-sm text-muted-foreground">
                <span>Débit: {account.solde_debiteur.toLocaleString()}</span>
                <span>Crédit: {account.solde_crediteur.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleEditAccount(account)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleDeleteAccount(account.id)}
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
        <h2 className="text-2xl font-bold">Plan Comptable OHADA</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Compte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Modifier le compte' : 'Créer un nouveau compte'}
              </DialogTitle>
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
                      {ohadaClasses.map(cls => (
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
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveAccount}>
                {editingAccount ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="tree" className="w-full">
        <TabsList>
          <TabsTrigger value="tree">Arbre des comptes</TabsTrigger>
          <TabsTrigger value="classes">Classes OHADA</TabsTrigger>
          <TabsTrigger value="analytique">Comptes analytiques</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="space-y-4">
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
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrer par classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {ohadaClasses.map(cls => (
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
                  Aucun compte trouvé
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ohadaClasses.map(cls => {
              const Icon = cls.icon;
              const classAccounts = accounts.filter(acc => acc.classe === cls.classe);
              return (
                <Card key={cls.classe}>
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
                        <span>Solde total:</span>
                        <span className="font-medium">
                          {classAccounts.reduce((sum, acc) => sum + acc.solde_debiteur - acc.solde_crediteur, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytique" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comptes analytiques</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comptes utilisés pour la comptabilité analytique et les centres de coûts
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts.filter(acc => acc.analytique).map(account => (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{account.code}</Badge>
                      <span className="font-medium">{account.libelle}</span>
                      <Badge variant="secondary">Analytique</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Classe {account.classe}
                    </div>
                  </div>
                ))}
                {accounts.filter(acc => acc.analytique).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun compte analytique configuré
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChartOfAccounts;