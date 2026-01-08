import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  FileSpreadsheet, 
  Save, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Settings2,
  Loader2,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useSupplierExcelMappings } from '@/hooks/useSupplierExcelMappings';
import { 
  EXCEL_COLUMNS, 
  RECEPTION_TABLE_FIELDS,
  type ExcelColumnMapping,
  type ExcelColumnLetter,
  type ReceptionFieldKey 
} from '@/types/excelMapping';

const ExcelMappingConfig: React.FC = () => {
  const { tenantId } = useTenant();
  const { mappings, loading, createMapping, updateMapping, deleteMapping } = useSupplierExcelMappings();
  
  const [suppliers, setSuppliers] = useState<{ id: string; nom: string }[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [currentMapping, setCurrentMapping] = useState<Record<ExcelColumnLetter, ReceptionFieldKey | ''>>({} as any);
  const [existingMappingId, setExistingMappingId] = useState<string | null>(null);
  const [existingMappingIsOwner, setExistingMappingIsOwner] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  // Charger les fournisseurs actifs
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!tenantId) return;
      
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('id, nom')
        .eq('tenant_id', tenantId)
        .eq('statut', 'actif')
        .order('nom');

      if (error) {
        console.error('Erreur chargement fournisseurs:', error);
        return;
      }
      setSuppliers(data || []);
    };

    fetchSuppliers();
  }, [tenantId]);

  // Initialiser le mapping vide
  const initializeEmptyMapping = () => {
    const empty: Record<ExcelColumnLetter, ReceptionFieldKey | ''> = {} as any;
    EXCEL_COLUMNS.forEach(letter => {
      empty[letter] = '';
    });
    return empty;
  };

  // Charger le mapping existant quand un fournisseur est sélectionné
  useEffect(() => {
    if (!selectedSupplierId) {
      setCurrentMapping(initializeEmptyMapping());
      setExistingMappingId(null);
      setExistingMappingIsOwner(true);
      return;
    }

    const existingMapping = mappings.find(m => m.fournisseur_id === selectedSupplierId);
    
    if (existingMapping) {
      setExistingMappingId(existingMapping.id);
      setExistingMappingIsOwner(existingMapping.isOwner ?? true);
      
      // Reconstruire le mapping inversé (field -> letter devient letter -> field)
      const reversedMapping = initializeEmptyMapping();
      const config = existingMapping.mapping_config;
      
      Object.entries(config).forEach(([field, letter]) => {
        if (letter && EXCEL_COLUMNS.includes(letter as ExcelColumnLetter)) {
          reversedMapping[letter as ExcelColumnLetter] = field as ReceptionFieldKey;
        }
      });
      
      setCurrentMapping(reversedMapping);
    } else {
      setCurrentMapping(initializeEmptyMapping());
      setExistingMappingId(null);
      setExistingMappingIsOwner(true);
    }
  }, [selectedSupplierId, mappings]);

  // Mettre à jour le mapping pour une lettre
  const handleMappingChange = (letter: ExcelColumnLetter, field: ReceptionFieldKey | '') => {
    setCurrentMapping(prev => ({
      ...prev,
      [letter]: field
    }));
  };

  // Convertir le mapping (letter -> field) vers le format DB (field -> letter)
  const convertMappingToDbFormat = (): ExcelColumnMapping => {
    const dbMapping: ExcelColumnMapping = {};
    
    Object.entries(currentMapping).forEach(([letter, field]) => {
      if (field) {
        (dbMapping as any)[field] = letter;
      }
    });
    
    return dbMapping;
  };

  // Sauvegarder le mapping
  const handleSave = async () => {
    if (!selectedSupplierId) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    // Vérifier qu'au moins CIP et Prix sont mappés
    const dbMapping = convertMappingToDbFormat();
    if (!dbMapping.cip) {
      toast.error('Le mapping de la colonne CIP/EAN13 est obligatoire');
      return;
    }

    setSaving(true);
    try {
      if (existingMappingId) {
        await updateMapping(existingMappingId, dbMapping);
      } else {
        await createMapping(selectedSupplierId, dbMapping);
      }
    } finally {
      setSaving(false);
    }
  };

  // Réinitialiser le mapping
  const handleReset = () => {
    setCurrentMapping(initializeEmptyMapping());
  };

  // Supprimer le mapping
  const handleDelete = async () => {
    if (!existingMappingId) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce mapping ?')) {
      await deleteMapping(existingMappingId);
      setSelectedSupplierId('');
    }
  };

  // Vérifier les champs utilisés
  const usedFields = useMemo(() => {
    return new Set(Object.values(currentMapping).filter(v => v !== ''));
  }, [currentMapping]);

  // Compter les mappings configurés
  const configuredCount = usedFields.size;

  // Fournisseur sélectionné
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Configuration des Mappings Excel
          </CardTitle>
          <CardDescription>
            Configurez la correspondance entre les colonnes des fichiers Excel de chaque fournisseur 
            et les champs du tableau de réception.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Sélection du fournisseur */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Sélectionner un fournisseur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un fournisseur..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => {
                    const hasMapping = mappings.some(m => m.fournisseur_id === supplier.id);
                    return (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div className="flex items-center gap-2">
                          <span>{supplier.nom}</span>
                          {hasMapping && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Configuré
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            {existingMappingId && (
              <Badge 
                variant="outline" 
                className={existingMappingIsOwner 
                  ? "bg-green-50 text-green-700 border-green-200" 
                  : "bg-blue-50 text-blue-700 border-blue-200"
                }
              >
                {existingMappingIsOwner ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Votre mapping
                  </>
                ) : (
                  <>
                    <Share2 className="h-3 w-3 mr-1" />
                    Mapping partagé
                  </>
                )}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grille de mapping */}
      {selectedSupplierId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Mapping pour: <span className="text-primary">{selectedSupplier?.nom}</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Associez chaque lettre de colonne Excel au champ correspondant du tableau de réception
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {configuredCount} / {RECEPTION_TABLE_FIELDS.length} champs configurés
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Comment ça marche ?</AlertTitle>
              <AlertDescription>
                Pour chaque lettre de colonne (A à T) de votre fichier Excel, sélectionnez le champ 
                correspondant du tableau de réception. Les champs obligatoires sont : CIP/EAN13.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-24 text-center font-semibold">Colonne Excel</TableHead>
                    <TableHead className="font-semibold">Champ du tableau</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EXCEL_COLUMNS.map((letter) => {
                    const currentField = currentMapping[letter];
                    return (
                      <TableRow key={letter} className="hover:bg-muted/30">
                        <TableCell className="text-center">
                          <Badge 
                            variant={currentField ? "default" : "outline"}
                            className={`w-10 justify-center font-mono text-base ${
                              currentField ? 'bg-primary' : ''
                            }`}
                          >
                            {letter}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={currentField || 'none'} 
                            onValueChange={(value) => handleMappingChange(letter, value === 'none' ? '' : value as ReceptionFieldKey)}
                          >
                            <SelectTrigger className="w-full max-w-xs">
                              <SelectValue placeholder="— Aucun —" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="text-muted-foreground">— Aucun —</span>
                              </SelectItem>
                              {RECEPTION_TABLE_FIELDS.map(field => {
                                const isUsed = usedFields.has(field.key) && currentField !== field.key;
                                return (
                                  <SelectItem 
                                    key={field.key} 
                                    value={field.key}
                                    disabled={isUsed}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{field.label}</span>
                                      {isUsed && (
                                        <span className="text-xs text-muted-foreground">(déjà utilisé)</span>
                                      )}
                                      {field.key === 'cip' && (
                                        <Badge variant="destructive" className="text-[10px] h-4">Requis</Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Separator className="my-4" />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {existingMappingId && existingMappingIsOwner && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleReset}
                  disabled={!existingMappingIsOwner && existingMappingId !== null}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
              
              {!existingMappingIsOwner && existingMappingId && (
                <Badge variant="secondary" className="text-xs">
                  <Info className="h-3 w-3 mr-1" />
                  Mapping en lecture seule
                </Badge>
              )}
              
              {existingMappingIsOwner && (
                <Button 
                  onClick={handleSave}
                  disabled={saving || configuredCount === 0}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {existingMappingId ? 'Mettre à jour' : 'Enregistrer'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des mappings existants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mappings configurés</CardTitle>
          <CardDescription>
            Liste des fournisseurs avec un mapping de colonnes Excel configuré
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun mapping configuré</p>
              <p className="text-sm">Sélectionnez un fournisseur ci-dessus pour créer un mapping</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Créé par</TableHead>
                    <TableHead>Champs configurés</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière modification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map(mapping => {
                    const fieldCount = Object.keys(mapping.mapping_config).filter(k => 
                      (mapping.mapping_config as any)[k]
                    ).length;
                    const hasCip = !!(mapping.mapping_config as any).cip;
                    
                    return (
                      <TableRow 
                        key={mapping.id}
                        className={`cursor-pointer hover:bg-muted/50 ${
                          selectedSupplierId === mapping.fournisseur_id ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedSupplierId(mapping.fournisseur_id)}
                      >
                        <TableCell className="font-medium">
                          {mapping.fournisseur?.nom || 'Fournisseur inconnu'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{mapping.creatorName}</span>
                            {mapping.isOwner ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                Vous
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <Share2 className="h-3 w-3 mr-1" />
                                Partagé
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{fieldCount} champs</Badge>
                        </TableCell>
                        <TableCell>
                          {hasCip ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Valide
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Incomplet
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(mapping.updated_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExcelMappingConfig;
