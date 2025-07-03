import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Keyboard
} from 'lucide-react';

interface InventoryItem {
  id: string;
  codeBarre: string;
  produit: string;
  lot: string;
  emplacementTheorique: string;
  emplacementReel: string;
  quantiteTheorique: number;
  quantiteComptee?: number;
  unite: string;
  statut: 'non_compte' | 'compte' | 'ecart';
  dateComptage?: Date;
  operateur?: string;
}

const InventoryEntry = () => {
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [scanMode, setScanMode] = useState<'scanner' | 'manuel'>('scanner');
  const [scannedCode, setScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Données mockées pour les éléments d'inventaire
  const mockItems: InventoryItem[] = [
    {
      id: '1',
      codeBarre: '3401028310045',
      produit: 'Paracétamol 500mg',
      lot: 'LOT001',
      emplacementTheorique: 'A1-B2',
      emplacementReel: 'A1-B2',
      quantiteTheorique: 50,
      quantiteComptee: 48,
      unite: 'boîtes',
      statut: 'ecart',
      dateComptage: new Date(),
      operateur: 'Marie Dubois'
    },
    {
      id: '2',
      codeBarre: '3401056158057',
      produit: 'Ibuprofène 200mg',
      lot: 'LOT002',
      emplacementTheorique: 'B2-C1',
      emplacementReel: 'B2-C1',
      quantiteTheorique: 30,
      quantiteComptee: 30,
      unite: 'boîtes',
      statut: 'compte',
      dateComptage: new Date(),
      operateur: 'Marie Dubois'
    },
    {
      id: '3',
      codeBarre: '3401053468451',
      produit: 'Aspirine 100mg',
      lot: 'LOT003',
      emplacementTheorique: 'C1-D3',
      emplacementReel: 'C1-D3',
      quantiteTheorique: 25,
      unite: 'boîtes',
      statut: 'non_compte'
    }
  ];

  useEffect(() => {
    setItems(mockItems);
  }, []);

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
    const item = items.find(item => item.codeBarre === code);
    if (item && item.statut === 'non_compte') {
      // Simuler la sélection de l'élément pour comptage
      console.log(`Produit trouvé: ${item.produit} - Lot: ${item.lot}`);
    }
  };

  const saveCount = () => {
    if (scannedCode && currentQuantity) {
      const updatedItems = items.map(item => {
        if (item.codeBarre === scannedCode) {
          const quantite = parseInt(currentQuantity);
          return {
            ...item,
            quantiteComptee: quantite,
            emplacementReel: currentLocation || item.emplacementTheorique,
            statut: (quantite === item.quantiteTheorique ? 'compte' : 'ecart') as InventoryItem['statut'],
            dateComptage: new Date(),
            operateur: 'Utilisateur Actuel'
          };
        }
        return item;
      });
      
      setItems(updatedItems);
      setCurrentQuantity('');
      setCurrentLocation('');
      setScannedCode('');
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
                <SelectItem value="session1">Inventaire Général Q1 2024</SelectItem>
                <SelectItem value="session2">Inventaire Cyclique Antibiotiques</SelectItem>
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
                    <Button variant="outline" onClick={() => setIsScanning(!isScanning)}>
                      <Camera className="h-4 w-4" />
                    </Button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantité Comptée</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(e.target.value)}
                  placeholder="Quantité réelle..."
                />
              </div>
              <div>
                <Label htmlFor="location">Emplacement (optionnel)</Label>
                <Input
                  id="location"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="Emplacement réel..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveCount} disabled={!currentQuantity}>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </Button>
              <Button variant="outline" onClick={() => {
                setCurrentQuantity('');
                setCurrentLocation('');
                setScannedCode('');
                setManualCode('');
              }}>
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
          <CardTitle>Éléments à Compter</CardTitle>
          <CardDescription>Liste des produits de la session d'inventaire en cours</CardDescription>
        </CardHeader>
        <CardContent>
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
                          {item.statut === 'non_compte' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setScannedCode(item.codeBarre)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          {item.statut !== 'non_compte' && (
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryEntry;