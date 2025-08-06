import { useState, useEffect } from 'react';
import { SupplyChainAutomationService, StockAlert, SupplyNeed } from '@/services/supplyChainAutomationService';
import { toast } from '@/hooks/use-toast';

export const useSupplyAutomation = () => {
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [supplyNeeds, setSupplyNeeds] = useState<SupplyNeed[]>([]);
  const [lateDeliveries, setLateDeliveries] = useState<Array<{ orderId: string; daysLate: number; supplierName: string }>>([]);
  const [loading, setLoading] = useState(false);

  // Charger les alertes de stock
  const loadStockAlerts = async () => {
    try {
      setLoading(true);
      const alerts = await SupplyChainAutomationService.generateStockAlerts();
      setStockAlerts(alerts);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les alertes de stock",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les besoins d'approvisionnement
  const loadSupplyNeeds = async () => {
    try {
      setLoading(true);
      const needs = await SupplyChainAutomationService.calculateSupplyNeeds();
      setSupplyNeeds(needs);
    } catch (error) {
      console.error('Erreur lors du calcul des besoins:', error);
      toast({
        title: "Erreur",
        description: "Impossible de calculer les besoins d'approvisionnement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Vérifier les livraisons en retard
  const checkLateDeliveries = async () => {
    try {
      const late = await SupplyChainAutomationService.checkLateDeliveries();
      setLateDeliveries(late);
      
      if (late.length > 0) {
        toast({
          title: "Livraisons en retard détectées",
          description: `${late.length} commande(s) en retard`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des retards:', error);
    }
  };

  // Générer automatiquement une commande basée sur les besoins
  const generateAutomaticOrder = async (supplierId: string, needs: SupplyNeed[]) => {
    try {
      setLoading(true);
      const products = needs.map(need => ({
        produit_id: need.produit_id,
        quantite: need.quantite_recommandee,
        prix_unitaire_attendu: need.prix_unitaire_moyen
      }));

      const result = await SupplyChainAutomationService.generatePurchaseOrder(supplierId, products);
      
      if (result.success) {
        toast({
          title: "Commande générée automatiquement",
          description: `Bon de commande créé pour ${needs.length} produit(s)`,
        });
        // Recharger les besoins après la commande
        await loadSupplyNeeds();
        return result.orderId;
      } else {
        throw new Error('Échec de la génération de commande');
      }
    } catch (error) {
      console.error('Erreur lors de la génération automatique:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer la commande automatiquement",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Traiter une réception automatiquement
  const processAutomaticReception = async (receptionData: any) => {
    try {
      setLoading(true);
      const result = await SupplyChainAutomationService.processAutomaticReception(receptionData);
      
      if (result.success) {
        // Mettre à jour les alertes après la réception
        setStockAlerts(result.alerts);
        await loadSupplyNeeds();
        
        toast({
          title: "Réception traitée automatiquement",
          description: "Stocks mis à jour et alertes générées",
        });
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors du traitement automatique:', error);
      toast({
        title: "Erreur",
        description: "Échec du traitement automatique de la réception",
        variant: "destructive"
      });
      return { success: false, alerts: [] };
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour automatiquement le statut d'une commande
  const updateOrderStatus = async (orderId: string, newStatus: string, reason?: string) => {
    try {
      const success = await SupplyChainAutomationService.updateOrderStatus(orderId, newStatus, reason);
      
      if (success) {
        toast({
          title: "Statut mis à jour",
          description: `Commande marquée comme: ${newStatus}`,
        });
        // Vérifier à nouveau les retards après mise à jour
        await checkLateDeliveries();
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
      return false;
    }
  };

  // Charger toutes les données au montage
  useEffect(() => {
    loadStockAlerts();
    loadSupplyNeeds();
    checkLateDeliveries();
  }, []);

  // Vérification périodique des retards (toutes les heures)
  useEffect(() => {
    const interval = setInterval(checkLateDeliveries, 60 * 60 * 1000); // 1 heure
    return () => clearInterval(interval);
  }, []);

  return {
    // Données
    stockAlerts,
    supplyNeeds,
    lateDeliveries,
    loading,
    
    // Actions
    loadStockAlerts,
    loadSupplyNeeds,
    checkLateDeliveries,
    generateAutomaticOrder,
    processAutomaticReception,
    updateOrderStatus,
    
    // Utilitaires
    refresh: async () => {
      await Promise.all([
        loadStockAlerts(),
        loadSupplyNeeds(),
        checkLateDeliveries()
      ]);
    }
  };
};