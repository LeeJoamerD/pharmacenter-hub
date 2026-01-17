import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Upload, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Info,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface GlobalAccountingPlanImportProps {
  onSuccess: () => void;
}

interface ParsedAccount {
  numero_compte: string;
  libelle_compte: string;
  classe: number;
  niveau: number;
  compte_parent_numero: string | null;
  type_compte: string | null;
  est_nouveau_syscohada: boolean;
  est_modifie_syscohada: boolean;
  est_compte_flux_tresorerie: boolean;
}

interface ImportStats {
  total: number;
  inserted: number;
  updated: number;
  errors: number;
}

const GlobalAccountingPlanImport: React.FC<GlobalAccountingPlanImportProps> = ({ onSuccess }) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedAccounts, setParsedAccounts] = useState<ParsedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: plans } = useQuery({
    queryKey: ['plans-comptables-globaux'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans_comptables_globaux')
        .select('id, code, nom')
        .eq('is_active', true)
        .order('nom');

      if (error) throw error;
      return data;
    },
  });

  const determineAccountLevel = (numeroCompte: string): number => {
    const len = numeroCompte.length;
    if (len <= 2) return 1; // Classe/Compte principal (10, 11, etc.)
    if (len === 3) return 2; // Sous-compte (101, 102, etc.)
    if (len === 4) return 3; // Sous-sous-compte (1011, 1012, etc.)
    return 4; // Détail (10111, etc.)
  };

  const determineParentAccount = (numeroCompte: string): string | null => {
    if (numeroCompte.length <= 2) return null;
    return numeroCompte.slice(0, -1);
  };

  const determineAccountType = (classe: number): string | null => {
    switch (classe) {
      case 1: return 'Passif';
      case 2: case 3: case 5: return 'Actif';
      case 4: return 'Actif'; // Mixed but mostly Actif
      case 6: return 'Charge';
      case 7: return 'Produit';
      case 8: return 'Resultat';
      case 9: return 'HorsBilan';
      default: return null;
    }
  };

  const parseExcelFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setParsedAccounts([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to array of arrays
      const rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
      
      const accounts: ParsedAccount[] = [];
      
      // Skip header rows and parse accounts
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        // Check each column for account numbers (SYSCOHADA format has multiple columns)
        for (let j = 0; j < Math.min(row.length, 4); j++) {
          const cell = row[j];
          if (!cell) continue;

          const cellStr = String(cell).trim();
          
          // Check if this is a valid account number (starts with 1-9, all digits)
          if (/^[1-9]\d*$/.test(cellStr) && cellStr.length >= 2 && cellStr.length <= 6) {
            // The label is typically in the next non-empty column
            let libelle = '';
            for (let k = j + 1; k < row.length; k++) {
              if (row[k] && String(row[k]).trim()) {
                libelle = String(row[k]).trim();
                break;
              }
            }

            if (!libelle) continue;

            const classe = parseInt(cellStr[0]);
            const niveau = determineAccountLevel(cellStr);
            
            // Check for markers (usually color-coded in the source)
            const rowStr = row.join(' ').toLowerCase();
            const isNew = rowStr.includes('créés lors') || rowStr.includes('nouveau');
            const isModified = rowStr.includes('modifié');
            const isFlux = rowStr.includes('flux de trésorerie');

            accounts.push({
              numero_compte: cellStr,
              libelle_compte: libelle.replace(/\s+/g, ' '),
              classe,
              niveau,
              compte_parent_numero: determineParentAccount(cellStr),
              type_compte: determineAccountType(classe),
              est_nouveau_syscohada: isNew,
              est_modifie_syscohada: isModified,
              est_compte_flux_tresorerie: isFlux,
            });

            break; // Only process first valid account number per row
          }
        }
      }

      // Remove duplicates (keep first occurrence)
      const seen = new Set<string>();
      const uniqueAccounts = accounts.filter(acc => {
        if (seen.has(acc.numero_compte)) return false;
        seen.add(acc.numero_compte);
        return true;
      });

      // Sort by account number
      uniqueAccounts.sort((a, b) => a.numero_compte.localeCompare(b.numero_compte));

      setParsedAccounts(uniqueAccounts);
      
      if (uniqueAccounts.length === 0) {
        setError('Aucun compte valide trouvé dans le fichier. Vérifiez le format.');
      }
    } catch (err) {
      console.error('Error parsing Excel:', err);
      setError('Erreur lors de la lecture du fichier Excel');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcelFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!selectedPlanId || parsedAccounts.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    setError(null);

    const stats: ImportStats = { total: parsedAccounts.length, inserted: 0, updated: 0, errors: 0 };
    const batchSize = 50;

    try {
      for (let i = 0; i < parsedAccounts.length; i += batchSize) {
        const batch = parsedAccounts.slice(i, i + batchSize);
        
        const accountsToUpsert = batch.map(acc => ({
          plan_comptable_id: selectedPlanId,
          numero_compte: acc.numero_compte,
          libelle_compte: acc.libelle_compte,
          classe: acc.classe,
          niveau: acc.niveau,
          compte_parent_numero: acc.compte_parent_numero,
          type_compte: acc.type_compte,
          est_nouveau_syscohada: acc.est_nouveau_syscohada,
          est_modifie_syscohada: acc.est_modifie_syscohada,
          est_compte_flux_tresorerie: acc.est_compte_flux_tresorerie,
          is_active: true,
        }));

        const { data, error } = await supabase
          .from('comptes_globaux')
          .upsert(accountsToUpsert, {
            onConflict: 'plan_comptable_id,numero_compte',
            ignoreDuplicates: false,
          })
          .select('id');

        if (error) {
          console.error('Upsert error:', error);
          stats.errors += batch.length;
        } else {
          stats.inserted += data?.length || 0;
        }

        setImportProgress(Math.round(((i + batch.length) / parsedAccounts.length) * 100));
      }

      setImportStats(stats);
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['comptes-globaux'] });
      await queryClient.invalidateQueries({ queryKey: ['comptes-globaux-counts'] });

      if (stats.errors === 0) {
        toast.success(`${stats.inserted} comptes importés avec succès`);
        onSuccess();
      } else {
        toast.warning(`Import terminé avec ${stats.errors} erreurs`);
      }
    } catch (err) {
      console.error('Import error:', err);
      setError('Erreur lors de l\'import des comptes');
      toast.error('Erreur lors de l\'import');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['N° Compte', 'Libellé', 'Classe', 'Type'],
      ['10', 'CAPITAL', '1', 'Passif'],
      ['101', 'CAPITAL SOCIAL', '1', 'Passif'],
      ['1011', 'Capital souscrit, non appelé', '1', 'Passif'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plan Comptable');
    XLSX.writeFile(wb, 'template_plan_comptable.xlsx');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer un Plan Comptable
          </CardTitle>
          <CardDescription>
            Importez des comptes depuis un fichier Excel (format SYSCOHADA ou personnalisé)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Selection */}
          <div className="space-y-2">
            <Label>Plan comptable cible</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un plan comptable" />
              </SelectTrigger>
              <SelectContent>
                {plans?.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.nom} ({plan.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Fichier Excel</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isLoading || isImporting}
              />
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Modèle
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analyse du fichier en cours...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {parsedAccounts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <span className="font-medium">{parsedAccounts.length} comptes détectés</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(classe => {
                    const count = parsedAccounts.filter(a => a.classe === classe).length;
                    if (count === 0) return null;
                    return (
                      <Badge key={classe} variant="outline">
                        C{classe}: {count}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="border rounded-lg max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">N° Compte</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead className="w-[80px]">Classe</TableHead>
                      <TableHead className="w-[80px]">Niveau</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedAccounts.slice(0, 50).map((acc, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{acc.numero_compte}</TableCell>
                        <TableCell>{acc.libelle_compte}</TableCell>
                        <TableCell>{acc.classe}</TableCell>
                        <TableCell>{acc.niveau}</TableCell>
                      </TableRow>
                    ))}
                    {parsedAccounts.length > 50 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          ... et {parsedAccounts.length - 50} autres comptes
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Import en cours...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          )}

          {/* Import Stats */}
          {importStats && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Import terminé</AlertTitle>
              <AlertDescription>
                {importStats.inserted} comptes importés sur {importStats.total}
                {importStats.errors > 0 && ` (${importStats.errors} erreurs)`}
              </AlertDescription>
            </Alert>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!selectedPlanId || parsedAccounts.length === 0 || isImporting}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importer {parsedAccounts.length} comptes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Format attendu</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Le fichier Excel doit contenir les colonnes suivantes :</p>
          <ul className="list-disc list-inside text-sm">
            <li>Numéro de compte (2-6 chiffres, ex: 10, 101, 1011)</li>
            <li>Libellé du compte</li>
            <li>Optionnel : Classe, Type de compte</li>
          </ul>
          <p className="text-xs mt-2">
            Le système détecte automatiquement la hiérarchie et le type de compte.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default GlobalAccountingPlanImport;
