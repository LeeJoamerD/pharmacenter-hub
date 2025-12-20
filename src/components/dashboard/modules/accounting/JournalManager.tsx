import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Plus, Edit, Trash2, BookOpen, ShoppingCart, CreditCard, Banknote, FileText, Check, X, AlertCircle, Lock, Unlock, Link2, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useJournalManager, type JournalEntry, type EntryLine } from '@/hooks/useJournalManager';
import AccountSelector from '@/components/accounting/AccountSelector';
import { Skeleton } from "@/components/ui/skeleton";

const JournalManager = () => {
  const { toast } = useToast();
  const {
    journals,
    entries,
    isLoadingJournals,
    isLoadingEntries,
    isSaving,
    createEntry,
    updateEntry,
    validateEntry,
    lockEntry,
    calculateBalance,
    getEntriesByStatus
  } = useJournalManager();

  const [activeTab, setActiveTab] = useState('journals');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJournal, setSelectedJournal] = useState<string>('all');
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Journaux types
  const journalTypes = [
    { code: 'AC', libelle: 'Achats', icon: ShoppingCart, color: 'text-orange-600' },
    { code: 'VT', libelle: 'Ventes', icon: CreditCard, color: 'text-green-600' },
    { code: 'CA', libelle: 'Caisse', icon: Banknote, color: 'text-blue-600' },
    { code: 'BQ', libelle: 'Banque', icon: CreditCard, color: 'text-purple-600' },
    { code: 'OD', libelle: 'Opérations Diverses', icon: FileText, color: 'text-gray-600' }
  ];

  // Nouvelle écriture
  const [newEntry, setNewEntry] = useState<Partial<JournalEntry>>({
    journal_id: '',
    date_ecriture: new Date().toISOString().split('T')[0],
    libelle: '',
    reference_type: '',
    reference_id: '',
    lines: []
  });

  const [newLine, setNewLine] = useState<Partial<EntryLine>>({
    compte_id: '',
    compte_code: '',
    compte_libelle: '',
    libelle: '',
    debit: 0,
    credit: 0
  });

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.numero_piece.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJournal = selectedJournal === 'all' || entry.journal_id === selectedJournal;
    return matchesSearch && matchesJournal;
  });

  const handleSaveEntry = async () => {
    if (!newEntry.journal_id || !newEntry.libelle || !newEntry.lines?.length) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const balance = calculateBalance(newEntry.lines);
    if (!balance.isBalanced) {
      toast({
        title: "Erreur d'équilibre",
        description: "Le total des débits doit être égal au total des crédits",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, newEntry);
      } else {
        await createEntry(newEntry);
      }
      
      setShowEntryDialog(false);
      setEditingEntry(null);
      resetForm();
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const resetForm = () => {
    setNewEntry({
      journal_id: '',
      date_ecriture: new Date().toISOString().split('T')[0],
      libelle: '',
      reference_type: '',
      reference_id: '',
      lines: []
    });
    setNewLine({
      compte_id: '',
      compte_code: '',
      compte_libelle: '',
      libelle: '',
      debit: 0,
      credit: 0
    });
  };

  const addLineToEntry = () => {
    if (!newLine.compte_id || !newLine.libelle || (newLine.debit === 0 && newLine.credit === 0)) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs de la ligne",
        variant: "destructive"
      });
      return;
    }

    const line: EntryLine = {
      id: Date.now().toString(),
      tenant_id: '',
      ecriture_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...newLine
    } as EntryLine;

    setNewEntry(prev => ({
      ...prev,
      lines: [...(prev.lines || []), line]
    }));

    setNewLine({
      compte_id: '',
      compte_code: '',
      compte_libelle: '',
      libelle: '',
      debit: 0,
      credit: 0
    });
  };

  const removeLineFromEntry = (lineId: string) => {
    setNewEntry(prev => ({
      ...prev,
      lines: (prev.lines || []).filter(line => line.id !== lineId)
    }));
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'Brouillon':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'Validé':
        return <Badge variant="default">Validé</Badge>;
      case 'Verrouillé':
        return <Badge variant="destructive">Verrouillé</Badge>;
      default:
        return <Badge variant="outline">{status || 'Inconnu'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Journalisation Comptable</h2>
        <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Écriture
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Modifier l\'écriture' : 'Créer une nouvelle écriture'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="journal">Journal</Label>
                  <Select 
                    value={newEntry.journal_id} 
                    onValueChange={(value) => setNewEntry(prev => ({ ...prev, journal_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un journal" />
                    </SelectTrigger>
                    <SelectContent>
                      {journals.map(journal => (
                        <SelectItem key={journal.id} value={journal.id}>
                          {journal.code} - {journal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date d'écriture</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEntry.date_ecriture}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, date_ecriture: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Libellé</Label>
                  <Input
                    id="libelle"
                    value={newEntry.libelle}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, libelle: e.target.value }))}
                    placeholder="Description de l'écriture"
                  />
                </div>
                <div>
                  <Label htmlFor="reference">Référence</Label>
                  <Input
                    id="reference"
                    value={newEntry.reference_id || ''}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, reference_id: e.target.value }))}
                    placeholder="Numéro de pièce justificative"
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Lignes d'écriture</h4>
                
                {/* Ajouter une ligne */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <Input
                    placeholder="Code compte"
                    value={newLine.compte_code}
                    onChange={(e) => setNewLine(prev => ({ ...prev, compte_code: e.target.value }))}
                  />
                  <Input
                    placeholder="Libellé"
                    value={newLine.libelle}
                    onChange={(e) => setNewLine(prev => ({ ...prev, libelle: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Débit"
                    value={newLine.debit || ''}
                    onChange={(e) => setNewLine(prev => ({ ...prev, debit: parseFloat(e.target.value) || 0 }))}
                  />
                  <Input
                    type="number"
                    placeholder="Crédit"
                    value={newLine.credit || ''}
                    onChange={(e) => setNewLine(prev => ({ ...prev, credit: parseFloat(e.target.value) || 0 }))}
                  />
                  <Button onClick={addLineToEntry} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Liste des lignes */}
                {newEntry.lines && newEntry.lines.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Compte</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead>Débit</TableHead>
                        <TableHead>Crédit</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newEntry.lines.map(line => (
                        <TableRow key={line.id}>
                          <TableCell>{line.compte_code}</TableCell>
                          <TableCell>{line.libelle}</TableCell>
                          <TableCell>{line.debit.toLocaleString()}</TableCell>
                          <TableCell>{line.credit.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeLineFromEntry(line.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Équilibre */}
                {newEntry.lines && newEntry.lines.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    {(() => {
                      const balance = calculateBalance(newEntry.lines);
                      return (
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-4">
                            <span>Total Débit: {balance.totalDebit.toLocaleString()}</span>
                            <span>Total Crédit: {balance.totalCredit.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {balance.isBalanced ? (
                              <>
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">Équilibré</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="text-red-600">Déséquilibré</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEntryDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveEntry}>
                {editingEntry ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="journals">Journaux</TabsTrigger>
          <TabsTrigger value="entries">Écritures</TabsTrigger>
          <TabsTrigger value="validation">Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="journals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {journals.map(journal => {
              const journalType = journalTypes.find(t => t.code === journal.type);
              const Icon = journalType?.icon || BookOpen;
              const entriesCount = entries.filter(e => e.journal_id === journal.id).length;
              
              return (
                <Card key={journal.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-5 w-5 ${journalType?.color}`} />
                        <span>{journal.code}</span>
                      </div>
                      <Badge variant={journal.is_active ? "default" : "secondary"}>
                        {journal.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{journal.name}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Écritures:</span>
                        <Badge variant="outline">{entriesCount}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Séquence:</span>
                        <span className="font-medium">{journal.sequence_courante}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {journal.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="entries" className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une écriture..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedJournal} onValueChange={setSelectedJournal}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par journal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les journaux</SelectItem>
                {journals.map(journal => (
                  <SelectItem key={journal.id} value={journal.id}>
                    {journal.code} - {journal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Pièce</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Journal</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map(entry => {
                    const journal = journals.find(j => j.id === entry.journal_id);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.numero_piece}</TableCell>
                        <TableCell>{new Date(entry.date_ecriture).toLocaleDateString()}</TableCell>
                        <TableCell>{journal?.code}</TableCell>
                        <TableCell>{entry.libelle}</TableCell>
                        <TableCell>{entry.montant_total.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(entry.statut)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {entry.statut === 'Brouillon' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingEntry(entry);
                                    setNewEntry(entry);
                                    setShowEntryDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => validateEntry(entry.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {entry.statut === 'Validé' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => lockEntry(entry.id)}
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Edit className="h-5 w-5 text-orange-600" />
                  <span>Brouillons</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {entries.filter(e => e.statut === 'Brouillon').length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Écritures en cours de saisie
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Validées</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {entries.filter(e => e.statut === 'Validé').length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Écritures validées aujourd'hui
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  <span>Verrouillées</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {entries.filter(e => e.statut === 'Verrouillé').length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Écritures définitives
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Écritures en attente de validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entries.filter(e => e.statut === 'Brouillon').map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{entry.numero_piece} - {entry.libelle}</div>
                      <div className="text-sm text-muted-foreground">
                        Créé par {entry.created_by} le {new Date(entry.date_ecriture).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => validateEntry(entry.id)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Valider
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingEntry(entry);
                          setNewEntry(entry);
                          setShowEntryDialog(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </Button>
                    </div>
                  </div>
                ))}
                {entries.filter(e => e.statut === 'Brouillon').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune écriture en attente de validation
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

export default JournalManager;