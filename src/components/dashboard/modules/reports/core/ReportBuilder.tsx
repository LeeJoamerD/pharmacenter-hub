import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
// import { DatePicker } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Calendar, 
  Filter, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Table,
  FileText,
  Download,
  Eye,
  Save,
  Play,
  Plus,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  category: string;
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'table';
  title: string;
  dataSource: string;
  fields: string[];
  groupBy?: string;
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max';
}

const ReportBuilder = () => {
  const { toast } = useToast();
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedDataSource, setSelectedDataSource] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const dataSources = [
    { id: 'sales', name: 'Ventes', description: 'Données de transactions et CA' },
    { id: 'stock', name: 'Stock', description: 'Inventaire et mouvements' },
    { id: 'customers', name: 'Clients', description: 'Base clients et analyses' },
    { id: 'staff', name: 'Personnel', description: 'Équipe et performances' },
    { id: 'financial', name: 'Financier', description: 'Comptabilité et trésorerie' }
  ];

  const availableFields: Record<string, ReportField[]> = {
    sales: [
      { id: 'date_vente', name: 'Date de vente', type: 'date', category: 'Transaction' },
      { id: 'montant', name: 'Montant', type: 'number', category: 'Transaction' },
      { id: 'quantite', name: 'Quantité', type: 'number', category: 'Transaction' },
      { id: 'libelle_produit', name: 'Nom produit', type: 'text', category: 'Produit' },
      { id: 'categorie', name: 'Catégorie', type: 'text', category: 'Produit' },
      { id: 'nom_client', name: 'Nom client', type: 'text', category: 'Client' },
      { id: 'caissier', name: 'Caissier', type: 'text', category: 'Personnel' }
    ],
    stock: [
      { id: 'libelle_produit', name: 'Nom produit', type: 'text', category: 'Produit' },
      { id: 'quantite_stock', name: 'Quantité en stock', type: 'number', category: 'Stock' },
      { id: 'seuil_minimum', name: 'Seuil minimum', type: 'number', category: 'Stock' },
      { id: 'date_expiration', name: 'Date expiration', type: 'date', category: 'Stock' },
      { id: 'prix_achat', name: 'Prix d\'achat', type: 'number', category: 'Financier' },
      { id: 'fournisseur', name: 'Fournisseur', type: 'text', category: 'Partenaire' }
    ],
    customers: [
      { id: 'nom_client', name: 'Nom client', type: 'text', category: 'Identité' },
      { id: 'telephone', name: 'Téléphone', type: 'text', category: 'Contact' },
      { id: 'date_creation', name: 'Date création', type: 'date', category: 'Historique' },
      { id: 'ca_total', name: 'CA Total', type: 'number', category: 'Commercial' },
      { id: 'nb_commandes', name: 'Nb commandes', type: 'number', category: 'Commercial' }
    ]
  };

  const chartTypes = [
    { id: 'bar', name: 'Graphique en barres', icon: BarChart3 },
    { id: 'line', name: 'Graphique linéaire', icon: LineChart },
    { id: 'pie', name: 'Graphique circulaire', icon: PieChart },
    { id: 'table', name: 'Tableau', icon: Table }
  ];

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleAddChart = () => {
    const newChart: ChartConfig = {
      type: 'bar',
      title: `Graphique ${charts.length + 1}`,
      dataSource: selectedDataSource,
      fields: selectedFields.slice(0, 2), // Prendre les 2 premiers champs sélectionnés
      aggregation: 'sum'
    };
    setCharts([...charts, newChart]);
  };

  const handleRemoveChart = (index: number) => {
    setCharts(charts.filter((_, i) => i !== index));
  };

  const handleGenerateReport = () => {
    if (!reportName || !selectedDataSource || selectedFields.length === 0) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Rapport généré",
      description: `Le rapport "${reportName}" a été créé avec succès`,
    });
  };

  const handlePreview = () => {
    setIsPreviewMode(true);
    toast({
      title: "Aperçu généré",
      description: "Prévisualisation du rapport disponible",
    });
  };

  const handleSaveTemplate = () => {
    toast({
      title: "Modèle sauvegardé",
      description: "Le modèle de rapport a été enregistré",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Générateur de Rapports</h2>
          <p className="text-muted-foreground">
            Créez des rapports personnalisés avec notre outil de construction visuelle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePreview} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>
          <Button onClick={handleSaveTemplate} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
          <Button onClick={handleGenerateReport}>
            <Play className="h-4 w-4 mr-2" />
            Générer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration du rapport */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-name">Nom du rapport *</Label>
                <Input
                  id="report-name"
                  placeholder="Ex: Ventes mensuelles par produit"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-description">Description</Label>
                <Textarea
                  id="report-description"
                  placeholder="Description du rapport..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Source de données *</Label>
                <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une source" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSources.map(source => (
                      <SelectItem key={source.id} value={source.id}>
                        <div>
                          <div className="font-medium">{source.name}</div>
                          <div className="text-xs text-muted-foreground">{source.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sélection des champs */}
          {selectedDataSource && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Champs à inclure
                </CardTitle>
                <CardDescription>
                  Sélectionnez les données à afficher dans le rapport
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    availableFields[selectedDataSource]?.reduce((acc, field) => {
                      if (!acc[field.category]) acc[field.category] = [];
                      acc[field.category].push(field);
                      return acc;
                    }, {} as Record<string, ReportField[]>) || {}
                  ).map(([category, fields]) => (
                    <div key={category}>
                      <p className="font-medium text-sm mb-2">{category}</p>
                      {fields.map(field => (
                        <div key={field.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={field.id}
                            checked={selectedFields.includes(field.id)}
                            onCheckedChange={() => handleFieldToggle(field.id)}
                          />
                          <label
                            htmlFor={field.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {field.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Zone de construction */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Visualisations
                </span>
                <Button onClick={handleAddChart} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {charts.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucune visualisation ajoutée. Cliquez sur "Ajouter" pour commencer.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {charts.map((chart, index) => (
                    <Card key={index} className="border-2 border-dashed">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Input
                            value={chart.title}
                            onChange={(e) => {
                              const updatedCharts = [...charts];
                              updatedCharts[index].title = e.target.value;
                              setCharts(updatedCharts);
                            }}
                            className="font-medium"
                          />
                          <Button
                            onClick={() => handleRemoveChart(index)}
                            size="sm"
                            variant="outline"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Type de graphique</Label>
                            <Select
                              value={chart.type}
                              onValueChange={(value: any) => {
                                const updatedCharts = [...charts];
                                updatedCharts[index].type = value;
                                setCharts(updatedCharts);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {chartTypes.map(type => {
                                  const IconComponent = type.icon;
                                  return (
                                    <SelectItem key={type.id} value={type.id}>
                                      <div className="flex items-center gap-2">
                                        <IconComponent className="h-4 w-4" />
                                        {type.name}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Agrégation</Label>
                            <Select
                              value={chart.aggregation}
                              onValueChange={(value: any) => {
                                const updatedCharts = [...charts];
                                updatedCharts[index].aggregation = value;
                                setCharts(updatedCharts);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sum">Somme</SelectItem>
                                <SelectItem value="count">Nombre</SelectItem>
                                <SelectItem value="avg">Moyenne</SelectItem>
                                <SelectItem value="min">Minimum</SelectItem>
                                <SelectItem value="max">Maximum</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Champs sélectionnés</Label>
                          <div className="flex flex-wrap gap-2">
                            {chart.fields.map(fieldId => {
                              const field = availableFields[selectedDataSource]?.find(f => f.id === fieldId);
                              return field ? (
                                <Badge key={fieldId} variant="secondary">
                                  {field.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prévisualisation */}
          {isPreviewMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu du Rapport
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    L'aperçu du rapport "{reportName}" s'afficherait ici avec les visualisations configurées.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button onClick={() => handleExport('PDF')} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button onClick={() => handleExport('Excel')} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  function handleExport(format: string) {
    toast({
      title: `Export ${format}`,
      description: "Le rapport est en cours de génération...",
    });
  }
};

export default ReportBuilder;