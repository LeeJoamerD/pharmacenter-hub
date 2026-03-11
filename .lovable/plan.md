
Objectif: rendre la connexion “Tester PharmaSoft” strictement équivalente à un vrai flux “Pharmacie + Utilisateur”, et supprimer la redirection parasite vers l’accueil.

1) Diagnostic confirmé
- Le tenant est bien créé (session pharmacie réelle), mais la session utilisateur n’est pas fiable dans le flux test.
- `auto-login-test` s’appuie sur `generateLink` puis lit `properties.access_token/refresh_token` (souvent absents pour magiclink), donc `setSession` côté client peut ne jamais authentifier l’utilisateur.
- Le Dashboard redirige trop vite si `user` n’est pas encore hydraté, ce qui déclenche le toast “non autorisé”.

2) Correctifs à implémenter

A. `supabase/functions/auto-login-test/index.ts`
- Garder les contrôles OTP + email autorisé.
- Conserver `create_pharmacy_session` (tenant test).
- Remplacer la récupération de tokens auth:
  - `generateLink(type: "magiclink", email: TEST_USER_EMAIL)`
  - récupérer `email_otp` (ou token_hash)
  - appeler `auth.verifyOtp(...)` pour obtenir une vraie `session` (access/refresh tokens valides)
- Retourner explicitement:
  - `access_token`, `refresh_token`
  - `session_token`, `expires_at`
  - `pharmacy` enrichie
  - `auth_user_id` attendu + `personnel_id` attendu (pour validation côté client)
- Si tokens absents: renvoyer erreur (ne jamais répondre success partiel).

B. `src/components/test-access/TestAccessDialog.tsx`
- Rendre le login atomique (tout ou rien):
  1. vérifier OTP
  2. appeler `auto-login-test`
  3. exiger `access_token + refresh_token + session_token`
  4. `supabase.auth.setSession(...)`
  5. vérifier `supabase.auth.getUser()` + cohérence ID attendu
  6. hydrater `pharmacy_session` (format enrichi camelCase)
  7. appeler `setConnectedPharmacyFromSession(session_token)` pour sync immédiate du contexte
  8. naviguer vers `/tableau-de-bord`
- En cas d’échec à une étape: rollback (`auth.signOut`, suppression `pharmacy_session`) + toast erreur clair.

C. `src/pages/Tableau de bord.tsx`
- Intégrer `loading` depuis `useAuth`.
- Ne faire aucun redirect/toast tant que `loading === true`.
- Vérifier l’accès seulement après fin d’hydratation (évite le faux “non autorisé” pendant synchronisation post-login).

D. `src/contexts/AuthContext.tsx` (compatibilité cache/PWA)
- Ajouter un normaliseur de session locale acceptant aussi l’ancien format snake_case (`session_token`, `expires_at`, etc.) puis migration vers format enrichi camelCase.
- Évite les régressions chez les clients qui ont un bundle/cache ancien.

3) Validation E2E attendue
- Depuis “Tester PharmaSoft”:
  - OTP valide → redirection directe Dashboard (pas retour accueil).
  - Aucun toast “Non autorisé”.
  - `connectedPharmacy.id === 2f7365aa-eadd-4aa9-a5c8-330b97d55ea8`
  - `user.id === 63c51688-ad32-4299-82b7-bbb1408e668e` et personnel `ae6f6441-45bd-44d5-9e53-e98a72a8c503`
- Rechargement page Dashboard: session conservée (tenant + user).
