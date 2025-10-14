Lovable  
Worked for 2m 55s11:21 PM on Oct 13  
Thought for 28 seconds

Je vais analyser l'existant pour le bloc "Seuils par Catégorie" dans la configuration des alertes. Laissez-moi examiner les fichiers pertinents.

Je vais analyser l'existant pour le bloc "Seuils par Catégorie" dans la configuration des alertes. Laissez-moi examiner les fichiers pertinents.

Show all

7 tools used

## 📊 ANALYSE DE L'EXISTANT

J'ai analysé le composant "Seuils par Catégorie" dans `AlertsConfig.tsx` (lignes 320-360). Voici ce que j'ai trouvé :

### ✅ CE QUI EXISTE DÉJÀ

1. Interface UI de base :  
   * Affichage des seuils existants avec nom de catégorie et valeur  
   * Modification du seuil (input number)  
   * Activation/désactivation (Switch)  
   * Badge de statut (Actif/Inactif)  
2. Hook `useAlertThresholds.ts` :  
   * ✅ `updateThreshold` \- Mise à jour d'un seuil existant  
   * ✅ `createThreshold` \- Implémenté mais non utilisé dans l'UI  
   * ❌ `deleteThreshold` \- Non implémenté  
3. Table BDD `alert_thresholds_by_category` :  
   * Structure : `id`, `tenant_id`, `category` (TEXT), `threshold` (INTEGER), `enabled` (BOOLEAN)  
   * Actuellement vide (aucun seuil configuré)  
   * Le champ `category` stocke le nom de la famille (ex: "Antalgiques")  
4. Table `famille_produit` :  
   * Contient 10+ familles disponibles (Antalgiques, Antibiotiques, Cosmétique, etc.)  
   * Structure : `id`, `libelle_famille`, `description`  
5. Utilisation dans le système :  
   * `useCurrentStockDirect.ts` : Compare le stock avec les seuils par catégorie  
   * `stockNotificationService.ts` : Génère des alertes basées sur ces seuils

---

## ❌ FONCTIONNALITÉS MANQUANTES

1. Création de nouveaux seuils :  
   * Pas de bouton "Ajouter un seuil"  
   * Pas de sélection de catégorie depuis les familles existantes  
   * `createThreshold` existe dans le hook mais n'est pas utilisé  
2. Suppression de seuils :  
   * Pas de bouton de suppression  
   * Fonction `deleteThreshold` absente du hook  
3. Validation et UX :  
   * Pas de validation pour éviter les doublons (même catégorie)  
   * Pas de message lorsque la liste est vide  
   * Pas d'icônes pour améliorer la lisibilité  
   * Pas de confirmation avant suppression  
4. Gestion des familles :  
   * Pas de liste déroulante des familles disponibles  
   * Pas de filtre pour afficher uniquement les familles sans seuil configuré

---

## 🎯 PLAN D'IMPLÉMENTATION COMPLET

### PHASE 1 : Compléter le hook `useAlertThresholds.ts` (15 min)

#### Objectif : Ajouter la fonction de suppression manquante

Modifications nécessaires :

1. Ajouter la mutation de suppression (après ligne 87\) :

`const deleteMutation = useMutation({`  
  `mutationFn: async (id: string) => {`  
    `const { error } = await supabase`  
      `.from('alert_thresholds_by_category')`  
      `.delete()`  
      `.eq('id', id);`

    `if (error) throw error;`  
    `return id;`  
  `},`  
  `onSuccess: () => {`  
    `queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });`  
    `toast({`  
      `title: "Seuil supprimé",`  
      `description: "Le seuil d'alerte a été supprimé avec succès.",`  
    `});`  
  `},`  
  `onError: (error) => {`  
    `toast({`  
      `title: "Erreur",`  
      `description: "Impossible de supprimer le seuil d'alerte.",`  
      `variant: "destructive",`  
    `});`  
    `console.error('Error deleting alert threshold:', error);`  
  `},`

`});`

2. Exporter la fonction de suppression (ligne 89\) :

`return {`  
  `thresholds: query.data,`  
  `loading: query.isLoading,`  
  `error: query.error,`  
  `updateThreshold: updateMutation.mutateAsync,`  
  `createThreshold: createMutation.mutateAsync,`  
  `deleteThreshold: deleteMutation.mutateAsync,  // ✅ NOUVEAU`  
  `isUpdating: updateMutation.isPending || createMutation.isPending || deleteMutation.isPending,`

`};`

Temps estimé : 15 minutes  
Impact : ✅ Fonction de suppression disponible pour l'UI

---

### PHASE 2 : Créer un hook pour charger les familles (10 min)

