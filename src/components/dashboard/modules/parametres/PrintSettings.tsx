import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Printer, FileText, Settings, Loader2, Plus, Edit, Trash2, Monitor } from 'lucide-react';
import { usePrintSettings } from '@/hooks/usePrintSettings';

const PrintSettings = () => {
  const {
    printSettings,
    setPrintSettings,
    receiptSettings,
    setReceiptSettings,
    printers,
    loading,
    saving,
    printersLoading,
    saveSettings,
    handlePrintTest,
    addPrinter,
    updatePrinter,
    deletePrinter
  } = usePrintSettings();

  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<any>(null);
  const [newPrinter, setNewPrinter] = useState({
    name: '',
    type: 'standard',
    connection_type: 'usb',
    ip_address: '',
    port: '',
    driver_name: '',
    paper_sizes: ['A4'],
    is_default: false,
    is_active: true
  });

  const handleAddPrinter = async () => {
    await addPrinter(newPrinter);
    setShowAddPrinter(false);
    setNewPrinter({
      name: '',
      type: 'standard',
      connection_type: 'usb',
      ip_address: '',
      port: '',
      driver_name: '',
      paper_sizes: ['A4'],
      is_default: false,
      is_active: true
    });
  };

  const handleEditPrinter = async () => {
    if (editingPrinter) {
      const { id, tenant_id, created_at, updated_at, ...printerData } = editingPrinter;
      await updatePrinter(id, printerData);
      setEditingPrinter(null);
    }
  };

  const handleDeletePrinter = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette imprimante ?')) {
      await deletePrinter(id);
    }
  };

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement des paramètres d'impression...</span>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Paramètres Généraux
            </CardTitle>
            <CardDescription>
              Configuration générale des impressions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultPrinter">Imprimante par défaut</Label>
              <Select 
                value={printSettings.defaultPrinter} 
                onValueChange={(value) => setPrintSettings(prev => ({ ...prev, defaultPrinter: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {printers.filter(p => p.type === 'standard').map(printer => (
                    <SelectItem key={printer.id} value={printer.name}>
                      {printer.name}
                    </SelectItem>
                  ))}
                  {printers.filter(p => p.type === 'standard').length === 0 && (
                    <SelectItem value="" disabled>Aucune imprimante configurée</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paperSize">Format papier</Label>
                <Select 
                  value={printSettings.paperSize} 
                  onValueChange={(value) => setPrintSettings(prev => ({ ...prev, paperSize: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select 
                  value={printSettings.orientation} 
                  onValueChange={(value) => setPrintSettings(prev => ({ ...prev, orientation: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Paysage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quality">Qualité</Label>
                <Select 
                  value={printSettings.quality} 
                  onValueChange={(value) => setPrintSettings(prev => ({ ...prev, quality: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="colorMode">Mode couleur</Label>
                <Select 
                  value={printSettings.colorMode} 
                  onValueChange={(value) => setPrintSettings(prev => ({ ...prev, colorMode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Couleur</SelectItem>
                    <SelectItem value="grayscale">Niveaux de gris</SelectItem>
                    <SelectItem value="blackwhite">Noir et blanc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="margin">Marges (mm): {printSettings.margin}</Label>
              <input
                type="range"
                id="margin"
                min="5"
                max="50"
                value={printSettings.margin}
                onChange={(e) => setPrintSettings(prev => ({ ...prev, margin: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              En-tête et Pied de Page
            </CardTitle>
            <CardDescription>
              Configuration des en-têtes et pieds de page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="logoEnabled">Logo entreprise</Label>
              <Switch
                id="logoEnabled"
                checked={printSettings.logoEnabled}
                onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, logoEnabled: checked }))}
              />
            </div>
            
            {printSettings.logoEnabled && (
              <div className="space-y-2">
                <Label htmlFor="logoPosition">Position du logo</Label>
                <Select 
                  value={printSettings.logoPosition} 
                  onValueChange={(value) => setPrintSettings(prev => ({ ...prev, logoPosition: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Haut gauche</SelectItem>
                    <SelectItem value="top-center">Haut centre</SelectItem>
                    <SelectItem value="top-right">Haut droite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Label htmlFor="headerEnabled">En-tête activé</Label>
              <Switch
                id="headerEnabled"
                checked={printSettings.headerEnabled}
                onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, headerEnabled: checked }))}
              />
            </div>
            
            {printSettings.headerEnabled && (
              <div className="space-y-2">
                <Label htmlFor="headerText">Texte de l'en-tête</Label>
                <Input
                  id="headerText"
                  value={printSettings.headerText}
                  onChange={(e) => setPrintSettings(prev => ({ ...prev, headerText: e.target.value }))}
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Label htmlFor="footerEnabled">Pied de page activé</Label>
              <Switch
                id="footerEnabled"
                checked={printSettings.footerEnabled}
                onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, footerEnabled: checked }))}
              />
            </div>
            
            {printSettings.footerEnabled && (
              <div className="space-y-2">
                <Label htmlFor="footerText">Texte du pied de page</Label>
                <Input
                  id="footerText"
                  value={printSettings.footerText}
                  onChange={(e) => setPrintSettings(prev => ({ ...prev, footerText: e.target.value }))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres de Reçus
          </CardTitle>
          <CardDescription>
            Configuration spécifique pour les reçus et tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="receiptPrinter">Imprimante de reçus</Label>
              <Select 
                value={receiptSettings.receiptPrinter} 
                onValueChange={(value) => setReceiptSettings(prev => ({ ...prev, receiptPrinter: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {printers.filter(p => p.type === 'receipt' || p.type === 'thermal').map(printer => (
                    <SelectItem key={printer.id} value={printer.name}>
                      {printer.name}
                    </SelectItem>
                  ))}
                  {printers.filter(p => p.type === 'receipt' || p.type === 'thermal').length === 0 && (
                    <SelectItem value="" disabled>Aucune imprimante de reçu configurée</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiptWidth">Largeur papier (mm)</Label>
              <Select 
                value={receiptSettings.receiptWidth.toString()} 
                onValueChange={(value) => setReceiptSettings(prev => ({ ...prev, receiptWidth: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58mm</SelectItem>
                  <SelectItem value="80">80mm</SelectItem>
                  <SelectItem value="110">110mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="showLogo">Logo sur reçu</Label>
              <Switch
                id="showLogo"
                checked={receiptSettings.showLogo}
                onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, showLogo: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showAddress">Adresse sur reçu</Label>
              <Switch
                id="showAddress"
                checked={receiptSettings.showAddress}
                onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, showAddress: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoOpenCashDrawer">Ouvrir tiroir-caisse</Label>
              <Switch
                id="autoOpenCashDrawer"
                checked={receiptSettings.autoOpenCashDrawer}
                onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, autoOpenCashDrawer: checked }))}
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="headerLines">Lignes d'en-tête</Label>
              <Textarea
                id="headerLines"
                value={receiptSettings.headerLines}
                onChange={(e) => setReceiptSettings(prev => ({ ...prev, headerLines: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="footerLines">Lignes de pied</Label>
              <Textarea
                id="footerLines"
                value={receiptSettings.footerLines}
                onChange={(e) => setReceiptSettings(prev => ({ ...prev, footerLines: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Gestion des Imprimantes
          </CardTitle>
          <CardDescription>
            Configurez et gérez vos imprimantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {printers.length} imprimante(s) configurée(s)
            </div>
            <Dialog open={showAddPrinter} onOpenChange={setShowAddPrinter}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une imprimante
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une imprimante</DialogTitle>
                  <DialogDescription>
                    Configurez une nouvelle imprimante pour votre pharmacie
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="printer-name">Nom de l'imprimante</Label>
                    <Input
                      id="printer-name"
                      value={newPrinter.name}
                      onChange={(e) => setNewPrinter(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: HP LaserJet Pro 400"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="printer-type">Type</Label>
                      <Select value={newPrinter.type} onValueChange={(value) => setNewPrinter(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="receipt">Reçu</SelectItem>
                          <SelectItem value="thermal">Thermique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="connection-type">Connexion</Label>
                      <Select value={newPrinter.connection_type} onValueChange={(value) => setNewPrinter(prev => ({ ...prev, connection_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usb">USB</SelectItem>
                          <SelectItem value="network">Réseau</SelectItem>
                          <SelectItem value="bluetooth">Bluetooth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newPrinter.connection_type === 'network' && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ip-address">Adresse IP</Label>
                        <Input
                          id="ip-address"
                          value={newPrinter.ip_address}
                          onChange={(e) => setNewPrinter(prev => ({ ...prev, ip_address: e.target.value }))}
                          placeholder="192.168.1.100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="port">Port</Label>
                        <Input
                          id="port"
                          value={newPrinter.port}
                          onChange={(e) => setNewPrinter(prev => ({ ...prev, port: e.target.value }))}
                          placeholder="9100"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="driver-name">Pilote (optionnel)</Label>
                    <Input
                      id="driver-name"
                      value={newPrinter.driver_name}
                      onChange={(e) => setNewPrinter(prev => ({ ...prev, driver_name: e.target.value }))}
                      placeholder="Nom du pilote d'imprimante"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddPrinter(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddPrinter} disabled={!newPrinter.name}>
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {printersLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Chargement des imprimantes...</span>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Connexion</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Aucune imprimante configurée
                      </TableCell>
                    </TableRow>
                  ) : (
                    printers.map((printer) => (
                      <TableRow key={printer.id}>
                        <TableCell className="font-medium">{printer.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {printer.type === 'standard' ? 'Standard' : 
                             printer.type === 'receipt' ? 'Reçu' : 'Thermique'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {printer.connection_type === 'usb' ? 'USB' : 
                           printer.connection_type === 'network' ? 'Réseau' : 'Bluetooth'}
                          {printer.ip_address && ` (${printer.ip_address})`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={printer.is_active ? 'default' : 'secondary'}>
                            {printer.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {printer.is_default && (
                            <Badge variant="outline" className="ml-2">Par défaut</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog open={editingPrinter?.id === printer.id} onOpenChange={(open) => {
                              if (open) {
                                setEditingPrinter(printer);
                              } else {
                                setEditingPrinter(null);
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Modifier l'imprimante</DialogTitle>
                                  <DialogDescription>
                                    Modifiez les paramètres de l'imprimante
                                  </DialogDescription>
                                </DialogHeader>
                                {editingPrinter && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-printer-name">Nom de l'imprimante</Label>
                                      <Input
                                        id="edit-printer-name"
                                        value={editingPrinter.name}
                                        onChange={(e) => setEditingPrinter(prev => ({ ...prev, name: e.target.value }))}
                                      />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-printer-type">Type</Label>
                                        <Select value={editingPrinter.type} onValueChange={(value) => setEditingPrinter(prev => ({ ...prev, type: value }))}>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="standard">Standard</SelectItem>
                                            <SelectItem value="receipt">Reçu</SelectItem>
                                            <SelectItem value="thermal">Thermique</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-connection-type">Connexion</Label>
                                        <Select value={editingPrinter.connection_type} onValueChange={(value) => setEditingPrinter(prev => ({ ...prev, connection_type: value }))}>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="usb">USB</SelectItem>
                                            <SelectItem value="network">Réseau</SelectItem>
                                            <SelectItem value="bluetooth">Bluetooth</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    {editingPrinter.connection_type === 'network' && (
                                      <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-ip-address">Adresse IP</Label>
                                          <Input
                                            id="edit-ip-address"
                                            value={editingPrinter.ip_address || ''}
                                            onChange={(e) => setEditingPrinter(prev => ({ ...prev, ip_address: e.target.value }))}
                                            placeholder="192.168.1.100"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-port">Port</Label>
                                          <Input
                                            id="edit-port"
                                            value={editingPrinter.port || ''}
                                            onChange={(e) => setEditingPrinter(prev => ({ ...prev, port: e.target.value }))}
                                            placeholder="9100"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-driver-name">Pilote (optionnel)</Label>
                                      <Input
                                        id="edit-driver-name"
                                        value={editingPrinter.driver_name || ''}
                                        onChange={(e) => setEditingPrinter(prev => ({ ...prev, driver_name: e.target.value }))}
                                        placeholder="Nom du pilote d'imprimante"
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id="edit-is-active"
                                        checked={editingPrinter.is_active}
                                        onCheckedChange={(checked) => setEditingPrinter(prev => ({ ...prev, is_active: checked }))}
                                      />
                                      <Label htmlFor="edit-is-active">Imprimante active</Label>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEditingPrinter(null)}>
                                    Annuler
                                  </Button>
                                  <Button onClick={handleEditPrinter}>
                                    Modifier
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeletePrinter(printer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrintTest}>
          Test d'impression
        </Button>
        <Button onClick={saveSettings} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Sauvegarder les paramètres
        </Button>
      </div>
    </div>
  );
};

export default PrintSettings;