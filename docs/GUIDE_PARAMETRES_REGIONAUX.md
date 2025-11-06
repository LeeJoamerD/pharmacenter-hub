# Guide Utilisateur : Configuration des Devises et Paramètres Régionaux

## Table des Matières
1. [Introduction](#introduction)
2. [Accès aux Paramètres Système](#accès-aux-paramètres-système)
3. [Configuration des Devises](#configuration-des-devises)
4. [Configuration des Paramètres Régionaux](#configuration-des-paramètres-régionaux)
5. [Formats et Conventions](#formats-et-conventions)
6. [Exemples par Pays](#exemples-par-pays)
7. [FAQ](#faq)

---

## Introduction

L'application de gestion pharmaceutique est **multi-locale** et s'adapte automatiquement aux paramètres régionaux de votre pharmacie. Cette flexibilité permet à des pharmacies du Congo-Brazzaville, du Cameroun, de France, ou d'autres pays d'utiliser l'application avec leurs propres conventions locales.

### Paramètres Configurables
- **Devise** : Monnaie utilisée pour tous les prix et transactions
- **Langue** : Langue de l'interface utilisateur
- **Fuseau horaire** : Fuseau horaire pour l'affichage des dates et heures
- **Formats** : Format des dates, des nombres et des devises

---

## Accès aux Paramètres Système

### Étape 1 : Accéder aux Paramètres
1. Connectez-vous à votre compte
2. Cliquez sur l'icône **Paramètres** dans le menu latéral gauche
3. Sélectionnez **Paramètres Système**

### Étape 2 : Section Paramètres Régionaux
Dans la page des Paramètres Système, vous trouverez plusieurs onglets :
- **Informations Pharmacie** : Nom, adresse, contacts
- **Paramètres Système** : Configuration générale
- **Paramètres Régionaux** : Devise, langue, fuseau horaire ⭐
- **Paramètres Fiscaux** : TVA, année fiscale
- **Paramètres Interface** : Thème, couleurs, affichage

---

## Configuration des Devises

### Devise Par Défaut

La devise par défaut est utilisée pour **tous les prix** affichés dans l'application (produits, ventes, stock, rapports).

#### Comment Configurer
1. Accédez à **Paramètres Système** → **Paramètres Régionaux**
2. Dans le champ **Devise par défaut**, sélectionnez votre devise
3. Cliquez sur **Enregistrer les modifications**

#### Devises Disponibles (Par Défaut)

| Code | Nom | Symbole | Pays |
|------|-----|---------|------|
| **XOF** | Franc CFA XOF | CFA | Congo Brazzaville, Sénégal, Mali |
| **XAF** | Franc CFA BEAC | FCFA | Cameroun, Gabon, Tchad |
| **EUR** | Euro | € | France, Allemagne, Espagne |
| **USD** | Dollar américain | $ | États-Unis, Canada |
| **GBP** | Livre sterling | £ | Royaume-Uni |

### Formats d'Affichage par Devise

Après avoir sélectionné une devise, tous les montants s'affichent automatiquement avec le bon format :

#### Exemple : 1 234 567,89 unités
- **XOF/XAF (Congo/Cameroun)** : `1 234 568 FCFA` (arrondi à l'entier)
- **EUR (France)** : `1 234 567,89 €`
- **USD (États-Unis)** : `$1,234,567.89`
- **GBP (Royaume-Uni)** : `£1,234,567.89`

> **Note** : Le format suit automatiquement les conventions locales (espaces, virgules, points).

### Ajouter/Modifier des Devises

Si votre devise n'est pas dans la liste par défaut, vous pouvez l'ajouter :

1. Contactez votre administrateur système
2. Les devises sont configurées dans la table `parametres_systeme`
3. Paramètre : `currencies_available` (type JSON)

**Exemple de configuration JSON** :
```json
[
  {
    "code": "MAD",
    "name": "Dirham marocain",
    "symbol": "DH",
    "rate": 1,
    "countries": ["Maroc"]
  }
]
```

---

## Configuration des Paramètres Régionaux

### Langue de l'Interface

#### Langues Disponibles (Par Défaut)
- 🇫🇷 **Français** (fr) - Congo Brazzaville, France, Cameroun
- 🇨🇬 **Lingala** (ln) - Congo Brazzaville
- 🇺🇸 **English** (en) - International
- 🇪🇸 **Español** (es) - Espagne, Amérique Latine
- 🇩🇪 **Deutsch** (de) - Allemagne

#### Comment Changer la Langue
1. **Paramètres Système** → **Paramètres Régionaux**
2. Champ **Langue par défaut** : Sélectionnez votre langue
3. **Enregistrer** : L'interface se met à jour immédiatement

> **Effet** : Tous les textes de l'interface (menus, boutons, messages) s'affichent dans la langue sélectionnée.

### Fuseau Horaire

Le fuseau horaire affecte l'affichage des **dates et heures** dans toute l'application (ventes, logs, rapports).

#### Fuseaux Horaires Disponibles
- **Africa/Brazzaville** (UTC+1) - Congo Brazzaville
- **Africa/Douala** (UTC+1) - Cameroun
- **Europe/Paris** (UTC+1) - France
- **America/New_York** (UTC-5) - États-Unis Est
- **Asia/Tokyo** (UTC+9) - Japon

#### Comment Configurer
1. **Paramètres Système** → **Paramètres Régionaux**
2. Champ **Fuseau horaire** : Sélectionnez votre zone
3. **Enregistrer**

**Exemple** : 
- Heure serveur : 14:00 UTC
- Affichage Congo (UTC+1) : **15:00**
- Affichage New York (UTC-5) : **09:00**

---

## Formats et Conventions

### Format des Dates

Le format des dates s'adapte à la locale sélectionnée :

| Locale | Format | Exemple |
|--------|--------|---------|
| **fr-CG** (Congo) | JJ/MM/AAAA | 15/03/2025 |
| **fr-FR** (France) | JJ/MM/AAAA | 15/03/2025 |
| **en-US** (USA) | MM/DD/YYYY | 03/15/2025 |
| **en-GB** (UK) | DD/MM/YYYY | 15/03/2025 |

### Format des Nombres

| Locale | Séparateur décimal | Séparateur milliers | Exemple |
|--------|-------------------|---------------------|---------|
| **fr-CG** | Virgule (,) | Espace | 1 234,56 |
| **fr-FR** | Virgule (,) | Espace | 1 234,56 |
| **en-US** | Point (.) | Virgule | 1,234.56 |
| **en-GB** | Point (.) | Virgule | 1,234.56 |

### Format des Devises

Le format combine **locale + devise** pour un affichage optimal :

```
Congo (fr-CG) + XOF → "1 500 FCFA"
France (fr-FR) + EUR → "1 500,00 €"
USA (en-US) + USD → "$1,500.00"
```

---

## Exemples par Pays

### 🇨🇬 Congo Brazzaville (Configuration par Défaut)

**Paramètres Recommandés** :
- **Devise** : XOF (Franc CFA)
- **Langue** : Français (fr) ou Lingala (ln)
- **Fuseau horaire** : Africa/Brazzaville (UTC+1)
- **TVA** : 19,25%

**Affichage** :
- Prix : `50 000 FCFA`
- Date : `15/03/2025`
- Heure : `14:30`

---

### 🇨🇲 Cameroun

**Paramètres Recommandés** :
- **Devise** : XAF (Franc CFA BEAC)
- **Langue** : Français (fr)
- **Fuseau horaire** : Africa/Douala (UTC+1)
- **TVA** : 19,25%

**Affichage** :
- Prix : `50 000 FCFA`
- Date : `15/03/2025`
- Heure : `14:30`

---

### 🇫🇷 France

**Paramètres Recommandés** :
- **Devise** : EUR (Euro)
- **Langue** : Français (fr)
- **Fuseau horaire** : Europe/Paris (UTC+1)
- **TVA** : 20%

**Affichage** :
- Prix : `50,00 €`
- Date : `15/03/2025`
- Heure : `14:30`

---

### 🇺🇸 États-Unis

**Paramètres Recommandés** :
- **Devise** : USD (Dollar)
- **Langue** : English (en)
- **Fuseau horaire** : America/New_York (UTC-5)
- **TVA** : Variable selon l'État

**Affichage** :
- Prix : `$50.00`
- Date : `03/15/2025`
- Heure : `2:30 PM`

---

## FAQ

### ❓ Puis-je changer de devise après avoir commencé à utiliser l'application ?

**Oui**, mais avec précautions :
- Les **anciens prix** restent enregistrés en base dans leur devise d'origine
- Les **nouveaux prix** s'affichent dans la nouvelle devise
- **Recommandation** : Définissez la devise au démarrage et évitez de la changer

### ❓ La langue change-t-elle immédiatement ?

**Oui**, l'interface se met à jour dès que vous enregistrez le paramètre.

### ❓ Le fuseau horaire affecte-t-il les rapports ?

**Oui** :
- Les **rapports** affichent les dates/heures selon votre fuseau
- Les **exports** (PDF, Excel) utilisent aussi ce fuseau
- Les **données en base** sont stockées en UTC (universel)

### ❓ Comment ajouter une nouvelle devise non listée ?

Contactez l'administrateur pour ajouter la devise dans :
1. **Base de données** : Table `parametres_systeme`
2. **Paramètre** : `currencies_available`
3. **Format JSON** avec code ISO 4217

### ❓ Puis-je avoir plusieurs devises actives en même temps ?

**Non**, l'application utilise **une seule devise par défaut** pour tous les prix. Cependant :
- Vous pouvez définir plusieurs devises dans `currencies_available`
- Seule la `default_currency` est utilisée pour l'affichage

### ❓ Les paramètres sont-ils sauvegardés par utilisateur ou par pharmacie ?

**Par pharmacie** (tenant) :
- Tous les utilisateurs de la même pharmacie partagent les mêmes paramètres régionaux
- Seul un administrateur peut modifier ces paramètres

---

## Support Technique

Pour toute question ou problème :
1. Consultez la **documentation technique** : `/docs/MULTI_LOCALE_GUIDE.md`
2. Contactez votre **administrateur système**
3. Vérifiez les **logs d'erreur** dans les paramètres avancés

---

**Version du Guide** : 1.0.0  
**Dernière mise à jour** : Novembre 2025  
**Compatibilité** : Application Gestion Pharmaceutique v2.0+
