Lovable  
11:38 PM on Oct 20  
Thought for 19 seconds

Je vais analyser en profondeur la section "Caisse" du module "Vente" pour élaborer un plan détaillé d'implémentation et de finalisation. Laissez-moi d'abord examiner tous les fichiers concernés.

Show all

5 tools used

Laissez-moi maintenant examiner la structure de la base de données pour voir quelles tables existent déjà pour le module caisse:

Show all

12 tools used

# 📋 PLAN DÉTAILLÉ D'IMPLÉMENTATION ET DE FINALISATION

## Section "Caisse" \- Module Vente

---

## 🔍 DIAGNOSTIC COMPLET DE L'EXISTANT

### ✅ État Actuel du Frontend

Flowchart :   
![][image1]

Composants Frontend Existants:

* ✅ `CashManagement.tsx` \- Composant principal avec 4 onglets  
* ✅ `CashSessionForm.tsx` \- Formulaire ouverture/fermeture session  
* ✅ `CashMovementForm.tsx` \- Formulaire enregistrement mouvements  
* ✅ `CashSessionList.tsx` \- Liste des sessions avec détails  
* ✅ `CashReport.tsx` \- Rapport détaillé de session  
* ✅ `useCashRegister.ts` \- Hook custom pour la logique métier  
* ✅ `useSalesSettings.ts` \- Hook pour les paramètres système

### ✅ Tables Supabase Existantes

