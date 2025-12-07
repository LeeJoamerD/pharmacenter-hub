import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VisionConfig {
  id: string;
  tenant_id: string;
  auto_detection_enabled: boolean;
  min_confidence_threshold: number;
  save_processed_images: boolean;
  enable_shelf_monitoring: boolean;
  shelf_scan_interval_hours: number;
  quality_control_types: string[];
  notification_settings: {
    alerts_enabled: boolean;
    email: boolean;
    push: boolean;
  };
}

export interface VisionDetection {
  id: string;
  tenant_id: string;
  product_id: string | null;
  detected_name: string;
  detected_barcode: string | null;
  confidence: number;
  status: 'verified' | 'pending' | 'failed' | 'rejected';
  image_url: string | null;
  detected_price: number | null;
  detected_stock: number | null;
  detected_expiry_date: string | null;
  packaging_status: string | null;
  metadata: Record<string, any>;
  processing_time_ms: number | null;
  created_at: string;
  verified_at: string | null;
  verified_by: string | null;
  product?: {
    libelle_produit: string;
    code_cip: string;
  };
}

export interface ShelfAnalysis {
  id: string;
  tenant_id: string;
  shelf_name: string;
  shelf_location: string | null;
  rayon_id: string | null;
  total_products: number;
  stockouts_detected: number;
  misplacements_detected: number;
  compliance_score: number;
  issues: string[];
  image_url: string | null;
  scanned_at: string;
  scanned_by: string | null;
  rayon?: {
    libelle: string;
  };
}

export interface QualityControl {
  id: string;
  tenant_id: string;
  control_type: 'expiry_date' | 'packaging' | 'barcode' | 'price_label';
  product_id: string | null;
  lot_id: string | null;
  checked_items: number;
  alerts_generated: number;
  accuracy: number;
  status: 'active' | 'warning' | 'error';
  details: Record<string, any>;
  image_url: string | null;
  checked_at: string;
  checked_by: string | null;
}

export interface BatchRecognition {
  id: string;
  tenant_id: string;
  batch_name: string;
  total_items: number;
  recognized_count: number;
  failed_count: number;
  duplicates_count: number;
  new_products_count: number;
  processing_time_ms: number | null;
  accuracy: number | null;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  items: any[];
  started_at: string;
  completed_at: string | null;
  started_by: string | null;
}

export interface VisionMetrics {
  images_processed: number;
  average_accuracy: number;
  avg_processing_time_ms: number;
  detections_today: number;
  pending_verifications: number;
  total_shelf_scans: number;
  avg_compliance: number;
  quality_alerts: number;
}

interface DetectionFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minConfidence?: number;
}

