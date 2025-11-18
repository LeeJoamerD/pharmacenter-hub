import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileUp, Upload, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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

  // Filtrer les commandes du fournisseur sélectionné avec statut "Livré"
  const filteredOrders = orders.filter(
    o => o.fournisseur_id === selectedSupplierId && (o.statut === 'Livré' || o.statut === 'Validé')
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

      // Si aucune commande n'est sélectionnée, en créer une automatiquement
      if (!orderId) {
        toast.info('Création automatique de la commande...');
        const orderResult = await AutoOrderCreationService.createOrderFromExcelData(
          selectedSupplierId,
          validationResult.validLines,
          validationResult.productMatches
        );
        orderId = orderResult.orderId;
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
        statut: 'Validé' as const,
        lignes
      };

      await onCreateReception(receptionData as any);

      // Si une commande existante a été sélectionnée, mettre à jour son statut
      if (selectedOrderId) {
        await AutoOrderCreationService.updateOrderStatus(selectedOrderId, 'Réceptionné');
      }

      toast.success('Réception créée et validée avec succès');

      // Réinitialiser le formulaire
      setFile(null);
      setParseResult(null);
      setValidationResult(null);
      setBonLivraison('');
      setSelectedOrderId('');
    } catch (error) {
      console.error('Erreur lors de la création de la réception:', error);
      toast.error('Erreur lors de la création de la réception');
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
                        {supplier.nom_fournisseur}
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
                        ✅ {validationResult.validLines.length} ligne(s) validée(s)
                      </AlertTitle>
                      <AlertDescription>
                        Les données sont prêtes à être importées
                      </AlertDescription>
                    </Alert>
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
                        {parseResult.lines.map((line, idx) => (
                          <TableRow key={idx}>
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
                        ))}
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
