Je vais analyser en profondeur les 4 onglets de la section "Mouvements" du module "Stock" pour identifier tous les problèmes et élaborer un plan d'implémentation complet.

Tout montrer

4 outils utilisés

Je continue l'analyse en regardant le hook useLotMovements pour comprendre l'erreur de relation mentionnée :

Tout montrer

3 outils utilisés

Laissez-moi examiner la dernière version des fonctions RPC :

Tout montrer

1 outil utilisé

Maintenant je vais vérifier la structure de la table mouvements\_lots pour comprendre l'erreur de relation :

Tout montrer

2 outils utilisés

Parfait \! J'ai maintenant une vision complète des problèmes. Voici mon plan d'implémentation détaillé :

📋 PLAN D'IMPLÉMENTATION COMPLET \- SECTION MOUVEMENTS

🎯 PROBLÈMES IDENTIFIÉS

1\. Journal (StockMovementJournal)

* ❌ Erreur critique : "Impossible d'intégrer car plusieurs relations ont été trouvées pour 'mouvements\_lots' et 'lots'"  
* Cause : La table mouvements\_lots a 2 foreign keys vers lots :  
  * lot\_id → lot source  
  * lot\_destination\_id → lot destination (transferts)  
* Supabase ne sait pas laquelle utiliser dans l'embed

2\. Ajustements (StockAdjustments)

* ❌ Ajustements créés mais non affichés dans le tableau  
* ❌ Liste des lots incomplète (filtre trop restrictif à ligne 112-115)  
* ⚠️ Pas de relation produit dans la query (ligne 75-77)  
* ⚠️ Le refetch ne fonctionne pas correctement après création

3\. Transferts (StockTransfers)

* ❌ Déconnecté de la base de données (données en dur)  
* ❌ Pas de relation produit dans la query (ligne 78-80)  
* ⚠️ Metadata mal structuré  
* ⚠️ Fonction RPC appelée mais données pas récupérées

4\. Audit (StockAudit)

* ❌ Page blanche \- erreur non catchée  
* ❌ Tentative d'accès à audit\_logs avec contraintes incorrectes (ligne 72-74)  
* ⚠️ Fallback vers mouvements\_lots incomplet  
* ⚠️ Pas de relation produit pour afficher les noms

---

🔧 PHASE 1 : CORRIGER LES RELATIONS SUPABASE (Critique)

Objectif : Résoudre l'ambiguïté des relations entre mouvements\_lots et lots

Actions :

1. Modifier useLotMovements.ts (lignes 68-72) :  
2. // AVANT (ligne 71\)  
3. lot:lots(id, numero\_lot, produit\_id)  
4.    
5. // APRÈS \- Spécifier explicitement la relation  
6. lot:lots\!lot\_id(id, numero\_lot, produit\_id, quantite\_restante),

produit:produits\!produit\_id(id, libelle\_produit, code\_cip)

7. Ajouter la relation pour lot\_destination (transferts) :

lot\_destination:lots\!lot\_destination\_id(id, numero\_lot, produit\_id)

8. Mettre à jour toutes les queries dans :  
   * useLotMovementsQuery (ligne 66-82)  
   * useRecentMovementsQuery (ligne 135-150)

Résultat attendu : ✅ Plus d'erreur d'embed, toutes les relations fonctionnent  
---

🔧 PHASE 2 : CORRIGER LE COMPOSANT JOURNAL

Objectif : Affichage complet et fonctionnel du journal des mouvements

Actions :

1. Corriger l'affichage des produits (ligne 437-438) :  
   * Utiliser movement.produit?.libelle\_produit au lieu de chercher manuellement  
2. Améliorer les filtres de date (lignes 63-67) :  
   * Corriger la logique pour utiliser les bonnes colonnes  
3. Ajouter la gestion des erreurs :  
   * Entourer le code d'un try-catch robuste  
   * Afficher un message d'erreur utilisateur-friendly  
4. Tester tous les types de mouvements :  
   * Entrée, Sortie, Ajustement, Transfert, Retour, Destruction

Résultat attendu : ✅ Journal affiche tous les mouvements avec produits et lots corrects  
---

🔧 PHASE 3 : CORRIGER LE COMPOSANT AJUSTEMENTS

Objectif : Création et affichage fonctionnels des ajustements

Actions :

1. Corriger le filtre des lots (lignes 110-116) :  
2. // AVANT \- trop restrictif  
3. return lotsData.filter((lot: any) \=\>  
4.   lot.produit\_id \=== formData.produit\_id &&  
5.   lot.quantite\_restante \> 0  
6. );  
7.    
8. // APRÈS \- afficher TOUS les lots du produit  
9. return lotsData.filter((lot: any) \=\>  
10.   lot.produit\_id \=== formData.produit\_id

);

11. Ajouter la relation produit dans la query (ligne 75-77) :  
12. const { data: movementsData, isLoading, refetch } \= useLotMovementsQuery({  
13.   type\_mouvement: 'ajustement'  
14. });

// Doit inclure produit dans l'embed via useLotMovements

15. Forcer le refetch après création (ligne 221\) :  
16. await refetchMovements();

await queryClient.invalidateQueries(\['lot-movements'\]);

17. Corriger l'affichage du tableau (lignes 526-615) :  
    * Utiliser ajustement.produit?.libelle\_produit  
    * Afficher correctement les métadonnées

Résultat attendu : ✅ Ajustements créés s'affichent immédiatement, tous les lots disponibles  
---

🔧 PHASE 4 : FINALISER LE COMPOSANT TRANSFERTS

