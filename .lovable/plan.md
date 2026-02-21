
# Generation automatique des ecritures comptables lors du paiement de factures

## Analyse

Le `recordPaymentMutation` dans `useInvoiceManager.ts` (lignes 432-483) insere le paiement et met a jour le solde de la facture, mais ne genere **aucune ecriture comptable**. La table `accounting_default_accounts` contient deja les mappages necessaires :

- `encaissement_client` : Debit 521 (Banque), Credit 411 (Client) -- pour reglements clients
- `decaissement_fournisseur` : Debit 401 (Fournisseur), Credit 521 (Banque) -- pour paiements fournisseurs
- `decaissement_especes` : Debit 401, Credit 571 (Caisse) -- pour paiements en especes
- `decaissement_banque` : Debit 401, Credit 521 -- pour paiements par banque

La RPC `generate_accounting_entry` existe deja et accepte un tableau de lignes avec numero de compte, libelle, debit/credit.

## Solution

### Fichier unique a modifier : `src/hooks/useInvoiceManager.ts`

Modifier le `recordPaymentMutation` pour ajouter, apres l'insertion du paiement et la mise a jour du solde, un appel a `generate_accounting_entry` avec les lignes comptables appropriees selon le type de facture.

#### Logique des ecritures SYSCOHADA par type de facture

**Facture Client (encaissement)** :
- Debit : Compte tresorerie (571 Caisse / 521 Banque / 572 Mobile Money) selon le mode de paiement
- Credit : 411 Client (creance client soldee)

**Facture Assureur (encaissement)** :
- Debit : Compte tresorerie (571/521/572) selon mode de paiement
- Credit : 411 Client (creance assureur traitee comme client dans le plan comptable)

**Facture Fournisseur (decaissement)** :
- Debit : 401 Fournisseur (dette fournisseur soldee)
- Credit : Compte tresorerie (571/521/572) selon mode de paiement

**Avoir applique** : Deja gere dans `updateCreditNoteStatusMutation` (lignes 641-724), aucune modification necessaire.

#### Mapping mode de paiement vers compte de tresorerie

Le mapping utilisera les event_types existants de `accounting_default_accounts` :
- Especes : `decaissement_especes` (compte 571 Caisse)
- Carte/Virement/Cheque : `decaissement_banque` ou `encaissement_client` (compte 521 Banque)
- Mobile Money : compte 572 si disponible, sinon 521

La facture complete sera recuperee depuis la base pour determiner son type (`client` vs `fournisseur`) et la presence d'un `assureur_id`.

#### Implementation detaillee

Apres la mise a jour du `montant_paye` (ligne 468), ajouter :

1. Recuperer la facture complete (avec type, numero, assureur_id)
2. Determiner le `event_type` selon le type de facture et le mode de paiement :
   - Client/Assureur + Especes = `decaissement_especes` (pour le compte caisse 571)
   - Client/Assureur + Banque/Carte/Virement = `encaissement_client` (pour le compte banque 521)
   - Fournisseur + Especes = `decaissement_especes`
   - Fournisseur + Banque = `decaissement_fournisseur`
3. Recuperer les comptes par defaut via `accounting_default_accounts`
4. Construire les lignes d'ecriture :
   - Pour client/assureur : Debit tresorerie, Credit 411
   - Pour fournisseur : Debit 401, Credit tresorerie
5. Appeler `generate_accounting_entry` avec le journal appropriate (BQ1, CAI, etc.)
6. En cas d'echec, afficher un toast d'avertissement sans bloquer le paiement

### Resume des fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/hooks/useInvoiceManager.ts` | Ajout de la generation d'ecritures comptables dans `recordPaymentMutation` |

### Ce qui ne change PAS

- Le composant `InvoicePaymentDialog` (Sales et Comptabilite) : pas de modification, il appelle deja `recordPayment` du hook
- Le composant `InvoiceManager.tsx` : pas de modification, il utilise deja le hook
- Le composant `InvoiceModuleConnected.tsx` : pas de modification
- Les avoirs : deja geres dans `updateCreditNoteStatusMutation`
- La migration SQL : aucune migration necessaire, les `accounting_default_accounts` sont deja configures

### Resultat attendu

- Chaque paiement de facture client genere automatiquement une ecriture comptable d'encaissement
- Chaque paiement de facture assureur genere une ecriture d'encaissement similaire
- Chaque paiement de facture fournisseur genere une ecriture de decaissement
- Les ecritures sont creees au statut "Brouillon" et referent le paiement
- Le journal comptable utilise est determine dynamiquement via `accounting_default_accounts`
- En cas de prerequis manquant (exercice, journal, comptes), un toast d'avertissement s'affiche sans bloquer le paiement
