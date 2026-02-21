
# Audit et correction du systeme de gestion des ventes en bon (credit/dette)

## Anomalies detectees

### Anomalie 1 : La dette est attribuee au client au lieu de l'assureur
**Localisation** : `usePOSData.ts` (ligne 207) et `processPayment` (ligne 411)

Quand un client assure achete en bon (dette), le systeme enregistre `montant_net = totalAPayer` (la part client uniquement). La dette enregistree dans `metadata.montant_dette` correspond a la part client non payee, mais la **part assurance** (`montant_part_assurance`) n'est jamais tracee comme une dette a recouvrer separement.

Au moment de la facturation :
- La RPC `get_unbilled_sales_by_client` cherche les ventes par `client_id` et retourne `montant_total_ttc` (le montant brut avant couverture).
- La facture est creee au nom du client et non de l'assureur.
- Le montant facture est le TTC complet au lieu d'etre la part assureur.

### Anomalie 2 : L'assureur n'apparait pas dans la liste "Client" du modal de facturation
**Localisation** : `ClientSelector.tsx` et `InvoiceFormDialog.tsx`

Le `ClientSelector` charge uniquement la table `clients`. Les assureurs sont dans la table `assureurs` (entite separee). Ils ne sont donc jamais proposes comme destinataires de facture.

### Anomalie 3 : Pas de colonne `assureur_id` dans la table `ventes`
La table `ventes` n'a pas de colonne `assureur_id`. L'information de l'assureur est stockee uniquement dans `metadata.client_info.assureur_id` (JSON), ce qui empeche toute requete SQL efficace pour retrouver les ventes a facturer par assureur.

### Anomalie 4 : Absence de formulaire "Details beneficiaire" pour les ventes en bon
Aucune table ni interface ne permet de capturer les informations complementaires du beneficiaire (Nom beneficiaire, Lien, Matricule Agent, Matricule Patient, N Police, N Bon, Type Piece, Ref Piece, Tel Agent, Adresse Agent, Medecin Traitant) qui sont necessaires pour la facturation a l'assureur.

---

## Plan de correction

### Phase 1 : Schema de base de donnees

**1.1 Ajouter `assureur_id` a la table `ventes`**
- Nouvelle colonne `assureur_id UUID REFERENCES assureurs(id)` sur `ventes`
- Permet de filtrer les ventes par assureur pour la facturation

**1.2 Creer la table `details_vente_bon`**
Table pour stocker les informations du beneficiaire liees a chaque transaction en bon :

```text
details_vente_bon
  id              UUID PRIMARY KEY
  tenant_id       UUID NOT NULL (FK pharmacies)
  vente_id        UUID NOT NULL (FK ventes, UNIQUE)
  nom_beneficiaire    TEXT NOT NULL
  lien                TEXT
  matricule_agent     TEXT
  matricule_patient   TEXT
  numero_police       TEXT
  numero_bon          TEXT
  type_piece          TEXT
  reference_piece     TEXT
  telephone_agent     TEXT
  adresse_agent       TEXT
  medecin_traitant    TEXT
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()
```

RLS : policer par `tenant_id = get_current_user_tenant_id()`.

**1.3 Creer la RPC `get_unbilled_sales_by_insurer`**
Nouvelle fonction RPC qui retourne les ventes non facturees pour un assureur donne, en filtrant sur `assureur_id` et `montant_part_assurance > 0`.

### Phase 2 : Enregistrement de la vente (usePOSData.ts)

**2.1 Sauvegarder `assureur_id` dans la vente**
Dans `saveTransaction` : si le client est assure, enregistrer `assureur_id` directement dans la colonne de la table `ventes` (en plus du `metadata`).

### Phase 3 : Formulaire "Details beneficiaire" au POS

**3.1 Creer le composant `BeneficiaryDetailsModal.tsx`**
Modal avec les champs : Nom beneficiaire (obligatoire, pre-rempli avec le nom du client), Lien, Matricule Agent, Matricule Patient, N Police, N Bon, Type Piece, Ref Piece, Tel Agent, Adresse Agent, Medecin Traitant.

