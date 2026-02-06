
# Correction des triggers de creation de clients pour Societes et Conventionnes

## Diagnostic

Les triggers `create_client_for_societe` et `create_client_for_conventionne` echouent silencieusement pour **2 raisons** :

### Erreur 1 : Mauvais nom de type enum
Les deux fonctions utilisent `'Entreprise'::type_client_enum` alors que le type s'appelle `public.type_client`.

### Erreur 2 : Mauvais noms de colonnes
| Fonction | Colonne utilisee | Colonne reelle |
|----------|-----------------|----------------|
| `create_client_for_societe` | `NEW.nom` | `NEW.libelle_societe` |
| `create_client_for_societe` | `NEW.telephone` | `NEW.telephone_appel` |
| `create_client_for_conventionne` | `NEW.nom_complet` | `NEW.noms` |
| `create_client_for_conventionne` | `NEW.telephone` | `NEW.telephone_appel` |
| `sync_client_from_societe` | `NEW.nom` | `NEW.libelle_societe` |
| `sync_client_from_societe` | `NEW.telephone` | `NEW.telephone_appel` |

### Pourquoi on ne voit pas les erreurs
Les 3 fonctions ont un bloc `EXCEPTION WHEN OTHERS` qui avale silencieusement les erreurs avec un simple `RAISE WARNING`.

---

## Plan de correction

### Migration SQL unique (3 fonctions corrigees)

**1. `create_client_for_societe`** - Corriger le cast enum et les noms de colonnes :
- `type_client_enum` remplace par `public.type_client`
- `NEW.nom` remplace par `NEW.libelle_societe`
- `NEW.telephone` remplace par `NEW.telephone_appel`
- Remplacer le `EXCEPTION WHEN OTHERS` silencieux par un `RAISE LOG` explicite

**2. `create_client_for_conventionne`** - Corriger le cast enum et les noms de colonnes :
- `type_client_enum` remplace par `public.type_client`
- `NEW.nom_complet` remplace par `NEW.noms`
- `NEW.telephone` remplace par `NEW.telephone_appel`
- Remplacer le `EXCEPTION WHEN OTHERS` silencieux par un `RAISE LOG` explicite

**3. `sync_client_from_societe`** (trigger UPDATE) - Corriger les noms de colonnes :
- `NEW.nom` remplace par `NEW.libelle_societe`
- `NEW.telephone` remplace par `NEW.telephone_appel`

La migration se terminera par `NOTIFY pgrst, 'reload schema';`.

---

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| Nouvelle migration SQL | Creer - corrige les 3 fonctions trigger |

Aucun fichier TypeScript n'est modifie, le probleme est 100% cote base de donnees.