#### Objectif : Récupérer la liste des familles de produits pour la sélection

Créer nouveau fichier : `src/hooks/useFamillesProduits.ts`

`import { useQuery } from '@tanstack/react-query';`  
`import { supabase } from '@/integrations/supabase/client';`  
`import { useTenant } from '@/contexts/TenantContext';`

`export interface FamilleProduit {`  
  `id: string;`  
  `libelle_famille: string;`  
  `description: string | null;`  
`}`

`export const useFamillesProduits = () => {`  
  `const { tenantId } = useTenant();`

  `const query = useQuery({`  
    `queryKey: ['familles-produits', tenantId],`  
    `queryFn: async () => {`  
      `const { data, error } = await supabase`  
        `.from('famille_produit')`  
        `.select('id, libelle_famille, description')`  
        `.eq('tenant_id', tenantId)`  
        `.order('libelle_famille');`

      `if (error) throw error;`  
      `return data || [];`  
    `},`  
    `enabled: !!tenantId,`  
  `});`

  `return {`  
    `familles: query.data || [],`  
    `loading: query.isLoading,`  
    `error: query.error,`  
  `};`

`};`

Temps estimé : 10 minutes  
Impact : ✅ Liste des familles disponible pour la sélection

---

### PHASE 3 : Améliorer l'UI du bloc "Seuils par Catégorie" (45 min)

#### Objectif : Interface complète avec création, modification et suppression

Modifications dans `AlertsConfig.tsx` (section lignes 320-360) :

#### 3.1 \- Ajouter les imports nécessaires (ligne 10\) :

`import {`   
  `AlertTriangle, Clock, TrendingDown, Calendar,`   
  `Plus, Trash2, Tag  // ✅ AJOUTS`  
`} from 'lucide-react';`  
`import {`   
  `AlertDialog, AlertDialogAction, AlertDialogCancel,`   
  `AlertDialogContent, AlertDialogDescription, AlertDialogFooter,`   
  `AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger`   
`} from '@/components/ui/alert-dialog';`

`import { useFamillesProduits } from '@/hooks/useFamillesProduits';  // ✅ NOUVEAU HOOK`

#### 3.2 \- Charger les familles et préparer l'état (ligne 20\) :

`const { familles, loading: famillesLoading } = useFamillesProduits();`  
`const { deleteThreshold } = useAlertThresholds();  // ✅ Importer deleteThreshold`

`const [showCreateDialog, setShowCreateDialog] = useState(false);`  
`const [newThreshold, setNewThreshold] = useState({`  
  `category: '',`  
  `threshold: 10,`  
  `enabled: true,`

`});`

#### 3.3 \- Ajouter les handlers (après ligne 71\) :

`const handleCreateThreshold = async () => {`  
  `if (!tenantId) {`  
    `toast({`  
      `title: "Erreur",`  
      `description: "Impossible de créer un seuil sans tenant ID.",`  
      `variant: "destructive",`  
    `});`  
    `return;`  
  `}`

  `// Vérifier les doublons`  
  `const exists = thresholds?.some(t => t.category === newThreshold.category);`  
  `if (exists) {`  
    `toast({`  
      `title: "Doublon détecté",`  
      `description: "Un seuil existe déjà pour cette catégorie.",`  
      `variant: "destructive",`  
    `});`  
    `return;`  
  `}`

  `try {`  
    `await createThreshold({`  
      `tenant_id: tenantId,`  
      `category: newThreshold.category,`  
      `threshold: newThreshold.threshold,`  
      `enabled: newThreshold.enabled,`  
    `});`  
      
    `setShowCreateDialog(false);`  
    `setNewThreshold({ category: '', threshold: 10, enabled: true });`  
  `} catch (error) {`  
    `console.error('Error creating threshold:', error);`  
  `}`  
`};`

`const handleDeleteThreshold = async (id: string) => {`  
  `try {`  
    `await deleteThreshold(id);`  
  `} catch (error) {`  
    `console.error('Error deleting threshold:', error);`  
  `}`

`};`

#### 3.4 \- Refondre le bloc UI (remplacer lignes 320-360) :

