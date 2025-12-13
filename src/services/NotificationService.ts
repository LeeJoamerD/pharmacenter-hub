import { supabase } from '@/integrations/supabase/client';
import { StockAlert } from '@/hooks/useStockAlerts';

export interface NotificationTemplate {
  type: 'stock_faible' | 'critique' | 'rupture' | 'commande_urgente';
  channel: 'email' | 'dashboard' | 'sms';
  subject: string;
  body: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationRecipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  preferences: {
    email_enabled: boolean;
    sms_enabled: boolean;
    dashboard_enabled: boolean;
    urgency_threshold: 'low' | 'medium' | 'high' | 'critical';
  };
}

export class NotificationService {
  /**
   * Get current user's tenant_id
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
      console.error('Erreur lors de la récupération du tenant_id:', error);
      return null;
    }
  }

  /**
   * Get notification templates
   */
  private static getNotificationTemplates(): Record<string, NotificationTemplate> {
    return {
      stock_critique_email: {
        type: 'critique',
        channel: 'email',
        subject: 'URGENT: Stock critique détecté - {produit_name}',
        body: `
          Bonjour,
          
          Une alerte de stock critique a été détectée pour le produit suivant :
          
          Produit: {produit_name}
          Code: {produit_code}
          Stock actuel: {stock_actuel} unités
          Seuil minimum: {stock_minimum} unités
          
          Action requise: Une commande d'urgence est nécessaire pour éviter une rupture de stock.
          
          Cordialement,
          Système de gestion de stock
        `,
        priority: 'critical'
      },
      stock_faible_email: {
        type: 'stock_faible',
        channel: 'email',
        subject: 'Alerte: Stock faible - {produit_name}',
        body: `
          Bonjour,
          
          Le stock du produit suivant est maintenant faible :
          
          Produit: {produit_name}
          Code: {produit_code}
          Stock actuel: {stock_actuel} unités
          Seuil minimum: {stock_minimum} unités
          
          Nous vous recommandons de planifier une commande de réapprovisionnement.
          
          Cordialement,
          Système de gestion de stock
        `,
        priority: 'medium'
      },
      rupture_email: {
        type: 'rupture',
        channel: 'email',
        subject: 'CRITIQUE: Rupture de stock - {produit_name}',
        body: `
          Attention !
          
          Le produit suivant est maintenant en rupture de stock :
          
          Produit: {produit_name}
          Code: {produit_code}
          Stock actuel: 0 unités
          
          Action immédiate requise : Commande d'urgence nécessaire.
          
          Cordialement,
          Système de gestion de stock
        `,
        priority: 'critical'
      },
      commande_urgente_email: {
        type: 'commande_urgente',
        channel: 'email',
        subject: 'Commande d\'urgence créée - {commande_numero}',
        body: `
          Une commande d'urgence a été créée automatiquement :
          
          Numéro de commande: {commande_numero}
          Fournisseur: {fournisseur_name}
          Nombre de produits: {nb_produits}
          Total: {total_amount} F
          
          Veuillez valider et traiter cette commande rapidement.
          
          Cordialement,
          Système de gestion de stock
        `,
        priority: 'high'
      }
    };
  }

  /**
   * Get notification recipients based on role and preferences
   */
  private static async getNotificationRecipients(
    tenantId: string,
    alertType: string,
    urgencyLevel: StockAlert['niveau_urgence']
  ): Promise<NotificationRecipient[]> {
    try {
      // Get personnel with admin or pharmacist roles
      const { data: personnel, error } = await supabase
        .from('personnel')
        .select('id, noms, prenoms, email, telephone_appel, role')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .in('role', ['Admin', 'Pharmacien Titulaire', 'Pharmacien Adjoint', 'Gestionnaire de stock']);

      if (error) throw error;

      return (personnel || []).map(person => ({
        id: person.id,
        name: `${person.prenoms} ${person.noms}`,
        email: person.email,
        phone: person.telephone_appel,
        role: person.role,
        preferences: {
          email_enabled: true, // Default preferences - could be enhanced from settings
          sms_enabled: person.role === 'Admin', // Only admins get SMS by default
          dashboard_enabled: true,
          urgency_threshold: person.role === 'Admin' ? 'low' : 'medium'
        }
      }));

    } catch (error) {
      console.error('Error getting notification recipients:', error);
      return [];
    }
  }

