import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUp, Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ExcelParserService } from '@/services/ExcelParserService';
import { AutoOrderCreationService } from '@/services/AutoOrderCreationService';
import type { ExcelReceptionLine, ParseResult, ValidationResult } from '@/types/excelImport';
import type { Reception } from '@/hooks/useReceptions';

interface ReceptionExcelImportProps {
  suppliers: any[];
  orders: any[];
  onCreateReception: (receptionData: any) => Promise<any>;
  loading: boolean;
}

const ReceptionExcelImport: React.FC<ReceptionExcelImportProps> = ({
  suppliers,
  orders,
  onCreateReception,
  loading
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [bonLivraison, setBonLivraison] = useState<string>('');
  const [selectedForCatalog, setSelectedForCatalog] = useState<Set<number>>(new Set());
  const [addingToCatalog, setAddingToCatalog] = useState(false);

  // Liste des produits avec erreur "product_not_found"
  const productNotFoundLines = React.useMemo(() => {
    if (!validationResult || !parseResult) return [];
    return parseResult.lines.filter(line => 
      validationResult.errors.some(
        e => e.rowNumber === line.rowNumber && e.type === 'product_not_found'
      )
    );
  }, [validationResult, parseResult]);

  // Fonction pour sélectionner/désélectionner tous les produits non trouvés
  const handleSelectAll = () => {
    if (selectedForCatalog.size === productNotFoundLines.length) {
      // Tout désélectionner
      setSelectedForCatalog(new Set());
    } else {
      // Tout sélectionner
      const allRowNumbers = new Set(productNotFoundLines.map(l => l.rowNumber));
      setSelectedForCatalog(allRowNumbers);
    }
  };

  const allSelected = productNotFoundLines.length > 0 && 
                      selectedForCatalog.size === productNotFoundLines.length;

  // Filtrer les commandes avec statut "Livré" ou "Validé"
  const filteredOrders = orders.filter(
    o => o.statut === 'Livré' || o.statut === 'Validé'
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      toast.error('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 10 MB)');
      return;
    }

    setFile(selectedFile);
    await parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    setParsing(true);
    setParseResult(null);
    setValidationResult(null);

    try {
      const result = await ExcelParserService.parseExcelFile(file);
      setParseResult(result);

      if (result.bonLivraison) {
        setBonLivraison(result.bonLivraison);
      }

      if (result.success && result.lines.length > 0) {
        toast.success(`${result.lines.length} lignes importées avec succès`);
        
        // Lancer automatiquement la validation si un fournisseur est sélectionné
        if (selectedSupplierId) {
          await validateData(result.lines);
        }
      } else if (result.errors.length > 0) {
        toast.error(`Erreurs lors du parsing : ${result.errors.length} erreur(s)`);
      }
    } catch (error) {
      console.error('Erreur lors du parsing:', error);
      toast.error('Erreur lors de la lecture du fichier');
    } finally {
      setParsing(false);
    }
  };

  const validateData = async (lines: ExcelReceptionLine[]) => {
    if (!selectedSupplierId) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    setValidating(true);
    try {
      const result = await ExcelParserService.validateReceptionData(lines, selectedSupplierId);
      setValidationResult(result);

      if (result.isValid) {
        toast.success(`Validation réussie : ${result.validLines.length} lignes validées`);
      } else {
        toast.warning(
          `Validation terminée avec ${result.errors.length} erreur(s) et ${result.warnings.length} avertissement(s)`
        );
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation des données');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSupplierId) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    if (!validationResult || validationResult.validLines.length === 0) {
      toast.error('Aucune ligne valide à importer');
      return;
    }

    try {
      let orderId = selectedOrderId;
      let isAutoCreated = false;

      // Si aucune commande n'est sélectionnée, en créer une automatiquement
      if (!orderId) {
        toast.info('Création automatique de la commande...');
        const orderResult = await AutoOrderCreationService.createOrderFromExcelData(
          selectedSupplierId,
          validationResult.validLines,
          validationResult.productMatches
        );
        orderId = orderResult.orderId;
        isAutoCreated = true;
        toast.success(`Commande ${orderResult.orderNumber} créée automatiquement`);
      }

      // Préparer les lignes de réception
      const lignes = validationResult.validLines.map(line => ({
        produit_id: line.produitId!,
        quantite_commandee: line.quantiteCommandee,
        quantite_recue: line.quantiteRecue,
        quantite_acceptee: line.quantiteAcceptee,
        prix_achat_reel: line.prixAchatReel,
        numero_lot: line.numeroLot,
        date_expiration: line.dateExpiration,
        statut: line.statut
      }));

      // Créer la réception
      const receptionData = {
        fournisseur_id: selectedSupplierId,
        commande_id: orderId || undefined,
        date_reception: new Date().toISOString(),
        reference_facture: bonLivraison,
        isValidated: true,
        lignes
      };

      await onCreateReception(receptionData as any);

      // Mettre à jour le statut de la commande (qu'elle soit créée automatiquement ou existante)
      if (orderId) {
        await AutoOrderCreationService.updateOrderStatus(orderId, 'Réceptionné');
        toast.success(
          isAutoCreated 
            ? 'Commande créée et réceptionnée avec succès'
            : 'Commande mise à jour avec le statut Réceptionné'
        );
      }

      toast.success('Réception créée et validée avec succès');

      // Réinitialiser le formulaire
      setFile(null);
      setParseResult(null);
      setValidationResult(null);
      setBonLivraison('');
      setSelectedOrderId('');
      setSelectedForCatalog(new Set());
    } catch (error) {
      console.error('Erreur lors de la création de la réception:', error);
      toast.error('Erreur lors de la création de la réception');
    }
  };

  const handleAddProductsToCatalog = async () => {
    if (selectedForCatalog.size === 0) return;
    
    setAddingToCatalog(true);
    try {
      // Récupérer le tenant_id
      const { data: user } = await supabase.auth.getUser();
      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user?.id)
        .single();

      if (!personnel) {
        toast.error('Personnel non trouvé');
        return;
      }

      const linesToAdd = parseResult?.lines.filter(l => 
        selectedForCatalog.has(l.rowNumber)
      ) || [];

      let created = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const line of linesToAdd) {
        const normalizedCip = String(line.reference).trim();
        const normalizedName = String(line.produit).trim();

        // Vérifier si le produit existe déjà par code_cip
        const { data: existing } = await supabase
          .from('produits')
          .select('id')
          .eq('tenant_id', personnel.tenant_id)
          .eq('code_cip', normalizedCip)
          .maybeSingle();

        if (existing) {
          skipped++;
          errors.push(`"${normalizedName}" (CIP: ${normalizedCip}) existe déjà`);
          continue;
        }

        const { error } = await supabase
          .from('produits')
          .insert({
            tenant_id: personnel.tenant_id,
            libelle_produit: normalizedName,
            code_cip: normalizedCip,
            prix_achat: line.prixAchatReel,
            categorie_tarification_id: '52e236fb-9bf7-4709-bcb0-d8abb4b44db6',
            is_active: true
          });

        if (error) {
          errors.push(`Erreur pour "${normalizedName}": ${error.message}`);
        } else {
          created++;
        }
      }

      // Afficher les résultats
      if (created > 0) {
        toast.success(`${created} produit(s) ajouté(s) au catalogue`);
      }
      if (skipped > 0) {
        toast.warning(`${skipped} produit(s) ignoré(s) (déjà existants)`);
      }
      if (errors.length > 0 && created === 0 && skipped === 0) {
        toast.error(`Erreurs: ${errors.slice(0, 3).join(', ')}`);
      }

      setSelectedForCatalog(new Set());

      // Re-valider les données pour actualiser les statuts
      if (parseResult?.lines) {
        await validateData(parseResult.lines);
      }

    } catch (error) {
      console.error('Erreur lors de l\'ajout des produits:', error);
      toast.error('Erreur lors de l\'ajout des produits au catalogue');
    } finally {
      setAddingToCatalog(false);
    }
  };

  const getStatusBadge = (line: ExcelReceptionLine) => {
    const hasError = validationResult?.errors.some(e => e.rowNumber === line.rowNumber);
    const hasWarning = validationResult?.warnings.some(w => w.rowNumber === line.rowNumber);

    if (hasError) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erreur</Badge>;
    }
    if (hasWarning) {
      return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Attention</Badge>;
    }
    return <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Valide</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Import Excel - Réception de Marchandises
          </CardTitle>
          <CardDescription>
            Importez un fichier Excel/CSV depuis votre fournisseur pour créer automatiquement une réception
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 1: Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1️⃣ Informations de base</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Fournisseur *</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Commande (facultatif)</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger id="order">
                    <SelectValue placeholder="Aucune commande (création automatique)" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOrders.map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        Commande du {new Date(order.date_commande).toLocaleDateString()} - {order.statut}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonLivraison">Bon de livraison</Label>
                <Input
                  id="bonLivraison"
                  value={bonLivraison}
                  onChange={(e) => setBonLivraison(e.target.value)}
                  placeholder="Auto-rempli depuis Excel"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Upload fichier */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2️⃣ Fichier Excel</h3>
            
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-sm text-muted-foreground mb-2">
                  Glissez votre fichier Excel ici ou cliquez pour parcourir
                </div>
                <div className="text-xs text-muted-foreground">
                  Formats acceptés : .xlsx, .csv | Taille max : 10 MB
                </div>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {file && (
                <div className="mt-4 text-sm">
                  <Badge variant="outline">📄 {file.name}</Badge>
                  {parsing && <span className="ml-2 text-muted-foreground">Parsing en cours...</span>}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Résultats du parsing */}
          {parseResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">3️⃣ Résultats</h3>
                {parseResult.lines.length > 0 && selectedSupplierId && (
                  <Button
                    onClick={() => validateData(parseResult.lines)}
                    disabled={validating}
                    variant="outline"
                  >
                    {validating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validation...
                      </>
                    ) : (
                      '⚙️ Valider les données'
                    )}
                  </Button>
                )}
              </div>

              {/* Alertes d'erreurs/warnings */}
              {parseResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erreurs de parsing ({parseResult.errors.length})</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm mt-2">
                      {parseResult.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>Ligne {err.rowNumber} - {err.column}: {err.message}</li>
                      ))}
                      {parseResult.errors.length > 5 && (
                        <li>... et {parseResult.errors.length - 5} autre(s) erreur(s)</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult && (
                <>
                  {validationResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Erreurs de validation ({validationResult.errors.length})</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside text-sm mt-2">
                          {validationResult.errors.slice(0, 5).map((err, idx) => (
                            <li key={idx}>
                              Ligne {err.rowNumber} - {err.reference}: {err.message}
                            </li>
                          ))}
                          {validationResult.errors.length > 5 && (
                            <li>... et {validationResult.errors.length - 5} autre(s) erreur(s)</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Avertissements ({validationResult.warnings.length})</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside text-sm mt-2">
                          {validationResult.warnings.slice(0, 3).map((warn, idx) => (
                            <li key={idx}>
                              Ligne {warn.rowNumber} - {warn.reference}: {warn.message}
                            </li>
                          ))}
                          {validationResult.warnings.length > 3 && (
                            <li>... et {validationResult.warnings.length - 3} autre(s) avertissement(s)</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationResult.validLines.length > 0 && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>
                        ✅ {validationResult.validLines.length} ligne(s) validée(s) sur {parseResult?.lines.length || 0} total
                      </AlertTitle>
                      <AlertDescription>
                        Les données sont prêtes à être importées
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Bloc d'ajout de produits au catalogue */}
                  {validationResult?.errors.some(e => e.type === 'product_not_found') && (
                    <div className="flex flex-col gap-3 p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        <PlusCircle className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {selectedForCatalog.size} / {productNotFoundLines.length} produit(s) sélectionné(s) pour ajout
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Catégorie : MEDICAMENTS
                          </p>
                        </div>
                        <Button
                          onClick={handleSelectAll}
                          variant="outline"
                          size="sm"
                        >
                          {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </Button>
                        <Button
                          onClick={handleAddProductsToCatalog}
                          disabled={selectedForCatalog.size === 0 || addingToCatalog}
                          size="sm"
                        >
                          {addingToCatalog ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Ajout en cours...
                            </>
                          ) : (
                            <>
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Ajouter au catalogue
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tableau de prévisualisation */}
              {parseResult.lines.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                <TableHead className="w-[50px]">
                  {productNotFoundLines.length > 0 && (
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Sélectionner tous les produits non trouvés"
                    />
                  )}
                </TableHead>
                          <TableHead className="w-[80px]">Statut</TableHead>
                          <TableHead>Référence</TableHead>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-right">Commandé</TableHead>
                          <TableHead className="text-right">Reçu</TableHead>
                          <TableHead className="text-right">Accepté</TableHead>
                          <TableHead className="text-right">Prix</TableHead>
                          <TableHead>Lot</TableHead>
                          <TableHead>Expiration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parseResult.lines.map((line, idx) => {
                          const hasProductNotFoundError = validationResult?.errors.some(
                            e => e.rowNumber === line.rowNumber && e.type === 'product_not_found'
                          );
                          
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                {hasProductNotFoundError ? (
                                  <Checkbox
                                    checked={selectedForCatalog.has(line.rowNumber)}
                                    onCheckedChange={(checked) => {
                                      const newSet = new Set(selectedForCatalog);
                                      if (checked) {
                                        newSet.add(line.rowNumber);
                                      } else {
                                        newSet.delete(line.rowNumber);
                                      }
                                      setSelectedForCatalog(newSet);
                                    }}
                                  />
                                ) : null}
                              </TableCell>
                              <TableCell>{validationResult ? getStatusBadge(line) : '-'}</TableCell>
                              <TableCell className="font-mono text-sm">{line.reference}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{line.produit}</TableCell>
                              <TableCell className="text-right">{line.quantiteCommandee}</TableCell>
                              <TableCell className="text-right">{line.quantiteRecue}</TableCell>
                              <TableCell className="text-right">{line.quantiteAcceptee}</TableCell>
                              <TableCell className="text-right">{line.prixAchatReel.toFixed(2)}</TableCell>
                              <TableCell>{line.numeroLot}</TableCell>
                              <TableCell>{line.dateExpiration}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Actions */}
          {validationResult && validationResult.validLines.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">4️⃣ Actions</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setFile(null);
                    setParseResult(null);
                    setValidationResult(null);
                  }}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || validationResult.validLines.length === 0}
                  className="ml-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Valider la réception ({validationResult.validLines.length} lignes)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceptionExcelImport;
