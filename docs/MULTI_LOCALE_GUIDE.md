# Guide Développeur : Architecture Multi-Locale

## Table des Matières
1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Globale](#architecture-globale)
3. [Contextes et Hooks](#contextes-et-hooks)
4. [Formatage des Devises](#formatage-des-devises)
5. [Ajouter une Nouvelle Devise](#ajouter-une-nouvelle-devise)
6. [Bonnes Pratiques](#bonnes-pratiques)
7. [Erreurs Communes](#erreurs-communes)
8. [Exemples de Code](#exemples-de-code)
9. [Tests](#tests)

---

## Vue d'Ensemble

L'application de gestion pharmaceutique est **multi-locale** et supporte plusieurs devises, langues et fuseaux horaires. L'architecture repose sur une **source de vérité unique** : les paramètres système stockés dans la base de données.

### Principes de Conception

✅ **Single Source of Truth** : Les paramètres régionaux sont stockés dans `parametres_systeme`  
✅ **Synchronisation Automatique** : Les contextes se synchronisent automatiquement  
✅ **Pas de Hardcoding** : Aucune devise/langue/format codé en dur dans les composants  
✅ **Hooks Réutilisables** : Utilisation de hooks centralisés pour accéder aux paramètres  
✅ **Typage Fort** : TypeScript pour garantir la cohérence  

### Technologies Utilisées

- **React Context API** : Gestion d'état global pour devises/langues/paramètres
- **Custom Hooks** : Abstraction de la logique métier
- **Supabase** : Stockage des paramètres système (table `parametres_systeme`)
- **TypeScript** : Typage fort des interfaces et paramètres
- **Intl API** : Formatage natif des nombres/dates/devises

---

## Architecture Globale

### Diagramme de Flux

```
┌─────────────────────────────────────────────────────────────┐
│                    Base de Données (Supabase)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Table: parametres_systeme                   │   │
│  │  - default_currency: "XOF"                           │   │
│  │  - currencies_available: [XOF, XAF, EUR, USD, ...]   │   │
│  │  - default_language: "fr"                            │   │
│  │  - default_timezone: "Africa/Brazzaville"            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ Fetch
┌─────────────────────────────────────────────────────────────┐
│              SystemSettingsContext (Provider)                │
│  - Charge les paramètres depuis la DB                       │
│  - Expose settings, loading, saving, saveSettings()         │
│  - Synchronise avec CurrencyContext et LanguageContext      │
└─────────────────────────────────────────────────────────────┘
                           ↓ Sync
┌──────────────────────┐         ┌──────────────────────────┐
│   CurrencyContext    │         │   LanguageContext        │
│  - currentCurrency   │         │  - currentLanguage       │
│  - formatPrice()     │         │  - t() (traduction)      │
│  - getCurrency()     │         │  - setLanguage()         │
└──────────────────────┘         └──────────────────────────┘
           ↓ Used by                        ↓ Used by
┌─────────────────────────────────────────────────────────────┐
│                   Composants React                           │
│  - useCurrency() → formatPrice()                            │
│  - useGlobalSystemSettings() → settings                     │
│  - useLanguage() → t()                                      │
└─────────────────────────────────────────────────────────────┘
```

### Hiérarchie des Providers

```tsx
<App>
  <AuthProvider>
    <SystemSettingsProvider>
      {/* Synchronise automatiquement avec: */}
      <CurrencyProvider>
        <LanguageProvider>
          <Router>
            {/* Vos composants */}
          </Router>
        </LanguageProvider>
      </CurrencyProvider>
    </SystemSettingsProvider>
  </AuthProvider>
</App>
```

---

## Contextes et Hooks

### 1. SystemSettingsContext

**Fichier** : `src/contexts/SystemSettingsContext.tsx`

**Responsabilités** :
- Charger les paramètres système depuis la base de données
- Fournir un accès centralisé aux paramètres (devise, langue, fuseau horaire)
- Synchroniser automatiquement avec `CurrencyContext` et `LanguageContext`
- Sauvegarder les modifications dans la base de données

**Interface** :
```typescript
interface SystemSettingsContextType {
  settings: SystemSettings | null;
  loading: boolean;
  saving: boolean;
  saveSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  refetch: () => Promise<void>;
  
  // Helpers
  getCurrentCurrency: () => Currency | undefined;
  getCurrentTimezone: () => Timezone | undefined;
  getCurrentLanguage: () => Language | undefined;
  
  // Actions
  applyCurrencySettings: () => void;
  applyLanguageSettings: () => void;
  applyInterfaceSettings: () => void;
}
```

**Utilisation** :
```tsx
import { useSystemSettingsContext } from '@/contexts/SystemSettingsContext';

const MyComponent = () => {
  const { settings, saveSettings, getCurrentCurrency } = useSystemSettingsContext();
  
  const currentCurrency = getCurrentCurrency();
  console.log('Devise actuelle:', currentCurrency?.code); // "XOF"
  
  // Changer la devise
  await saveSettings({ default_currency: 'EUR' });
};
```

---

### 2. CurrencyContext

**Fichier** : `src/contexts/CurrencyContext.tsx`

**Responsabilités** :
- Gérer la devise active
- Fournir une fonction `formatPrice()` pour formater les montants
- Synchroniser avec `SystemSettingsContext`

**Interface** :
```typescript
interface CurrencyContextType {
  currentCurrency: Currency;
  setCurrentCurrency: (currency: Currency) => void;
  formatPrice: (amount: number) => string;
  getCurrency: (code: string) => Currency | undefined;
}

interface Currency {
  code: string;      // "XOF", "EUR", "USD"
  name: string;      // "Franc CFA XOF"
  symbol: string;    // "FCFA", "€", "$"
  rate: number;      // Taux de change (optionnel)
  countries: string[]; // ["Congo Brazzaville", ...]
}
```

**Utilisation** :
```tsx
import { useCurrency } from '@/contexts/CurrencyContext';

const ProductCard = ({ price }: { price: number }) => {
  const { formatPrice } = useCurrency();
  
  return (
    <div>
      <p>Prix: {formatPrice(price)}</p>
      {/* Affiche: "50 000 FCFA" ou "50,00 €" selon la devise */}
    </div>
  );
};
```

---

### 3. useSystemSettings Hook

**Fichier** : `src/hooks/useSystemSettings.ts`

**Responsabilités** :
- Charger les paramètres depuis la base de données (table `parametres_systeme` + `pharmacies`)
- Gérer les états de chargement et de sauvegarde
- Exposer les méthodes CRUD pour les paramètres

**Interface** :
```typescript
export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const loadSettings = async () => { /* ... */ };
  const saveSettings = async (updates: Partial<SystemSettings>) => { /* ... */ };
  const updateSettings = (updates: Partial<SystemSettings>) => { /* ... */ };
  
  return { settings, loading, saving, saveSettings, updateSettings, refetch: loadSettings };
};
```

**Utilisation** :
```tsx
import { useSystemSettings } from '@/hooks/useSystemSettings';

const SettingsPage = () => {
  const { settings, loading, saveSettings } = useSystemSettings();
  
  if (loading) return <Spinner />;
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      saveSettings({ default_currency: 'EUR' });
    }}>
      <select value={settings?.default_currency}>
        <option value="XOF">Franc CFA</option>
        <option value="EUR">Euro</option>
      </select>
    </form>
  );
};
```

---

### 4. useGlobalSystemSettings Hook

**Fichier** : `src/hooks/useGlobalSystemSettings.ts`

**Responsabilités** :
- Abstraction de haut niveau pour accéder aux paramètres système
- Combine `SystemSettingsContext` avec des helpers pratiques
- Fournit des fonctions utilitaires (`getPharmacyInfo`, `getTaxSettings`, etc.)

**Interface** :
```typescript
export const useGlobalSystemSettings = () => {
  const context = useSystemSettingsContext();
  
  return {
    ...context,
    // Helpers
    getCurrentCurrency: () => Currency | undefined;
    getCurrentTimezone: () => Timezone | undefined;
    getCurrentLanguage: () => Language | undefined;
    getPharmacyInfo: () => PharmacyInfo;
    getTaxSettings: () => TaxSettings;
    getRegionalSettings: () => RegionalSettings;
    syncWithOtherContexts: () => void;
  };
};
```

**Utilisation** :
```tsx
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';

const Dashboard = () => {
  const { settings, getPharmacyInfo, getTaxSettings } = useGlobalSystemSettings();
  
  const pharmacy = getPharmacyInfo();
  const tax = getTaxSettings();
  
  return (
    <div>
      <h1>{pharmacy.name}</h1>
      <p>TVA: {tax.taux_tva}%</p>
    </div>
  );
};
```

---

## Formatage des Devises

### Fonction `formatPrice()`

La fonction `formatPrice()` est fournie par `CurrencyContext` et utilise l'API `Intl.NumberFormat` pour formater les montants selon la devise et la locale actives.

**Implémentation** :
```typescript
const formatPrice = (amount: number): string => {
  const locale = currentCurrency.code === 'XOF' || currentCurrency.code === 'XAF' 
    ? 'fr-CG' 
    : 'fr-FR';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currentCurrency.code,
    minimumFractionDigits: currentCurrency.code === 'XOF' || currentCurrency.code === 'XAF' ? 0 : 2,
  }).format(amount);
};
```

**Exemples de Formatage** :

| Devise | Montant | Locale | Résultat |
|--------|---------|--------|----------|
| XOF | 50000 | fr-CG | `50 000 FCFA` |
| XAF | 50000 | fr-CM | `50 000 FCFA` |
| EUR | 50.99 | fr-FR | `50,99 €` |
| USD | 50.99 | en-US | `$50.99` |
| GBP | 50.99 | en-GB | `£50.99` |

### ❌ MAUVAISE PRATIQUE (Hardcoding)

```tsx
// ❌ NE PAS FAIRE
const ProductCard = ({ price }) => {
  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`; // Hardcoded!
  };
  
  return <p>{formatPrice(price)}</p>;
};
```

### ✅ BONNE PRATIQUE (Hook)

```tsx
// ✅ BON
import { useCurrency } from '@/contexts/CurrencyContext';

const ProductCard = ({ price }) => {
  const { formatPrice } = useCurrency();
  
  return <p>{formatPrice(price)}</p>;
};
```

---

## Ajouter une Nouvelle Devise

### Méthode 1 : Via l'Interface Utilisateur (Recommandé)

**Prérequis** : Droits administrateur

1. **Accéder aux Paramètres Système**
   - Connexion → Paramètres → Paramètres Système

2. **Section Paramètres Régionaux**
   - Onglet "Paramètres Régionaux"
   - Section "Devises disponibles"

3. **Ajouter la Devise**
   - Cliquer sur "Ajouter une devise"
   - Remplir les champs :
     - **Code** : Code ISO 4217 (ex: `MAD` pour Dirham marocain)
     - **Nom** : Nom complet (ex: "Dirham marocain")
     - **Symbole** : Symbole à afficher (ex: `DH`)
     - **Taux** : Taux de change (optionnel, défaut : 1)
     - **Pays** : Liste des pays utilisant cette devise

4. **Enregistrer**
   - La devise est ajoutée à `currencies_available`
   - Elle devient immédiatement sélectionnable

---

### Méthode 2 : Via la Base de Données

**Prérequis** : Accès direct à la base Supabase

#### Étape 1 : Préparer les Données

```json
{
  "code": "MAD",
  "name": "Dirham marocain",
  "symbol": "DH",
  "rate": 1,
  "countries": ["Maroc"]
}
```

#### Étape 2 : Exécuter la Requête SQL

```sql
-- Insérer ou mettre à jour le paramètre currencies_available
INSERT INTO parametres_systeme (
  tenant_id,
  cle_parametre,
  valeur_parametre,
  type_parametre,
  description,
  categorie,
  is_modifiable,
  is_visible
) VALUES (
  '<TENANT_ID>',
  'currencies_available',
  '[
    {"code": "XOF", "name": "Franc CFA XOF", "symbol": "FCFA", "rate": 1, "countries": ["Congo Brazzaville"]},
    {"code": "XAF", "name": "Franc CFA BEAC", "symbol": "FCFA", "rate": 1, "countries": ["Cameroun"]},
    {"code": "EUR", "name": "Euro", "symbol": "€", "rate": 0.0015, "countries": ["France"]},
    {"code": "USD", "name": "Dollar américain", "symbol": "$", "rate": 0.0016, "countries": ["États-Unis"]},
    {"code": "MAD", "name": "Dirham marocain", "symbol": "DH", "rate": 1, "countries": ["Maroc"]}
  ]'::jsonb,
  'json',
  'Liste des devises disponibles dans l''application',
  'regional',
  true,
  true
)
ON CONFLICT (tenant_id, cle_parametre) 
DO UPDATE SET valeur_parametre = EXCLUDED.valeur_parametre;
```

#### Étape 3 : Mettre à Jour la Devise par Défaut (Optionnel)

```sql
UPDATE parametres_systeme
SET valeur_parametre = 'MAD'
WHERE tenant_id = '<TENANT_ID>' AND cle_parametre = 'default_currency';
```

---

### Méthode 3 : Via le Code (Migration)

**Prérequis** : Accès au dossier `supabase/migrations/`

#### Créer une Migration

**Fichier** : `supabase/migrations/YYYYMMDDHHMMSS_add_mad_currency.sql`

```sql
-- Migration: Ajouter le Dirham marocain (MAD)
DO $$
DECLARE
  current_currencies jsonb;
  new_currency jsonb;
BEGIN
  -- Nouvelle devise à ajouter
  new_currency := '{
    "code": "MAD",
    "name": "Dirham marocain",
    "symbol": "DH",
    "rate": 1,
    "countries": ["Maroc"]
  }'::jsonb;

  -- Mettre à jour pour tous les tenants
  UPDATE parametres_systeme
  SET valeur_parametre = (
    CASE 
      WHEN valeur_parametre::jsonb ? 'code' AND valeur_parametre::jsonb->>'code' = 'MAD'
      THEN valeur_parametre::jsonb
      ELSE (valeur_parametre::jsonb || jsonb_build_array(new_currency))
    END
  )::text
  WHERE cle_parametre = 'currencies_available'
    AND type_parametre = 'json';
END $$;
```

#### Exécuter la Migration

```bash
# Appliquer la migration localement
supabase migration up

# Déployer en production
supabase db push
```

---

## Bonnes Pratiques

### 1. Toujours Utiliser les Hooks

❌ **MAUVAIS** :
```tsx
const price = 50000;
const formatted = `${price.toLocaleString()} FCFA`; // Hardcoded!
```

✅ **BON** :
```tsx
const { formatPrice } = useCurrency();
const formatted = formatPrice(50000); // Dynamique!
```

---

### 2. Ne Jamais Coder en Dur les Devises

❌ **MAUVAIS** :
```tsx
<p>{price} FCFA</p>
<p>{price} €</p>
<p>${price}</p>
```

✅ **BON** :
```tsx
const { formatPrice } = useCurrency();
<p>{formatPrice(price)}</p>
```

---

### 3. Centraliser la Logique de Formatage

❌ **MAUVAIS** :
```tsx
// Copier-coller la fonction dans chaque composant
const formatPrice = (amount: number) => { /* ... */ };
```

✅ **BON** :
```tsx
// Utiliser le hook centralisé
import { useCurrency } from '@/contexts/CurrencyContext';
const { formatPrice } = useCurrency();
```

---

### 4. Gérer les Cas Spéciaux (XOF/XAF)

Les devises CFA n'ont pas de décimales (1 FCFA = 1 unité).

✅ **BON** :
```tsx
const formatPrice = (amount: number): string => {
  const isCFA = ['XOF', 'XAF'].includes(currentCurrency.code);
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currentCurrency.code,
    minimumFractionDigits: isCFA ? 0 : 2, // Pas de décimales pour CFA
  }).format(amount);
};
```

---

### 5. Typer Correctement les Interfaces

✅ **BON** :
```typescript
interface Currency {
  code: string;      // ISO 4217
  name: string;
  symbol: string;
  rate: number;
  countries: string[];
}

interface SystemSettings {
  default_currency: string;
  currencies_available: Currency[];
  // ...
}
```

---

### 6. Mémoïser les Fonctions Lourdes

Pour les composants qui appellent `formatPrice()` fréquemment :

✅ **BON** :
```tsx
const ProductList = ({ products }) => {
  const { formatPrice } = useCurrency();
  
  // Mémoïser les prix formatés
  const formattedPrices = useMemo(() => 
    products.map(p => ({ ...p, formattedPrice: formatPrice(p.price) })),
    [products, formatPrice]
  );
  
  return formattedPrices.map(p => <div>{p.formattedPrice}</div>);
};
```

---

### 7. Valider les Codes de Devise

Utiliser des codes **ISO 4217** valides :

```typescript
const ISO_CURRENCY_CODES = [
  'XOF', 'XAF', 'EUR', 'USD', 'GBP', 'MAD', 'JPY', 'CNY', // ...
];

const isValidCurrencyCode = (code: string): boolean => {
  return ISO_CURRENCY_CODES.includes(code.toUpperCase());
};
```

---

## Erreurs Communes

### ❌ Erreur 1 : Hardcoder la Devise

```tsx
// ❌ MAUVAIS
const price = `${amount} FCFA`;
```

**Solution** : Utiliser `useCurrency().formatPrice()`

---

### ❌ Erreur 2 : Oublier de Synchroniser les Contextes

```tsx
// ❌ MAUVAIS
const saveSettings = async (currency: string) => {
  await supabase.from('parametres_systeme').update({ default_currency: currency });
  // Oubli de synchroniser CurrencyContext!
};
```

**Solution** : Utiliser `SystemSettingsContext.saveSettings()` qui synchronise automatiquement.

---

### ❌ Erreur 3 : Mauvais Format JSON dans la DB

```sql
-- ❌ MAUVAIS
INSERT INTO parametres_systeme (valeur_parametre)
VALUES ('{"code": "EUR"}'); -- JSON invalide (guillemets simples)
```

**Solution** : Utiliser `::jsonb` et des guillemets doubles :
```sql
VALUES ('[{"code": "EUR", "name": "Euro"}]'::jsonb);
```

---

### ❌ Erreur 4 : Ne Pas Gérer les États de Chargement

```tsx
// ❌ MAUVAIS
const { settings } = useGlobalSystemSettings();
return <div>{settings.default_currency}</div>; // Peut crasher si null!
```

**Solution** : Gérer `loading` :
```tsx
const { settings, loading } = useGlobalSystemSettings();
if (loading) return <Spinner />;
return <div>{settings?.default_currency}</div>;
```

---

### ❌ Erreur 5 : Mélanger Locale et Devise

```tsx
// ❌ MAUVAIS
const formatPrice = (amount: number) => {
  return amount.toLocaleString('fr-FR'); // Locale fixe!
};
```

**Solution** : Adapter la locale à la devise :
```tsx
const locale = currentCurrency.code === 'USD' ? 'en-US' : 'fr-FR';
return amount.toLocaleString(locale, { style: 'currency', currency: currentCurrency.code });
```

---

## Exemples de Code

### Exemple 1 : Composant avec Formatage de Prix

```tsx
import { useCurrency } from '@/contexts/CurrencyContext';

interface ProductCardProps {
  product: {
    name: string;
    price: number;
    stock: number;
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { formatPrice } = useCurrency();
  
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p className="price">{formatPrice(product.price)}</p>
      <p className="stock">Stock: {product.stock} unités</p>
    </div>
  );
};
```

---

### Exemple 2 : Page de Paramètres avec Sélection de Devise

```tsx
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { Select } from '@/components/ui/select';

export const CurrencySettingsPage = () => {
  const { settings, loading, saveSettings } = useGlobalSystemSettings();
  
  if (loading) return <div>Chargement...</div>;
  
  const handleCurrencyChange = async (currencyCode: string) => {
    await saveSettings({ default_currency: currencyCode });
  };
  
  return (
    <div>
      <h1>Paramètres de Devise</h1>
      <Select
        value={settings?.default_currency}
        onValueChange={handleCurrencyChange}
      >
        {settings?.currencies_available.map(currency => (
          <option key={currency.code} value={currency.code}>
            {currency.name} ({currency.symbol})
          </option>
        ))}
      </Select>
    </div>
  );
};
```

---

### Exemple 3 : Tableau avec Formatage Multi-Devises

```tsx
import { useCurrency } from '@/contexts/CurrencyContext';

export const SalesTable = ({ sales }: { sales: Sale[] }) => {
  const { formatPrice } = useCurrency();
  
  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Produit</th>
          <th>Montant</th>
        </tr>
      </thead>
      <tbody>
        {sales.map(sale => (
          <tr key={sale.id}>
            <td>{new Date(sale.date).toLocaleDateString()}</td>
            <td>{sale.product_name}</td>
            <td>{formatPrice(sale.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

## Tests

### Test Unitaire : formatPrice()

```typescript
import { renderHook } from '@testing-library/react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

describe('useCurrency', () => {
  it('should format XOF currency without decimals', () => {
    const { result } = renderHook(() => useCurrency(), {
      wrapper: ({ children }) => (
        <CurrencyProvider initialCurrency={{ code: 'XOF', name: 'Franc CFA', symbol: 'FCFA', rate: 1, countries: [] }}>
          {children}
        </CurrencyProvider>
      ),
    });
    
    expect(result.current.formatPrice(50000)).toBe('50 000 FCFA');
  });
  
  it('should format EUR currency with decimals', () => {
    const { result } = renderHook(() => useCurrency(), {
      wrapper: ({ children }) => (
        <CurrencyProvider initialCurrency={{ code: 'EUR', name: 'Euro', symbol: '€', rate: 1, countries: [] }}>
          {children}
        </CurrencyProvider>
      ),
    });
    
    expect(result.current.formatPrice(50.99)).toBe('50,99 €');
  });
});
```

---

### Test d'Intégration : Changement de Devise

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SystemSettingsProvider } from '@/contexts/SystemSettingsContext';
import { CurrencySettingsPage } from '@/pages/CurrencySettingsPage';

describe('CurrencySettingsPage', () => {
  it('should change currency and update display', async () => {
    render(
      <SystemSettingsProvider>
        <CurrencySettingsPage />
      </SystemSettingsProvider>
    );
    
    // Changer la devise
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'EUR' } });
    
    // Vérifier que la sauvegarde a été appelée
    await waitFor(() => {
      expect(screen.getByText(/enregistré/i)).toBeInTheDocument();
    });
  });
});
```

---

## Checklist de Développement

Avant de committer du code manipulant des devises :

- [ ] Utilise `useCurrency().formatPrice()` au lieu de fonctions locales
- [ ] Aucune devise codée en dur (XOF, EUR, $, etc.)
- [ ] Types TypeScript corrects pour `Currency` et `SystemSettings`
- [ ] Gestion des états de chargement (`loading`, `saving`)
- [ ] Validation des codes de devise (ISO 4217)
- [ ] Tests unitaires pour les fonctions de formatage
- [ ] Documentation des nouveaux paramètres ajoutés
- [ ] Vérification de la synchronisation `SystemSettingsContext` ↔ `CurrencyContext`

---

## Ressources

### Documentation Interne
- [Guide Utilisateur Multi-Locale](./GUIDE_PARAMETRES_REGIONAUX.md)
- [Architecture Supabase](./SUPABASE_ARCHITECTURE.md)

### Références Externes
- [ISO 4217 - Codes de Devises](https://en.wikipedia.org/wiki/ISO_4217)
- [Intl.NumberFormat - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [React Context API](https://react.dev/reference/react/useContext)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**Version** : 1.0.0  
**Dernière Mise à Jour** : Novembre 2025  
**Auteurs** : Équipe Développement
