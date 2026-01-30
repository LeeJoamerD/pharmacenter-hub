

# Plan de Correction : Bouton Connexion Utilisateur sur Mobile

## Problème Identifié

Sur mobile, lorsqu'aucun utilisateur n'est connecté, seule l'option **"Connexion Pharmacie"** est affichée. Il manque le bouton **"Connexion Utilisateur"** qui permet d'accéder à `/user-login` puis au Dashboard.

### Comparaison Desktop vs Mobile

| Élément | Desktop | Mobile |
|---------|---------|--------|
| Connexion Utilisateur | ✅ Icône `<User>` vers `/user-login` | ❌ Manquant |
| Connexion Pharmacie | ❌ Non visible (dans autre section) | ✅ Bouton "Pharmacie" |

## Solution

Ajouter un bouton de connexion utilisateur dans deux endroits du code mobile :

1. **Barre de navigation mobile** (à côté du menu hamburger)
2. **Menu mobile ouvert** (dans la liste des options)

## Modifications Requises

### Fichier : `src/components/Header.tsx`

#### Changement 1 : Barre de navigation mobile (lignes 175-206)

Ajouter un bouton connexion utilisateur pour les visiteurs non connectés :

**Avant :**
```typescript
) : (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => navigate('/pharmacy-connection')}
    className="text-foreground hover:bg-muted/50 mr-2"
  >
    {t('pharmacy')}
  </Button>
)}
```

**Après :**
```typescript
) : (
  <Button
    variant="ghost"
    size="icon"
    onClick={() => navigate('/user-login')}
    className="text-foreground hover:bg-muted/50 mr-2"
    aria-label="Se connecter"
  >
    <User size={20} />
  </Button>
)}
```

#### Changement 2 : Menu mobile ouvert (lignes 295-306)

Ajouter les deux options de connexion dans le menu déroulant :

**Avant :**
```typescript
) : (
  <Button onClick={() => navigate('/pharmacy-connection')}>
    {t('connectPharmacy')}
  </Button>
)}
```

**Après :**
```typescript
) : (
  <>
    <Button 
      variant="ghost" 
      onClick={() => {
        navigate('/user-login');
        setIsMobileMenuOpen(false);
      }}
      className="justify-start py-3 text-lg font-medium border-b border-border/20"
    >
      <User className="mr-2 h-4 w-4" />
      {t('signIn')}
    </Button>
    <Button 
      variant="ghost" 
      onClick={() => {
        navigate('/pharmacy-connection');
        setIsMobileMenuOpen(false);
      }}
      className="justify-start py-3 text-lg font-medium border-b border-border/20"
    >
      <Building2 className="mr-2 h-4 w-4" />
      {t('connectPharmacy')}
    </Button>
  </>
)}
```

## Résultat Attendu

### Sur Mobile (visiteur non connecté)

| Position | Avant | Après |
|----------|-------|-------|
| Barre de nav | Bouton "Pharmacie" | Icône utilisateur (comme desktop) |
| Menu ouvert | Seulement "Connexion Pharmacie" | "Se connecter" + "Connexion Pharmacie" |

### Flux Utilisateur Corrigé

```text
Visiteur sur mobile
       │
       ├─→ Clique icône User (barre) → /user-login → Dashboard
       │
       └─→ Ouvre menu hamburger
              ├─→ "Se connecter" → /user-login → Dashboard
              └─→ "Connexion Pharmacie" → /pharmacy-connection
```

## Résumé des Modifications

| Fichier | Lignes | Modification |
|---------|--------|--------------|
| `Header.tsx` | 197-206 | Remplacer bouton "Pharmacie" par icône User |
| `Header.tsx` | 295-306 | Ajouter deux boutons : connexion user + connexion pharmacie |

## Impact

- **Aucun impact** sur le comportement desktop
- **Aucun impact** sur les utilisateurs déjà connectés
- Les visiteurs mobile pourront désormais accéder au Dashboard via la connexion utilisateur