  /**
   * Format notification template with data
   */
  private static formatTemplate(
    template: NotificationTemplate,
    data: Record<string, any>
  ): NotificationTemplate {
    let subject = template.subject;
    let body = template.body;

    // Replace placeholders with actual data
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(data[key]));
      body = body.replace(new RegExp(placeholder, 'g'), String(data[key]));
    });

    return {
      ...template,
      subject,
      body
    };
  }

  /**
   * Send stock alert notification
   */
  static async sendStockAlertNotification(
    alert: StockAlert,
    productData: {
      libelle_produit: string;
      code_cip: string;
    },
    channels: ('email' | 'dashboard' | 'sms')[] = ['dashboard']
  ): Promise<{success: boolean; sent_count: number; errors: string[]}> {
    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) throw new Error('Utilisateur non authentifié');

      const templates = this.getNotificationTemplates();
      const recipients = await this.getNotificationRecipients(tenantId, alert.type, alert.niveau_urgence);
      const errors: string[] = [];
      let sentCount = 0;

      // Filter recipients based on urgency threshold
      const filteredRecipients = recipients.filter(recipient => {
        const thresholds = { low: 1, medium: 2, high: 3, critical: 4 };
        const alertLevel = thresholds[alert.niveau_urgence];
        const userThreshold = thresholds[recipient.preferences.urgency_threshold];
        return alertLevel >= userThreshold;
      });

      // Process each channel
      for (const channel of channels) {
        const templateKey = `${alert.type}_${channel}` as keyof typeof templates;
        const template = templates[templateKey];
        
        if (!template) {
          errors.push(`Template not found for ${alert.type}_${channel}`);
          continue;
        }

        // Format template with alert data
        const formattedTemplate = this.formatTemplate(template, {
          produit_name: productData.libelle_produit,
          produit_code: productData.code_cip,
          stock_actuel: alert.quantite_actuelle,
          stock_minimum: alert.quantite_seuil,
          alert_id: alert.id,
          urgence: alert.niveau_urgence
        });

        // Send to each recipient
        for (const recipient of filteredRecipients) {
          try {
            if (channel === 'email' && recipient.preferences.email_enabled && recipient.email) {
              await this.sendEmailNotification(recipient.email, formattedTemplate);
              sentCount++;
            } else if (channel === 'sms' && recipient.preferences.sms_enabled && recipient.phone) {
              await this.sendSMSNotification(recipient.phone, formattedTemplate);
              sentCount++;
            } else if (channel === 'dashboard' && recipient.preferences.dashboard_enabled) {
              await this.createDashboardNotification(tenantId, recipient.id, alert, formattedTemplate);
              sentCount++;
            }
          } catch (recipientError) {
            errors.push(`Failed to send ${channel} to ${recipient.name}: ${recipientError}`);
          }
        }
      }

      return {
        success: sentCount > 0,
        sent_count: sentCount,
        errors
      };

    } catch (error) {
      console.error('Error sending stock alert notification:', error);
      return {
        success: false,
        sent_count: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Send email notification (mock implementation - would integrate with email service)
   */
  private static async sendEmailNotification(
    email: string,
    template: NotificationTemplate
  ): Promise<void> {
    // This would integrate with an actual email service (SendGrid, AWS SES, etc.)
    console.log('Sending email notification:', {
      to: email,
      subject: template.subject,
      body: template.body,
      priority: template.priority
    });

    // For now, we'll simulate the email sending
    // In production, this would make an actual API call to the email service
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  }

  /**
   * Send SMS notification (mock implementation - would integrate with SMS service)
   */
  private static async sendSMSNotification(
    phone: string,
    template: NotificationTemplate
  ): Promise<void> {
    // This would integrate with an SMS service (Twilio, AWS SNS, etc.)
    console.log('Sending SMS notification:', {
      to: phone,
      message: template.subject, // SMS typically uses just the subject as message
      priority: template.priority
    });

    // Simulate SMS sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Create dashboard notification
   */
  private static async createDashboardNotification(
    tenantId: string,
    recipientId: string,
    alert: StockAlert,
    template: NotificationTemplate
  ): Promise<void> {
    // Store notification in database for dashboard display
    // This could be a separate notifications table if needed
    console.log('Creating dashboard notification:', {
      tenant_id: tenantId,
      recipient_id: recipientId,
      alert_id: alert.id,
      title: template.subject,
      message: template.body,
      priority: template.priority,
      type: template.type,
      read: false,
      created_at: new Date().toISOString()
    });

    // For now, we'll just log it
    // In a full implementation, this would insert into a notifications table
  }

  /**
   * Send order confirmation notification
   */
  static async sendOrderNotification(
    orderData: {
      numero_commande: string;
      fournisseur_name: string;
      nb_produits: number;
      total_amount: number;
    },
    channels: ('email' | 'dashboard')[] = ['dashboard']
  ): Promise<{success: boolean; sent_count: number}> {
    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) throw new Error('Utilisateur non authentifié');

      const templates = this.getNotificationTemplates();
      const recipients = await this.getNotificationRecipients(tenantId, 'commande_urgente', 'eleve');
      let sentCount = 0;

      for (const channel of channels) {
        const template = templates[`commande_urgente_${channel}`];
        if (!template) continue;

        const formattedTemplate = this.formatTemplate(template, orderData);

        for (const recipient of recipients) {
          if (channel === 'email' && recipient.email) {
            await this.sendEmailNotification(recipient.email, formattedTemplate);
            sentCount++;
          } else if (channel === 'dashboard') {
            // Create dashboard notification for order
            console.log('Order dashboard notification:', {
              recipient: recipient.name,
              title: formattedTemplate.subject,
              message: formattedTemplate.body
            });
            sentCount++;
          }
        }
      }

      return { success: sentCount > 0, sent_count: sentCount };
    } catch (error) {
      console.error('Error sending order notification:', error);
      return { success: false, sent_count: 0 };
    }
  }
}