\-- Table: sessions\_caisse  
CREATE TABLE sessions\_caisse (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  tenant\_id UUID NOT NULL,  
  caissier\_id UUID NOT NULL,  
  numero\_session TEXT NOT NULL,  
  date\_ouverture TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
  date\_fermeture TIMESTAMP WITH TIME ZONE,  
  fond\_caisse\_ouverture NUMERIC DEFAULT 0.00,  
  montant\_theorique\_fermeture NUMERIC,  
  montant\_reel\_fermeture NUMERIC,  
  ecart NUMERIC,  
  statut TEXT DEFAULT 'Ouverte',  
  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
  updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- Table: mouvements\_caisse  
CREATE TABLE mouvements\_caisse (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  tenant\_id UUID NOT NULL,  
  session\_caisse\_id UUID NOT NULL,  
  type\_mouvement TEXT NOT NULL,  
  montant NUMERIC NOT NULL,  
  reference\_id UUID,  
  reference\_type TEXT,  
  description TEXT,  
  agent\_id UUID,  
  date\_mouvement TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
  updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

### ✅ Paramètres Système Existants

`{`  
  `"sales_register": {`  
    `"requireOpeningAmount": false,`  
    `"defaultOpeningAmount": 50000,`  
    `"enableCashDrawer": false,`  
    `"alertLowCash": true,`  
    `"lowCashThreshold": 20000,`  
    `"enableMultipleUsers": true,`  
    `"sessionTimeout": 480`  
  `}`  
`}`

### ❌ Problèmes Identifiés

| Catégorie | Problème | Impact | Priorité |
| ----- | ----- | ----- | ----- |
| Backend | Aucune connexion à Supabase | 🔴 Critique | P0 |
| Données | Données mockées en mémoire | 🔴 Critique | P0 |
| Multi-tenant | Pas de gestion tenant\_id | 🔴 Critique | P0 |
| Sécurité | Pas de RLS policies | 🔴 Critique | P0 |
| Personnel | ID agents hardcodés | 🔴 Critique | P0 |
| Validation | Pas de validation des montants | 🟡 Élevée | P1 |
| Erreurs | Gestion d'erreurs minimale | 🟡 Élevée | P1 |
| UX | Pas de feedback utilisateur | 🟢 Moyenne | P2  |

## 🎯 OBJECTIFS DE FINALISATION

### 1\. Connexion Base de Données Complète

* Remplacer toutes les données mock par des requêtes Supabase  
* Implémenter les opérations CRUD complètes  
* Gérer les relations entre tables

### 2\. Gestion Multi-Tenant Robuste

* Utiliser `useTenant()` pour récupérer le tenant\_id  
* Filtrer toutes les données par tenant  
* Implémenter les RLS policies

### 3\. Intégration Personnel/Caissiers

* Récupérer les agents depuis la table `personnel`  
* Filtrer par rôle et statut actif  
* Associer correctement les sessions aux caissiers

### 4\. Paramètres Système

* Intégrer les paramètres de `sales_register`  
* Appliquer les valeurs par défaut  
* Valider selon les contraintes

### 5\. Opérations Métier Complètes

* Ouverture de session avec validations  
* Enregistrement de mouvements  
* Fermeture avec calculs automatiques  
* Génération de rapports détaillés

### 6\. Expérience Utilisateur Professionnelle

* Messages de succès/erreur clairs  
* États de chargement  
* Validation en temps réel  
* Actualisation automatique  
* automatique

---

## 📐 ARCHITECTURE DE SOLUTION

Flowchart

---

## 🔧 PLAN D'IMPLÉMENTATION DÉTAILLÉ

### PHASE 1: Préparation de la Base de Données ⏱️ 30min

#### 1.1 Créer les RLS Policies

\-- Policy pour sessions\_caisse

CREATE POLICY "Users can view their tenant's cash sessions"

ON sessions\_caisse FOR SELECT

USING (tenant\_id \= get\_current\_user\_tenant\_id());

CREATE POLICY "Users can create cash sessions for their tenant"

ON sessions\_caisse FOR INSERT

WITH CHECK (tenant\_id \= get\_current\_user\_tenant\_id());

CREATE POLICY "Users can update their tenant's cash sessions"

ON sessions\_caisse FOR UPDATE

USING (tenant\_id \= get\_current\_user\_tenant\_id());

\-- Policy pour mouvements\_caisse

CREATE POLICY "Users can view their tenant's cash movements"

ON mouvements\_caisse FOR SELECT

USING (tenant\_id \= get\_current\_user\_tenant\_id());

CREATE POLICY "Users can create cash movements for their tenant"

ON mouvements\_caisse FOR INSERT

WITH CHECK (tenant\_id \= get\_current\_user\_tenant\_id());

CREATE POLICY "Users can update their tenant's cash movements"

ON mouvements\_caisse FOR UPDATE

USING (tenant\_id \= get\_current\_user\_tenant\_id());

#### 1.2 Créer les Fonctions Base de Données

\-- Fonction pour générer un numéro de session unique

CREATE OR REPLACE FUNCTION generate\_session\_number(p\_tenant\_id UUID)

RETURNS TEXT AS $$

DECLARE

  session\_count INTEGER;

  session\_number TEXT;

BEGIN

  SELECT COUNT(\*) INTO session\_count

  FROM sessions\_caisse

  WHERE tenant\_id \= p\_tenant\_id

  AND DATE(date\_ouverture) \= CURRENT\_DATE;


  session\_number := 'SES-' || 

                   TO\_CHAR(CURRENT\_DATE, 'YYYYMMDD') || '-' || 

                   LPAD((session\_count \+ 1)::TEXT, 4, '0');


  RETURN session\_number;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

\-- Fonction pour calculer le montant théorique de fermeture

CREATE OR REPLACE FUNCTION calculate\_expected\_closing(p\_session\_id UUID)

RETURNS NUMERIC AS $$

DECLARE

  opening\_amount NUMERIC;

  total\_movements NUMERIC;

BEGIN

  SELECT fond\_caisse\_ouverture INTO opening\_amount

  FROM sessions\_caisse

  WHERE id \= p\_session\_id;


  SELECT COALESCE(SUM(montant), 0\) INTO total\_movements

  FROM mouvements\_caisse

  WHERE session\_caisse\_id \= p\_session\_id;


  RETURN opening\_amount \+ total\_movements;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

#### 1.3 Créer les Index pour Performance

`CREATE INDEX idx_sessions_caisse_tenant_id ON sessions_caisse(tenant_id);`

`CREATE INDEX idx_sessions_caisse_statut ON sessions_caisse(statut);`

`CREATE INDEX idx_sessions_caisse_date ON sessions_caisse(date_ouverture);`

`CREATE INDEX idx_mouvements_caisse_session ON mouvements_caisse(session_caisse_id);`  
`CREATE INDEX idx_mouvements_caisse_tenant ON mouvements_caisse(tenant_id);`

### PHASE 2: Refonte du Hook `useCashRegister` ⏱️ 2h

#### 2.1 Structure du Hook Refactorisé

`// src/hooks/useCashRegister.ts`

`import { useState, useCallback, useEffect } from 'react';`

`import { supabase } from '@/integrations/supabase/client';`

`import { useTenant } from '@/contexts/TenantContext';`

`import { useToast } from '@/hooks/use-toast';`

`import { handleError, handleSuccess } from '@/lib/errorHandler';`

`export interface CashSession {`

  `id: string;`

  `tenant_id: string;`

  `caissier_id: string;`

  `numero_session: string;`

  `date_ouverture: string;`

  `date_fermeture?: string;`

  `fond_caisse_ouverture: number;`

  `montant_theorique_fermeture?: number;`

  `montant_reel_fermeture?: number;`

  `ecart?: number;`

  `statut: 'Ouverte' | 'Fermée';`

  `created_at: string;`

  `updated_at: string;`

  `// Relations`

  `caissier?: {`

    `noms: string;`

    `prenoms: string;`

  `};`

`}`

`export interface CashMovement {`

  `id: string;`

  `tenant_id: string;`

  `session_caisse_id: string;`

  `type_mouvement: 'entree' | 'sortie' | 'depot' | 'retrait' | 'vente' | 'depense';`

  `montant: number;`

  `reference_id?: string;`

  `reference_type?: string;`

  `description: string;`

  `agent_id?: string;`

  `date_mouvement: string;`

  `created_at: string;`

  `updated_at: string;`

`}`

`const useCashRegister = () => {`

  `const { tenantId } = useTenant();`

  `const { toast } = useToast();`

  `const [currentSession, setCurrentSession] = useState<CashSession | null>(null);`

  `const [sessions, setSessions] = useState<CashSession[]>([]);`

  `const [movements, setMovements] = useState<CashMovement[]>([]);`

  `const [loading, setLoading] = useState(false);`

  `const [error, setError] = useState<string | null>(null);`

  `// Charger la session active au montage`

  `useEffect(() => {`

    `if (tenantId) {`

      `loadCurrentSession();`

      `loadSessions();`

    `}`

  `}, [tenantId]);`

  `// Charger la session active`

  `const loadCurrentSession = useCallback(async () => {`

    `try {`

      `const { data, error } = await supabase`

        `.from('sessions_caisse')`

        `` .select(` ``

          `*,`

          `caissier:personnel!sessions_caisse_caissier_id_fkey(noms, prenoms)`

        `` `) ``

        `.eq('tenant_id', tenantId)`

        `.eq('statut', 'Ouverte')`

        `.order('date_ouverture', { ascending: false })`

        `.limit(1)`

        `.single();`

      `if (error && error.code !== 'PGRST116') throw error;`

      

      `setCurrentSession(data);`

      `if (data) {`

        `loadMovements(data.id);`

      `}`

    `} catch (err: any) {`

      `handleError(err, 'Erreur lors du chargement de la session active');`

    `}`

  `}, [tenantId]);`

  `// Charger toutes les sessions`

  `const loadSessions = useCallback(async () => {`

    `try {`

      `const { data, error } = await supabase`

        `.from('sessions_caisse')`

        `` .select(` ``

          `*,`

          `caissier:personnel!sessions_caisse_caissier_id_fkey(noms, prenoms)`

        `` `) ``

        `.eq('tenant_id', tenantId)`

        `.order('date_ouverture', { ascending: false })`

        `.limit(50);`

      `if (error) throw error;`

      `setSessions(data || []);`

    `} catch (err: any) {`

      `handleError(err, 'Erreur lors du chargement des sessions');`

    `}`

  `}, [tenantId]);`

  `// Charger les mouvements d'une session`

  `const loadMovements = useCallback(async (sessionId: string) => {`

    `try {`

      `const { data, error } = await supabase`

        `.from('mouvements_caisse')`

        `.select('*')`

        `.eq('session_caisse_id', sessionId)`

        `.order('date_mouvement', { ascending: false });`

      `if (error) throw error;`

      `setMovements(data || []);`

    `} catch (err: any) {`

      `handleError(err, 'Erreur lors du chargement des mouvements');`

    `}`

  `}, []);`

  `// Ouvrir une session`

  `const openSession = useCallback(async (`

    `caissier_id: string,`

    `fond_caisse_ouverture: number`

  `): Promise<CashSession> => {`

    `setLoading(true);`

    `try {`

      `// Vérifier qu'il n'y a pas déjà une session ouverte`

      `const { data: existingSession } = await supabase`

        `.from('sessions_caisse')`

        `.select('id')`

        `.eq('tenant_id', tenantId)`

        `.eq('statut', 'Ouverte')`

        `.single();`

      `if (existingSession) {`

        `throw new Error('Une session est déjà ouverte. Veuillez la fermer avant d\'en ouvrir une nouvelle.');`

      `}`

      `// Générer le numéro de session`

      `const { data: sessionNumber } = await supabase`

        `.rpc('generate_session_number', { p_tenant_id: tenantId });`

      `// Créer la session`

      `const { data: newSession, error } = await supabase`

        `.from('sessions_caisse')`

        `.insert({`

          `tenant_id: tenantId,`

          `caissier_id,`

          `numero_session: sessionNumber,`

          `fond_caisse_ouverture,`

          `statut: 'Ouverte'`

        `})`

        `` .select(` ``

          `*,`

          `caissier:personnel!sessions_caisse_caissier_id_fkey(noms, prenoms)`

        `` `) ``

        `.single();`

      `if (error) throw error;`

      `// Enregistrer le mouvement d'ouverture`

      `await supabase`

        `.from('mouvements_caisse')`

        `.insert({`

          `tenant_id: tenantId,`

          `session_caisse_id: newSession.id,`

          `type_mouvement: 'entree',`

          `montant: fond_caisse_ouverture,`

          `description: 'Ouverture de caisse',`

          `agent_id: caissier_id`

        `});`

      `setCurrentSession(newSession);`

      `await loadSessions();`

      `handleSuccess('Session de caisse ouverte avec succès');`

      

      `return newSession;`

    `} catch (err: any) {`

      `handleError(err, 'Erreur lors de l\'ouverture de la session');`

      `throw err;`

    `} finally {`

      `setLoading(false);`

    `}`

  `}, [tenantId, loadSessions]);`

  `// Fermer une session`

  `const closeSession = useCallback(async (`

    `sessionId: string,`

    `montant_reel_fermeture: number,`

    `notes?: string`

  `): Promise<CashSession> => {`

    `setLoading(true);`

    `try {`

      `// Calculer le montant théorique`

      `const { data: montant_theorique } = await supabase`

        `.rpc('calculate_expected_closing', { p_session_id: sessionId });`

      `const ecart = montant_reel_fermeture - (montant_theorique || 0);`

      `// Mettre à jour la session`

      `const { data: closedSession, error } = await supabase`

        `.from('sessions_caisse')`

        `.update({`

          `date_fermeture: new Date().toISOString(),`

          `montant_theorique_fermeture: montant_theorique,`

          `montant_reel_fermeture,`

          `ecart,`

          `statut: 'Fermée'`

        `})`

        `.eq('id', sessionId)`

        `` .select(` ``

          `*,`

          `caissier:personnel!sessions_caisse_caissier_id_fkey(noms, prenoms)`

        `` `) ``

        `.single();`

      `if (error) throw error;`

      `setCurrentSession(null);`

      `await loadSessions();`

      

      `const message = ecart === 0` 

        `? 'Session fermée avec succès. Aucun écart détecté.'` 

        ``: `Session fermée. Écart de ${Math.abs(ecart)} FCFA ${ecart > 0 ? '(excédent)' : '(manquant)'}.`;``

      

      `handleSuccess(message);`

      

      `return closedSession;`

    `} catch (err: any) {`

      `handleError(err, 'Erreur lors de la fermeture de la session');`

      `throw err;`

    `} finally {`

      `setLoading(false);`

    `}`

  `}, [tenantId, loadSessions]);`

  `// Enregistrer un mouvement`

  `const recordMovement = useCallback(async (`

    `sessionId: string,`

    `type_mouvement: CashMovement['type_mouvement'],`

    `montant: number,`

    `description: string,`

    `reference_id?: string,`

    `reference_type?: string`

  `): Promise<CashMovement> => {`

    `setLoading(true);`

    `try {`

      `const { data: movement, error } = await supabase`

        `.from('mouvements_caisse')`

        `.insert({`

          `tenant_id: tenantId,`

          `session_caisse_id: sessionId,`

          `type_mouvement,`

          `montant,`

          `description,`

          `reference_id,`

          `reference_type`

        `})`

        `.select()`

        `.single();`

      `if (error) throw error;`

      `await loadMovements(sessionId);`

      `handleSuccess('Mouvement enregistré avec succès');`

      

      `return movement;`

    `} catch (err: any) {`

      `handleError(err, 'Erreur lors de l\'enregistrement du mouvement');`

      `throw err;`

    `} finally {`

      `setLoading(false);`

    `}`

  `}, [tenantId, loadMovements]);`

  `// Calculer le solde d'une session`

  `const getSessionBalance = useCallback((sessionId: string): number => {`

    `const session = sessions.find(s => s.id === sessionId);`

    `if (!session) return 0;`

    `const sessionMovements = movements.filter(m => m.session_caisse_id === sessionId);`

    `const totalMovements = sessionMovements.reduce((sum, m) => sum + m.montant, 0);`

    

    `return session.fond_caisse_ouverture + totalMovements;`

  `}, [sessions, movements]);`

  `// Générer un rapport de session`

  `const getSessionReport = useCallback((sessionId: string) => {`

    `const session = sessions.find(s => s.id === sessionId);`

    `if (!session) return null;`

    `const sessionMovements = movements.filter(m => m.session_caisse_id === sessionId);`

    

    `const summary = {`

      `openingAmount: session.fond_caisse_ouverture,`

      `totalEntries: sessionMovements`

        `.filter(m => m.type_mouvement === 'entree' || m.type_mouvement === 'depot' || m.type_mouvement === 'vente')`

        `.reduce((sum, m) => sum + m.montant, 0),`

      `totalExits: sessionMovements`

        `.filter(m => m.type_mouvement === 'sortie' || m.type_mouvement === 'retrait' || m.type_mouvement === 'depense')`

        `.reduce((sum, m) => sum + Math.abs(m.montant), 0),`

      `expectedClosing: session.montant_theorique_fermeture || 0,`

      `actualClosing: session.montant_reel_fermeture || 0,`

      `variance: session.ecart || 0`

    `};`

    `return {`

      `session,`

      `movements: sessionMovements,`

      `summary`

    `};`

  `}, [sessions, movements]);`

  `return {`

    `currentSession,`

    `sessions,`

    `movements,`

    `loading,`

    `error,`

    `openSession,`

    `closeSession,`

    `recordMovement,`

    `getSessionBalance,`

    `getSessionReport,`

    `refetch: loadSessions`

  `};`

`};`

`export default useCashRegister;`

### PHASE 3: Mise à Jour des Composants ⏱️ 2h30

#### 3.1 Mise à Jour `CashSessionForm.tsx`

Modifications clés:

* Récupérer les agents depuis la table `personnel`  
* Filtrer par tenant\_id et rôle approprié  
* Intégrer les paramètres système (defaultOpeningAmount)  
* Améliorer la validation

`// Ajouter au début du composant`

`const { tenantId } = useTenant();`

`const [agents, setAgents] = useState<any[]>([]);`

`const { settings } = useSalesSettings();`

`useEffect(() => {`

  `loadAgents();`

`}, [tenantId]);`

`const loadAgents = async () => {`

  `const { data } = await supabase`

    `.from('personnel')`

    `.select('id, noms, prenoms')`

    `.eq('tenant_id', tenantId)`

    `.eq('is_active', true)`

    `.in('role', ['Admin', 'Caissier', 'Vendeur']);`


  `setAgents(data || []);`

`};`

`// Utiliser settings.register.defaultOpeningAmount comme valeur par défaut`

#### 3.2 Mise à Jour `CashMovementForm.tsx`

Modifications clés:

* Valider les montants selon le solde disponible  
* Ajouter des types de mouvements appropriés  
* Améliorer le feedback utilisateur

#### 3.3 Mise à Jour `CashManagement.tsx`

Modifications clés:

* Utiliser les données du hook refactorisé  
* Afficher les données réelles depuis la BD  
* Gérer les états de chargement  
* Ajouter des fonctionnalités d'actualisation

### PHASE 4: Tests et Validation ⏱️ 1h

#### 4.1 Tests Fonctionnels

| Fonctionnalité | Test | Résultat Attendu |
| ----- | ----- | ----- |
| Ouverture Session | Ouvrir avec montant valide | Session créée, visible dans onglet Sessions |
| Ouverture Session | Tenter d'ouvrir une 2ème session | Message d'erreur "Session déjà ouverte" |
| Mouvement | Enregistrer entrée/sortie | Mouvement visible, solde mis à jour |
| Fermeture | Fermer avec montant correct | Écart \= 0, session fermée |
| Fermeture | Fermer avec écart | Écart calculé et affiché |
| Multi-tenant | Utilisateur A ne voit pas données B | Isolation complète |
| Rapports | Générer rapport session | Toutes données affichées correctement |
| Actualisation | Cliquer sur Actualiser | Données rechargées depuis BD |

#### 4.2 Tests de Sécurité

* ✅ RLS empêche l'accès cross-tenant  
* ✅ Seul le personnel autorisé peut ouvrir une session  
* ✅ Les montants sont validés côté serveur  
* ✅ Les références sont vérifiées

---

### PHASE 5: Optimisations et Polish ⏱️ 1h

#### 5.1 Optimisations Performance

`// Ajouter du caching pour les requêtes fréquentes`

`const { data, isLoading } = useQuery({`

  `queryKey: ['cash-sessions', tenantId],`

  `queryFn: () => loadSessions(),`

  `staleTime: 30000, // 30 secondes`

  `refetchOnWindowFocus: true`  
`});`

#### 5.2 Améliorations UX

* ✅ Messages de succès/erreur avec toasts  
* ✅ États de chargement avec spinners  
* ✅ Confirmation avant fermeture de session  
* ✅ Validation en temps réel des formulaires  
* ✅ Indicateurs visuels (badges colorés pour statuts)  
* ✅ Rafraîchissement automatique après actions

#### 5.3 Audit Logging

`// Ajouter des logs d'audit pour les actions critiques`

`await supabase`

  `.rpc('log_audit_trail', {`

    `action: 'CASH_SESSION_OPENED',`

    `table_name: 'sessions_caisse',`

    `record_id: newSession.id,`

    `details: { amount: fond_caisse_ouverture }`  
  `});`

## 📊 RÉCAPITULATIF DES MODIFICATIONS

### Fichiers à Créer/Modifier

| Fichier | Type | Modifications |
| ----- | ----- | ----- |
| `migrations/add_cash_rls_policies.sql` | Nouveau | RLS policies \+ fonctions DB |
| `src/hooks/useCashRegister.ts` | Refonte Complète | Connexion Supabase, logique métier |
| `src/components/dashboard/modules/sales/CashManagement.tsx` | Mise à jour | Intégration hook refactorisé |
| `src/components/dashboard/modules/sales/cash/CashSessionForm.tsx` | Mise à jour | Récupération agents, validation |
| `src/components/dashboard/modules/sales/cash/CashMovementForm.tsx` | Mise à jour | Validation, types mouvements |
| `src/components/dashboard/modules/sales/cash/CashSessionList.tsx` | Mise à jour mineure | Affichage données réelles |
| `src/components/dashboard/modules/sales/cash/CashReport.tsx` | Mise à jour mineure | Affichage données réelles |

### Résumé des Changements

Backend (Supabase):

* ✅ 6 RLS policies créées  
* ✅ 2 fonctions PostgreSQL créées  
* ✅ 5 index de performance ajoutés

Frontend (React):

* ✅ 1 hook complètement refactorisé (600+ lignes)  
* ✅ 5 composants mis à jour  
* ✅ Intégration complète avec Supabase  
* ✅ Gestion multi-tenant  
* ✅ Validation et gestion d'erreurs

Nouvelles Fonctionnalités:

* ✅ Génération automatique numéros de session  
* ✅ Calcul automatique montants théoriques  
* ✅ Détection et affichage des écarts  
* ✅ Rapports détaillés avec statistiques  
* ✅ Audit logging des actions critiques

---

## ⚡ ORDRE D'IMPLÉMENTATION RECOMMANDÉ

### Jour 1 \- Backend (3h)

1. ✅ Créer les RLS policies  
2. ✅ Créer les fonctions PostgreSQL  
3. ✅ Créer les index  
4. ✅ Tester les policies manuellement

### Jour 2 \- Hook (4h)

1. ✅ Refactoriser `useCashRegister.ts`  
2. ✅ Implémenter toutes les fonctions  
3. ✅ Ajouter la gestion d'erreurs  
4. ✅ Tester le hook isolément

### Jour 3 \- Composants (4h)

1. ✅ Mettre à jour `CashSessionForm`  
2. ✅ Mettre à jour `CashMovementForm`  
3. ✅ Mettre à jour `CashManagement`  
4. ✅ Mettre à jour les composants d'affichage

### Jour 4 \- Tests et Polish (3h)

1. ✅ Tests fonctionnels complets  
2. ✅ Tests multi-tenant  
3. ✅ Tests de sécurité  
4. ✅ Optimisations et polish

---

## 🎯 RÉSULTATS ATTENDUS

### Fonctionnalités Opérationnelles

✅ Ouverture de Session

* Sélection agent depuis BD  
* Montant d'ouverture avec valeur par défaut  
* Génération automatique numéro session  
* Vérification session unique active

✅ Gestion des Mouvements

* Enregistrement entrées/sorties  
* Validation montants  
* Calcul automatique solde  
* Historique complet

✅ Fermeture de Session

* Calcul montant théorique  
* Saisie montant réel  
* Calcul écart automatique  
* Archivage session

✅ Dashboard et Métriques

* Affichage session active  
* Solde en temps réel  
* Statistiques du jour  
* Nombre de mouvements

✅ Rapports

* Rapport détaillé par session  
* Résumé financier  
* Liste mouvements  
* Détection écarts significatifs

✅ Multi-Tenant

* Isolation complète données  
* RLS activée  
* Filtrage automatique

### Métriques de Qualité

| Métrique | Objectif | Moyen de Mesure |
| ----- | ----- | ----- |
| Performance | Chargement \< 2s | Chrome DevTools |
| Fiabilité | 0 erreur console | Browser Console |
| Sécurité | 100% RLS coverage | Tests manuels |
| UX | Feedback sur toutes actions | Tests utilisateur |

---

## 🚨 POINTS D'ATTENTION CRITIQUES

### 1\. Gestion de la Session Active

⚠️ Un seul utilisateur \= une seule session ouverte à la fois

* Vérifier avant ouverture  
* Bloquer si session existe

### 2\. Calculs Financiers

⚠️ Précision des montants

* Utiliser `NUMERIC` en BD (pas `FLOAT`)  
* Arrondir correctement côté frontend  
* Valider avant sauvegarde

### 3\. Multi-Tenant

⚠️ Isolation absolue

* Toujours filtrer par `tenant_id`  
* Tester avec plusieurs tenants  
* Vérifier RLS actives

### 4\. Gestion des Erreurs

⚠️ Feedback utilisateur

* Catch toutes les erreurs  
* Messages clairs et actionnable  
* Logs en console en dev

### 5\. États de Chargement

⚠️ Expérience utilisateur

* Spinners pendant requêtes  
* Désactiver boutons en cours  
* Empêcher double-clic

---

## 📝 CHECKLIST DE VALIDATION FINALE

### Backend

*  RLS policies créées et testées  
*  Fonctions PostgreSQL fonctionnelles  
*  Index créés pour performance  
*  Données test insérées

### Frontend

*  Hook `useCashRegister` connecté à Supabase  
*  Tous les composants mis à jour  
*  Gestion tenant\_id partout  
*  Validation formulaires

### Fonctionnalités

*  Ouverture session OK  
*  Enregistrement mouvements OK  
*  Fermeture session OK  
*  Calcul écarts OK  
*  Génération rapports OK  
*  Dashboard métriques OK

### Tests

*  Tests multi-tenant passent  
*  Pas d'erreurs console  
*  Performance \< 2s  
*  Tous boutons fonctionnels  
*  Messages succès/erreur affichés

### Documentation

*  Code commenté  
*  Types TypeScript corrects  
*  README mis à jour  
*  Guide utilisateur créé

---

## 🎓 CONCLUSION

Ce plan d'implémentation couvre 100% des fonctionnalités de la section "Caisse" avec un niveau de professionnalisme élevé :

✅ Aucune suppression de fonctionnalité frontend ✅ Connexion complète à la base de données ✅ Multi-tenant robuste avec RLS ✅ Validation et sécurité à tous les niveaux ✅ Expérience utilisateur soignée ✅ Performance optimisée avec index et caching ✅ Tests complets pour garantir la qualité

Temps estimé total: \~14 heures de développement réparti sur 4 jours

Prêt pour implémentation\! 🚀

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmUAAAC9CAYAAADyfQpMAAAbH0lEQVR4Xu3d+68UZZ7H8fmHVAwbNxnjghOzOjKAo8m4BjcT2Z01K0Encd2YmaxOTMYLgnfAu8cLgiLi5ShyU/FyAEHBG4rIVVQQvKFcRid5dj/P5st5zrf60NV9qruf7n7/8Ep3V1VX1Xmq6qlPP09VnV/8/edjAQAAAJ31Cz8AAAAA7UcoAwAAyAChDAAAIAOEMgAAgAwQygAAADJAKAMAAMgAoQwAACADhDIAAIAMEMoAAAAyQCgDAADIAKEMAAAgA4QyAACADBDKAAAAMkAoAwAAyAChDAAAIAOEMgAAgAwQygAAADJAKAMAAMgAoQwAACADhDIAAIAMEMoAAAAyQCgDAADIAKEMAAAgA4QyAACADBDKAAAAMkAoAwAAyAChDAAAIAOEMgAAgAwQygAAADJAKAMAAMgAoQwAACADhDIAAIAMEMoAAAAyQCgDAADIAKEMAAAgA4QyAACADBDKAAAAMkAoAwAAyAChDAAAIAOEMgAAgAwQygAAADJAKAMAAMgAoQwAACADhDIAAIAMEMoAAAAyQCgD+sDnOw6FlQv3o+X2FcoewEjF4waGUAb0AYWygwcDWmzF4/sLZQ9gJH/cYBihDOgDhLL2IJQB9fnjBsMIZUAfIJS1B6EMqM8fNxhGKAP6AKGsPQhlQH3+uMEwQhnQBwhl7UEoA+rzxw2GEcqAPkAoaw9CGVCfP24wjFAG9AFCWXsQyoD6/HGDYYQyoA8QytqDUAbU548bDCOUAX1gLKFs/Pjx0eTJUwvjzNatB8LVV197/LPez5s3cPzz4OCaEeN7FaEMqM8fN1WzOiutg8TXU7XoO/qu6iw/ztP8xA8fC0IZ0AeaDWVDQ1vCnj2HC8M9X9ldd92s+FnfFb3XMP+9dhsYWBz/pvSzn2YsCGVAff64qZLVOX64+HrK0/g5c+YVhhuNs2mqDmOGUAb0gWZD2WgVlH5NKtxYqFEFpZY0DZs588r4vbVrP4qvCmP61ZnOSxWjvqP5WGizX6b6bOOshU3vrRLUMvT+wgunxfdark2fVqpaN33fxslooSytZDVe69xMpUsoA+rzx00ZdlzruEyPc9UXs2fPHTFs+vRLozScWf2g+kTTWz2T1mM2fwtuaZ1g62DL0WtaV2l5Vo9ZC52vk8oglAF9oNlQ5lu3rGnfVzpWkdlrWnn5ikwhKg1SNh9VZhqu+afTWyWnitG6JWw5qhRtHTWdppkwYWKcJg16No/RQpmtV/p3+rIog1AG1OePmzLSUKZXHdM61u3Y1TGfBjH7cZXWWVZv2PSi6W2cLatWnWPrkNZN/gekvVodY6+2rv5vqoVQBvSBZkOZKpP016YFoDS0WAVVK5Tp+9ZapWH6viqqtKXM5meVmVV06a9OqyBtmScKZWmQLBvKjMal65eOK4NQBtTnj5sy7HhPj1993rx5z/GWrZTVEWmdZcNsXun0aWuW1SPpsmyaMqHM6jWrf2xd9+49WlhPj1AG9IFmQ1kO0hav3BHKgPr8cdOr0h+vZRHKgD7QjaFMFZp1Q/pxuSKUAfX546bXWJenulP9uHoIZUAP+mzPzrDlw/fDW2+tDc89uzQ8cu8zhYMf1SOUAfX54wbDCGVApn7625HwzddfhQ8/eC+8tX5tePaZp8OCBY+Gu++eF269ZU647757wsKFC8IrL68KGzasC3s/2xW++/ZgYT7SjS1l3Uih7PCP34cvv/gsbNy4Pry8emV49NGHw/x5c8NNN94QHn74obD06SVh9aoV4eOPPgyf790dfjj0bWF7Ab3MHzcYRigDOujHH76LJ/Btn3wcXn/t1bDsxcHw5JOLwp133B5P4nPvujMseWpxWLF8WXj33XfC9k8/CV/t/6Iwn3oIZe1Rr6Vs964d4YP33w1Db74eFj/5RHjggfvCbbfeEu699+4YsLUPbN78dtzOx47+WPg+0Av8cYNhhDKgIgpXn2z9KLzzzobw4gvPx3B1x+23hXvumR/mzb0rtpAoXK0deiPs3PFpOPDVl4V5tAqhrD3qhbJGff/d17Erev26objvLFr0eNynZt88Kzz++GPh+eeeCWtefTl8um1rU2Ed6AR/3GAYoQwo6eefjsbuRLV2qDtRXVCxa2r+3HiSfOSRgXjSfGHwudh1tfXjLfGk6ufTCbu2fl04+FG9qkPZaNSKpta0TZs2htfWvBIDmrq1FdgeeuiB2LqqIKfrCtWt7b8PdJI/bjCMUAY4R4/8EE946i58adkL4anFT8YTnboT1eKlbia1WqgLSi1eBw/sy7KrSSdjXWumrrFbbnigcPCjeoMDn8UbK1Tufnu0w6Hvv4nbXWFM+6jCmfZd/WhQaFv+0osxxCnMqaX2b8cOF+YBtJo/bjCMUIae9sXne2KLlVqudLK0FgVdy3P//ffGVi2dpN5++63Y/ahrvPw8cqaLxLX+TzyxMLbYPbP06dhCopsE0unUffnhhiNosbSlTEFdoV2h/q4774iBXttmz+6dhe3YSbo5RCFO3eoKbToudCOJjhFd96abFXSzicKeQp//PtAof9xgGKEMXU8nCt3FptYJ3YmoOxQVUHTHm04surZLF9DbBdTdfO2Nwtaundvj9Wl3z58XLxJXKNO1bH7a1OHvj4RP3vm2qyy6/+XwyuCHheE527frUKHszdcH98fWK92BqR8Gev/ee5tiS6ufNgf6QfPRlg/icWUtbuoeVcuruunXrX0zrr+68/13gRPxx00O5s56qjCsEwhl6BrW6qXgpVYvnSjULXP7bbfG8KXg9cbra2LwUteMuiH9PLqRQqS6UnVS1N2Yunbt/fc2Z3syr4qCp/5OP7xX2GNO9ANCPxzefOO1LLvBvX1f7o0/AnSnqFpmFTJvnnVTUNBUS7SOQbWsjfZ4FiBHuuPdD+sEQhnaThfMK1Ds2L4tVuAKU+p+U6vPnNk3H79YXpW+Atb+fZ/3TMA6EV3no7s27fljagHTXXV+un7R66FsNOom1EN/1dKrbk/9+Mity7MshUz9qLBntmmb2t2jCqLqLlW3qVq6u+3SAfQWQhn6glq39JBMnWRUIetXtS6YV9fbY489Elu97E7FfquUFU51s4BOTjoBDz7/7PFr2/y0/UjBXNc6+eH9RK1NanXScXPjDdfHYKNWqm7/kaKwpmN+/fqhsGrl8vDgg/fHH2WiEKo7m/V3KtBxMwLaQT0RflgnEMrQEJ0kdB2JWrjUqqNgpa4L/cp4eslTsTJVZatgoSeb++/3Iz0WQw8M1QXUOumoy0rXhfnpMFK/tpSVpe5Pu9ZLdwlrH/PT9ArdMKGW5FdfWR0GBh6MlyzoZgTVOXpOm1rU9bga/z2gLFrKkDUFCXWZKHytXPFS0PUis266MXanKFSohUutOrp2qxuug2k3lZ9aOHRRtLprdPKgBawxCv393lJWllqitY+p61s3EPRDuelHn4Kouj91c4+ut9QPRN0xqjpL9ZNurvDfA2pR2PfDOoFQ1ufUDaKwoDupdH2HutJ0vYd+NajLROFLF5nzTKP6VJbqqtVJUUFM18rpejg/HcqhpaxxOpbVJagbYXSSUcvSju3bCtP1Kv1A1DGo+kzHoR5DoqCmx5Ko61f/bYPHeqAWWsrQUqp4dKu6KmWd3G6ZMzv+ux89gV4XkCto0YXWPD0fTGWoLhSVqU4CfhqMjf6FUC93ybWT3bWsFm+1Iu3oo6BWi1rZ9O+rrH7UD1Fd16mbjNTCprqR8NZfdBe0H9YJhLIeoF+H6irT3Yr6hayLZnXNhVq6NEwnNq7vqoYeB6DuEl0bprKmXFuHlrLq6cJ5/YDQtaAqX0LvMF2TppsL1G2ux86oDlVXqK7X0zVt/XYjUr+hpQxN07VeaobXL141z+tXnipY/epT6w2VR/UUxnR9mOh5Un48qkcoay0FMl0fqrs69ZBYPx7HYouZHp6r1nD9ENM1tbqZSfWs6gQ/PboXoQyjsn94rV9oqjB18a4enbDtk4+5w6hNVNbPLP3/oMt1YZ2hR2LQktM+anHXndUKIHpMjR+PIj1TTneFqndCj/rRdXwKbL3+YOdepG3oh3UCoSwT+jWmEKaWGFWK8V+wvLspPsvKT4vWUqWqa0sUzPw4tA8tZZ2hFiB14enOaz8Oo1NdrevU1Pqo5zCq5UU3XejBuH5a5IeWsj6lA1R3OOpXlSq9Hdu38UiJDOj5a7qwnFvo86G7V2kp6yz9r1X9WNTd134cytMlJSpH3Uyg1neFNz8NOouHx/YZnWD08FA1kXLXY17seWJ+ODqLlrJ86KYhtkU1dKOFujn1/3q5NCIftJT1AV1XoGfj6OBT96QeKOqnQWep5VJdlX44Oo9Qlhc964uuuOp8+82B+JgiPfhWjyzx49FehLIepqdr6y4dPxx54Qn7eSOU5Yku/tbQYzh004AfjvYglPUw/aL0w5AfXUPmhyEfhLI86VE8fhiqoeei+WFoD0JZj9K/+PDDkCd1HfhhyAehLE9q0fHDUB0ep9EZhLIeNG7cuOjkk08ujENetI20rXQXrB+HzjvppJPi9jn11FML49A5V131X3GbaPv4cRg71Usq3wsuOL8wDq0zY8Zlsb455ZRTOn5OIJRV6PLLZ4bx48eHG67/a2Ec8jJhwoS4rfTvU/w4dN4f/3hF3D6qKP04dI6uedJ2OfvsswvjMHZXXHF53Of1P0r9OLTO0NDrcb+eMmVyfHi7H99OhLKKXXbZfxaGIT/6p8Pnn//bwnDk4eiRH8L0Sy7hUSUZmjTpXP4tUwvNvevOwjC03tSpU+JzQ/3wdssylP107GhYcOPusHzBV2iTVQtbcx3D4IP7CstCfR9v/KZQlmP16PUcU63my7wKC27cVVgORvJlVoXHbuiv42X9sgOFMhire//6UZj9wGo0INtQtmrRgXDwYECbrFrYmtvcd2//ubAs1NeKULbi8f2F5aBavsyrsPL/fjD55WAkX2ZVWL2wv46XdS9WH8ruHhgKv930H2gAoQwRoSwvhLLu5Mu8CoSy+nyZVYFQNnaEssYRyhARyvJCKOtOvsyrQCirz5dZFQhlY0coaxyhDBGhLC+Esu7ky7wKhLL6fJlVgVA2doSyxhHKEBHK8kIo606+zKtAKKvPl1kVCGVjRyhrHKEMEaEsL4Sy7uTLvAqEsvp8mVWBUDZ2hLLGEcoQEcryQijrTr7Mq0Aoq8+XWRUIZWNHKGscoQwRoSwvhLLu5Mu8CoSy+nyZVYFQNnaEssYRyhARyvJCKOtOvsyrQCirz5dZFQhlY5dDKDv7od+FX10/uTC8lSZcdU5hWFl9Gcq2bj0Qpk+/tDDc27PncLj66mvj9DZscHDNiNdGDQ1tKQyrRfNvZFlaR62r1tmPKyOnUDZv3kDkh9eSTqcymDNnXmGaKpTdblXJKZTNnHllqf1K0/hjJT3OBgYWjxjfSrYftGp/GI0v8yo0G8rK1Bvij7Wy32uUjiHtA3640bhmjzNfZlVoNpSVLT9f7lY21103qzBtI5otw5xC2Vm3nBdfFaj8uGZMXftv8fXcpdOOz7usM6+ZdPz7J6J523tNP+WVSwrTlNFTocx2aju4dULQPxnVzm/vNV6f/YGjcTatwo3eWyjTQaJXTWffswNKr5pWJxtNr+XoJGbf0XB9Z/LkqWHduq3x1cKTvmfz1XcuvHDa8ZNWrVBmy7Jla1p91jzTULZkyYoRf1sZOYUyHy6tXO3vnDBhYqRtrHLWcH2uFbbT8km/Z+9Vtlae6T4gs2fPjfPT8n1Fp3nadhdtvyVLlsd113cWL14WX/33ysoplPm/QWWW7oe2H6uctD3sONN0KkO91zi9t+NE09i2sPnovW3r9HjTdFamNtyOZ33WNLYfaP52nGh+aSjzy7VtlR7z/hhrlC/zKjQTyjZt2jnis+3zabmm5aVxaT1i3/Pbw+aTHkN6X6uO0nfS/UHTWR1t+4GVu+1TNm2jfJlVoZlQtmHDthGfrZzSY2K0creysX1PrzbO6hibjz5rXDpe5w8dY5pm48ZPC+tWT46hTMFGYecfzjgt/NPMf47D1Or1y2kTwq+fuGjEcL3qb7dXax37x1//Mn7WvOy9xmk6zUc0TNPastKAdfq//+r4Z31PQdFa3/SqeU569uL4qnkqkNl6jLZemiZdbqqnQ1m6U9sBbydhH8rswFEFZCcCqzSsotKrxmneOkDSA07jbbmShjI7ALUcO8FZ5ZWuU7o+GmbraMv0f5+dcGwZFvh8uZSRcyizYVZW6UnCyi3dnlaeKiMrYzsB2/fsfTqtfV/la/uIvabjReWtV20D2z/8/mIhJf1eWTmHMitXC6x2YtZ7/e32avuwWDmJ7ccW1FRGq1dviO/9cWHb1baDpk23qz9+7LVWS5lfrm2rtD6wv6PZ48iXeRWqCGVWP6QncV9mvl60OjQt57RsfHj2dZSVr+0P6Xgbru9p/7Hv+H2tLF9mVagilFm5q/zqlbv+fptG5ZCeW6y8NL3V/TatvU/H+/UqI6dQpmCkv13BxcKU6L2FLT/cWtXUdajQoxCk4bb/KlhZS5kFKk1v4/XZwpJfH5uvXs+8dtKI0Gjrkwa3dJ611iudZtIL/zpiOT0Vymwnt4pb722n9ZWNflXYZ6s0xCoZG5aeZPWaniQ0n/Skq2F2gGl6+47GpYEtXVe/7iY9IVmFZ91I6TrZePtsLRONyi2UpeVhJ930pGHlY9P57ZvuAylfrjYPOxlb+dqy7NXPy+ah8Vb2ftvocy+EMgtfel/rbxRrBbOTgx0rou9bOWi4bbN0O2leaRi2ZaflrPc2vZ/G5mmvtUKZX679HekybT+wY6tRvsyr0Ewo27v36IgySsvZ10lp2dUq13SYDbdh9l58HWXLsv1B430o03vbh3ohlI1W7lYGGjZauVvZWH2U1h3psWXb0crd6iArz2bLMKdQlnYxKswo8FjIshDkh9cKP9bSZvOqFcpqdZHWGmatYBp3zsJ/OT5c87PAp8/++rVa65Uu3+upUKadUcnTuo3sl4Z2XOvusANDw/TZfuVbatV09svGn4DsRKPv20GiA8KWoc/67m9+M2VEpa9XO7HZZ73X99Km7PRv8RWfXtNl2TrYOqfznT//4ULZ1JNTKNPfkHZPWbna316r3OykkHapaLhtV/89e2+Vmp/WKkp79RVduo+kZZ9uc33uhVBm+52k+7y20ebNe+J7DbOysFfbh9OTrY1Pt4U+W8uzbXsbl+77em8nOds//DZMXzVdre5Lm3cvhzKxfbTW/p/WSWmZ2XS2b/vtoWn8MeS3ky2vViiz43PZsqG479g66ru2bP93lOHLrArNhDKpVe5Sr9wtlNmxkJalvpt2g+qzlpOeV/SqcZqmV7ovReFFf5NvKfPDa4WftMvSrvPS5zQUWTeizdve2/Lt+za9xtl46wK1eafdlydar7T7csqb00f87T0VyjrNDsC0ZaFb5BTKkFcoQ3m+zKvQbCjrJ77MqtBsKGuFNHS1Sk6hLFcKbepa9cOrRChDRCjLC6GsO/kyrwKhrD5fZlXIKZS1A6EsD4QyRISyvBDKupMv8yoQyurzZVYFQtnYEcoaRyhDRCjLC6GsO/kyrwKhrD5fZlUglI0doaxxhDJEhLK8EMq6ky/zKhDK6vNlVgVC2dgRyhpHKENEKMsLoaw7+TKvAqGsPl9mVSCUjR2hrHGEMkSEsrwQyrqTL/MqEMrq82VWBULZ2BHKGkcoQ0QoywuhrDv5Mq8Coaw+X2ZVIJSNHaGscVmGsr//dCx8ufNQV1q6aGVhWDf47sCPxe1QAb8clHP40JFCWY6VXwaq58u8Cn4ZKPJlVgW/jF536OvDhTIYK78M1JdnKOtiy14cLAwDAACoh1BWsVUrlxeGAQAA1EMoq9jqVSsKwwAAAOohlFWM7ksAANAMQlnFaCkDAADNIJRVjJYyAADQDEJZxQhlAACgGYSyihHKAABAMwhlFSOUAQCAZhDKKkYoAwAAzSCUVYxQBgAAmkEoqxihDAAANINQVjFCGQAAaAahrGKEMgAA0AxCWcV4oj8AAGgGoaxiK5YvKwwDAACoh1BWMbovAQBAMwhlFbr88pnh4mnTwowZlxXGAQAAnAihrEJ/+cs1Ydy4ceG+++4pjAMAADgRQlmF3n9vc5g4cWL44vM9hXEAAAAn0pFQtm/3D+GFP70eNv7pKXSJxX9+J/z8U3FbAgCAanQslL3/34+EMGMGusSr16wilAEA0EKEMpRCKAMAoLUIZSiFUAYAQGsRylAKoQwAgNYilKEUQhkAAK1FKEMphDIAAFqLUIZSCGUAALRW34Wyw5deGq4955xw4A9/KIzLWafXm1AGAEBrdVUoW3PRRWH8+PGR3vvxZWy4+OKw5fe/LwyvRcu49MwzYyDSZwUiffbTeQPnnVcYVoYtzz5reRbCGllvoxDnhzWLUAYAQGt1XSjTq0JSmXBUy67p0wvDRmMhycLQ4gsuKLXcqkKZlmehrJH1bgVCGQAArdWVoUysFUmtQWnXnrVs6bOmn3r66XG4gpIFHIUsBZ55U6aM+OxbovR90XR61TzS95p+1rnnxuWl3YpzJ08utFLZums5tl6aRxrgbHmaly0jbS2z9Zx2xhnxvU1r0/my0HALevpsf6/mka5bGYQyAABaq2tDmUKJhRR9tlBl01ggsdBjIcq6PxVcJp522vHP1vqWhikLSRbMLNjYsvQdBbA9l1wyYj1rda/acmycX7/Rlid+vS18WYjU9LXKIl2GPtvf6wNjGYQyAABaqytDmYKKtRZdedZZI1qH6oWydH5q5RptGfZeNF+bVmHJWrispSxtzRIFNa3Xiebr1y9dnsKhLc9CWTqv0UKZLwsfymr9vWURygAAaK2uCmXoHEIZAACtRShDKYQyAABai1CGUghlAAC0FqEMpRDKAABoLUIZSiGUAQDQWoQylEIoAwCgtQhlKIVQBgBAaxHKUAqhDACA1iKUoRRCGQAArdWxUPbcn9eGdf8ziC7xxJ83E8oAAGihjoQyAAAAjEQoAwAAyAChDAAAIAOEMgAAgAwQygAAADJAKAMAAMgAoQwAACADhDIAAIAMEMoAAAAyQCgDAADIAKEMAAAgA4QyAACADBDKAAAAMkAoAwAAyAChDAAAIAOEMgAAgAwQygAAADJAKAMAAMgAoQwAACADhDIAAIAMEMoAAAAyQCgDAADIAKEMAAAgA4QyAACADBDKAAAAMkAoAwAAyAChDAAAIAOEMgAAgAwQygAAADJAKAMAAMgAoQwAACAD/wufG2+NZrdU8gAAAABJRU5ErkJggg==>