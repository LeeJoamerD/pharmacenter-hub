

# Enrichissement du bulletin de paie — Primes détaillées et retenues

## Analyse de la capture d'écran WinDev

Rubriques identifiées absentes du système actuel :

**Primes imposables (11 rubriques) :**
1. Ancienneté (avec nb années + montant calculé)
2. Prime de Nuit
3. Prime de Caisse
4. Prime de Logement
5. Prime Expatriation
6. Prime de Risque
7. Allocations Familiales
8. Prime de Diplôme
9. Heures Supp. à 4 taux (10%, 25%, 50%, 100%) — déjà partiellement couvert par `heures_sup`
10. Autres Primes (avec champ texte libre)

**Primes non imposables (4 rubriques) :**
1. Prime de Transport
2. Prime de Ration
3. Prime de Salissure
4. Autres Primes non imposables (avec champ texte libre)

**Retenues additionnelles (4 rubriques au-delà de CNSS/IRPP) :**
1. TOL (Taxe sur l'Obligation Légale)
2. Crédit
3. Pharmacie
4. Autres Retenues (avec champ texte libre)

**Autres champs :**
- Quantité Présences (jours travaillés)
- Congés payés (montant calculé, avec toggle)
- Acompte (distinct des avances)

## Approche technique

### 1. Migration SQL — Enrichir `bulletins_paie` et `parametres_paie`

**Table `bulletins_paie` — Ajouter des colonnes JSONB pour le détail :**
```
detail_primes_imposables JSONB DEFAULT '{}'
detail_primes_non_imposables JSONB DEFAULT '{}'
detail_retenues JSONB DEFAULT '{}'
conges_payes NUMERIC DEFAULT 0
qte_presences INTEGER DEFAULT 26
acompte NUMERIC DEFAULT 0
```

Structure JSONB `detail_primes_imposables` :
```json
{
  "anciennete": { "actif": false, "annees": 0, "montant": 0 },
  "prime_nuit": { "actif": false, "montant": 0 },
  "prime_caisse": { "actif": false, "montant": 0 },
  "prime_logement": { "actif": false, "montant": 0 },
  "prime_expatriation": { "actif": false, "montant": 0 },
  "prime_risque": { "actif": false, "montant": 0 },
  "allocations_familiales": { "actif": false, "montant": 0 },
  "prime_diplome": { "actif": false, "montant": 0 },
  "heures_sup_10": { "actif": false, "qte": 0, "montant": 0 },
  "heures_sup_25": { "actif": false, "qte": 0, "montant": 0 },
  "heures_sup_50": { "actif": false, "qte": 0, "montant": 0 },
  "heures_sup_100": { "actif": false, "qte": 0, "montant": 0 },
  "autres": { "actif": false, "montant": 0, "description": "" }
}
```

Structure JSONB `detail_primes_non_imposables` :
```json
{
  "prime_transport": { "actif": false, "montant": 0 },
  "prime_ration": { "actif": false, "montant": 0 },
  "prime_salissure": { "actif": false, "montant": 0 },
  "autres": { "actif": false, "montant": 0, "description": "" }
}
```

Structure JSONB `detail_retenues` :
```json
{
  "tol": { "actif": false, "montant": 0 },
  "credit": { "actif": false, "montant": 0 },
  "pharmacie": { "actif": false, "montant": 0 },
  "autres": { "actif": false, "montant": 0, "description": "" }
}
```

**Table `parametres_paie` — Ajouter les montants par défaut :**
```
primes_defaut JSONB DEFAULT '{}'
taux_conge_paye NUMERIC DEFAULT 8.33
tol_defaut NUMERIC DEFAULT 0
```

### 2. Modifier `PayrollSettings.tsx` — Onglet Paramètres

Ajouter deux nouvelles cartes :
- **Primes par défaut** : Montants par défaut pour chaque prime (utilisés à la génération)
- **Autres paramètres** : Taux congés payés, TOL par défaut

### 3. Modifier le modal "Modifier le bulletin" dans `BulletinsList.tsx`

Restructurer le dialog en sections :
- **Salaire de base** + Qté Présences
- **Primes imposables** : Bloc avec switch (toggle) pour chaque prime + champ montant. Désactivées par défaut.
- **Primes non imposables** : Idem avec switch + montant
- **Congés payés** : Switch + montant calculé auto (salaire_brut × taux / 100)
- **Retenues** : TOL, Crédit, Pharmacie, Autres avec switch + montant
- **Avances / Acompte**

Utiliser un `ScrollArea` pour gérer la hauteur du dialog.

### 4. Mettre à jour `useSalaryManager.ts` — Logique de calcul

Modifier `calculatePayroll` :
- `primes` = somme des primes imposables activées
- `salaire_brut` = salaire_base + primes imposables + heures_sup
- `total_brut_conge` = salaire_brut + congés_payés
- CNSS s'applique sur `salaire_brut` (pas sur primes non imposables)
- `retenues_autres` = somme des retenues détaillées activées (TOL + Crédit + Pharmacie + Autres)
- `net_a_payer` = salaire_net + primes_non_imposables - avances - acompte

Mettre à jour `generatePayroll` pour utiliser les primes par défaut des paramètres.

### 5. Mettre à jour le PDF du bulletin

Enrichir `generateBulletinPDF` dans `BulletinsList.tsx` :
- Section "Primes imposables" : lister uniquement les primes activées avec leurs montants
- Section "Primes non imposables" : idem
- Section "Retenues" : détailler TOL, Crédit, Pharmacie, Autres au lieu du simple "Autres retenues"
- Ajouter ligne "Congés payés" si activés
- Conserver le style professionnel existant (table jsPDF autoTable)

### 6. Mettre à jour les interfaces TypeScript

Enrichir `BulletinPaie` dans `useSalaryManager.ts` avec les nouveaux champs JSONB typés.

## Fichiers impactés
- **Nouveau** : Migration SQL
- **Modifié** : `PayrollSettings.tsx` (cartes primes par défaut)
- **Modifié** : `BulletinsList.tsx` (modal édition enrichi + PDF enrichi)
- **Modifié** : `useSalaryManager.ts` (calculs + interfaces + génération)
- **Modifié** : `PayrollAccountingService.ts` (prise en compte congés payés dans écritures)