`<Card>`  
  `<CardHeader>`  
    `<div className="flex items-center justify-between">`  
      `<div>`  
        `<CardTitle className="flex items-center gap-2">`  
          `<Tag className="h-5 w-5" />`  
          `Seuils par Catégorie`  
        `</CardTitle>`  
        `<CardDescription>`  
          `Configuration des seuils spécifiques par catégorie de produits`  
        `</CardDescription>`  
      `</div>`  
        
      `{/* Bouton Ajouter */}`  
      `<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>`  
        `<DialogTrigger asChild>`  
          `<Button size="sm" className="gap-2">`  
            `<Plus className="h-4 w-4" />`  
            `Ajouter un seuil`  
          `</Button>`  
        `</DialogTrigger>`  
          
        `<DialogContent>`  
          `<DialogHeader>`  
            `<DialogTitle>Créer un nouveau seuil</DialogTitle>`  
            `<DialogDescription>`  
              `Définissez un seuil d'alerte spécifique pour une catégorie`  
            `</DialogDescription>`  
          `</DialogHeader>`  
            
          `<div className="space-y-4">`  
            `{/* Sélection de la catégorie */}`  
            `<div className="space-y-2">`  
              `<Label htmlFor="category">Catégorie de produits</Label>`  
              `<Select`   
                `value={newThreshold.category}`   
                `onValueChange={(value) => setNewThreshold(prev => ({ ...prev, category: value }))}`  
              `>`  
                `<SelectTrigger>`  
                  `<SelectValue placeholder="Choisir une catégorie" />`  
                `</SelectTrigger>`  
                `<SelectContent>`  
                  `{familles`  
                    `.filter(f => !thresholds?.some(t => t.category === f.libelle_famille))`  
                    `.map(famille => (`  
                      `<SelectItem key={famille.id} value={famille.libelle_famille}>`  
                        `{famille.libelle_famille}`  
                      `</SelectItem>`  
                    `))`  
                  `}`  
                `</SelectContent>`  
              `</Select>`  
            `</div>`  
              
            `{/* Valeur du seuil */}`  
            `<div className="space-y-2">`  
              `<Label htmlFor="threshold">Seuil d'alerte (unités)</Label>`  
              `<Input`  
                `id="threshold"`  
                `type="number"`  
                `min="1"`  
                `max="1000"`  
                `value={newThreshold.threshold}`  
                `onChange={(e) => setNewThreshold(prev => ({ ...prev, threshold: Number(e.target.value) }))}`  
              `/>`  
            `</div>`  
              
            `{/* Activation immédiate */}`  
            `<div className="flex items-center justify-between">`  
              `<Label htmlFor="enabled">Activer immédiatement</Label>`  
              `<Switch`  
                `id="enabled"`  
                `checked={newThreshold.enabled}`  
                `onCheckedChange={(checked) => setNewThreshold(prev => ({ ...prev, enabled: checked }))}`  
              `/>`  
            `</div>`  
          `</div>`  
            
          `<DialogFooter>`  
            `<Button variant="outline" onClick={() => setShowCreateDialog(false)}>`  
              `Annuler`  
            `</Button>`  
            `<Button`   
              `onClick={handleCreateThreshold}`  
              `disabled={!newThreshold.category || newThreshold.threshold < 1}`  
            `>`  
              `Créer le seuil`  
            `</Button>`  
          `</DialogFooter>`  
        `</DialogContent>`  
      `</Dialog>`  
    `</div>`  
  `</CardHeader>`  
    
  `<CardContent>`  
    `{/* Message si vide */}`  
    `{!thresholds || thresholds.length === 0 ? (`  
      `<div className="text-center py-8 text-muted-foreground">`  
        `<Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />`  
        `<p className="font-medium">Aucun seuil configuré</p>`  
        `<p className="text-sm">Cliquez sur "Ajouter un seuil" pour commencer</p>`  
      `</div>`  
    `) : (`  
      `<div className="space-y-3">`  
        `{thresholds.map((threshold) => (`  
          `<div`   
            `key={threshold.id}`   
            `className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"`  
          `>`  
            `<div className="flex items-center gap-3">`  
              `<Tag className="h-5 w-5 text-muted-foreground" />`  
              `<div>`  
                `<p className="font-medium">{threshold.category}</p>`  
                `<p className="text-sm text-muted-foreground">`  
                  `Seuil: {threshold.threshold} unités`  
                `</p>`  
              `</div>`  
            `</div>`  
              
            `<div className="flex items-center gap-3">`  
              `{/* Input de modification */}`  
              `<Input`  
                `type="number"`  
                `min="0"`  
                `max="1000"`  
                `value={threshold.threshold}`  
                `onChange={(e) => handleThresholdChange(threshold.id, 'threshold', Number(e.target.value))}`  
                `className="w-20"`  
              `/>`  
                
              `{/* Switch d'activation */}`  
              `<Switch`  
                `checked={threshold.enabled}`  
                `onCheckedChange={(checked) => handleThresholdChange(threshold.id, 'enabled', checked)}`  
              `/>`  
                
              `{/* Badge de statut */}`  
              `<Badge variant={threshold.enabled ? "default" : "secondary"} className="min-w-[70px] justify-center">`  
                `{threshold.enabled ? 'Actif' : 'Inactif'}`  
              `</Badge>`  
                
              `{/* Bouton de suppression */}`  
              `<AlertDialog>`  
                `<AlertDialogTrigger asChild>`  
                  `<Button variant="ghost" size="sm" className="h-8 w-8 p-0">`  
                    `<Trash2 className="h-4 w-4 text-destructive" />`  
                  `</Button>`  
                `</AlertDialogTrigger>`  
                  
                `<AlertDialogContent>`  
                  `<AlertDialogHeader>`  
                    `<AlertDialogTitle>Supprimer ce seuil ?</AlertDialogTitle>`  
                    `<AlertDialogDescription>`  
                      `Le seuil pour <strong>{threshold.category}</strong> sera définitivement supprimé.`   
                      `Les alertes utiliseront les seuils globaux par défaut.`  
                    `</AlertDialogDescription>`  
                  `</AlertDialogHeader>`  
                    
                  `<AlertDialogFooter>`  
                    `<AlertDialogCancel>Annuler</AlertDialogCancel>`  
                    `<AlertDialogAction`   
                      `onClick={() => handleDeleteThreshold(threshold.id)}`  
                      `className="bg-destructive hover:bg-destructive/90"`  
                    `>`  
                      `Supprimer`  
                    `</AlertDialogAction>`  
                  `</AlertDialogFooter>`  
                `</AlertDialogContent>`  
              `</AlertDialog>`  
            `</div>`  
          `</div>`  
        `))}`  
      `</div>`  
    `)}`  
  `</CardContent>`

