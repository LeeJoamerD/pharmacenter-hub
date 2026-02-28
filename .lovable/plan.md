

# Plan : Factures Proforma — Du devis à l'encaissement

## Résumé

Créer un flux complet de factures proforma dans le Point de Vente : recherche dans le **catalogue produits** (pas les lots), **aucune déduction de stock**, export **PDF A4**, et **conversion en vente réelle** avec déduction de stock au moment de la livraison/encaissement.

## Architecture

```text
┌─────────────────────────────────────────────────┐
│           POSInterface.tsx (Tabs)                │
│  ┌──────┐ ┌──────┐ ┌──────────┐ ┌────┐          │
│  │Vente │ │Caisse│ │ PROFORMA │ │... │          │
│  └──────┘ └──────┘ └──────────┘ └────┘          │
│                      ▼                          │
│         ProformaInterface.tsx (nouveau)          │
│         - Recherche dans table `produits`        │
│         - Pas de vérification stock              │
│         - Pas de déduction stock                 │
│         - Export PDF A4                          │
│         - Sauvegarde dans `proformas` (nouvelle) │
└─────────────────────────────────────────────────┘
         ▼ Conversion
┌─────────────────────────────────────────────────┐
│  ProformaListPanel.tsx — Liste des proformas     │
│  - Bouton "Convertir en vente" → vérifie stock  │
│  - Crée vente réelle + déduit stock FIFO        │
│  - Bouton "Réimprimer PDF"                      │
│  - Bouton "Annuler"                             │
└─────────────────────────────────────────────────┘
```

## 1. Migration SQL — Table `proformas` + `lignes_proforma`

**Table `proformas`** :
- `id`, `tenant_id`, `numero_proforma` (auto-incrémenté via séquence), `date_proforma`
- `client_id` (nullable), `client_nom` (texte libre si pas de client enregistré)
- `montant_total_ht`, `montant_tva`, `montant_total_ttc`, `remise_globale`, `montant_net`
- `statut` : enum `('En attente', 'Convertie', 'Annulée', 'Expirée')`
- `validite_jours` (défaut 30), `date_expiration`
- `vente_id` (FK nullable → `ventes.id`, rempli à la conversion)
- `agent_id`, `notes`, `metadata` (jsonb)
- `created_at`, `updated_at`

**Table `lignes_proforma`** :
- `id`, `tenant_id`, `proforma_id` (FK)
- `produit_id` (FK → `produits.id`), `libelle_produit`, `code_cip`
- `quantite`, `prix_unitaire_ht`, `prix_unitaire_ttc`, `taux_tva`
- `remise_ligne`, `montant_ligne_ttc`

**RPC `generate_proforma_number`** : Similaire à `generate_pos_invoice_number` mais avec préfixe `PRO-`.

**RLS** : Politiques tenant_id standard (SELECT/INSERT/UPDATE pour authenticated).

## 2. Nouveau composant `ProformaInterface.tsx`

Réplique de `SalesOnlyInterface.tsx` avec ces différences clés :

| Aspect | Vente (actuel) | Proforma (nouveau) |
|--------|---------------|---------------------|
| Recherche produits | `usePOSProductsPaginated` (lots) | Requête directe sur `produits` via combobox serveur-side |
| Vérification stock | Oui (bloquant) | Non |
| Déduction stock | Oui (FIFO via `updateStockAfterSale`) | Non |
| Sauvegarde | Table `ventes` + `lignes_ventes` | Table `proformas` + `lignes_proforma` |
| Impression | Ticket thermique | PDF A4 (jsPDF) |
| Session caisse | Requise | Non requise |

**Composant de recherche** : Créer `ProformaProductSearch.tsx` — recherche serveur-side dans `produits` (libelle_produit, code_cip, ancien_code_cip) avec debounce 400ms, 50 résultats, affichant prix_vente_ttc. Pattern identique à `GlobalCatalogSearchCombobox` mais sur la table `produits` du tenant.

## 3. Export PDF A4

Créer `src/utils/proformaInvoicePDF.ts` :
- Format A4 portrait
- En-tête : logo + infos pharmacie (via `usePrintSettings`/`useGlobalSystemSettings`)
- Mention "FACTURE PROFORMA" en gros
- Infos client, date, numéro, validité
- Tableau produits avec `autoTable` (désignation, qté, PU, montant)
- Totaux HT, TVA, TTC, remise, net
- Pied de page : "Ce document n'est pas une facture. Validité : X jours."
- Généré automatiquement à la création + réimprimable

## 4. Conversion Proforma → Vente

Créer `src/hooks/useProformaManager.ts` avec :
- `createProforma()` : sauvegarde dans `proformas` + `lignes_proforma`
- `convertToSale(proformaId)` :
  1. Vérifie stock disponible pour chaque ligne
  2. Crée une vente dans `ventes` (via le flux existant `saveTransaction`)
  3. Déduit le stock FIFO (existant `updateStockAfterSale`)
  4. Met à jour `proformas.statut = 'Convertie'` + `proformas.vente_id`
- `cancelProforma(proformaId)` : statut → Annulée
- `listProformas()` : liste avec filtres (statut, date, client)

## 5. Panel liste des proformas

Créer `ProformaListPanel.tsx` — accessible dans le même onglet ou via un sous-panel :
- Tableau des proformas (numéro, date, client, montant, statut, validité restante)
- Actions par ligne : Réimprimer PDF, Convertir en vente, Annuler
- Badge de validité (vert/orange/rouge selon jours restants)
- La conversion ouvre un dialogue de confirmation montrant les éventuels produits en rupture

## 6. Intégration dans POSInterface

- Ajouter un onglet "Proforma" dans `POSInterface.tsx` (TabsTrigger + TabsContent)
- Icône `Receipt` de lucide-react
- Toujours visible (pas conditionné au mode séparé/unifié)
- Adapter le grid-cols des tabs

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| Migration SQL | Créer tables `proformas`, `lignes_proforma`, RPC, RLS |
| `src/components/dashboard/modules/sales/pos/ProformaInterface.tsx` | Nouveau — interface de création proforma |
| `src/components/dashboard/modules/sales/pos/ProformaProductSearch.tsx` | Nouveau — recherche produits dans catalogue |
| `src/components/dashboard/modules/sales/pos/ProformaListPanel.tsx` | Nouveau — liste et gestion des proformas |
| `src/hooks/useProformaManager.ts` | Nouveau — logique CRUD + conversion |
| `src/utils/proformaInvoicePDF.ts` | Nouveau — génération PDF A4 |
| `src/components/dashboard/modules/sales/POSInterface.tsx` | Modifier — ajouter onglet Proforma |

