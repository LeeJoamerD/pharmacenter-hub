import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  Clock, 
  TrendingUp,
  Bell,
  Zap,
  Info,
  Save,
  RotateCw,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FIFORule {
  id: string;
  categorie: string;
  produit: string;
  actif: boolean;
  priorite: 'haute' | 'moyenne' | 'basse';
  delaiAlerte: number; // jours avant expiration
  actionAuto: boolean;
  type: 'strict' | 'flexible' | 'manuel';
}

interface FIFOHistory {
  id: string;
  date: string;
  produit: string;
  lotSortant: string;
  lotEntrant: string;
  quantite: number;
  motif: string;
  utilisateur: string;
  conforme: boolean;
}

const FIFOConfig = () => {
  const { toast } = useToast();
  const [globalFIFO, setGlobalFIFO] = useState(true);
  const [alertesAuto, setAlertesAuto] = useState(true);
  const [delaiGlobal, setDelaiGlobal] = useState(30);
  const [toleranceDelai, setToleranceDelai] = useState(7);

  // Règles FIFO par catégorie
  const [fifoRules, setFifoRules] = useState<FIFORule[]>([
    {
      id: '1',
      categorie: 'Antibiotiques',
      produit: 'Tous',
      actif: true,
      priorite: 'haute',
      delaiAlerte: 30,
      actionAuto: true,
      type: 'strict'
    },
    {
      id: '2',
      categorie: 'Vitamines',
      produit: 'Tous',
      actif: true,
      priorite: 'moyenne',
      delaiAlerte: 60,
      actionAuto: false,
      type: 'flexible'
    },
    {
      id: '3',
      categorie: 'Antalgiques',
      produit: 'Paracétamol',
      actif: true,
      priorite: 'haute',
      delaiAlerte: 45,
      actionAuto: true,
      type: 'strict'
    },
    {
      id: '4',
      categorie: 'Cosmétiques',
      produit: 'Tous',
      actif: false,
      priorite: 'basse',
      delaiAlerte: 90,
      actionAuto: false,
      type: 'manuel'
    }
  ]);

  // Historique des rotations FIFO
  const fifoHistory: FIFOHistory[] = [
    {
      id: '1',
      date: '2024-03-15',
      produit: 'Amoxicilline 250mg',
      lotSortant: 'LOT003-2024',
      lotEntrant: 'LOT010-2024',
      quantite: 50,
      motif: 'Expiration proche',
      utilisateur: 'Système Auto',
      conforme: true
    },
    {
      id: '2',
      date: '2024-03-14',
      produit: 'Paracétamol 500mg',
      lotSortant: 'LOT001-2024',
      lotEntrant: 'LOT011-2024',
      quantite: 100,
      motif: 'Rotation programmée',
      utilisateur: 'Pharmacien',
      conforme: true
    },
    {
      id: '3',
      date: '2024-03-13',
      produit: 'Vitamine C 500mg',
      lotSortant: 'LOT004-2024',
      lotEntrant: 'LOT012-2024',
      quantite: 75,
      motif: 'Demande client',
      utilisateur: 'Vendeur1',
      conforme: false
    }
  ];

  const handleSaveGlobalSettings = () => {
    toast({
      title: "Paramètres sauvegardés",
      description: "La configuration FIFO globale a été mise à jour.",
    });
  };

  const handleRuleToggle = (ruleId: string) => {
    setFifoRules(rules => 
      rules.map(rule => 
        rule.id === ruleId ? { ...rule, actif: !rule.actif } : rule
      )
    );
  };

  const handleForceRotation = () => {
    toast({
      title: "Rotation forcée lancée",
      description: "La rotation FIFO a été déclenchée manuellement pour tous les produits éligibles.",
    });
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'haute': return 'bg-red-100 text-red-800';
      case 'moyenne': return 'bg-orange-100 text-orange-800';
      case 'basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strict': return 'bg-blue-100 text-blue-800';
      case 'flexible': return 'bg-purple-100 text-purple-800';
      case 'manuel': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConformityColor = (conforme: boolean) => {
    return conforme ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Paramètres globaux FIFO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Globale FIFO
          </CardTitle>
          <CardDescription>
            Paramètres généraux pour la rotation automatique des stocks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="global-fifo">FIFO Activé Globalement</Label>
                  <p className="text-sm text-muted-foreground">
                    Active la rotation FIFO pour tous les produits
                  </p>
                </div>
                <Switch
                  id="global-fifo"
                  checked={globalFIFO}
                  onCheckedChange={setGlobalFIFO}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-alerts">Alertes Automatiques</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications automatiques de rotation
                  </p>
                </div>
                <Switch
                  id="auto-alerts"
                  checked={alertesAuto}
                  onCheckedChange={setAlertesAuto}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delai-global">Délai d'Alerte Global (jours)</Label>
                <Input
                  id="delai-global"
                  type="number"
                  value={delaiGlobal}
                  onChange={(e) => setDelaiGlobal(Number(e.target.value))}
                  min="1"
                  max="365"
                />
                <p className="text-xs text-muted-foreground">
                  Nombre de jours avant expiration pour déclencher l'alerte
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tolerance">Tolérance de Délai (jours)</Label>
                <Input
                  id="tolerance"
                  type="number"
                  value={toleranceDelai}
                  onChange={(e) => setToleranceDelai(Number(e.target.value))}
                  min="0"
                  max="30"
                />
                <p className="text-xs text-muted-foreground">
                  Marge de tolérance pour la rotation automatique
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSaveGlobalSettings}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
            <Button variant="outline" onClick={handleForceRotation}>
              <RotateCw className="h-4 w-4 mr-2" />
              Forcer Rotation
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Règles par Catégorie</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="history">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Historique</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Analyse</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Règles FIFO par Catégorie</CardTitle>
              <CardDescription>
                Configuration spécifique des règles de rotation pour chaque catégorie de produits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Règles Configurées</h4>
                  <Button>
                    <Package className="h-4 w-4 mr-2" />
                    Nouvelle Règle
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Catégorie / Produit</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead>Délai Alerte</TableHead>
                        <TableHead>Action Auto</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fifoRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{rule.categorie}</p>
                              <p className="text-sm text-muted-foreground">{rule.produit}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(rule.type)}>
                              {rule.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(rule.priorite)}>
                              {rule.priorite}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {rule.delaiAlerte} jours
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {rule.actionAuto ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                              )}
                              {rule.actionAuto ? 'Oui' : 'Non'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.actif}
                                onCheckedChange={() => handleRuleToggle(rule.id)}
                              />
                              <span className="text-sm">
                                {rule.actif ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                Modifier
                              </Button>
                              <Button variant="outline" size="sm">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Rotations FIFO</CardTitle>
              <CardDescription>
                Suivi de toutes les opérations de rotation effectuées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Rotation</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Conformité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fifoHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {new Date(entry.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{entry.produit}</p>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <RotateCcw className="h-3 w-3 text-red-600" />
                              <span className="text-red-600">Sortie: {entry.lotSortant}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <RotateCw className="h-3 w-3 text-green-600" />
                              <span className="text-green-600">Entrée: {entry.lotEntrant}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold">{entry.quantite}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{entry.motif}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{entry.utilisateur}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getConformityColor(entry.conforme)}>
                            <div className="flex items-center gap-1">
                              {entry.conforme ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {entry.conforme ? 'Conforme' : 'Non conforme'}
                            </div>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Statistiques de performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance FIFO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-green-600">95%</p>
                    <p className="text-sm text-muted-foreground">Conformité FIFO</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-blue-600">87</p>
                    <p className="text-sm text-muted-foreground">Rotations ce mois</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-orange-600">2.5j</p>
                    <p className="text-sm text-muted-foreground">Délai moyen rotation</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-purple-600">12</p>
                    <p className="text-sm text-muted-foreground">Alertes non traitées</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommandations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recommandations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border border-blue-200 bg-blue-50 rounded">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Optimisation suggérée</p>
                      <p className="text-sm text-blue-700">
                        Réduire le délai d'alerte pour les antibiotiques à 21 jours
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 border border-orange-200 bg-orange-50 rounded">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800">Action requise</p>
                      <p className="text-sm text-orange-700">
                        12 lots nécessitent une rotation manuelle immédiate
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 border border-green-200 bg-green-50 rounded">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Performance excellente</p>
                      <p className="text-sm text-green-700">
                        Le FIFO fonctionne bien pour la catégorie Antalgiques
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FIFOConfig;