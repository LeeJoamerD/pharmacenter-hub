import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Scan,
  Package,
  CheckCircle,
  AlertTriangle,
  Plus,
  Save,
  RotateCcw,
  Search,
  Trash2,
  Camera,
  Keyboard,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useInventoryEntry, InventoryItem } from '@/hooks/useInventoryEntry';
import { toast } from 'sonner';

interface InventoryEntryProps {
  selectedSessionId?: string;
}

const InventoryEntry: React.FC<InventoryEntryProps> = ({ selectedSessionId }) => {
  const { 
    items, 
    sessions, 
    loading, 
    saveCount: hookSaveCount, 
    resetCount: hookResetCount, 
    initializeSessionItems, 
    refetch,
    finishSession
  } = useInventoryEntry();
  
  const [selectedSession, setSelectedSession] = useState<string>(selectedSessionId || '');
  const [scanMode, setScanMode] = useState<'scanner' | 'manuel'>('scanner');
  const [scannedCode, setScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [resetItemId, setResetItemId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'tous' | 'non_compte' | 'compte' | 'ecart'>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [recentEntries, setRecentEntries] = useState<Array<{
    id: string;
    produit: string;
    lot: string;
    quantite: number;
    timestamp: Date;
  }>>([]);
  const [formErrors, setFormErrors] = useState<{
    quantity?: string;
    location?: string;
  }>({});
  const [hasAttemptedInit, setHasAttemptedInit] = useState(false);

  // États pour la saisie rapide
  const [quickEntryMode, setQuickEntryMode] = useState(false);
  const [quickEntryItems, setQuickEntryItems] = useState<Array<{
    id: string;
    produit: string;
    lot: string;
    quantite: string;
    emplacement: string;
  }>>([]);
  const [quickScanInput, setQuickScanInput] = useState('');

  // Create a map for efficient barcode lookups
  const itemsByBarcode = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    if (!Array.isArray(items)) return map;
    items.forEach(item => {
      if (item?.codeBarre) {
        map.set(item.codeBarre, item);
      }
    });
    return map;
  }, [items]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply status filter
    if (filterStatus !== 'tous') {
      filtered = filtered.filter(item => item.statut === filterStatus);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.codeBarre.toLowerCase().includes(searchLower) ||
        item.produit.toLowerCase().includes(searchLower) ||
        item.lot.toLowerCase().includes(searchLower) ||
        item.emplacementTheorique.toLowerCase().includes(searchLower) ||
        item.emplacementReel.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [items, filterStatus, searchTerm]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  // 1. Synchroniser selectedSession avec le prop
  useEffect(() => {
    if (selectedSessionId && selectedSessionId !== selectedSession) {
      setSelectedSession(selectedSessionId);
      setHasAttemptedInit(false);
    }
  }, [selectedSessionId, selectedSession]);

  // 2. Charger les items quand la session change
  useEffect(() => {
    if (selectedSession) {
      console.log('📦 Chargement des items pour session:', selectedSession);
      refetch(selectedSession);
    }
  }, [selectedSession, refetch]);

  // 3. Initialiser automatiquement si 0 items après le fetch
  useEffect(() => {
    if (selectedSession && !loading && items.length === 0 && !hasAttemptedInit) {
      console.log('🔄 Auto-initialisation de la session (0 items détectés)');
      setHasAttemptedInit(true);
      initializeSessionItems(selectedSession);
    }
  }, [selectedSession, loading, items.length, hasAttemptedInit, initializeSessionItems]);

  const handleScan = (code: string) => {
    const item = itemsByBarcode.get(code);
    if (item) {
      setSelectedItem(item);
      setCurrentQuantity(item.quantiteComptee?.toString() || '');
      setCurrentLocation(item.emplacementReel || item.emplacementTheorique || '');
      setScannedCode(code);
      setManualCode('');
    } else {
      toast.error('Produit non trouvé dans cette session d\'inventaire');
    }
  };

  const handleManualEntry = () => {
    if (!manualCode.trim()) {
      toast.error('Veuillez saisir un code-barres');
      return;
    }
    handleScan(manualCode.trim());
  };

  const validateForm = () => {
    const errors: { quantity?: string; location?: string } = {};
    
    if (!currentQuantity || isNaN(Number(currentQuantity)) || Number(currentQuantity) < 0) {
      errors.quantity = 'Quantité invalide';
    }
    
    if (!currentLocation.trim()) {
      errors.location = 'Emplacement requis';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCount = async () => {
    if (!selectedItem || !validateForm()) return;

    setIsSaving(true);
    try {
      await hookSaveCount(selectedItem.id, Number(currentQuantity), currentLocation, selectedSession);
      
      // Add to recent entries
      setRecentEntries(prev => [{
        id: selectedItem.id,
        produit: selectedItem.produit,
        lot: selectedItem.lot,
        quantite: Number(currentQuantity),
        timestamp: new Date()
      }, ...prev.slice(0, 4)]);

      // Reset form
      setSelectedItem(null);
      setCurrentQuantity('');
      setCurrentLocation('');
      setScannedCode('');
      setManualCode('');
      setFormErrors({});
      
      toast.success('Comptage enregistré avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCount = async (itemId: string) => {
    setIsResetting(true);
    try {
      await hookResetCount(itemId, selectedSession);
      toast.success('Comptage réinitialisé');
      setResetItemId(null);
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation');
    } finally {
      setIsResetting(false);
    }
  };

  const handleQuickScan = (code: string) => {
    const item = itemsByBarcode.get(code);
    if (item) {
      const existingIndex = quickEntryItems.findIndex(qi => qi.id === item.id);
      if (existingIndex >= 0) {
        toast.warning('Produit déjà ajouté à la saisie rapide');
        return;
      }
      
      setQuickEntryItems(prev => [...prev, {
        id: item.id,
        produit: item.produit,
        lot: item.lot,
        quantite: '',
        emplacement: item.emplacementReel || item.emplacementTheorique || ''
      }]);
      setQuickScanInput('');
    } else {
      toast.error('Produit non trouvé');
    }
  };

  const updateQuickEntryItem = (index: number, field: 'quantite' | 'emplacement', value: string) => {
    setQuickEntryItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeQuickEntryItem = (index: number) => {
    setQuickEntryItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickSave = async () => {
    const validItems = quickEntryItems.filter(item => 
      item.quantite && !isNaN(Number(item.quantite)) && Number(item.quantite) >= 0 && item.emplacement.trim()
    );

    if (validItems.length === 0) {
      toast.error('Aucun élément valide à enregistrer');
      return;
    }

    setIsSaving(true);
    try {
      for (const item of validItems) {
        await hookSaveCount(item.id, Number(item.quantite), item.emplacement, selectedSession);
      }
      
      setQuickEntryItems([]);
      toast.success(`${validItems.length} comptages enregistrés`);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const counted = items.filter(item => item.statut === 'compte').length;
    const discrepancies = items.filter(item => item.statut === 'ecart').length;
    
    return {
      total,
      counted,
      remaining: total - counted,
      discrepancies,
      progress: total > 0 ? Math.round((counted / total) * 100) : 0
    };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Sélection de session et mode */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration de Saisie</CardTitle>
          <CardDescription>Sélectionnez la session et le mode de saisie</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session">Session d'inventaire</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.nom} - {new Date(session.date_debut).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode de saisie</Label>
              <div className="flex gap-2">
                <Button
                  variant={scanMode === 'scanner' ? 'default' : 'outline'}
                  onClick={() => setScanMode('scanner')}
                  className="flex-1"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Scanner
                </Button>
                <Button
                  variant={scanMode === 'manuel' ? 'default' : 'outline'}
                  onClick={() => setScanMode('manuel')}
                  className="flex-1"
                >
                  <Keyboard className="mr-2 h-4 w-4" />
                  Manuel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      {selectedSession && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.counted}</div>
              <p className="text-xs text-muted-foreground">Comptés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.remaining}</div>
              <p className="text-xs text-muted-foreground">Restants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.discrepancies}</div>
              <p className="text-xs text-muted-foreground">Écarts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.progress}%</div>
              <p className="text-xs text-muted-foreground">Progression</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bouton Terminer l'inventaire */}
      {selectedSession && sessions.find(s => s.id === selectedSession)?.statut === 'en_cours' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-green-900">Inventaire en cours</p>
              <p className="text-sm text-green-700">
                {stats.progress}% complété - {stats.remaining} produits restants
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Terminer l'inventaire
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Terminer l'inventaire</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir clôturer cet inventaire ? 
                    {stats.remaining > 0 && ` Il reste ${stats.remaining} produits non comptés.`}
                    {' '}Cette action est définitive.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => finishSession(selectedSession)}>
                    Confirmer la clôture
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Message si aucun produit */}
      {selectedSession && !loading && items.length === 0 && hasAttemptedInit && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-2">
                  Session vide - Aucun produit à inventorier
                </h3>
                <p className="text-sm text-orange-700 mb-4">
                  La session a été initialisée mais aucun produit n'a été chargé. 
                  Vérifiez que vous avez des lots avec un statut "actif" ou "Disponible" 
                  et une quantité restante supérieure à 0.
                </p>
                <Button 
                  onClick={() => {
                    setHasAttemptedInit(false);
                    initializeSessionItems(selectedSession);
                  }}
                  variant="outline"
                  className="border-orange-300 hover:bg-orange-100"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Réessayer l'initialisation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton de réinitialisation manuelle */}
      {selectedSession && items.length === 0 && !loading && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Session vide</p>
              <p className="text-sm text-muted-foreground">
                Aucun produit chargé pour cette session
              </p>
            </div>
            <Button 
              onClick={() => {
                setHasAttemptedInit(false);
                initializeSessionItems(selectedSession);
              }}
              variant="outline"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Initialiser la session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filtres et recherche */}
      {selectedSession && (
        <Card>
          <CardHeader>
            <CardTitle>Filtres et Recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter">Filtrer par statut</Label>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous ({items.length})</SelectItem>
                    <SelectItem value="non_compte">Non comptés ({items.filter(i => i.statut === 'non_compte').length})</SelectItem>
                    <SelectItem value="compte">Comptés ({items.filter(i => i.statut === 'compte').length})</SelectItem>
                    <SelectItem value="ecart">Écarts ({items.filter(i => i.statut === 'ecart').length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">Rechercher</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Code-barres, produit, lot, emplacement..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zone de saisie */}
      {selectedSession && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Saisie des Comptages</CardTitle>
                <CardDescription>Scannez ou saisissez les codes-barres pour compter les produits</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={quickEntryMode ? 'default' : 'outline'}
                  onClick={() => setQuickEntryMode(!quickEntryMode)}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Saisie rapide
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!quickEntryMode ? (
              <div className="space-y-4">
                {/* Mode normal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    {scanMode === 'scanner' ? (
                      <div className="space-y-2">
                        <Label>Scanner le code-barres</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Code-barres scanné apparaîtra ici"
                            value={scannedCode}
                            onChange={(e) => setScannedCode(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && scannedCode) {
                                handleScan(scannedCode);
                              }
                            }}
                          />
                          <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Camera className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Scanner avec la caméra</DialogTitle>
                                <DialogDescription>
                                  Positionnez le code-barres devant la caméra
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                                <p className="text-muted-foreground">Caméra non disponible</p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="manual-code">Saisie manuelle du code-barres</Label>
                        <div className="flex gap-2">
                          <Input
                            id="manual-code"
                            placeholder="Saisissez le code-barres"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleManualEntry();
                              }
                            }}
                          />
                          <Button onClick={handleManualEntry} variant="outline">
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedItem && (
                      <Alert>
                        <Package className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{selectedItem.produit}</strong><br />
                          Lot: {selectedItem.lot}<br />
                          Code: {selectedItem.codeBarre}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantité comptée</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="0"
                        value={currentQuantity}
                        onChange={(e) => setCurrentQuantity(e.target.value)}
                        className={formErrors.quantity ? 'border-red-500' : ''}
                      />
                      {formErrors.quantity && (
                        <p className="text-sm text-red-500">{formErrors.quantity}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Emplacement</Label>
                      <Input
                        id="location"
                        placeholder="Ex: A1-B2"
                        value={currentLocation}
                        onChange={(e) => setCurrentLocation(e.target.value)}
                        className={formErrors.location ? 'border-red-500' : ''}
                      />
                      {formErrors.location && (
                        <p className="text-sm text-red-500">{formErrors.location}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveCount}
                        disabled={!selectedItem || isSaving}
                        className="flex-1"
                      >
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Enregistrer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(null);
                          setCurrentQuantity('');
                          setCurrentLocation('');
                          setScannedCode('');
                          setManualCode('');
                          setFormErrors({});
                        }}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Saisies récentes */}
                {recentEntries.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">Saisies récentes</h4>
                    <div className="space-y-2">
                      {recentEntries.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{entry.produit}</div>
                            <div className="text-xs text-muted-foreground">
                              Lot: {entry.lot} • Quantité: {entry.quantite}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {entry.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mode saisie rapide */}
                <div className="space-y-2">
                  <Label>Scanner plusieurs produits</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Scannez les codes-barres successivement"
                      value={quickScanInput}
                      onChange={(e) => setQuickScanInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && quickScanInput.trim()) {
                          handleQuickScan(quickScanInput.trim());
                        }
                      }}
                    />
                    <Button
                      onClick={() => quickScanInput.trim() && handleQuickScan(quickScanInput.trim())}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {quickEntryItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead>Lot</TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead>Emplacement</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quickEntryItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.produit}</TableCell>
                              <TableCell>{item.lot}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={item.quantite}
                                  onChange={(e) => updateQuickEntryItem(index, 'quantite', e.target.value)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="Emplacement"
                                  value={item.emplacement}
                                  onChange={(e) => updateQuickEntryItem(index, 'emplacement', e.target.value)}
                                  className="w-32"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeQuickEntryItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleQuickSave}
                        disabled={isSaving || quickEntryItems.length === 0}
                        className="flex-1"
                      >
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Enregistrer tout ({quickEntryItems.length})
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setQuickEntryItems([])}
                      >
                        Vider la liste
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Liste des éléments */}
      {selectedSession && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Éléments à Compter</CardTitle>
                <CardDescription>Liste des produits de la session d'inventaire en cours</CardDescription>
              </div>
              {selectedSession && items.length === 0 && !loading && (
                <Button
                  onClick={() => initializeSessionItems(selectedSession)}
                  variant="outline"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Initialiser les éléments
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Chargement...</span>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Code-barres</TableHead>
                        <TableHead>Lot</TableHead>
                        <TableHead>Emplacement</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.produit}</TableCell>
                          <TableCell>{item.codeBarre}</TableCell>
                          <TableCell>{item.lot}</TableCell>
                          <TableCell>{item.emplacementReel || item.emplacementTheorique}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {item.quantiteComptee !== null ? (
                                <>
                                  <span className="font-medium">{item.quantiteComptee}</span>
                                  {item.quantiteTheorique !== null && item.quantiteComptee !== item.quantiteTheorique && (
                                    <Badge variant="destructive" className="text-xs">
                                      Écart: {item.quantiteComptee - item.quantiteTheorique}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.statut === 'compte' ? 'default' :
                                item.statut === 'ecart' ? 'destructive' : 'secondary'
                              }
                            >
                              {item.statut === 'compte' && <CheckCircle className="mr-1 h-3 w-3" />}
                              {item.statut === 'ecart' && <AlertTriangle className="mr-1 h-3 w-3" />}
                              {item.statut === 'compte' ? 'Compté' :
                               item.statut === 'ecart' ? 'Écart' : 'Non compté'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setCurrentQuantity(item.quantiteComptee?.toString() || '');
                                  setCurrentLocation(item.emplacementReel || item.emplacementTheorique || '');
                                  setScannedCode(item.codeBarre);
                                }}
                              >
                                <Scan className="h-4 w-4" />
                              </Button>
                              {item.quantiteComptee !== null && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setResetItemId(item.id)}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Réinitialiser le comptage</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Êtes-vous sûr de vouloir réinitialiser le comptage de ce produit ?
                                        Cette action ne peut pas être annulée.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setResetItemId(null)}>
                                        Annuler
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleResetCount(item.id)}
                                        disabled={isResetting}
                                      >
                                        {isResetting ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        Réinitialiser
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination améliorée */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} sur {totalPages} ({filteredItems.length} éléments)
                      </div>
                      <Select 
                        value={itemsPerPage.toString()} 
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 par page</SelectItem>
                          <SelectItem value="50">50 par page</SelectItem>
                          <SelectItem value="100">100 par page</SelectItem>
                          <SelectItem value="200">200 par page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) setCurrentPage(currentPage - 1);
                            }}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          // Show first page, last page, current page, and pages around current
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(pageNum);
                                  }}
                                  isActive={pageNum === currentPage}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            pageNum === currentPage - 2 ||
                            pageNum === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                            }}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Aucun résultat trouvé pour les filtres appliqués</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterStatus('tous');
                    setSearchTerm('');
                  }}
                >
                  Réinitialiser filtres
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryEntry;