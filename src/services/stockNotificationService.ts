import { supabase } from '@/integrations/supabase/client';
import { StockSettings } from '@/hooks/useStockSettings';
import { AlertThreshold } from '@/hooks/useAlertThresholds';

export interface AlertSettings {
  email_notifications?: boolean;
  dashboard_notifications?: boolean;
  alert_frequency?: string;
  business_days_only?: boolean;
  alert_start_time?: string;
  alert_end_time?: string;
}

export interface StockNotification {
  id: string;
  type: 'low_stock' | 'critical_stock' | 'out_of_stock' | 'expiration' | 'overstock' | 'slow_moving';
  priority: 'low' | 'medium' | 'high' | 'critical';
  productId: string;
  productName: string;
  message: string;
  currentStock: number;
  threshold?: number;
  expirationDate?: string;
  daysUntilExpiry?: number;
  lotId?: string;
  category?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export class StockNotificationService {
  /**
   * Generate all stock notifications based on current settings
   */
  static async generateNotifications(
    settings: StockSettings,
    thresholds: AlertThreshold[],
    alertSettings?: AlertSettings
  ): Promise<StockNotification[]> {
    const notifications: StockNotification[] = [];

    // Get current tenant ID
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) return [];

    // Generate stock level notifications
    const stockNotifications = await this.generateStockLevelNotifications(tenantId, settings, thresholds);
    notifications.push(...stockNotifications);

    // Generate expiration notifications
    if (settings.track_expiration_dates) {
      const expirationNotifications = await this.generateExpirationNotifications(tenantId, settings);
      notifications.push(...expirationNotifications);
    }

    // Generate slow-moving product notifications
    const slowMovingNotifications = await this.generateSlowMovingNotifications(tenantId, settings);
    notifications.push(...slowMovingNotifications);

    return notifications;
  }

  /**
   * Generate stock level notifications
   */
  private static async generateStockLevelNotifications(
    tenantId: string,
    settings: StockSettings,
    thresholds: AlertThreshold[]
  ): Promise<StockNotification[]> {
    const notifications: StockNotification[] = [];

    // Get products with their current stock levels
    const { data: products, error } = await supabase
      .from('produits')
      .select(`
        id, libelle_produit, famille_id, stock_limite, stock_alerte,
        famille_produit!fk_produits_famille_id(libelle_famille)
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error || !products) return notifications;

    for (const product of products) {
      const currentStock = await this.calculateCurrentStock(product.id);
      const categoryThreshold = this.getCategoryThreshold(
        product.famille_produit?.libelle_famille || 'default',
        thresholds
      );

      const effectiveThreshold = categoryThreshold?.threshold || product.stock_limite || 10;
      const criticalThreshold = Math.floor(effectiveThreshold * 0.3);

      if (currentStock === 0) {
        notifications.push({
          id: `out-of-stock-${product.id}`,
          type: 'out_of_stock',
          priority: 'critical',
          productId: product.id,
          productName: product.libelle_produit,
          message: `Produit en rupture de stock`,
          currentStock,
          threshold: effectiveThreshold,
          category: product.famille_produit?.libelle_famille,
          metadata: { familleId: product.famille_id },
          createdAt: new Date().toISOString()
        });
      } else if (currentStock <= criticalThreshold) {
        notifications.push({
          id: `critical-stock-${product.id}`,
          type: 'critical_stock',
          priority: 'critical',
          productId: product.id,
          productName: product.libelle_produit,
          message: `Stock critique: ${currentStock} unités restantes (seuil: ${criticalThreshold})`,
          currentStock,
          threshold: criticalThreshold,
          category: product.famille_produit?.libelle_famille,
          metadata: { familleId: product.famille_id },
          createdAt: new Date().toISOString()
        });
      } else if (currentStock <= effectiveThreshold) {
        notifications.push({
          id: `low-stock-${product.id}`,
          type: 'low_stock',
          priority: 'high',
          productId: product.id,
          productName: product.libelle_produit,
          message: `Stock faible: ${currentStock} unités restantes (seuil: ${effectiveThreshold})`,
          currentStock,
          threshold: effectiveThreshold,
          category: product.famille_produit?.libelle_famille,
          metadata: { familleId: product.famille_id },
          createdAt: new Date().toISOString()
        });
      } else if (currentStock >= (product.stock_alerte || 100)) {
        notifications.push({
          id: `overstock-${product.id}`,
          type: 'overstock',
          priority: 'medium',
          productId: product.id,
          productName: product.libelle_produit,
          message: `Surstock détecté: ${currentStock} unités (alerte: ${product.stock_alerte})`,
          currentStock,
          threshold: product.stock_alerte,
          category: product.famille_produit?.libelle_famille,
          metadata: { familleId: product.famille_id },
          createdAt: new Date().toISOString()
        });
      }
    }

    return notifications;
  }

  /**
   * Generate expiration notifications
   */
  private static async generateExpirationNotifications(
    tenantId: string,
    settings: StockSettings
  ): Promise<StockNotification[]> {
    const notifications: StockNotification[] = [];
    const alertDays = 30; // Default from settings or expiration parameters

    const { data: expiringLots, error } = await supabase
      .from('lots')
      .select(`
        id, numero_lot, quantite_restante, date_peremption, produit_id,
        produits!inner(id, libelle_produit, famille_id, famille_produit!fk_produits_famille_id(libelle_famille))
      `)
      .eq('tenant_id', tenantId)
      .gt('quantite_restante', 0)
      .not('date_peremption', 'is', null)
      .lte('date_peremption', new Date(Date.now() + alertDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (error || !expiringLots) return notifications;

    for (const lot of expiringLots) {
      const daysUntilExpiry = Math.ceil(
        (new Date(lot.date_peremption).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      let priority: StockNotification['priority'] = 'medium';
      if (daysUntilExpiry <= 0) priority = 'critical';
      else if (daysUntilExpiry <= 7) priority = 'high';

      notifications.push({
        id: `expiration-${lot.id}`,
        type: 'expiration',
        priority,
        productId: lot.produit_id,
        productName: lot.produits.libelle_produit,
        message: daysUntilExpiry <= 0 
          ? `Lot ${lot.numero_lot} expiré (${lot.quantite_restante} unités)`
          : `Lot ${lot.numero_lot} expire dans ${daysUntilExpiry} jours (${lot.quantite_restante} unités)`,
        currentStock: lot.quantite_restante,
        expirationDate: lot.date_peremption,
        daysUntilExpiry,
        lotId: lot.id,
        category: lot.produits.famille_produit?.libelle_famille,
        metadata: { 
          numeroLot: lot.numero_lot,
          familleId: lot.produits.famille_id 
        },
        createdAt: new Date().toISOString()
      });
    }

    return notifications;
  }

  /**
   * Generate slow-moving product notifications
   */
  private static async generateSlowMovingNotifications(
    tenantId: string,
    settings: StockSettings
  ): Promise<StockNotification[]> {
    const notifications: StockNotification[] = [];
    const slowMovingDays = 90; // Default from settings

    const { data: products, error } = await supabase
      .from('produits')
      .select(`
        id, libelle_produit, updated_at,
        famille_produit!fk_produits_famille_id(libelle_famille)
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error || !products) return notifications;

    for (const product of products) {
      const currentStock = await this.calculateCurrentStock(product.id);
      if (currentStock === 0) continue;

      // Check last movement date
      const { data: lastMovement } = await supabase
        .from('stock_mouvements')
        .select('date_mouvement')
        .eq('produit_id', product.id)
        .eq('type_mouvement', 'sortie')
        .order('date_mouvement', { ascending: false })
        .limit(1);

      const lastMovementDate = lastMovement?.[0]?.date_mouvement 
        ? new Date(lastMovement[0].date_mouvement) 
        : new Date(product.updated_at);

      const daysSinceLastMovement = Math.floor(
        (Date.now() - lastMovementDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastMovement >= slowMovingDays && currentStock > 0) {
        notifications.push({
          id: `slow-moving-${product.id}`,
          type: 'slow_moving',
          priority: 'medium',
          productId: product.id,
          productName: product.libelle_produit,
          message: `Produit à rotation lente: ${daysSinceLastMovement} jours sans sortie (${currentStock} unités en stock)`,
          currentStock,
          category: product.famille_produit?.libelle_famille,
          metadata: { 
            daysSinceLastMovement,
            lastMovementDate: lastMovementDate.toISOString()
          },
          createdAt: new Date().toISOString()
        });
      }
    }

    return notifications;
  }

  /**
   * Send notifications based on settings
   */
  static async sendNotifications(
    notifications: StockNotification[],
    settings: StockSettings,
    alertSettings?: AlertSettings
  ): Promise<void> {
    // Filter notifications based on business hours and frequency
    const filteredNotifications = this.filterNotificationsBySchedule(notifications, settings, alertSettings);

    if (filteredNotifications.length === 0) return;

    // Group by priority
    const criticalNotifications = filteredNotifications.filter(n => n.priority === 'critical');
    const highNotifications = filteredNotifications.filter(n => n.priority === 'high');
    const mediumNotifications = filteredNotifications.filter(n => n.priority === 'medium');

    // Send email notifications if enabled
    if (alertSettings?.email_notifications || false) {
      await this.sendEmailNotifications(criticalNotifications, 'critical');
      await this.sendEmailNotifications(highNotifications, 'high');
      if (alertSettings?.alert_frequency === 'daily') {
        await this.sendEmailNotifications(mediumNotifications, 'medium');
      }
    }

    // Store notifications for dashboard display
    if (alertSettings?.dashboard_notifications !== false) {
      await this.storeNotificationsForDashboard(filteredNotifications);
    }
  }

  /**
   * Helper methods
   */
  private static async getCurrentTenantId(): Promise<string | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      return personnel?.tenant_id || null;
    } catch (error) {
      console.error('Error getting tenant ID:', error);
      return null;
    }
  }

  private static async calculateCurrentStock(productId: string): Promise<number> {
    const { data: lots, error } = await supabase
      .from('lots')
      .select('quantite_restante')
      .eq('produit_id', productId)
      .gt('quantite_restante', 0);

    if (error || !lots) return 0;
    return lots.reduce((sum, lot) => sum + lot.quantite_restante, 0);
  }

  private static getCategoryThreshold(
    category: string,
    thresholds: AlertThreshold[]
  ): AlertThreshold | undefined {
    return thresholds.find(t => t.category === category && t.enabled);
  }

  private static filterNotificationsBySchedule(
    notifications: StockNotification[],
    settings: StockSettings,
    alertSettings?: AlertSettings
  ): StockNotification[] {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes / 60;

    // Parse alert time settings
    const startTime = this.parseTime(alertSettings?.alert_start_time || '08:00');
    const endTime = this.parseTime(alertSettings?.alert_end_time || '18:00');

    // Check business days only setting
    if (alertSettings?.business_days_only) {
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Only send critical notifications on weekends
        return notifications.filter(n => n.priority === 'critical');
      }
    }

    // Check business hours
    if (currentTime < startTime || currentTime > endTime) {
      // Only send critical notifications outside business hours
      return notifications.filter(n => n.priority === 'critical');
    }

    return notifications;
  }

  private static parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
  }

  private static async sendEmailNotifications(
    notifications: StockNotification[],
    priority: string
  ): Promise<void> {
    // This would integrate with an email service
    // For now, we'll log the notifications
    console.log(`Sending ${priority} email notifications:`, notifications);
  }

  private static async storeNotificationsForDashboard(
    notifications: StockNotification[]
  ): Promise<void> {
    // Store notifications in a dashboard_notifications table or similar
    // For now, we'll log them
    console.log('Storing dashboard notifications:', notifications);
  }
}