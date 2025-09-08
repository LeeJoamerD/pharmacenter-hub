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
  Loader2
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
    refetch 
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

  // Create a map for efficient barcode lookups
  const itemsByBarcode = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    items.forEach(item => map.set(item.codeBarre, item));
    return map;
  }, [items]);

  useEffect(() => {
    if (selectedSessionId) {
      setSelectedSession(selectedSessionId);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (selectedSession) {
      refetch(selectedSession);
      // Reset form when session changes
      setSelectedItem(null);
      setCurrentQuantity('');
      setCurrentLocation('');
      setScannedCode('');
      setManualCode('');
    }
  }, [selectedSession, refetch]);

  const handleScannerInput = (value: string) => {
    setScannedCode(value);
    if (value.length >= 13) { // Code-barres standard
      processScannedItem(value);
      setScannedCode('');
    }
  };

  const handleManualEntry = () => {
    if (manualCode) {
      processScannedItem(manualCode);
      setManualCode('');
    }
  };

  const processScannedItem = (code: string) => {
    const item = itemsByBarcode.get(code);
    if (item) {
      if (item.statut === 'non_compte') {
        setSelectedItem(item);
        setCurrentLocation(item.emplacementTheorique);
        setCurrentQuantity(''); // Let user enter quantity
      } else {
        // Item already counted, show current values for editing
        setSelectedItem(item);
        setCurrentQuantity(item.quantiteComptee.toString());
        setCurrentLocation(item.emplacementReel);
      }
    } else {
      // Item not found in session
      toast.error('Produit non trouvé dans cette session d\'inventaire');
    }
  };

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setCurrentLocation(item.emplacementReel);
    if (item.statut !== 'non_compte') {
      setCurrentQuantity(item.quantiteComptee.toString());
    } else {
      setCurrentQuantity('');
    }
  };

  const saveCount = async () => {
    if (!selectedItem || !currentQuantity || !selectedSession) {
      return;
    }

    setIsSaving(true);
    try {
      const quantity = parseInt(currentQuantity);
      const location = currentLocation || selectedItem.emplacementTheorique;
      
      await hookSaveCount(selectedItem.id, quantity, location, selectedSession);
      
      // Reset form after successful save
      setSelectedItem(null);
      setCurrentQuantity('');
      setCurrentLocation('');
      setScannedCode('');
      setManualCode('');
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedItem(null);
    setCurrentQuantity('');
    setCurrentLocation('');
    setScannedCode('');
    setManualCode('');
  };

  const handleResetCount = async (itemId: string) => {
    if (!selectedSession) return;
    
    setIsResetting(true);
    try {
      await hookResetCount(itemId, selectedSession);
      setResetItemId(null);
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsResetting(false);
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'compte':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ecart':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'non_compte':
        return <Package className="h-4 w-4 text-gray-400" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    const colors = {
      compte: 'bg-green-100 text-green-800 border-green-200',
      ecart: 'bg-orange-100 text-orange-800 border-orange-200',
      non_compte: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const labels = {
      compte: 'Compté',
      ecart: 'Écart',
      non_compte: 'Non compté'
    };

    return (
      <Badge className={colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[statut as keyof typeof labels] || statut}
      </Badge>
    );
  };

  const countedItems = items.filter(item => item.statut !== 'non_compte').length;
  const totalItems = items.length;
  const itemsWithEcart = items.filter(item => item.statut === 'ecart').length;

  return (
    <div className="space-y-6">
      {/* Sélection de session et mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Active</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mode de Saisie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                variant={scanMode === 'scanner' ? 'default' : 'outline'}
                onClick={() => setScanMode('scanner')}
                className="flex-1"
              >
                <Scan className="mr-2 h-4 w-4" />
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
          </CardContent>
        </Card>
      </div>

      {/* Progression */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{countedItems}/{totalItems}</div>
              <div className="text-sm text-muted-foreground">Produits comptés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{itemsWithEcart}</div>
              <div className="text-sm text-muted-foreground">Écarts détectés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((countedItems / totalItems) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Progression</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(countedItems / totalItems) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone de saisie */}
      <Card>
        <CardHeader>
          <CardTitle>Saisie des Comptages</CardTitle>
          <CardDescription>Scannez ou saisissez les codes-barres pour enregistrer les quantités</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scanMode === 'scanner' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scanner-input">Code-barres Scanner</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Scan className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="scanner-input"
                        value={scannedCode}
                        onChange={(e) => handleScannerInput(e.target.value)}
                        placeholder="Scannez un code-barres..."
                        className="pl-9"
                        autoFocus
                      />
                    </div>
                     <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
                       <DialogTrigger asChild>
                         <Button variant="outline">
                           <Camera className="h-4 w-4" />
                         </Button>
                       </DialogTrigger>
                       <DialogContent>
                         <DialogHeader>
                           <DialogTitle>Scanner avec Caméra</DialogTitle>
                           <DialogDescription>
                             Fonctionnalité de scan via caméra disponible prochainement. 
                             En attendant, utilisez le champ de saisie pour entrer le code-barres manuellement.
                           </DialogDescription>
                         </DialogHeader>
                         <div className="mt-4">
                           <Label htmlFor="camera-manual-input">Code-barres</Label>
                           <div className="flex gap-2 mt-1">
                             <Input
                               id="camera-manual-input"
                               placeholder="Entrez le code-barres..."
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter' && e.currentTarget.value) {
                                   processScannedItem(e.currentTarget.value);
                                   setShowCameraDialog(false);
                                   e.currentTarget.value = '';
                                 }
                               }}
                             />
                             <Button 
                               onClick={() => {
                                 const input = document.getElementById('camera-manual-input') as HTMLInputElement;
                                 if (input?.value) {
                                   processScannedItem(input.value);
                                   setShowCameraDialog(false);
                                   input.value = '';
                                 }
                               }}
                             >
                               <Search className="h-4 w-4" />
                             </Button>
                           </div>
                         </div>
                       </DialogContent>
                     </Dialog>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="manual-input">Code-barres Manuel</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="manual-input"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Saisissez le code-barres..."
                    />
                    <Button onClick={handleManualEntry}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedItem && (
              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  <strong>Article sélectionné:</strong> {selectedItem.produit} - Lot: {selectedItem.lot}
                  <br />
                  <strong>Quantité théorique:</strong> {selectedItem.quantiteTheorique} {selectedItem.unite}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantité Comptée</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(e.target.value)}
                  placeholder="Quantité réelle..."
                  disabled={!selectedItem}
                />
              </div>
              <div>
                <Label htmlFor="location">Emplacement</Label>
                <Input
                  id="location"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="Emplacement réel..."
                  disabled={!selectedItem}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={saveCount} 
                disabled={!selectedItem || !currentQuantity || isSaving || !selectedSession}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isSaving && <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={isSaving}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des éléments */}
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
                size="sm"
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Initialiser les éléments
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading state */}
          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Chargement des éléments...</p>
            </div>
          )}

          {/* Empty state - no session selected */}
          {!selectedSession && !loading && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Veuillez sélectionner une session d'inventaire</p>
            </div>
          )}

          {/* Empty state - session selected but no items */}
          {selectedSession && !loading && items.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Aucun élément trouvé pour cette session</p>
              <p className="text-sm text-muted-foreground">
                Utilisez le bouton "Initialiser les éléments" pour créer les articles depuis le stock actuel
              </p>
            </div>
          )}

          {/* Items table */}
          {!loading && items.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statut</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Emplacement</TableHead>
                    <TableHead>Qté Théorique</TableHead>
                    <TableHead>Qté Comptée</TableHead>
                    <TableHead>Écart</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const ecart = item.quantiteComptee !== undefined 
                      ? item.quantiteComptee - item.quantiteTheorique 
                      : 0;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.statut)}
                            {getStatusBadge(item.statut)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.produit}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.lot}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{item.emplacementReel}</div>
                            {item.emplacementReel !== item.emplacementTheorique && (
                              <div className="text-xs text-muted-foreground">
                                Théorique: {item.emplacementTheorique}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantiteTheorique} {item.unite}</TableCell>
                        <TableCell>
                          {item.quantiteComptee !== undefined ? (
                            <span>{item.quantiteComptee} {item.unite}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {ecart !== 0 && (
                            <span className={ecart > 0 ? 'text-green-600' : 'text-red-600'}>
                              {ecart > 0 ? '+' : ''}{ecart}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleSelectItem(item)}
                              disabled={isSaving || isResetting}
                              title={item.statut === 'non_compte' ? 'Compter cet article' : 'Modifier le comptage'}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            {item.statut !== 'non_compte' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={isSaving || isResetting}
                                    title="Réinitialiser le comptage"
                                  >
                                    {isResetting && resetItemId === item.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Réinitialiser le comptage</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir réinitialiser le comptage pour "{item.produit}" ?
                                      Cette action effacera la quantité comptée et remettra le statut à "non compté".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        setResetItemId(item.id);
                                        handleResetCount(item.id);
                                      }}
                                    >
                                      Réinitialiser
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
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

export default InventoryEntry;