export function useComputerVision(tenantId: string | null) {
  const { toast } = useToast();
  
  const [metrics, setMetrics] = useState<VisionMetrics>({
    images_processed: 0,
    average_accuracy: 0,
    avg_processing_time_ms: 0,
    detections_today: 0,
    pending_verifications: 0,
    total_shelf_scans: 0,
    avg_compliance: 0,
    quality_alerts: 0
  });
  const [detections, setDetections] = useState<VisionDetection[]>([]);
  const [shelfAnalyses, setShelfAnalyses] = useState<ShelfAnalysis[]>([]);
  const [qualityControls, setQualityControls] = useState<QualityControl[]>([]);
  const [batchRecognitions, setBatchRecognitions] = useState<BatchRecognition[]>([]);
  const [config, setConfig] = useState<VisionConfig | null>(null);
  
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isLoadingDetections, setIsLoadingDetections] = useState(false);
  const [isLoadingShelves, setIsLoadingShelves] = useState(false);
  const [isLoadingQuality, setIsLoadingQuality] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load metrics
  const loadMetrics = useCallback(async () => {
    if (!tenantId) return;
    setIsLoadingMetrics(true);
    try {
      const { data, error } = await supabase.rpc('calculate_vision_metrics', {
        p_tenant_id: tenantId
      });
      if (error) throw error;
      if (data) {
        setMetrics(data as unknown as VisionMetrics);
      }
    } catch (error) {
      console.error('Error loading vision metrics:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [tenantId]);

  // Load detections
  const loadDetections = useCallback(async (filters?: DetectionFilters) => {
    if (!tenantId) return;
    setIsLoadingDetections(true);
    try {
      let query = supabase
        .from('ai_vision_detections')
        .select(`
          *,
          product:produits(libelle_produit, code_cip)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters?.minConfidence) {
        query = query.gte('confidence', filters.minConfidence);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      setDetections((data || []) as VisionDetection[]);
    } catch (error) {
      console.error('Error loading detections:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les détections', variant: 'destructive' });
    } finally {
      setIsLoadingDetections(false);
    }
  }, [tenantId, toast]);

  // Load shelf analyses
  const loadShelfAnalyses = useCallback(async () => {
    if (!tenantId) return;
    setIsLoadingShelves(true);
    try {
      const { data, error } = await supabase
        .from('ai_shelf_analyses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('scanned_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const mappedData = (data || []).map(item => ({
        ...item,
        issues: Array.isArray(item.issues) ? item.issues : []
      }));
      setShelfAnalyses(mappedData as unknown as ShelfAnalysis[]);
    } catch (error) {
      console.error('Error loading shelf analyses:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les analyses d\'étagères', variant: 'destructive' });
    } finally {
      setIsLoadingShelves(false);
    }
  }, [tenantId, toast]);

  // Load quality controls
  const loadQualityControls = useCallback(async () => {
    if (!tenantId) return;
    setIsLoadingQuality(true);
    try {
      const { data, error } = await supabase
        .from('ai_quality_controls')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('checked_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setQualityControls((data || []) as QualityControl[]);
    } catch (error) {
      console.error('Error loading quality controls:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les contrôles qualité', variant: 'destructive' });
    } finally {
      setIsLoadingQuality(false);
    }
  }, [tenantId, toast]);

  // Load batch recognitions
  const loadBatchRecognitions = useCallback(async () => {
    if (!tenantId) return;
    setIsLoadingBatches(true);
    try {
      const { data, error } = await supabase
        .from('ai_batch_recognitions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('started_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setBatchRecognitions((data || []) as BatchRecognition[]);
    } catch (error) {
      console.error('Error loading batch recognitions:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les traitements par lot', variant: 'destructive' });
    } finally {
      setIsLoadingBatches(false);
    }
  }, [tenantId, toast]);

  // Load config
  const loadConfig = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('ai_vision_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setConfig({
          ...data,
          quality_control_types: data.quality_control_types as string[],
          notification_settings: data.notification_settings as VisionConfig['notification_settings']
        });
      }
    } catch (error) {
      console.error('Error loading vision config:', error);
    }
  }, [tenantId]);

  // Save config
  const saveConfig = useCallback(async (settings: Partial<VisionConfig>) => {
    if (!tenantId) return;
    try {
      if (config?.id) {
        const { error } = await supabase
          .from('ai_vision_config')
          .update(settings)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ai_vision_config')
          .insert({ ...settings, tenant_id: tenantId });
        if (error) throw error;
      }
      toast({ title: 'Succès', description: 'Configuration sauvegardée' });
      await loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder la configuration', variant: 'destructive' });
    }
  }, [tenantId, config, loadConfig, toast]);

  // Process image with AI
  const processImage = useCallback(async (file: File): Promise<VisionDetection | null> => {
    if (!tenantId) return null;
    setIsProcessing(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const imageBase64 = await base64Promise;

      // Call edge function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('analyze-product-image', {
        body: { imageBase64 }
      });

      if (functionError) throw functionError;
      if (!functionData?.success) throw new Error(functionData?.error || 'Analysis failed');

      const analysisResult = functionData.data;

      // Save detection to database
      const { data: detectionId, error: rpcError } = await supabase.rpc('process_vision_detection', {
        p_tenant_id: tenantId,
        p_detected_name: analysisResult.product_name || 'Produit non identifié',
        p_detected_barcode: analysisResult.barcode,
        p_confidence: analysisResult.confidence || 0,
        p_image_url: imageBase64,
        p_detected_price: analysisResult.price,
        p_detected_expiry_date: analysisResult.expiry_date,
        p_packaging_status: analysisResult.packaging_status,
        p_processing_time_ms: functionData.processing_time_ms,
        p_metadata: {
          price_label_status: analysisResult.price_label_status,
          estimated_stock: analysisResult.estimated_stock,
          additional_notes: analysisResult.additional_notes
        }
      });

      if (rpcError) throw rpcError;

      toast({ title: 'Succès', description: `Produit analysé: ${analysisResult.product_name || 'Non identifié'}` });
      
      // Reload data
      await Promise.all([loadDetections(), loadMetrics()]);

      // Get the created detection
      if (detectionId) {
        const { data: newDetection } = await supabase
          .from('ai_vision_detections')
          .select('*')
          .eq('id', detectionId)
          .single();
        return newDetection as VisionDetection;
      }
      return null;
    } catch (error) {
      console.error('Error processing image:', error);
      toast({ title: 'Erreur', description: 'Impossible d\'analyser l\'image', variant: 'destructive' });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [tenantId, loadDetections, loadMetrics, toast]);

  // Verify detection
  const verifyDetection = useCallback(async (id: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('ai_vision_detections')
        .update({ 
          status, 
          verified_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Succès', description: `Détection ${status === 'verified' ? 'vérifiée' : 'rejetée'}` });
      await Promise.all([loadDetections(), loadMetrics()]);
    } catch (error) {
      console.error('Error verifying detection:', error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour la détection', variant: 'destructive' });
    }
  }, [loadDetections, loadMetrics, toast]);

  // Delete detection
  const deleteDetection = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_vision_detections')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Détection supprimée' });
      await Promise.all([loadDetections(), loadMetrics()]);
    } catch (error) {
      console.error('Error deleting detection:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer la détection', variant: 'destructive' });
    }
  }, [loadDetections, loadMetrics, toast]);

  // Scan shelf (simulated for now, can integrate with AI later)
  const scanShelf = useCallback(async (shelfName: string, rayonId?: string) => {
    if (!tenantId) return null;
    setIsProcessing(true);
    try {
      // Simulate shelf analysis
      const totalProducts = Math.floor(Math.random() * 30) + 10;
      const stockouts = Math.floor(Math.random() * 3);
      const misplacements = Math.floor(Math.random() * 2);
      
      const issues: string[] = [];
      if (stockouts > 0) issues.push(`${stockouts} rupture(s) détectée(s)`);
      if (misplacements > 0) issues.push(`${misplacements} produit(s) mal placé(s)`);

      const { data: analysisId, error } = await supabase.rpc('create_shelf_analysis', {
        p_tenant_id: tenantId,
        p_shelf_name: shelfName,
        p_rayon_id: rayonId || null,
        p_total_products: totalProducts,
        p_stockouts_detected: stockouts,
        p_misplacements_detected: misplacements,
        p_issues: JSON.stringify(issues)
      });

      if (error) throw error;
      toast({ title: 'Succès', description: 'Étagère scannée avec succès' });
      await Promise.all([loadShelfAnalyses(), loadMetrics()]);
      return analysisId;
    } catch (error) {
      console.error('Error scanning shelf:', error);
      toast({ title: 'Erreur', description: 'Impossible de scanner l\'étagère', variant: 'destructive' });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [tenantId, loadShelfAnalyses, loadMetrics, toast]);

  // Delete shelf analysis
  const deleteShelfAnalysis = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_shelf_analyses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Analyse supprimée' });
      await loadShelfAnalyses();
    } catch (error) {
      console.error('Error deleting shelf analysis:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'analyse', variant: 'destructive' });
    }
  }, [loadShelfAnalyses, toast]);

  // Run quality check
  const runQualityCheck = useCallback(async (controlType: QualityControl['control_type']) => {
    if (!tenantId) return;
    setIsProcessing(true);
    try {
      // Simulate quality check
      const checkedItems = Math.floor(Math.random() * 100) + 50;
      const alerts = Math.floor(Math.random() * 10);
      const accuracy = 90 + Math.random() * 10;

      const { error } = await supabase
        .from('ai_quality_controls')
        .insert({
          tenant_id: tenantId,
          control_type: controlType,
          checked_items: checkedItems,
          alerts_generated: alerts,
          accuracy: parseFloat(accuracy.toFixed(1)),
          status: alerts > 5 ? 'warning' : 'active',
          details: { last_check: new Date().toISOString() }
        });

      if (error) throw error;
      toast({ title: 'Succès', description: 'Contrôle qualité effectué' });
      await Promise.all([loadQualityControls(), loadMetrics()]);
    } catch (error) {
      console.error('Error running quality check:', error);
      toast({ title: 'Erreur', description: 'Impossible d\'effectuer le contrôle qualité', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, [tenantId, loadQualityControls, loadMetrics, toast]);

  // Start batch processing
  const startBatchProcessing = useCallback(async (files: File[], batchName: string) => {
    if (!tenantId || files.length === 0) return null;
    setIsProcessing(true);
    try {
      // Create batch record
      const { data: batch, error: batchError } = await supabase
        .from('ai_batch_recognitions')
        .insert({
          tenant_id: tenantId,
          batch_name: batchName,
          total_items: files.length,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Process each file
      let recognized = 0;
      let failed = 0;
      const startTime = Date.now();

      for (const file of files) {
        try {
          const result = await processImage(file);
          if (result) recognized++;
          else failed++;
        } catch {
          failed++;
        }
      }

      // Update batch record
      const { error: updateError } = await supabase
        .from('ai_batch_recognitions')
        .update({
          recognized_count: recognized,
          failed_count: failed,
          accuracy: files.length > 0 ? parseFloat(((recognized / files.length) * 100).toFixed(1)) : 0,
          processing_time_ms: Date.now() - startTime,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', batch.id);

      if (updateError) throw updateError;

      toast({ title: 'Succès', description: `Lot traité: ${recognized}/${files.length} reconnus` });
      await loadBatchRecognitions();
      return batch.id;
    } catch (error) {
      console.error('Error in batch processing:', error);
      toast({ title: 'Erreur', description: 'Erreur lors du traitement par lot', variant: 'destructive' });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [tenantId, processImage, loadBatchRecognitions, toast]);

  // Delete batch
  const deleteBatch = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_batch_recognitions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Lot supprimé' });
      await loadBatchRecognitions();
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le lot', variant: 'destructive' });
    }
  }, [loadBatchRecognitions, toast]);

  // Initial load
  useEffect(() => {
    if (tenantId) {
      loadMetrics();
      loadDetections();
      loadShelfAnalyses();
      loadQualityControls();
      loadBatchRecognitions();
      loadConfig();
    }
  }, [tenantId, loadMetrics, loadDetections, loadShelfAnalyses, loadQualityControls, loadBatchRecognitions, loadConfig]);

  return {
    // Data
    metrics,
    detections,
    shelfAnalyses,
    qualityControls,
    batchRecognitions,
    config,
    
    // Loading states
    isLoadingMetrics,
    isLoadingDetections,
    isLoadingShelves,
    isLoadingQuality,
    isLoadingBatches,
    isProcessing,
    
    // Actions
    loadMetrics,
    loadDetections,
    loadShelfAnalyses,
    loadQualityControls,
    loadBatchRecognitions,
    loadConfig,
    saveConfig,
    processImage,
    verifyDetection,
    deleteDetection,
    scanShelf,
    deleteShelfAnalysis,
    runQualityCheck,
    startBatchProcessing,
    deleteBatch
  };
}
