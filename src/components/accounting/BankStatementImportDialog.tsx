import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import * as XLSX from 'xlsx';

interface BankStatementImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccounts: any[];
  onImport: (transactions: any[]) => Promise<void>;
}

interface ParsedTransaction {
  date_transaction: string;
  libelle: string;
  montant: number;
  type_transaction: 'credit' | 'debit';
  reference_externe?: string;
  valid: boolean;
  error?: string;
}

export function BankStatementImportDialog({
  open,
  onOpenChange,
  bankAccounts,
  onImport
}: BankStatementImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, errors: 0 });
  const [parseError, setParseError] = useState<string | null>(null);

  const { formatAmount } = useCurrencyFormatting();

  const resetDialog = useCallback(() => {
    setStep('upload');
    setFile(null);
    setSelectedAccountId('');
    setParsedData([]);
    setImportProgress(0);
    setImportResults({ success: 0, errors: 0 });
    setParseError(null);
  }, []);

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const parseDate = (value: any): string | null => {
    if (!value) return null;
    
    // Handle Excel date serial numbers
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }
    
    // Handle string dates
    const strValue = String(value).trim();
    
    // Try different date formats
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = strValue.match(format);
      if (match) {
        if (format === formats[0]) {
          return strValue;
        } else {
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }
    
    // Try parsing as Date
    const parsed = new Date(strValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    
    return null;
  };

  const parseAmount = (value: any): { montant: number; type: 'credit' | 'debit' } | null => {
    if (value === null || value === undefined || value === '') return null;
    
    let numValue: number;
    
    if (typeof value === 'number') {
      numValue = value;
    } else {
      // Clean string: remove spaces, replace comma with dot
      const cleaned = String(value)
        .replace(/\s/g, '')
        .replace(',', '.')
        .replace(/[^\d.-]/g, '');
      numValue = parseFloat(cleaned);
    }
    
    if (isNaN(numValue)) return null;
    
    return {
      montant: Math.abs(numValue),
      type: numValue >= 0 ? 'credit' : 'debit'
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setParseError(null);
    
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length < 2) {
        setParseError("Le fichier ne contient pas assez de données");
        return;
      }
      
      // Find headers (first row)
      const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
      
      // Map column indices
      const dateIndex = headers.findIndex((h: string) => 
        h.includes('date') || h === 'date_transaction'
      );
      const libelleIndex = headers.findIndex((h: string) => 
        h.includes('libelle') || h.includes('libellé') || h.includes('description') || h.includes('label')
      );
      const montantIndex = headers.findIndex((h: string) => 
        h.includes('montant') || h.includes('amount') || h.includes('somme')
      );
      const referenceIndex = headers.findIndex((h: string) => 
        h.includes('reference') || h.includes('ref') || h.includes('numéro')
      );
      
      if (dateIndex === -1 || libelleIndex === -1 || montantIndex === -1) {
        setParseError("Colonnes requises non trouvées. Assurez-vous d'avoir: Date, Libellé/Description, Montant");
        return;
      }
      
      // Parse rows
      const transactions: ParsedTransaction[] = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;
        
        const dateValue = parseDate(row[dateIndex]);
        const amountResult = parseAmount(row[montantIndex]);
        const libelle = row[libelleIndex] ? String(row[libelleIndex]).trim() : '';
        const reference = referenceIndex !== -1 && row[referenceIndex] 
          ? String(row[referenceIndex]).trim() 
          : undefined;
        
        const errors: string[] = [];
        if (!dateValue) errors.push('Date invalide');
        if (!amountResult) errors.push('Montant invalide');
        if (!libelle) errors.push('Libellé vide');
        
        transactions.push({
          date_transaction: dateValue || '',
          libelle,
          montant: amountResult?.montant || 0,
          type_transaction: amountResult?.type || 'debit',
          reference_externe: reference,
          valid: errors.length === 0,
          error: errors.length > 0 ? errors.join(', ') : undefined
        });
      }
      
      if (transactions.length === 0) {
        setParseError("Aucune transaction n'a pu être extraite du fichier");
        return;
      }
      
      setParsedData(transactions);
      setStep('preview');
      
    } catch (error) {
      console.error('Error parsing file:', error);
      setParseError("Erreur lors de la lecture du fichier. Vérifiez le format.");
    }
  };

  const handleImport = async () => {
    if (!selectedAccountId) {
      setParseError("Veuillez sélectionner un compte bancaire");
      return;
    }
    
    const validTransactions = parsedData.filter(t => t.valid);
    if (validTransactions.length === 0) {
      setParseError("Aucune transaction valide à importer");
      return;
    }
    
    setStep('importing');
    let success = 0;
    let errors = 0;
    
    for (let i = 0; i < validTransactions.length; i++) {
      try {
        const t = validTransactions[i];
        await onImport([{
          compte_bancaire_id: selectedAccountId,
          date_transaction: t.date_transaction,
          libelle: t.libelle,
          montant: t.type_transaction === 'debit' ? -t.montant : t.montant,
          type_transaction: t.type_transaction,
          reference_externe: t.reference_externe,
          statut_rapprochement: 'non_rapproche',
          source: 'import'
        }]);
        success++;
      } catch (error) {
        console.error('Error importing transaction:', error);
        errors++;
      }
      setImportProgress(Math.round(((i + 1) / validTransactions.length) * 100));
    }
    
    setImportResults({ success, errors });
    setStep('complete');
  };

  const validCount = parsedData.filter(t => t.valid).length;
  const invalidCount = parsedData.filter(t => !t.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer un Relevé Bancaire
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && "Sélectionnez un fichier CSV ou Excel contenant vos transactions bancaires"}
            {step === 'preview' && "Vérifiez les transactions avant l'import"}
            {step === 'importing' && "Import en cours..."}
            {step === 'complete' && "Import terminé"}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Compte Bancaire de destination</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.nom_compte} - {account.numero_compte}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary hover:underline">Cliquez pour sélectionner</span>
                  <span className="text-muted-foreground"> ou glissez un fichier</span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground">
                  Formats supportés: CSV, Excel (.xlsx, .xls)
                </p>
              </div>
              {file && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>

            {parseError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Format attendu</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Le fichier doit contenir les colonnes suivantes :
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Date</strong> (ou date_transaction) - Format: JJ/MM/AAAA ou AAAA-MM-JJ</li>
                <li>• <strong>Libellé</strong> (ou description) - Description de la transaction</li>
                <li>• <strong>Montant</strong> (ou amount) - Positif pour crédit, négatif pour débit</li>
                <li>• <strong>Référence</strong> (optionnel) - Numéro de référence externe</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Badge variant="default" className="px-3 py-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                {validCount} valide(s)
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive" className="px-3 py-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {invalidCount} erreur(s)
                </Badge>
              )}
            </div>

            <div className="border rounded-lg max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((transaction, index) => (
                    <TableRow key={index} className={!transaction.valid ? 'bg-destructive/10' : ''}>
                      <TableCell>
                        {transaction.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <span title={transaction.error}>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{transaction.date_transaction || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={transaction.libelle}>
                        {transaction.libelle || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.montant ? formatAmount(transaction.montant) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type_transaction === 'credit' ? 'default' : 'secondary'}>
                          {transaction.type_transaction === 'credit' ? 'Crédit' : 'Débit'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {parsedData.length > 50 && (
              <p className="text-sm text-muted-foreground text-center">
                Affichage limité à 50 lignes sur {parsedData.length}
              </p>
            )}
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <Progress value={importProgress} className="w-full" />
            <p className="text-center text-muted-foreground">
              Import en cours... {importProgress}%
            </p>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="py-8 space-y-4 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="text-lg font-medium">Import terminé</h3>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="default" className="px-3 py-1">
                {importResults.success} importée(s)
              </Badge>
              {importResults.errors > 0 && (
                <Badge variant="destructive" className="px-3 py-1">
                  {importResults.errors} erreur(s)
                </Badge>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Retour
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0 || !selectedAccountId}>
                Importer {validCount} transaction(s)
              </Button>
            </>
          )}
          
          {step === 'complete' && (
            <Button onClick={handleClose}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BankStatementImportDialog;