**3.2 Ajouter le bouton dans `CustomerSelection.tsx`**
Ajouter un bouton (icone `ClipboardList` ou `FileText`) dans la carte du client selectionne (zone encadree en rouge dans l'image `image-383.png`, a cote de Taux AD). Ce bouton ouvre le `BeneficiaryDetailsModal`.

Les donnees saisies sont stockees temporairement dans le state POS puis sauvegardees dans `details_vente_bon` apres la creation de la vente.

**3.3 Integration dans les deux modes**
- `SalesOnlyInterface.tsx` : Passer les details beneficiaire dans `saveTransaction`, inserer dans `details_vente_bon` apres creation de la vente.
- `CashRegisterInterface.tsx` : Meme integration via `processPayment` ou les hooks partages.

### Phase 4 : Correction de la facturation

**4.1 Modifier `InvoiceFormDialog.tsx`**
- Ajouter un nouveau type de facture : "Facture Assureur" (en plus de "Facture Client")
- Quand "Facture Assureur" est selectionne, le selecteur "Client" est remplace par un selecteur "Assureur" (charge depuis la table `assureurs`)
- Les "Ventes non facturees" sont chargees via la nouvelle RPC `get_unbilled_sales_by_insurer` au lieu de `get_unbilled_sales_by_client`
- Le montant de chaque vente affiche est `montant_part_assurance` (la part a facturer a l'assureur) au lieu de `montant_total_ttc`

**4.2 Creer `AssureurSelector.tsx`**
Composant de selection d'assureur (similaire a `ClientSelector`) qui charge la table `assureurs` et permet de chercher par nom.

**4.3 Adapter `useInvoiceManager.ts`**
- Supporter le type `assureur` dans `createInvoiceMutation`
- Stocker `assureur_id` dans la facture (la table `factures` a deja un champ `client_fournisseur` qui peut etre utilise, ou ajouter un champ `assureur_id`)
- Mettre a jour `facture_generee` sur les ventes lors de la creation de la facture assureur

**4.4 Modifier la RPC `get_unbilled_sales_by_client`**
Ajouter un filtre pour exclure la part assurance des ventes facturables au client. Si une vente a un `montant_part_assurance > 0`, le montant affiche dans "Ventes non facturees" du client doit etre `montant_part_patient` (la part client non couverte) au lieu de `montant_total_ttc`.

### Phase 5 : Coherence des montants de dette

**5.1 Clarifier la logique de dette dans `processPayment`**
Quand un client assure fait une vente en bon :
- `montant_dette` dans metadata = part client non payee (si le client n'a pas paye son ticket moderateur)
- La part assurance n'est PAS une dette du client, c'est une creance envers l'assureur
- S'assurer que `montant_paye` reflete uniquement ce que le client a reellement paye

**5.2 Afficher correctement les details dans `details_vente_bon`**
Les informations du beneficiaire seront accessibles :
- Depuis le detail de la transaction (TransactionDetailsModal)
- Depuis la facture assureur (pour justification)

---

## Resume des fichiers modifies

| Fichier | Modification |
|---------|-------------|
| **Migration SQL** | Ajout colonne `assureur_id` sur `ventes`, creation table `details_vente_bon`, RPC `get_unbilled_sales_by_insurer`, mise a jour RPC `get_unbilled_sales_by_client` |
| `src/hooks/usePOSData.ts` | Enregistrer `assureur_id` dans la vente, sauvegarder details beneficiaire |
| `src/components/dashboard/modules/sales/pos/CustomerSelection.tsx` | Ajouter bouton "Details beneficiaire" |
| **Nouveau** `src/components/dashboard/modules/sales/pos/BeneficiaryDetailsModal.tsx` | Modal formulaire details beneficiaire |
| `src/components/dashboard/modules/sales/pos/SalesOnlyInterface.tsx` | Integrer le state details beneficiaire |
| `src/components/dashboard/modules/sales/pos/CashRegisterInterface.tsx` | Integrer le state details beneficiaire |
| `src/components/dashboard/modules/sales/invoice/InvoiceFormDialog.tsx` | Ajouter type "Facture Assureur", selecteur assureur, montants corriges |
| **Nouveau** `src/components/accounting/AssureurSelector.tsx` | Composant selection assureur |
| `src/hooks/useInvoiceManager.ts` | Supporter factures assureur |
| `src/components/accounting/TransactionSelector.tsx` | Supporter le mode assureur avec montants `part_assurance` |

## Comportement attendu apres correction

1. **Client non couvert** : La dette est a la charge du client. La facture est emise au nom du client pour le montant total.
2. **Client couvert par assurance** : 
   - Le client paye son ticket moderateur a la caisse (part patient)
   - La part assurance est une creance envers l'assureur
   - La facture est emise au nom de l'assureur pour le montant de la couverture
   - Si le client n'a pas paye sa part a la caisse, une facture client separee peut etre emise pour sa part restante
3. **Details beneficiaire** : Le bouton dans la carte client permet de saisir les informations necessaires a la justification de la facturation assureur (Nom beneficiaire, Matricule, N Bon, etc.)
