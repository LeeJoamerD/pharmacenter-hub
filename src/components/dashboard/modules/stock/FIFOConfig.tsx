import { useState, useEffect, useMemo } from "react";
import { useFIFOConfiguration, FIFOConfigurationWithDetails, CreateFIFOConfigInput, UpdateFIFOConfigInput } from "@/hooks/useFIFOConfiguration";
import { useProducts } from "@/hooks/useProducts";
import { useTenantQuery } from "@/hooks/useTenantQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, Settings, Plus, Edit, Trash2, CheckCircle, 
  RotateCcw, TrendingUp, AlertCircle, Info, Filter,
  Package, Users, Globe, Save, X, Eye
} from "lucide-react";
import { toast } from "sonner";

export const FIFOConfig = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<FIFOConfigurationWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState("list");

  const {
    useFIFOConfigurationsQuery,
    createFIFOConfig,
    updateFIFOConfig,
    deleteFIFOConfig,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFIFOConfiguration();

  const { products } = useProducts();
  const { useTenantQueryWithCache } = useTenantQuery();

  const { data: configurations, isLoading } = useFIFOConfigurationsQuery();

  // Debug: Log configurations data
  console.log('🔍 FIFO Configurations Debug:', {
    configurations,
    configurationsLength: configurations?.length,
    isLoading,
    rawConfigurations: configurations
  });

  // Fetch families for dropdown
  const { data: families } = useTenantQueryWithCache(
    ['families'],
    'famille_produit',
    'id, libelle_famille',
    {},
    { enabled: true }
  );

  // Filter configurations based on search and filters
  const filteredConfigurations = useMemo(() => {
    if (!configurations) return [];

    console.log('🔍 Filtering Debug:', {
      originalConfigurations: configurations,
      searchTerm,
      selectedType,
      selectedStatus
    });

    const transformedConfigs = configurations.map((config: any) => ({
      ...config,
      // Transform database fields to UI fields for display
      activer_fifo: config.actif,
      tolerance_jours: config.tolerance_delai_jours,
      seuil_alerte_rotation: config.delai_alerte_jours,
      ignorer_lots_expires: true, // Default value
      priorite_prix: false, // Default value
    }));

    console.log('🔍 Transformed Configs:', transformedConfigs);

    const filtered = transformedConfigs.filter((config: FIFOConfigurationWithDetails) => {
      // Fix search logic to handle empty search term and null/undefined values
      const matchesSearch = !searchTerm || 
        (config.produit?.libelle_produit?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (config.famille?.libelle_famille?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = selectedType === "all" || 
        (selectedType === "product" && config.produit_id) ||
        (selectedType === "family" && config.famille_produit_id && !config.produit_id) ||
        (selectedType === "global" && !config.produit_id && !config.famille_produit_id);

      const matchesStatus = selectedStatus === "all" || 
        (selectedStatus === "active" && config.actif) ||
        (selectedStatus === "inactive" && !config.actif);

      console.log('🔍 Filter Check for config:', config.id, {
        matchesSearch,
        matchesType,
        matchesStatus,
        produit_id: config.produit_id,
        famille_produit_id: config.famille_produit_id,
        actif: config.actif
      });

      return matchesSearch && matchesType && matchesStatus;
    });

    console.log('🔍 Final Filtered Configs:', filtered);
    return filtered;
  }, [configurations, searchTerm, selectedType, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    if (!configurations) return { total: 0, active: 0, byProduct: 0, byFamily: 0, global: 0 };

    return {
      total: configurations.length,
      active: configurations.filter((c: any) => c.actif).length,
      byProduct: configurations.filter((c: any) => c.produit_id).length,
      byFamily: configurations.filter((c: any) => c.famille_id && !c.produit_id).length,
      global: configurations.filter((c: any) => !c.produit_id && !c.famille_id).length,
    };
  }, [configurations]);

  const handleEdit = (config: FIFOConfigurationWithDetails) => {
    setSelectedConfig(config);
    setIsEditModalOpen(true);
  };

  const handleDelete = (configId: string) => {
    deleteFIFOConfig({ id: configId });
  };

  const handleCreateConfig = (data: CreateFIFOConfigInput) => {
    createFIFOConfig(data);
    setIsCreateModalOpen(false);
  };

  const handleUpdateConfig = (data: UpdateFIFOConfigInput) => {
    updateFIFOConfig(data);
    setIsEditModalOpen(false);
    setSelectedConfig(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Info className="h-8 w-8 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">Configuration FIFO (First In, First Out)</h3>
              <p className="text-blue-700 mt-1">
                Configurez les règles FIFO pour garantir que les lots les plus anciens sont vendus en premier. 
                Vous pouvez définir des règles par produit, par famille ou globales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Actives</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Par Produit</p>
                <p className="text-2xl font-bold">{stats.byProduct}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Par Famille</p>
                <p className="text-2xl font-bold">{stats.byFamily}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm text-muted-foreground">Globales</p>
                <p className="text-2xl font-bold">{stats.global}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Liste des Configurations</TabsTrigger>
          <TabsTrigger value="analytics">Analyse & Métriques</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Configurations FIFO</CardTitle>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle Configuration
                    </Button>
                  </DialogTrigger>
                  <CreateConfigModal
                    products={products}
                    families={families || []}
                    onSubmit={handleCreateConfig}
                    isLoading={isCreating}
                  />
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par produit ou famille..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Type de règle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="product">Par Produit</SelectItem>
                    <SelectItem value="family">Par Famille</SelectItem>
                    <SelectItem value="global">Globale</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actives</SelectItem>
                    <SelectItem value="inactive">Inactives</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Configurations Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Cible</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Délai Alerte</TableHead>
                      <TableHead>Tolérance</TableHead>
                      <TableHead>Action Auto</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredConfigurations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {searchTerm || selectedType !== "all" || selectedStatus !== "all" 
                            ? "Aucune configuration trouvée pour les critères sélectionnés"
                            : "Aucune configuration FIFO définie. Créez votre première configuration."
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredConfigurations.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell>
                            <Badge variant={
                              config.produit_id ? "default" : 
                              config.famille_id ? "secondary" : "outline"
                            }>
                              {config.produit_id ? "Produit" : 
                               config.famille_id ? "Famille" : "Globale"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {config.produit?.libelle_produit || 
                                 config.famille?.libelle_famille || 
                                 "Configuration globale"}
                              </div>
                              {config.produit_id && config.famille && (
                                <div className="text-sm text-muted-foreground">
                                  Famille: {config.famille.libelle_famille}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={config.actif ? "default" : "secondary"}>
                              {config.actif ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {config.priorite || 1}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {config.delai_alerte_jours || 30} jours
                          </TableCell>
                          <TableCell>
                            {config.tolerance_delai_jours || 7} jours
                          </TableCell>
                          <TableCell>
                            <Badge variant={config.action_automatique ? "default" : "outline"}>
                              {config.action_automatique ? "Oui" : "Non"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(config)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer cette configuration FIFO ? 
                                      Cette action est irréversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(config.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <FIFOAnalytics configurations={configurations || []} />
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        {selectedConfig && (
          <EditConfigModal
            config={selectedConfig}
            products={products}
            families={families || []}
            onSubmit={handleUpdateConfig}
            isLoading={isUpdating}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedConfig(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
};

// Create Configuration Modal Component
const CreateConfigModal = ({ 
  products, 
  families, 
  onSubmit, 
  isLoading 
}: {
  products: any[];
  families: any[];
  onSubmit: (data: CreateFIFOConfigInput) => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState<CreateFIFOConfigInput>({
    activer_fifo: true,
    tolerance_jours: 7,
    ignorer_lots_expires: true,
    priorite_prix: false,
    seuil_alerte_rotation: 30,
    action_automatique: false,
    produit_id: undefined,
    famille_produit_id: undefined,
  });
  const [configType, setConfigType] = useState<"product" | "family" | "global">("product");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Form Submit Debug:', {
      configType,
      formData,
      produit_id: formData.produit_id,
      famille_produit_id: formData.famille_produit_id
    });
    
    const submitData: CreateFIFOConfigInput = {
      ...formData,
      produit_id: configType === "product" ? formData.produit_id : undefined,
      famille_produit_id: configType === "family" ? formData.famille_produit_id : undefined,
    };

    console.log('🔍 Submit Data Debug:', {
      configType,
      submitData,
      produit_id: submitData.produit_id,
      famille_produit_id: submitData.famille_produit_id
    });

    onSubmit(submitData);
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Nouvelle Configuration FIFO</DialogTitle>
        <DialogDescription>
          Créez une nouvelle règle FIFO pour un produit, une famille ou globalement.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Type de Configuration</Label>
            <Select value={configType} onValueChange={(value: any) => setConfigType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Par Produit</SelectItem>
                <SelectItem value="family">Par Famille</SelectItem>
                <SelectItem value="global">Configuration Globale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {configType === "product" && (
            <div>
              <Label>Produit</Label>
              <Select 
                value={formData.produit_id || ""} 
                onValueChange={(value) => {
                  console.log('🔍 Product Selection Debug:', { value, configType });
                  setFormData(prev => ({ ...prev, produit_id: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.libelle_produit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {configType === "family" && (
            <div>
              <Label>Famille</Label>
              <Select 
                value={formData.famille_produit_id || ""} 
                onValueChange={(value) => {
                  console.log('🔍 Family Selection Debug:', { value, configType });
                  setFormData(prev => ({ ...prev, famille_produit_id: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une famille" />
                </SelectTrigger>
                <SelectContent>
                  {families.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.libelle_famille}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tolérance (jours)</Label>
              <Input
                type="number"
                value={formData.tolerance_jours || 7}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  tolerance_jours: parseInt(e.target.value) || 7 
                }))}
                min="0"
              />
            </div>
            <div>
              <Label>Seuil d'alerte rotation (jours)</Label>
              <Input
                type="number"
                value={formData.seuil_alerte_rotation || 30}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  seuil_alerte_rotation: parseInt(e.target.value) || 30 
                }))}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Activer FIFO</Label>
              <Switch
                checked={formData.activer_fifo}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  activer_fifo: checked 
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ignorer les lots expirés</Label>
              <Switch
                checked={formData.ignorer_lots_expires}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  ignorer_lots_expires: checked 
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Priorité au prix</Label>
              <Switch
                checked={formData.priorite_prix}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  priorite_prix: checked 
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Actions automatiques</Label>
              <Switch
                checked={formData.action_automatique}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  action_automatique: checked 
                }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => {}}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Création..." : "Créer"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

// Edit Configuration Modal Component
const EditConfigModal = ({ 
  config, 
  products, 
  families, 
  onSubmit, 
  isLoading, 
  onClose 
}: {
  config: FIFOConfigurationWithDetails;
  products: any[];
  families: any[];
  onSubmit: (data: UpdateFIFOConfigInput) => void;
  isLoading: boolean;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    activer_fifo: config.activer_fifo,
    tolerance_jours: config.tolerance_jours,
    ignorer_lots_expires: config.ignorer_lots_expires,
    priorite_prix: config.priorite_prix,
    seuil_alerte_rotation: config.seuil_alerte_rotation,
    action_automatique: config.action_automatique,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: config.id,
      ...formData,
    });
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Modifier Configuration FIFO</DialogTitle>
        <DialogDescription>
          Modifiez les paramètres de cette configuration FIFO.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="font-medium">Configuration pour:</div>
            <div className="text-sm text-muted-foreground">
              {config.produit?.libelle_produit || 
               config.famille?.libelle_famille || 
               "Configuration globale"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tolérance (jours)</Label>
              <Input
                type="number"
                value={formData.tolerance_jours || 7}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  tolerance_jours: parseInt(e.target.value) || 7 
                }))}
                min="0"
              />
            </div>
            <div>
              <Label>Seuil d'alerte rotation (jours)</Label>
              <Input
                type="number"
                value={formData.seuil_alerte_rotation || 30}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  seuil_alerte_rotation: parseInt(e.target.value) || 30 
                }))}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Activer FIFO</Label>
              <Switch
                checked={formData.activer_fifo}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  activer_fifo: checked 
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ignorer les lots expirés</Label>
              <Switch
                checked={formData.ignorer_lots_expires}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  ignorer_lots_expires: checked 
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Priorité au prix</Label>
              <Switch
                checked={formData.priorite_prix}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  priorite_prix: checked 
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Actions automatiques</Label>
              <Switch
                checked={formData.action_automatique}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  action_automatique: checked 
                }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

// Analytics Component
const FIFOAnalytics = ({ configurations }: { configurations: any[] }) => {
  const activeConfigs = configurations.filter(c => c.actif);
  const inactiveConfigs = configurations.filter(c => !c.actif);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analyse des Configurations FIFO</CardTitle>
          <CardDescription>
            Vue d'ensemble de l'utilisation et de l'efficacité des règles FIFO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold">Répartition par Type</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Par Produit:</span>
                  <span className="font-medium">
                    {configurations.filter(c => c.produit_id).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Par Famille:</span>
                  <span className="font-medium">
                    {configurations.filter(c => c.famille_id && !c.produit_id).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Globales:</span>
                  <span className="font-medium">
                    {configurations.filter(c => !c.produit_id && !c.famille_id).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Statut d'Activation</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Actives:</span>
                  <span className="font-medium text-green-600">
                    {activeConfigs.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Inactives:</span>
                  <span className="font-medium text-red-600">
                    {inactiveConfigs.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Taux d'activation:</span>
                  <span className="font-medium">
                    {configurations.length > 0 
                      ? Math.round((activeConfigs.length / configurations.length) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Paramètres Moyens</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Tolérance moyenne:</span>
                  <span className="font-medium">
                    {activeConfigs.length > 0 
                      ? Math.round(activeConfigs.reduce((sum, c) => sum + (c.tolerance_delai_jours || 7), 0) / activeConfigs.length)
                      : 0} jours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Délai alerte moyen:</span>
                  <span className="font-medium">
                    {activeConfigs.length > 0 
                      ? Math.round(activeConfigs.reduce((sum, c) => sum + (c.delai_alerte_jours || 30), 0) / activeConfigs.length)
                      : 0} jours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Actions automatiques:</span>
                  <span className="font-medium">
                    {activeConfigs.filter(c => c.action_automatique).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommandations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {configurations.length === 0 && (
              <div className="flex items-center gap-2 text-blue-600">
                <Info className="h-4 w-4" />
                <span className="text-sm">
                  Commencez par créer une configuration globale pour établir les règles FIFO de base.
                </span>
              </div>
            )}
            {inactiveConfigs.length > activeConfigs.length && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Vous avez plus de configurations inactives qu'actives. Considérez activer ou supprimer les configurations inutiles.
                </span>
              </div>
            )}
            {activeConfigs.filter(c => c.action_automatique).length === 0 && activeConfigs.length > 0 && (
              <div className="flex items-center gap-2 text-blue-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">
                  Aucune action automatique configurée. Activez les actions automatiques pour optimiser la gestion FIFO.
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};