Objectif : Connecter complètement les transferts à la base de données

Actions :

1. Ajouter la relation produit dans la query (ligne 78-80) :  
2. const { data: movementsData, refetch } \= useLotMovementsQuery({  
3.   type\_mouvement: 'transfert'

});

4. Corriger la structure des transferts (lignes 106-122) :  
5. const transferts \= useMemo(() \=\> {  
6.   if (\!movementsData) return \[\];  
7.   return movementsData.map((movement: any) \=\> ({  
8. 	id: movement.id,  
9.     date\_mouvement: movement.date\_mouvement,  
10.     produit\_id: movement.produit\_id,  
11. 	lot\_id: movement.lot\_id,  
12. 	quantite\_mouvement: movement.quantite\_mouvement,  
13. 	metadata: movement.metadata || {},  
14. 	lot: movement.lot,  
15.     lot\_destination: movement.lot\_destination, // Nouveau  
16. 	produit: movement.produit // Nouveau  
17.   }));

}, \[movementsData\]);

18. Améliorer la fonction de mise à jour (lignes 245-276) :  
    * Utiliser la bonne signature RPC  
    * Gérer les erreurs correctement  
19. Améliorer l'affichage du tableau (lignes 547-655) :  
    * Afficher le produit depuis la relation  
    * Afficher les emplacements source/destination

Résultat attendu : ✅ Transferts créés et affichés avec toutes les informations  
---

🔧 PHASE 5 : CORRIGER LE COMPOSANT AUDIT

Objectif : Affichage fonctionnel du journal d'audit

Actions :

1. Corriger l'accès à audit\_logs (lignes 61-79) :  
2. // Retirer le filtre table\_name qui cause l'erreur  
3. useTenantQueryWithCache(  
4.   \['audit-logs', 'stock'\],  
5.   'audit\_logs',  
6.   \`id, created\_at, action, table\_name, record\_id, old\_values, new\_values,  
7.    user\_id, personnel\_id, ip\_address, status, error\_message\`,  
8.   {}, // Pas de filtre initial  
9.   {  
10. 	enabled: true,  
11. 	orderBy: { column: 'created\_at', ascending: false },  
12. 	limit: 1000  
13.   }

);

14. Améliorer le fallback (lignes 89-133) :  
    * Ajouter les relations produit et lot  
    * Calculer correctement les statistiques  
15. Corriger le calcul "Événements Aujourd'hui" (ligne 366\) :  
16. const todayCount \= auditEntries.filter(e \=\> {  
17.   const entryDate \= format(new Date(e.timestamp), 'yyyy-MM-dd');  
18.   const today \= format(new Date(), 'yyyy-MM-dd');  
19.   return entryDate \=== today;

}).length;

20. Améliorer l'affichage des détails (lignes 164-206) :  
    * Inclure les noms de produits  
    * Inclure les numéros de lots

Résultat attendu : ✅ Audit affiche correctement tous les événements  
---

🔧 PHASE 6 : CRÉER/VÉRIFIER LES FONCTIONS RPC MANQUANTES

Objectif : S'assurer que toutes les fonctions RPC existent et fonctionnent

Actions à vérifier :

1. rpc\_stock\_record\_movement \- ✅ Existe (migration 20251008144521\)  
2. rpc\_stock\_update\_movement \- ⚠️ À vérifier/créer si manquant  
3. rpc\_stock\_delete\_movement \- ⚠️ À vérifier/créer si manquant

Si manquantes, créer les migrations SQL nécessaires  
---

🔧 PHASE 7 : TESTS ET VALIDATION FINALE

Objectif : Vérifier que tout fonctionne correctement

Tests à effectuer :

1. Journal :  
   * ✅ Affichage de tous les types de mouvements  
   * ✅ Filtres (type, date, recherche) fonctionnels  
   * ✅ Édition de mouvements  
   * ✅ Suppression de mouvements  
   * ✅ Export CSV  
2. Ajustements :  
   * ✅ Création d'ajustements  
   * ✅ Affichage immédiat dans le tableau  
   * ✅ Tous les lots disponibles dans la liste  
   * ✅ Validation/Rejet des ajustements  
   * ✅ Suppression d'ajustements  
3. Transferts :  
   * ✅ Création de transferts  
   * ✅ Affichage dans le tableau  
   * ✅ Mise à jour du statut  
   * ✅ Filtres fonctionnels  
4. Audit :  
   * ✅ Affichage des événements  
   * ✅ Filtres fonctionnels  
   * ✅ Métriques correctes  
   * ✅ Export d'audit

---

📊 RÉSUMÉ DES FICHIERS À MODIFIER

1. src/hooks/useLotMovements.ts \- Corriger les relations  
2. src/components/dashboard/modules/stock/StockMovementJournal.tsx \- Affichage produits  
3. src/components/dashboard/modules/stock/StockAdjustments.tsx \- Filtre lots \+ affichage  
4. src/components/dashboard/modules/stock/StockTransfers.tsx \- Connexion DB  
5. src/components/dashboard/modules/stock/StockAudit.tsx \- Page blanche \+ repli  
6. Migrations SQL (si nécessaire) \- Fonctions RPC manquantes

⚠️ POINTS D'ATTENTION

* Multi-tenant : Toutes les queries incluent automatiquement tenant\_id  
* RLS : Les policies existantes sont maintenues  
* Pas de suppression : Tout le frontend existant est conservé  
* Design : Aucun changement de style/design  
* Atomic operations : Toutes les opérations utilisent les RPC pour la cohérence

