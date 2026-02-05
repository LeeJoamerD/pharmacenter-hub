 import { supabase } from '@/integrations/supabase/client';
 
 // ============================================
 // Types pour le service réglementaire
 // ============================================
 
 export interface NarcoticProduct {
   id: string;
   libelle_produit: string;
   stock_actuel: number;
   stock_critique: number;
   is_stupefiant: boolean;
   derniere_verification?: string;
 }
 
 export interface NarcoticMovement {
   id: string;
   produit_id: string;
   produit_nom?: string;
   lot_id?: string;
   type_mouvement: 'entree' | 'sortie' | 'ajustement' | 'destruction';
   quantite: number;
   stock_avant: number;
   stock_apres: number;
   ordonnance_reference?: string;
   prescripteur?: string;
   patient_reference?: string;
   agent_id?: string;
   agent_nom?: string;
   verified_by?: string;
   verification_date?: string;
   notes?: string;
   created_at: string;
 }
 
 export interface CreateNarcoticMovement {
   tenant_id: string;
   produit_id: string;
   lot_id?: string;
   type_mouvement: 'entree' | 'sortie' | 'ajustement' | 'destruction';
   quantite: number;
   stock_avant: number;
   stock_apres: number;
   ordonnance_reference?: string;
   prescripteur?: string;
   patient_reference?: string;
   agent_id?: string;
   notes?: string;
 }
 
 export interface TrackedLot {
   id: string;
   numero_lot: string;
   produit_nom: string;
   fournisseur_nom: string;
   date_reception: string;
   date_peremption: string;
   quantite_initiale: number;
   quantite_restante: number;
   statut: 'Active' | 'Expirée' | 'Rappelée';
 }
 
 export interface PharmacovigilanceReport {
   id: string;
   produit_id?: string;
   produit_nom?: string;
   patient_age?: number;
   patient_gender?: string;
   effet_indesirable: string;
   gravite: 'mineure' | 'moderee' | 'grave' | 'fatale';
   date_survenue: string;
   date_declaration: string;
   statut: 'en_cours' | 'declare_ansm' | 'clos' | 'suivi';
   suivi_requis: boolean;
   notes?: string;
   declared_by?: string;
   declared_by_nom?: string;
   ansm_reference?: string;
   created_at: string;
 }
 
 export interface CreatePharmacovigilance {
   tenant_id: string;
   produit_id?: string;
   patient_age?: number;
   patient_gender?: string;
   effet_indesirable: string;
   gravite: 'mineure' | 'moderee' | 'grave' | 'fatale';
   date_survenue: string;
   suivi_requis: boolean;
   notes?: string;
   declared_by?: string;
 }
 
 export interface MandatoryReport {
   id: string;
   nom: string;
   type_rapport: string;
   frequence: 'quotidien' | 'hebdomadaire' | 'mensuel' | 'trimestriel' | 'annuel' | 'immediat';
   autorite_destinataire: string;
   prochaine_echeance: string;
   derniere_soumission?: string;
   statut: 'planifie' | 'en_cours' | 'urgent' | 'complete' | 'en_retard';
   responsable_id?: string;
   responsable_nom?: string;
   progression: number;
   notes?: string;
   created_at: string;
 }
 
 export interface CreateMandatoryReport {
   tenant_id: string;
   nom: string;
   type_rapport: string;
   frequence: 'quotidien' | 'hebdomadaire' | 'mensuel' | 'trimestriel' | 'annuel' | 'immediat';
   autorite_destinataire: string;
   prochaine_echeance: string;
   responsable_id?: string;
   notes?: string;
 }
 
 export interface AuditEntry {
   id: string;
   nom: string;
   date: string;
   statut: 'Conforme' | 'Non conforme' | 'Préparation';
   notes?: string;
 }
 
 export interface ComplianceAction {
   id: string;
   titre: string;
   description: string;
   statut: 'en_cours' | 'complete' | 'planifie';
   echeance?: string;
   created_at: string;
 }
 
 export interface ComplianceMetrics {
   conformityRate: number;
   totalStupefiants: number;
   lotsTraces: number;
   rapportsCompletes: number;
   totalRapports: number;
   alertesActives: number;
   auditsReussis: number;
   totalAudits: number;
 }
 
 // ============================================
 // Fonction utilitaire de pagination
 // ============================================
 
 async function fetchAllProduitsStupefiants(tenantId: string): Promise<any[]> {
   let allData: any[] = [];
   let page = 0;
   const pageSize = 1000;
   let hasMore = true;
 
   while (hasMore) {
     const { data, error } = await supabase
       .from('produits')
       .select('id, libelle_produit, is_stupefiant, stock_critique')
       .eq('tenant_id', tenantId)
       .eq('is_stupefiant', true)
       .eq('is_active', true)
       .range(page * pageSize, (page + 1) * pageSize - 1);
 
     if (error) throw error;
 
     if (data && data.length > 0) {
       allData = [...allData, ...data];
       hasMore = data.length === pageSize;
       page++;
     } else {
       hasMore = false;
     }
   }
 
   return allData;
 }
 
 // ============================================
 // Service Réglementaire
 // ============================================
 
 class RegulatoryServiceClass {
   // === STUPÉFIANTS ===
 
   async getNarcoticProducts(tenantId: string): Promise<NarcoticProduct[]> {
     const data = await fetchAllProduitsStupefiants(tenantId);
 
     // Pour chaque produit, calculer le stock actuel via la vue
     const productsWithStock: NarcoticProduct[] = [];
     for (const prod of data) {
       const { data: stockData } = await (supabase
         .from('produits_with_stock' as any)
         .select('stock_actuel')
         .eq('id', prod.id)
         .single() as any);
 
       productsWithStock.push({
         id: prod.id,
         libelle_produit: prod.libelle_produit,
         stock_actuel: stockData?.stock_actuel || 0,
         stock_critique: prod.stock_critique || 10,
         is_stupefiant: true,
         derniere_verification: undefined
       });
     }
 
     return productsWithStock;
   }
 
   async getNarcoticMovements(tenantId: string, productId?: string): Promise<NarcoticMovement[]> {
     let query = supabase
       .from('narcotics_registry')
       .select(`
         *,
         produits(libelle_produit)
       `)
       .eq('tenant_id', tenantId)
       .order('created_at', { ascending: false });
 
     if (productId) {
       query = query.eq('produit_id', productId);
     }
 
     const { data, error } = await query.limit(500);
     if (error) throw error;
 
     return (data || []).map((m: any) => ({
       id: m.id,
       produit_id: m.produit_id,
       produit_nom: m.produits?.libelle_produit,
       lot_id: m.lot_id,
       type_mouvement: m.type_mouvement,
       quantite: m.quantite,
       stock_avant: m.stock_avant,
       stock_apres: m.stock_apres,
       ordonnance_reference: m.ordonnance_reference,
       prescripteur: m.prescripteur,
       patient_reference: m.patient_reference,
       agent_id: m.agent_id,
       agent_nom: undefined, // Personnel join removed - would need separate lookup
       verified_by: m.verified_by,
       verification_date: m.verification_date,
       notes: m.notes,
       created_at: m.created_at
     }));
   }
 
   async addNarcoticMovement(movement: CreateNarcoticMovement): Promise<void> {
     const { error } = await supabase
       .from('narcotics_registry')
       .insert(movement);
     if (error) throw error;
   }
 
   async verifyNarcoticEntry(entryId: string, verifierId: string): Promise<void> {
     const { error } = await supabase
       .from('narcotics_registry')
       .update({
         verified_by: verifierId,
         verification_date: new Date().toISOString()
       })
       .eq('id', entryId);
     if (error) throw error;
   }
 
   // === TRAÇABILITÉ ===
 
   async getTrackedLots(tenantId: string, limit = 100): Promise<TrackedLot[]> {
     const { data, error } = await supabase
       .from('lots')
       .select(`
         id,
         numero_lot,
         date_reception,
         date_peremption,
         quantite_initiale,
         quantite_restante,
         produits(libelle_produit),
         fournisseurs(nom)
       `)
       .eq('tenant_id', tenantId)
       .order('date_reception', { ascending: false })
       .limit(limit);
 
     if (error) throw error;
 
     const today = new Date();
     return (data || []).map((lot: any) => {
       const datePeremption = lot.date_peremption ? new Date(lot.date_peremption) : null;
       let statut: 'Active' | 'Expirée' | 'Rappelée' = 'Active';
       if (datePeremption && datePeremption < today) {
         statut = 'Expirée';
       }
 
       return {
         id: lot.id,
         numero_lot: lot.numero_lot || lot.id.substring(0, 8),
         produit_nom: lot.produits?.libelle_produit || 'Produit inconnu',
         fournisseur_nom: lot.fournisseurs?.nom || 'Fournisseur inconnu',
         date_reception: lot.date_reception || '',
         date_peremption: lot.date_peremption || '',
         quantite_initiale: lot.quantite_initiale || 0,
         quantite_restante: lot.quantite_restante || 0,
         statut
       };
     });
   }
 
   // === PHARMACOVIGILANCE ===
 
   async getPharmacovigilanceReports(tenantId: string): Promise<PharmacovigilanceReport[]> {
     const { data, error } = await supabase
       .from('pharmacovigilance_reports')
       .select(`
         *,
         produits(libelle_produit)
       `)
       .eq('tenant_id', tenantId)
       .order('date_declaration', { ascending: false });
 
     if (error) throw error;
 
     return (data || []).map((r: any) => ({
       id: r.id,
       produit_id: r.produit_id,
       produit_nom: r.produits?.libelle_produit,
       patient_age: r.patient_age,
       patient_gender: r.patient_gender,
       effet_indesirable: r.effet_indesirable,
       gravite: r.gravite,
       date_survenue: r.date_survenue,
       date_declaration: r.date_declaration,
       statut: r.statut,
       suivi_requis: r.suivi_requis,
       notes: r.notes,
       declared_by: r.declared_by,
       declared_by_nom: undefined, // Personnel join removed - would need separate lookup
       ansm_reference: r.ansm_reference,
       created_at: r.created_at
     }));
   }
 
   async createPharmacovigilanceReport(report: CreatePharmacovigilance): Promise<void> {
     const { error } = await supabase
       .from('pharmacovigilance_reports')
       .insert({
         ...report,
         date_declaration: new Date().toISOString().split('T')[0]
       });
     if (error) throw error;
   }
 
   async updatePharmacovigilanceStatus(id: string, statut: string, ansm_reference?: string): Promise<void> {
     const updateData: any = { statut };
     if (ansm_reference) updateData.ansm_reference = ansm_reference;
     
     const { error } = await supabase
       .from('pharmacovigilance_reports')
       .update(updateData)
       .eq('id', id);
     if (error) throw error;
   }
 
   async deletePharmacovigilanceReport(id: string): Promise<void> {
     const { error } = await supabase
       .from('pharmacovigilance_reports')
       .delete()
       .eq('id', id);
     if (error) throw error;
   }
 
   // === RAPPORTS OBLIGATOIRES ===
 
   async getMandatoryReports(tenantId: string): Promise<MandatoryReport[]> {
     const { data, error } = await supabase
       .from('mandatory_reports')
       .select('*')
       .eq('tenant_id', tenantId)
       .order('prochaine_echeance', { ascending: true });
 
     if (error) throw error;
 
     return (data || []).map((r: any) => ({
       id: r.id,
       nom: r.nom,
       type_rapport: r.type_rapport,
       frequence: r.frequence,
       autorite_destinataire: r.autorite_destinataire,
       prochaine_echeance: r.prochaine_echeance,
       derniere_soumission: r.derniere_soumission,
       statut: r.statut,
       responsable_id: r.responsable_id,
       responsable_nom: 'Non assigné', // Personnel join removed - would need separate lookup
       progression: r.progression || 0,
       notes: r.notes,
       created_at: r.created_at
     }));
   }
 
   async createMandatoryReport(report: CreateMandatoryReport): Promise<void> {
     const { error } = await supabase
       .from('mandatory_reports')
       .insert(report);
     if (error) throw error;
   }
 
   async updateReportProgress(id: string, progression: number): Promise<void> {
     const { error } = await supabase
       .from('mandatory_reports')
       .update({ progression })
       .eq('id', id);
     if (error) throw error;
   }
 
   async updateReportStatus(id: string, statut: string): Promise<void> {
     const updateData: any = { statut };
     if (statut === 'complete') {
       updateData.progression = 100;
       updateData.derniere_soumission = new Date().toISOString().split('T')[0];
     }
     
     const { error } = await supabase
       .from('mandatory_reports')
       .update(updateData)
       .eq('id', id);
     if (error) throw error;
   }
 
   async deleteMandatoryReport(id: string): Promise<void> {
     const { error } = await supabase
       .from('mandatory_reports')
       .delete()
       .eq('id', id);
     if (error) throw error;
   }
 
   // === CONFORMITÉ ===
 
   async getComplianceMetrics(tenantId: string): Promise<ComplianceMetrics> {
     // Compter produits stupéfiants
     const { count: stupeCount } = await supabase
       .from('produits')
       .select('id', { count: 'exact', head: true })
       .eq('tenant_id', tenantId)
       .eq('is_stupefiant', true)
       .eq('is_active', true);
 
     // Compter lots tracés
     const { count: lotsCount } = await supabase
       .from('lots')
       .select('id', { count: 'exact', head: true })
       .eq('tenant_id', tenantId);
 
     // Compter rapports obligatoires
     const { data: reportsData } = await supabase
       .from('mandatory_reports')
       .select('statut')
       .eq('tenant_id', tenantId);
 
     const totalRapports = reportsData?.length || 0;
     const rapportsCompletes = reportsData?.filter(r => r.statut === 'complete').length || 0;
 
     // Compter audits
     const { data: auditsData } = await supabase
       .from('audit_reports')
       .select('status')
       .eq('tenant_id', tenantId);
 
     const totalAudits = auditsData?.length || 0;
     const auditsReussis = auditsData?.filter(a => a.status === 'complete' || a.status === 'approved').length || 0;
 
     // Calculer alertes actives (lots expirés, rapports en retard)
     const today = new Date().toISOString().split('T')[0];
     const { count: expiredLots } = await supabase
       .from('lots')
       .select('id', { count: 'exact', head: true })
       .eq('tenant_id', tenantId)
       .lt('date_peremption', today)
       .gt('quantite_restante', 0);
 
     const { count: lateReports } = await supabase
       .from('mandatory_reports')
       .select('id', { count: 'exact', head: true })
       .eq('tenant_id', tenantId)
       .eq('statut', 'en_retard');
 
     const alertesActives = (expiredLots || 0) + (lateReports || 0);
 
     // Calculer taux de conformité
     let conformityRate = 100;
     if (totalRapports > 0) {
       conformityRate = Math.round((rapportsCompletes / totalRapports) * 100);
     }
     if (alertesActives > 0) {
       conformityRate = Math.max(conformityRate - (alertesActives * 5), 50);
     }
 
     return {
       conformityRate,
       totalStupefiants: stupeCount || 0,
       lotsTraces: lotsCount || 0,
       rapportsCompletes,
       totalRapports: Math.max(totalRapports, 1),
       alertesActives,
       auditsReussis,
       totalAudits: Math.max(totalAudits, 1)
     };
   }
 
   async getAuditHistory(tenantId: string): Promise<AuditEntry[]> {
     const { data, error } = await supabase
       .from('audit_reports')
       .select('id, report_name, period_start, status, metadata')
       .eq('tenant_id', tenantId)
       .order('period_start', { ascending: false })
       .limit(20);
 
     if (error) throw error;
 
     return (data || []).map((a: any) => ({
       id: a.id,
       nom: a.report_name || 'Audit',
       date: a.period_start || '',
       statut: a.status === 'complete' || a.status === 'approved' 
         ? 'Conforme' 
         : a.status === 'in_progress' ? 'Préparation' : 'Non conforme',
       notes: typeof a.metadata === 'object' ? JSON.stringify(a.metadata) : undefined
     }));
   }
 
   async getComplianceActions(tenantId: string): Promise<ComplianceAction[]> {
     const { data, error } = await supabase
       .from('compliance_actions')
       .select('id, action_description, action_type, status, due_date, created_at, priority')
       .eq('tenant_id', tenantId)
       .order('due_date', { ascending: true });
 
     if (error) throw error;
 
     return (data || []).map((a: any) => ({
       id: a.id,
       titre: a.action_description || 'Action',
       description: a.action_type || '',
       statut: a.status === 'completed' ? 'complete' : a.status === 'in_progress' ? 'en_cours' : 'planifie',
       echeance: a.due_date,
       created_at: a.created_at
     }));
   }
 
   async createComplianceAction(tenantId: string, titre: string, description: string, echeance?: string): Promise<void> {
     const { error } = await supabase
       .from('compliance_actions')
       .insert([{
         tenant_id: tenantId,
         action_description: description,
         action_type: titre,
         status: 'pending',
         due_date: echeance,
         priority: 'medium',
         control_id: crypto.randomUUID()
       }]);
     if (error) throw error;
   }
 
   async updateComplianceActionStatus(id: string, status: string): Promise<void> {
     const { error } = await supabase
       .from('compliance_actions')
       .update({ status })
       .eq('id', id);
     if (error) throw error;
   }
 }
 
 export const RegulatoryService = new RegulatoryServiceClass();