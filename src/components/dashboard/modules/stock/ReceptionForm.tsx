import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Package, 
  QrCode, 
  AlertTriangle, 
  CheckCircle, 
  Save, 
  Truck,
  Calendar,
  FileText,
  Camera
} from 'lucide-react';
import { useOrderLines } from '@/hooks/useOrderLines';
import { useReceptionLines } from '@/hooks/useReceptionLines';
import { useToast } from '@/hooks/use-toast';
import { ReceptionValidationService } from '@/services/receptionValidationService';

interface ReceptionLine {
  id: string;
  produit: string;
  reference: string;
  quantiteCommandee: number;
  quantiteRecue: number;
  quantiteAcceptee: number;
  numeroLot: string;
  dateExpiration: string;
  statut: 'conforme' | 'non-conforme' | 'partiellement-conforme';
  commentaire: string;
}

interface ReceptionFormProps {
  orders: any[];
  suppliers: any[];
  onCreateReception: (receptionData: any) => Promise<any>;
  loading: boolean;
}

const ReceptionForm: React.FC<ReceptionFormProps> = ({ orders: propOrders = [], suppliers: propSuppliers = [], onCreateReception, loading }) => {
  const [selectedOrder, setSelectedOrder] = useState('');
  const [receptionLines, setReceptionLines] = useState<ReceptionLine[]>([]);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [bonLivraison, setBonLivraison] = useState('');
  const [transporteur, setTransporteur] = useState('');
  const [observations, setObservations] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingValidation, setPendingValidation] = useState<{ isValidated: boolean; warnings: string[] } | null>(null);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();
  
  const { orderLines } = useOrderLines(selectedOrder);
  const { createReceptionLine } = useReceptionLines();

  // Use real orders with pending status
  const pendingOrders = propOrders.filter(order => 
    ['En cours', 'Confirmé', 'Expédié'].includes(order.statut)
  ).map(order => ({
    ...order,
    numero: `CMD-${new Date(order.date_commande || order.created_at).getFullYear()}-${String(order.id).slice(-3).padStart(3, '0')}`,
    fournisseur: order.fournisseur?.nom || 'Fournisseur inconnu',
    datePrevue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));

  // Load order details from real data
  const loadOrderDetails = (orderId: string) => {
    const lines: ReceptionLine[] = orderLines.map(line => ({
      id: line.id,
      produit: line.produit?.libelle_produit || 'Produit inconnu',
      reference: line.produit?.code_cip || 'N/A',
      quantiteCommandee: line.quantite_commandee,
      quantiteRecue: line.quantite_commandee, // Default to commanded quantity
      quantiteAcceptee: line.quantite_commandee,
      numeroLot: '',
      dateExpiration: '',
      statut: 'conforme',
      commentaire: ''
    }));
    setReceptionLines(lines);
  };

  const updateReceptionLine = (id: string, field: keyof ReceptionLine, value: any) => {
    setReceptionLines(lines => lines.map(line => {
      if (line.id === id) {
        const updatedLine = { ...line, [field]: value };
        
        // Déterminer automatiquement le statut
        if (updatedLine.quantiteRecue === updatedLine.quantiteCommandee && updatedLine.quantiteAcceptee === updatedLine.quantiteRecue) {
          updatedLine.statut = 'conforme';
        } else if (updatedLine.quantiteAcceptee > 0) {
          updatedLine.statut = 'partiellement-conforme';
        } else {
          updatedLine.statut = 'non-conforme';
        }
        
        return updatedLine;
      }
      return line;
    }));
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'conforme': return 'bg-green-100 text-green-800';
      case 'partiellement-conforme': return 'bg-orange-100 text-orange-800';
      case 'non-conforme': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'conforme': return <CheckCircle className="h-4 w-4" />;
      case 'partiellement-conforme': return <AlertTriangle className="h-4 w-4" />;
      case 'non-conforme': return <AlertTriangle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const handleBarcodeSubmit = () => {
    if (!scannedBarcode.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir ou scanner un code-barres",
        variant: "destructive",
      });
      return;
    }

    // Chercher le produit dans les lignes de commande
    const matchingOrderLine = orderLines.find(ol => 
      ol.produit?.code_cip === scannedBarcode.trim()
    );

    if (!matchingOrderLine) {
      toast({
        title: "Produit non trouvé",
        description: `Aucun produit avec le code ${scannedBarcode} dans cette commande`,
        variant: "destructive",
      });
      setScannedBarcode('');
      return;
    }

    // Mettre à jour la ligne correspondante
    const existingLine = receptionLines.find(rl => rl.id === matchingOrderLine.id);
    if (existingLine) {
      updateReceptionLine(existingLine.id, 'quantiteRecue', existingLine.quantiteRecue + 1);
      updateReceptionLine(existingLine.id, 'quantiteAcceptee', existingLine.quantiteAcceptee + 1);
      
      toast({
        title: "Produit traité",
        description: `${matchingOrderLine.produit?.libelle_produit} - Quantité incrémentée`,
      });
    }

    setScannedBarcode('');
  };

  const handleCameraOpen = async () => {
    try {
      if ('BarcodeDetector' in window) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setCameraStream(stream);
        setShowCameraDialog(true);
        
        // Initialiser le détecteur de codes-barres
        // @ts-ignore - BarcodeDetector n'est pas encore dans les types TypeScript
        const barcodeDetector = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'qr_code']
        });
        
        // TODO: Implémenter la détection en temps réel
        toast({
          title: "Caméra activée",
          description: "Scanner activé - Dirigez vers un code-barres",
        });
      } else {
        toast({
          title: "Scanner non supporté",
          description: "Utilisez la saisie manuelle ou un lecteur externe",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur caméra",
        description: "Impossible d'accéder à la caméra",
        variant: "destructive",
      });
    }
  };

  const handleCameraClose = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraDialog(false);
  };

  const handleSaveReception = async (isValidated: boolean) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      if (!selectedOrder) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner une commande",
          variant: "destructive",
        });
        return;
      }

      const selectedOrderData = pendingOrders.find(o => o.id === selectedOrder);
      if (!selectedOrderData) {
        toast({
          title: "Erreur",
          description: "Commande introuvable",
          variant: "destructive",
        });
        return;
      }

      const receptionData = {
        commande_id: selectedOrder,
        fournisseur_id: selectedOrderData.fournisseur_id,
        date_reception: new Date().toISOString(),
        reference_facture: bonLivraison,
        observations: observations,
        lignes: receptionLines.map(line => ({
          produit_id: orderLines.find(ol => ol.id === line.id)?.produit_id,
          quantite_commandee: line.quantiteCommandee,
          quantite_recue: line.quantiteRecue,
          quantite_acceptee: line.quantiteAcceptee,
          numero_lot: line.numeroLot,
          date_expiration: line.dateExpiration || null,
          statut: line.statut,
          commentaire: line.commentaire
        }))
      };

      // Validation avant enregistrement
      const validation = await ReceptionValidationService.validateReception(receptionData);
      
      if (!validation.isValid) {
        toast({
          title: "Erreurs de validation",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      // Si des avertissements, demander confirmation
      if (validation.warnings.length > 0 && !pendingValidation) {
        setPendingValidation({ isValidated, warnings: validation.warnings });
        setShowWarningDialog(true);
        return;
      }

      await onCreateReception(receptionData);
      
      // Reset form
      setSelectedOrder('');
      setReceptionLines([]);
      setBonLivraison('');
      setTransporteur('');
      setObservations('');
      setPendingValidation(null);
      
      toast({
        title: "Succès",
        description: `Réception ${isValidated ? 'validée' : 'sauvegardée'} avec succès`,
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement de la réception",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmWithWarnings = async () => {
    if (!pendingValidation) return;
    
    setShowWarningDialog(false);
    const { isValidated } = pendingValidation;
    
    try {
      const selectedOrderData = pendingOrders.find(o => o.id === selectedOrder);
      const receptionData = {
        commande_id: selectedOrder,
        fournisseur_id: selectedOrderData!.fournisseur_id,
        date_reception: new Date().toISOString(),
        reference_facture: bonLivraison,
        observations: observations,
        lignes: receptionLines.map(line => ({
          produit_id: orderLines.find(ol => ol.id === line.id)?.produit_id,
          quantite_commandee: line.quantiteCommandee,
          quantite_recue: line.quantiteRecue,
          quantite_acceptee: line.quantiteAcceptee,
          numero_lot: line.numeroLot,
          date_expiration: line.dateExpiration || null,
          statut: line.statut,
          commentaire: line.commentaire
        }))
      };

      await onCreateReception(receptionData);
      
      // Reset form
      setSelectedOrder('');
      setReceptionLines([]);
      setBonLivraison('');
      setTransporteur('');
      setObservations('');
      setPendingValidation(null);
      
      toast({
        title: "Succès",
        description: `Réception ${isValidated ? 'validée' : 'sauvegardée'} avec succès`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement de la réception",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Sélection de commande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Réception de Marchandises
          </CardTitle>
          <CardDescription>Enregistrer la réception d'une commande fournisseur</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="commande">Commande à réceptionner *</Label>
                <Select value={selectedOrder} onValueChange={(value) => {
                  setSelectedOrder(value);
                  loadOrderDetails(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une commande" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingOrders.map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.numero} - {order.fournisseur}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dateReception">Date de réception</Label>
                <Input
                  id="dateReception"
                  type="datetime-local"
                  defaultValue={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="bonLivraison">Bon de livraison</Label>
                 <Input
                   id="bonLivraison"
                   value={bonLivraison}
                   onChange={(e) => setBonLivraison(e.target.value)}
                   placeholder="Numéro du bon de livraison"
                 />
              </div>
              
              <div>
                <Label htmlFor="transporteur">Transporteur</Label>
                 <Input
                   id="transporteur"
                   value={transporteur}
                   onChange={(e) => setTransporteur(e.target.value)}
                   placeholder="Nom du transporteur"
                 />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner de code-barres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner Code-Barres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Scanner ou saisir le code-barres..."
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSubmit()}
              />
            </div>
            <Button onClick={handleBarcodeSubmit}>
              <QrCode className="mr-2 h-4 w-4" />
              Traiter
            </Button>
            <Button variant="outline" onClick={handleCameraOpen}>
              <Camera className="mr-2 h-4 w-4" />
              Caméra
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Détail de la réception */}
      {receptionLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Détail de la Réception</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Commandé</TableHead>
                    <TableHead>Reçu</TableHead>
                    <TableHead>Accepté</TableHead>
                    <TableHead>N° Lot</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Commentaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receptionLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.produit}</TableCell>
                      <TableCell>{line.reference}</TableCell>
                      <TableCell>{line.quantiteCommandee}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.quantiteRecue}
                          onChange={(e) => updateReceptionLine(line.id, 'quantiteRecue', parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.quantiteAcceptee}
                          onChange={(e) => updateReceptionLine(line.id, 'quantiteAcceptee', parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="0"
                          max={line.quantiteRecue}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.numeroLot}
                          onChange={(e) => updateReceptionLine(line.id, 'numeroLot', e.target.value)}
                          className="w-28"
                          placeholder="LOT-XXX"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={line.dateExpiration}
                          onChange={(e) => updateReceptionLine(line.id, 'dateExpiration', e.target.value)}
                          className="w-36"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(line.statut)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(line.statut)}
                          {line.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.commentaire}
                          onChange={(e) => updateReceptionLine(line.id, 'commentaire', e.target.value)}
                          className="w-32"
                          placeholder="Commentaire..."
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contrôle qualité */}
      {receptionLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contrôle Qualité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="emballage" />
                  <Label htmlFor="emballage">Emballage conforme</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="temperature" />
                  <Label htmlFor="temperature">Température respectée</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="etiquetage" />
                  <Label htmlFor="etiquetage">Étiquetage correct</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="observations">Observations générales</Label>
                 <Textarea
                   id="observations"
                   value={observations}
                   onChange={(e) => setObservations(e.target.value)}
                   placeholder="Observations sur l'état général de la livraison..."
                   rows={3}
                 />
              </div>
              
               <div className="flex gap-4 justify-end">
                 <Button 
                   variant="outline"
                   onClick={() => handleSaveReception(false)}
                   disabled={loading || isProcessing || !selectedOrder || receptionLines.length === 0}
                 >
                   <Save className="mr-2 h-4 w-4" />
                   {isProcessing ? 'Traitement...' : 'Sauvegarder'}
                 </Button>
                 <Button
                   onClick={() => handleSaveReception(true)}
                   disabled={loading || isProcessing || !selectedOrder || receptionLines.length === 0}
                 >
                   <CheckCircle className="mr-2 h-4 w-4" />
                   {isProcessing ? 'Validation...' : 'Valider Réception'}
                 </Button>
               </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog d'avertissements */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avertissements détectés</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingValidation?.warnings.map((warning, index) => (
                <div key={index} className="text-amber-600 mb-2">• {warning}</div>
              ))}
              <br />
              Voulez-vous continuer malgré ces avertissements ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowWarningDialog(false);
              setPendingValidation(null);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmWithWarnings}>
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog caméra */}
      <Dialog open={showCameraDialog} onOpenChange={handleCameraClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scanner Code-Barres</DialogTitle>
            <DialogDescription>
              Pointez la caméra vers un code-barres pour le scanner automatiquement
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {cameraStream ? (
              <video 
                autoPlay 
                playsInline 
                className="w-full max-w-sm rounded-lg border"
                ref={(video) => {
                  if (video && cameraStream) {
                    video.srcObject = cameraStream;
                  }
                }}
              />
            ) : (
              <div className="w-full max-w-sm h-64 rounded-lg border flex items-center justify-center text-muted-foreground">
                Initialisation de la caméra...
              </div>
            )}
            <Button onClick={handleCameraClose} variant="outline">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceptionForm;