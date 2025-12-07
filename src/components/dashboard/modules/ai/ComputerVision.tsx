import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, Camera, Upload, Scan, Package, Barcode, Shield, Activity,
  CheckCircle, AlertTriangle, Zap, Brain, Target, Clock, RefreshCw, Download, Settings, Trash2
} from 'lucide-react';
import { useComputerVision } from '@/hooks/useComputerVision';
import { useAuth } from '@/contexts/AuthContext';
import VisionConfigDialog from './dialogs/VisionConfigDialog';
import DetectionDetailDialog from './dialogs/DetectionDetailDialog';
import ShelfAnalysisDetailDialog from './dialogs/ShelfAnalysisDetailDialog';
import QualityControlDetailDialog from './dialogs/QualityControlDetailDialog';
import BatchProcessingDialog from './dialogs/BatchProcessingDialog';
import { exportDetectionsToPDF, exportDetectionsToExcel, exportShelfAnalysisToPDF, exportQualityReportPDF, exportBatchReportPDF } from '@/utils/visionExportUtils';
import type { VisionDetection, ShelfAnalysis, QualityControl } from '@/hooks/useComputerVision';

const ComputerVision = () => {
  const { user } = useAuth();
  const tenantId = user?.pharmacy_id || null;
  
  const {
    metrics, detections, shelfAnalyses, qualityControls, batchRecognitions, config,
    isLoadingMetrics, isProcessing,
    loadMetrics, loadDetections, processImage, verifyDetection, deleteDetection,
    scanShelf, deleteShelfAnalysis, runQualityCheck, startBatchProcessing, saveConfig
  } = useComputerVision(tenantId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState<VisionDetection | null>(null);
  const [selectedShelf, setSelectedShelf] = useState<ShelfAnalysis | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<QualityControl | null>(null);

  const handleImageUpload = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processImage(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'failed': case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 95) return 'text-green-600';
    if (compliance >= 85) return 'text-orange-600';
    return 'text-red-600';
  };

  const typeLabels: Record<string, string> = {
    expiry_date: "Date d'expiration", packaging: "Intégrité emballage",
    barcode: "Code-barres lisible", price_label: "Étiquetage prix"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vision par Ordinateur</h2>
          <p className="text-muted-foreground">IA visuelle pour reconnaissance produits et contrôle qualité</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />Paramètres Vision
          </Button>
          <Button onClick={handleImageUpload} disabled={isProcessing}>
            {isProcessing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {isProcessing ? 'Traitement...' : 'Analyser Image'}
          </Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Images Traitées</CardTitle><Camera className="h-4 w-4 text-muted-foreground" />
        </CardHeader><CardContent><div className="text-2xl font-bold">{metrics.images_processed}</div><p className="text-xs text-muted-foreground">Total analysées</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Précision</CardTitle><Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader><CardContent><div className="text-2xl font-bold">{metrics.average_accuracy}%</div><p className="text-xs text-muted-foreground">Reconnaissance</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle><Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader><CardContent><div className="text-2xl font-bold">{(metrics.avg_processing_time_ms / 1000).toFixed(1)}s</div><p className="text-xs text-muted-foreground">Par image</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Détections Aujourd'hui</CardTitle><Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader><CardContent><div className="text-2xl font-bold">{metrics.detections_today}</div><p className="text-xs text-muted-foreground">Produits identifiés</p></CardContent></Card>
      </div>

      <Tabs defaultValue="product-recognition" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="product-recognition">Reconnaissance</TabsTrigger>
          <TabsTrigger value="shelf-analysis">Étagères</TabsTrigger>
          <TabsTrigger value="quality-control">Contrôle Qualité</TabsTrigger>
          <TabsTrigger value="batch-processing">Traitement Lot</TabsTrigger>
        </TabsList>

        {/* Reconnaissance Tab */}
        <TabsContent value="product-recognition" className="space-y-6">
          <Card><CardHeader>
            <div className="flex items-center justify-between">
              <div><CardTitle className="flex items-center gap-2"><Scan className="h-5 w-5" />Reconnaissance de Produits</CardTitle>
              <CardDescription>IA pour identification automatique des produits pharmaceutiques</CardDescription></div>
              <Button variant="outline" size="sm" onClick={() => exportDetectionsToPDF(detections)}><Download className="h-4 w-4 mr-2" />Exporter</Button>
            </div>
          </CardHeader><CardContent>
            <div className="space-y-4">
              {detections.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune détection. Analysez une image pour commencer.</p>
              ) : detections.map((detection) => (
                <div key={detection.id} className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => setSelectedDetection(detection)}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center"><Package className="h-6 w-6 text-gray-500" /></div>
                    <div><h4 className="font-semibold">{detection.detected_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {detection.detected_barcode && <Badge variant="outline"><Barcode className="h-3 w-3 mr-1" />{detection.detected_barcode}</Badge>}
                        <Badge className={getStatusColor(detection.status)}>{detection.status === 'verified' ? 'Vérifié' : detection.status === 'pending' ? 'En attente' : 'Échec'}</Badge>
                      </div></div>
                  </div>
                  <div className="text-right">
                    {detection.detected_price && <div className="font-bold text-lg">{detection.detected_price} FCFA</div>}
                    <div className="flex items-center gap-2 mt-1"><Progress value={detection.confidence} className="w-16 h-2" /><span className="text-xs">{detection.confidence}%</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2"><Brain className="h-5 w-5 text-blue-600" /><h4 className="font-semibold text-blue-800">Assistant Reconnaissance</h4></div>
              <p className="text-sm text-blue-700 mb-3">Glissez-déposez une image ou cliquez pour identifier automatiquement vos produits</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleImageUpload}><Upload className="h-4 w-4 mr-2" />Télécharger Image</Button>
                <Button size="sm" variant="outline"><Camera className="h-4 w-4 mr-2" />Webcam</Button>
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Étagères Tab */}
        <TabsContent value="shelf-analysis" className="space-y-6">
          <Card><CardHeader>
            <div className="flex items-center justify-between">
              <div><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Analyse des Étagères</CardTitle>
              <CardDescription>Surveillance automatique du merchandising et des stocks</CardDescription></div>
              <Button variant="outline" size="sm" onClick={() => exportShelfAnalysisToPDF(shelfAnalyses)}><Download className="h-4 w-4 mr-2" />Rapport</Button>
            </div>
          </CardHeader><CardContent>
            <div className="space-y-4">
              {shelfAnalyses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune analyse d'étagère.</p>
              ) : shelfAnalyses.map((shelf) => (
                <div key={shelf.id} className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => setSelectedShelf(shelf)}>
                  <div className="flex items-start justify-between mb-3">
                    <div><h4 className="font-semibold">{shelf.shelf_name}</h4><p className="text-sm text-muted-foreground">{shelf.total_products} produits</p></div>
                    <div className="text-right"><div className={`text-2xl font-bold ${getComplianceColor(shelf.compliance_score)}`}>{shelf.compliance_score}%</div><div className="text-sm text-muted-foreground">Conformité</div></div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3 mb-3">
                    <div className="text-center p-2 bg-red-50 rounded"><div className="text-lg font-bold text-red-600">{shelf.stockouts_detected}</div><div className="text-xs text-red-700">Ruptures</div></div>
                    <div className="text-center p-2 bg-orange-50 rounded"><div className="text-lg font-bold text-orange-600">{shelf.misplacements_detected}</div><div className="text-xs text-orange-700">Mal placés</div></div>
                    <div className="text-center p-2 bg-green-50 rounded"><div className="text-lg font-bold text-green-600">{shelf.total_products - shelf.stockouts_detected - shelf.misplacements_detected}</div><div className="text-xs text-green-700">Conformes</div></div>
                  </div>
                  {shelf.issues && shelf.issues.length > 0 && (
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <h5 className="font-medium text-yellow-800 mb-1">Problèmes détectés:</h5>
                      <ul className="text-sm text-yellow-700 space-y-1">{shelf.issues.map((issue, i) => <li key={i} className="flex items-center gap-2"><AlertTriangle className="h-3 w-3" />{issue}</li>)}</ul>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); scanShelf(shelf.shelf_name); }} disabled={isProcessing}><Scan className="h-4 w-4 mr-2" />Scanner</Button>
                    <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); deleteShelfAnalysis(shelf.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              <Button onClick={() => scanShelf('Nouvelle Étagère')} disabled={isProcessing}><Scan className="h-4 w-4 mr-2" />Nouvelle Analyse</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Contrôle Qualité Tab */}
        <TabsContent value="quality-control" className="space-y-6">
          <Card><CardHeader>
            <div className="flex items-center justify-between">
              <div><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Contrôle Qualité Visuel</CardTitle>
              <CardDescription>Vérification automatique de la conformité des produits</CardDescription></div>
              <Button variant="outline" size="sm" onClick={() => exportQualityReportPDF(qualityControls)}><Download className="h-4 w-4 mr-2" />Rapport</Button>
            </div>
          </CardHeader><CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {(['expiry_date', 'packaging', 'barcode', 'price_label'] as const).map((type) => {
                const control = qualityControls.find(c => c.control_type === type);
                return (
                  <div key={type} className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => control && setSelectedQuality(control)}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{typeLabels[type]}</h4>
                      <Badge className={control?.status === 'active' ? 'bg-green-50 text-green-600' : control?.status === 'warning' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-600'}>
                        {control?.status === 'active' ? 'Actif' : control?.status === 'warning' ? 'Attention' : 'Inactif'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span>Éléments vérifiés:</span><span className="font-medium">{control?.checked_items || 0}</span></div>
                      <div className="flex justify-between text-sm"><span>Alertes:</span><span className="font-medium text-red-600">{control?.alerts_generated || 0}</span></div>
                      <div className="flex justify-between text-sm"><span>Précision:</span><span className="font-medium">{control?.accuracy || 0}%</span></div>
                    </div>
                    <Progress value={control?.accuracy || 0} className="mt-3" />
                    <Button size="sm" className="mt-3 w-full" onClick={(e) => { e.stopPropagation(); runQualityCheck(type); }} disabled={isProcessing}>
                      <RefreshCw className="h-4 w-4 mr-2" />Lancer contrôle
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Traitement Lot Tab */}
        <TabsContent value="batch-processing" className="space-y-6">
          <Card><CardHeader>
            <div className="flex items-center justify-between">
              <div><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" />Traitement par Lots</CardTitle>
              <CardDescription>Reconnaissance en masse pour inventaires et réceptions</CardDescription></div>
              <Button variant="outline" size="sm" onClick={() => exportBatchReportPDF(batchRecognitions)}><Download className="h-4 w-4 mr-2" />Rapport</Button>
            </div>
          </CardHeader><CardContent>
            <div className="space-y-4">
              {batchRecognitions.map((batch) => (
                <div key={batch.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div><h4 className="font-semibold">{batch.batch_name}</h4><p className="text-sm text-muted-foreground">Précision: {batch.accuracy}%</p></div>
                    <Badge className="bg-blue-50 text-blue-600">{batch.total_items} items</Badge>
                  </div>
                  <div className="grid gap-2 md:grid-cols-5 mb-3">
                    <div className="text-center p-2 bg-green-50 rounded"><div className="text-lg font-bold text-green-600">{batch.recognized_count}</div><div className="text-xs text-green-700">Reconnus</div></div>
                    <div className="text-center p-2 bg-red-50 rounded"><div className="text-lg font-bold text-red-600">{batch.failed_count}</div><div className="text-xs text-red-700">Échecs</div></div>
                    <div className="text-center p-2 bg-orange-50 rounded"><div className="text-lg font-bold text-orange-600">{batch.duplicates_count}</div><div className="text-xs text-orange-700">Doublons</div></div>
                    <div className="text-center p-2 bg-blue-50 rounded"><div className="text-lg font-bold text-blue-600">{batch.new_products_count}</div><div className="text-xs text-blue-700">Nouveaux</div></div>
                    <div className="text-center p-2 bg-purple-50 rounded"><div className="text-lg font-bold text-purple-600">{batch.accuracy}%</div><div className="text-xs text-purple-700">Précision</div></div>
                  </div>
                  <Progress value={(batch.recognized_count / batch.total_items) * 100} />
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2"><CheckCircle className="h-5 w-5 text-green-600" /><h4 className="font-semibold text-green-800">Nouveau Lot</h4></div>
              <p className="text-sm text-green-700 mb-3">Prêt à traiter un nouveau lot d'images pour reconnaissance en masse</p>
              <Button size="sm" onClick={() => setBatchOpen(true)}><Upload className="h-4 w-4 mr-2" />Démarrer Nouveau Lot</Button>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <VisionConfigDialog open={configOpen} onOpenChange={setConfigOpen} config={config} onSave={saveConfig} />
      <DetectionDetailDialog open={!!selectedDetection} onOpenChange={() => setSelectedDetection(null)} detection={selectedDetection} onVerify={verifyDetection} onDelete={deleteDetection} />
      <ShelfAnalysisDetailDialog open={!!selectedShelf} onOpenChange={() => setSelectedShelf(null)} analysis={selectedShelf} onDelete={deleteShelfAnalysis} />
      <QualityControlDetailDialog open={!!selectedQuality} onOpenChange={() => setSelectedQuality(null)} control={selectedQuality} onRunCheck={runQualityCheck} />
      <BatchProcessingDialog open={batchOpen} onOpenChange={setBatchOpen} onStartBatch={startBatchProcessing} isProcessing={isProcessing} />
    </div>
  );
};

export default ComputerVision;
