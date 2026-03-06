

# Plan : Pharmacie de Tests & Workflow "Tester PharmaSoft"

## Résumé

Trois tâches distinctes :
1. Créer une table `allowed_test_emails` et son interface d'administration dans `/platform-admin`
2. Corriger les textes "Voir la Démo" → "Tester PharmaSoft" et confirmer l'email du Footer
3. Implémenter le workflow complet : bouton → saisie email → vérification → connexion auto au tenant test

---

## 1. Table `allowed_test_emails` + Interface Admin

### Migration SQL

```sql
CREATE TABLE public.allowed_test_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.allowed_test_emails ENABLE ROW LEVEL SECURITY;

-- Seuls les platform admins peuvent lire/écrire
CREATE POLICY "Platform admins full access"
  ON public.allowed_test_emails
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

### Interface Admin

Nouveau composant `AllowedTestEmailsManager.tsx` dans `src/components/platform-admin/`, ajouté comme route dans `PlatformAdmin.tsx` et lien dans le menu `PlatformAdminLayout.tsx`.

Fonctionnalités :
- Liste des emails avec statut (actif/inactif)
- Ajouter un email (champ + bouton)
- Toggle activer/désactiver via `Switch`
- Supprimer avec confirmation
- Pattern identique à `PlatformConfiguration.tsx`

---

## 2. Corrections Textuelles

### Bouton "Voir la Démo" → "Tester PharmaSoft"

Fichier `src/contexts/LanguageContext.tsx` — modifier la clé `seeDemo` dans les 4 langues :
- FR (ligne 41) : `"Voir la Démo"` → `"Tester PharmaSoft"`
- EN (ligne 2177) : `"See Demo"` → `"Try PharmaSoft"`
- ES (ligne 4293) : `"Ver Demo"` → `"Probar PharmaSoft"`
- LN (ligne 6356) : `"Tala Demo"` → `"Meka PharmaSoft"`

### Email Footer

Le Footer (`src/components/Footer.tsx` ligne 91) affiche déjà `support@pharmasoft-djlcs.com`. Aucune modification nécessaire.

---

## 3. Workflow "Tester PharmaSoft"

### Flux utilisateur

```text
Bouton "Tester PharmaSoft"
  → Dialog : saisie email
  → Vérification : email dans allowed_test_emails + is_active = true
  → Envoi code OTP via edge function send-verification-code
  → Saisie code OTP (VerificationDialog existant)
  → Vérification code via edge function verify-code
  → Connexion automatique au compte test
  → Redirection vers /tableau-de-bord
```

### Modifications du bouton Hero

Dans `src/components/Hero.tsx` (lignes 179-184) : remplacer le `<Link to="/tableau-de-bord">` par un `onClick` qui ouvre un nouveau composant `TestAccessDialog`.

### Nouveau composant `TestAccessDialog.tsx`

Dialog en deux étapes :
1. **Étape 1** : Champ email + bouton "Envoyer le code"
   - Vérifie d'abord si l'email est dans `allowed_test_emails` et actif
   - Si oui, appelle `send-verification-code` avec `type: "email"`
   - Si non, message d'erreur "Cet email n'est pas autorisé pour les tests"

2. **Étape 2** : Réutilise le composant `VerificationDialog` existant pour la saisie du code OTP

### Nouvelle Edge Function `auto-login-test`

Crée une session Supabase pour le compte test après vérification du code :

- Vérifie que l'email appelant est dans `allowed_test_emails`
- Vérifie que le code OTP a bien été validé (vérifié_at non null)
- Utilise `supabase.auth.admin.generateLink()` avec `type: 'magiclink'` pour le compte test (`support@pharmasoft-djlcs.com`, user id `63c51688-ad32-4299-82b7-bbb1408e668e`)
- Retourne le lien magique ou les tokens de session
- Côté client : utilise `supabase.auth.verifyOtp()` ou redirige vers le magic link
- Stocke la session pharmacy du tenant test (`2f7365aa-eadd-4aa9-a5c8-330b97d55ea8`) dans localStorage

### Sécurité

- L'edge function utilise `SUPABASE_SERVICE_ROLE_KEY` (déjà disponible)
- Double vérification : email autorisé + code OTP validé
- Le compte test est un vrai compte Supabase Auth existant
- Aucune information sensible exposée côté client

---

## Fichiers impactés

| Action | Fichier |
|--------|---------|
| Migration | Nouvelle table `allowed_test_emails` |
| Créer | `src/components/platform-admin/AllowedTestEmailsManager.tsx` |
| Modifier | `src/components/platform-admin/PlatformAdminLayout.tsx` (menu) |
| Modifier | `src/pages/PlatformAdmin.tsx` (route) |
| Modifier | `src/contexts/LanguageContext.tsx` (4 traductions) |
| Créer | `src/components/test-access/TestAccessDialog.tsx` |
| Modifier | `src/components/Hero.tsx` (bouton) |
| Créer | `supabase/functions/auto-login-test/index.ts` |