`</Card>`

Temps estimé : 45 minutes  
Impact : ✅ Interface complète et intuitive

---

### PHASE 4 : Tests et validation (20 min)

#### Scénarios de test :

1. ✅ Créer un nouveau seuil :  
   * Sélectionner une catégorie depuis la liste  
   * Définir une valeur (ex: 15 unités)  
   * Vérifier l'enregistrement en BDD  
   * Vérifier que la catégorie disparaît de la liste de sélection  
2. ✅ Modifier un seuil existant :  
   * Changer la valeur (ex: 15 → 20\)  
   * Vérifier la mise à jour immédiate  
   * Vérifier la persistance après rechargement  
3. ✅ Activer/Désactiver un seuil :  
   * Basculer le Switch  
   * Vérifier le changement de badge (Actif ↔ Inactif)  
   * Vérifier la persistance  
4. ✅ Supprimer un seuil :  
   * Cliquer sur l'icône Trash2  
   * Confirmer dans l'AlertDialog  
   * Vérifier la suppression de l'UI et de la BDD  
   * Vérifier que la catégorie réapparaît dans la liste de sélection  
5. ✅ Validation des doublons :  
   * Tenter de créer un seuil pour une catégorie déjà existante  
   * Vérifier le toast d'erreur "Doublon détecté"  
6. ✅ Message liste vide :  
   * Supprimer tous les seuils  
   * Vérifier l'affichage du message "Aucun seuil configuré"  
7. ✅ Impact sur le système :  
   * Créer un seuil pour "Antalgiques" avec valeur 20  
   * Vérifier que `useCurrentStockDirect.ts` utilise ce seuil pour déterminer le statut  
   * Vérifier les alertes générées par `stockNotificationService.ts`

Temps estimé : 20 minutes

---

## 📋 RÉSUMÉ DU PLAN

| Phase | Description | Temps | Fichiers modifiés | |-------|-------------|-------|-------------------| | 1 | Ajouter fonction `deleteThreshold` au hook | 15 min | `useAlertThresholds.ts` | | 2 | Créer hook pour charger les familles | 10 min | `useFamillesProduits.ts` (nouveau) | | 3 | Refondre l'UI du bloc "Seuils par Catégorie" | 45 min | `AlertsConfig.tsx` | | 4 | Tests et validation complète | 20 min | \- | | TOTAL | | 90 min | 3 fichiers |

---

## 🎯 RÉSULTAT ATTENDU

Après implémentation, le bloc "Seuils par Catégorie" offrira :

✅ Création : Bouton "Ajouter un seuil" avec sélection de catégorie  
✅ Modification : Input pour changer la valeur du seuil  
✅ Activation/Désactivation : Switch pour activer/désactiver  
✅ Suppression : Bouton avec confirmation avant suppression  
✅ Validation : Empêche les doublons de catégories  
✅ UX améliorée : Icônes, badges de statut, message liste vide  
✅ Intégration : Seuils utilisés par le système de gestion des alertes stock

