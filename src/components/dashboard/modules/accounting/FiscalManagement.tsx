import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TVADeclaration, ObligationFiscale } from '@/hooks/useFiscalManagement';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  FileText, 
  Calculator, 
  AlertTriangle, 
  Download, 
  Upload, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  Shield,
  TrendingUp,
  DollarSign,
  Plus,
  Eye,
  Edit,
  Trash
} from 'lucide-react';
import { useFiscalManagement } from '@/hooks/useFiscalManagement';
import { TauxTVADialog } from '@/components/accounting/fiscal/TauxTVADialog';
import { DeclarationTVADialog } from '@/components/accounting/fiscal/DeclarationTVADialog';

const FiscalManagement = () => {
  const [activeTab, setActiveTab] = useState('tva');
  const [tvaDialogOpen, setTvaDialogOpen] = useState(false);
  const [declarationDialogOpen, setDeclarationDialogOpen] = useState(false);
  const [editingTaux, setEditingTaux] = useState<any>(null);
  const [selectedDeclaration, setSelectedDeclaration] = useState<TVADeclaration | null>(null);
  const [selectedObligation, setSelectedObligation] = useState<ObligationFiscale | null>(null);

  const {
    tauxTVA,
    loadingTaux,
    createTauxTVA,
    updateTauxTVA,
    deleteTauxTVA,
    declarations,
    loadingDeclarations,
    createDeclaration,
    updateDeclaration,
    obligations,
    loadingObligations,
    updateObligation,
    conformiteItems,
    scoreGlobal,
    loadingConformite,
    updateConformiteItem,
    parametresFiscaux,
    updateParametresFiscaux,
    archives,
    capaciteArchivage,
    vatSummary,
    loadingVAT,
    refetchVAT,
    taxAnalytics,
    generateJournalTVAPDF,
    generateEtatTVAExcel,
    generateAnnexeFiscalePDF,
    regionalParams,
    loadingRegionalParams,
    formatAmount,
  } = useFiscalManagement();

  const devise = regionalParams?.devise_principale || 'XAF';

  const handleSaveTaux = (data: any) => {
    if (editingTaux) {
      updateTauxTVA.mutate({ id: editingTaux.id, ...data });
    } else {
      createTauxTVA.mutate(data);
    }
    setEditingTaux(null);
  };

  const handleEditTaux = (taux: any) => {
    setEditingTaux(taux);
    setTvaDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Conforme':
      case 'Payée':
      case 'Déposée':
      case 'Traité':
        return 'default';
      case 'Brouillon':
      case 'Planifié':
        return 'secondary';
      case 'En attente':
      case 'À améliorer':
      case 'En retard':
        return 'destructive';
      default:
        return 'secondary';
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Gestion Fiscale</h3>
          <p className="text-muted-foreground">
            TVA, déclarations fiscales et conformité réglementaire
          </p>
          {regionalParams && (
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{regionalParams.pays}</Badge>
              <Badge variant="outline">{regionalParams.systeme_comptable}</Badge>
              <Badge variant="outline">{devise}</Badge>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            disabled={loadingVAT}
            onClick={async () => {
              await refetchVAT();
              toast.success('TVA et Centime Additionnel recalculés avec succès');
            }}
          >
            <Calculator className="h-4 w-4 mr-2" />
            {loadingVAT ? 'Recalcul en cours...' : 'Recalculer TVA'}
          </Button>
          <Button onClick={() => setDeclarationDialogOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Nouvelle Déclaration
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="tva">TVA</TabsTrigger>
          <TabsTrigger value="declarations">Déclarations</TabsTrigger>
          <TabsTrigger value="obligations">Obligations</TabsTrigger>
          <TabsTrigger value="conformite">Conformité</TabsTrigger>
          <TabsTrigger value="rapports">Rapports</TabsTrigger>
          <TabsTrigger value="parametres">Paramètres</TabsTrigger>
        </TabsList>

        {/* ==================== ONGLET TVA ==================== */}
        <TabsContent value="tva" className="space-y-4">
          {/* Cartes TVA */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TVA Collectée</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(vatSummary?.vatCollected || 0)}
                </div>
                <p className="text-xs text-muted-foreground">{devise} ce mois</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TVA Déductible</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(vatSummary?.vatDeductible || 0)}
                </div>
                <p className="text-xs text-muted-foreground">{devise} ce mois</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TVA à Payer</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(vatSummary?.vatDue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {vatSummary && vatSummary.vatDue < 0 ? 'Crédit de TVA' : 'À payer'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux Moyen</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {vatSummary?.averageRate.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">Taux effectif</p>
              </CardContent>
            </Card>
          </div>

          {/* Cartes Centime Additionnel */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-secondary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Centime Add. Collecté</CardTitle>
                <TrendingUp className="h-4 w-4 text-secondary-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary-foreground">
                  {formatAmount(vatSummary?.centimeCollected || 0)}
                </div>
                <p className="text-xs text-muted-foreground">{vatSummary?.centimeRate || regionalParams?.taux_centime_additionnel || 5}% sur TVA</p>
              </CardContent>
            </Card>
            <Card className="border-secondary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Centime Add. Déductible</CardTitle>
                <Receipt className="h-4 w-4 text-secondary-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary-foreground">
                  {formatAmount(vatSummary?.centimeDeductible || 0)}
                </div>
                <p className="text-xs text-muted-foreground">{devise} ce mois</p>
              </CardContent>
            </Card>
            <Card className="border-secondary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Centime Add. à Payer</CardTitle>
                <DollarSign className="h-4 w-4 text-secondary-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary-foreground">
                  {formatAmount(vatSummary?.centimeDue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {vatSummary && vatSummary.centimeDue < 0 ? 'Crédit' : 'À payer'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total à Payer</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatAmount((vatSummary?.vatDue || 0) + (vatSummary?.centimeDue || 0))}
                </div>
                <p className="text-xs text-muted-foreground">TVA + Centime Add.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Calcul TVA et Centime du Mois</CardTitle>
                <CardDescription>Résumé automatique des opérations TVA et Centime Additionnel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Ventes HT</span>
                    <span className="font-medium">{formatAmount(vatSummary?.salesHT || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>TVA Collectée</span>
                    <span className="font-medium">{formatAmount(vatSummary?.vatCollected || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="text-sm">↳ Centime Add. Collecté ({vatSummary?.centimeRate || regionalParams?.taux_centime_additionnel || 5}%)</span>
                    <span className="font-medium text-sm">{formatAmount(vatSummary?.centimeCollected || 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span>Achats HT</span>
                    <span className="font-medium">{formatAmount(vatSummary?.purchasesHT || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>TVA Déductible</span>
                    <span className="font-medium">{formatAmount(vatSummary?.vatDeductible || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="text-sm">↳ Centime Add. Déductible ({vatSummary?.centimeRate || regionalParams?.taux_centime_additionnel || 5}%)</span>
                    <span className="font-medium text-sm">{formatAmount(vatSummary?.centimeDeductible || 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span>TVA à Payer</span>
                    <span className="font-medium">{formatAmount(vatSummary?.vatDue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Centime Add. à Payer</span>
                    <span className="font-medium">{formatAmount(vatSummary?.centimeDue || 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-bold bg-primary/10 p-2 rounded">
                    <span>Total à Payer</span>
                    <span className="text-primary">{formatAmount((vatSummary?.vatDue || 0) + (vatSummary?.centimeDue || 0))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux de TVA Configurés</CardTitle>
                <CardDescription>Gestion des taux par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tauxTVA.map((rate) => (
                    <div key={rate.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{rate.nom_taux}</p>
                        <p className="text-sm text-muted-foreground">{rate.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-bold text-lg">{rate.taux_pourcentage}%</p>
                          <Badge variant="outline">{rate.type_taux}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTaux(rate)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTauxTVA.mutate(rate.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    setEditingTaux(null);
                    setTvaDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Taux
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== ONGLET DÉCLARATIONS ==================== */}
        <TabsContent value="declarations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Déclarations Fiscales</CardTitle>
              <CardDescription>Suivi des déclarations TVA et Centime Additionnel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Période</TableHead>
                      <TableHead>TVA Collectée</TableHead>
                      <TableHead>TVA Déductible</TableHead>
                      <TableHead>TVA à Payer</TableHead>
                      <TableHead>Cent. Collecté</TableHead>
                      <TableHead>Cent. Déductible</TableHead>
                      <TableHead>Cent. à Payer</TableHead>
                      <TableHead className="font-bold">Total</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {declarations.map((declaration) => (
                      <TableRow key={declaration.id}>
                        <TableCell className="font-medium">{declaration.periode}</TableCell>
                        <TableCell>{formatAmount(declaration.tva_collectee)}</TableCell>
                        <TableCell>{formatAmount(declaration.tva_deductible)}</TableCell>
                        <TableCell>{formatAmount(declaration.tva_a_payer)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatAmount(declaration.centime_additionnel_collecte || 0)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatAmount(declaration.centime_additionnel_deductible || 0)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatAmount(declaration.centime_additionnel_a_payer || 0)}</TableCell>
                        <TableCell className="font-bold text-primary">
                          {formatAmount((declaration.tva_a_payer || 0) + (declaration.centime_additionnel_a_payer || 0))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(declaration.statut)}>
                            {declaration.statut}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDeclaration(declaration)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={generateJournalTVAPDF}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {declaration.statut === 'Brouillon' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateDeclaration.mutate({ id: declaration.id, statut: 'Déposée' })}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ONGLET OBLIGATIONS ==================== */}
        <TabsContent value="obligations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obligations Fiscales</CardTitle>
              <CardDescription>Suivi des obligations fiscales</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Fréquence</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {obligations.map((obligation) => (
                    <TableRow key={obligation.id}>
                      <TableCell className="font-medium">{obligation.type_obligation}</TableCell>
                      <TableCell>{obligation.frequence}</TableCell>
                      <TableCell>{new Date(obligation.prochaine_echeance).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(obligation.statut)}>
                          {obligation.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedObligation(obligation)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateObligation.mutate({ id: obligation.id, statut: 'Traité' })}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ONGLET CONFORMITÉ ==================== */}
        <TabsContent value="conformite" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Score de Conformité</CardTitle>
                <CardDescription>Évaluation globale de votre conformité fiscale</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-48 h-48">
                  <Progress value={scoreGlobal} className="absolute top-0 left-0 w-full h-full rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{scoreGlobal}%</span>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Votre score de conformité actuel
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Éléments de Contrôle</CardTitle>
                <CardDescription>État de conformité par domaine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conformiteItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.element_controle}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(item.statut_conformite)}>
                          {item.statut_conformite}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateConformiteItem.mutate({ id: item.id, statut_conformite: 'Conforme' })}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== ONGLET RAPPORTS ==================== */}
        <TabsContent value="rapports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Génération de Rapports</CardTitle>
              <CardDescription>
                Créez et exportez vos rapports fiscaux
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full" onClick={generateJournalTVAPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Journal TVA (PDF)
              </Button>
              <Button variant="outline" className="w-full" onClick={generateEtatTVAExcel}>
                <FileText className="h-4 w-4 mr-2" />
                État TVA (Excel)
              </Button>
              <Button variant="outline" className="w-full" onClick={generateAnnexeFiscalePDF}>
                <FileText className="h-4 w-4 mr-2" />
                Annexe Fiscale (PDF)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ONGLET PARAMÈTRES ==================== */}
        <TabsContent value="parametres" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Fiscaux</CardTitle>
              <CardDescription>
                Configuration des paramètres généraux
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="regime_tva">Régime TVA</Label>
                  <Select
                    defaultValue={parametresFiscaux?.regime_tva}
                    onValueChange={(value) => updateParametresFiscaux.mutate({ regime_tva: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Simplifié">Simplifié</SelectItem>
                      <SelectItem value="Franchise">Franchise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frequence_declaration">Fréquence Déclaration</Label>
                  <Select
                    defaultValue={parametresFiscaux?.frequence_declaration}
                    onValueChange={(value) => updateParametresFiscaux.mutate({ frequence_declaration: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensuelle">Mensuelle</SelectItem>
                      <SelectItem value="Trimestrielle">Trimestrielle</SelectItem>
                      <SelectItem value="Annuelle">Annuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="numero_tva">Numéro TVA</Label>
                  <Input
                    id="numero_tva"
                    defaultValue={parametresFiscaux?.numero_tva || ''}
                    onBlur={(e) => updateParametresFiscaux.mutate({ numero_tva: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TauxTVADialog
        open={tvaDialogOpen}
        onOpenChange={setTvaDialogOpen}
        onSave={handleSaveTaux}
        defaultValues={editingTaux}
      />

      <DeclarationTVADialog
        open={declarationDialogOpen}
        onOpenChange={setDeclarationDialogOpen}
        onSave={(data) => createDeclaration.mutate(data)}
        vatSummary={vatSummary}
      />

      {/* Dialog Voir Déclaration */}
      <Dialog open={!!selectedDeclaration} onOpenChange={() => setSelectedDeclaration(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail de la Déclaration TVA et Centime Additionnel</DialogTitle>
            <DialogDescription>Période: {selectedDeclaration?.periode}</DialogDescription>
          </DialogHeader>
          {selectedDeclaration && (
            <div className="space-y-4">
              {/* TVA */}
              <div>
                <h4 className="font-medium mb-2">TVA</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Collectée</Label>
                    <p className="font-semibold">{formatAmount(selectedDeclaration.tva_collectee)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Déductible</Label>
                    <p className="font-semibold">{formatAmount(selectedDeclaration.tva_deductible)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">À Payer</Label>
                    <p className="font-semibold">{formatAmount(selectedDeclaration.tva_a_payer)}</p>
                  </div>
                </div>
              </div>
              <Separator />
              {/* Centime Additionnel */}
              <div>
                <h4 className="font-medium mb-2">Centime Additionnel <Badge variant="secondary" className="ml-2">{regionalParams?.taux_centime_additionnel || 5}%</Badge></h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Collecté</Label>
                    <p className="font-semibold">{formatAmount(selectedDeclaration.centime_additionnel_collecte || 0)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Déductible</Label>
                    <p className="font-semibold">{formatAmount(selectedDeclaration.centime_additionnel_deductible || 0)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">À Payer</Label>
                    <p className="font-semibold">{formatAmount(selectedDeclaration.centime_additionnel_a_payer || 0)}</p>
                  </div>
                </div>
              </div>
              <Separator />
              {/* Total */}
              <div className="bg-primary/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total à Payer</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatAmount((selectedDeclaration.tva_a_payer || 0) + (selectedDeclaration.centime_additionnel_a_payer || 0))}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-muted-foreground">Statut:</Label>
                  <Badge variant={getStatusColor(selectedDeclaration.statut)}>{selectedDeclaration.statut}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Créée le {new Date(selectedDeclaration.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Voir Obligation */}
      <Dialog open={!!selectedObligation} onOpenChange={() => setSelectedObligation(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détail de l'Obligation Fiscale</DialogTitle>
            <DialogDescription>{selectedObligation?.type_obligation}</DialogDescription>
          </DialogHeader>
          {selectedObligation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fréquence</Label>
                  <p className="font-semibold">{selectedObligation.frequence}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <Badge variant={getStatusColor(selectedObligation.statut)}>{selectedObligation.statut}</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Prochaine Échéance</Label>
                <p className="text-lg font-semibold">{new Date(selectedObligation.prochaine_echeance).toLocaleDateString()}</p>
              </div>
              {selectedObligation.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedObligation.description}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground">Rappel Email:</Label>
                <Badge variant={selectedObligation.rappel_email ? 'default' : 'secondary'}>
                  {selectedObligation.rappel_email ? 'Activé' : 'Désactivé'}
                </Badge>
              </div>
              {selectedObligation.rappel_email && (
                <div>
                  <Label className="text-muted-foreground">Rappel</Label>
                  <p className="text-sm">{selectedObligation.rappel_jours_avant} jours avant l'échéance</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FiscalManagement;

