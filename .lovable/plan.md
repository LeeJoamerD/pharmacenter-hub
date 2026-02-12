
# Reorganisation de la page Configuration en onglets

## Objectif

Remplacer la disposition actuelle (toutes les cartes empilees verticalement) par un systeme d'onglets pour mieux organiser les differentes sections de configuration.

## Structure des onglets

| Onglet | Contenu |
|--------|---------|
| **Communications** | Configuration Email (Resend) + Configuration SMS (Twilio) |
| **Base VIDAL** | Cles API et identifiants VIDAL |
| **Parametres Generaux** | Autres parametres (codes de verification, etc.) |

Chaque onglet contiendra les cartes deja existantes, simplement deplacees sous l'onglet correspondant. Le bouton "Enregistrer" et la section "Etat de la Configuration" resteront en dehors des onglets (toujours visibles).

## Modifications

### Fichier unique : `src/components/platform-admin/PlatformConfiguration.tsx`

1. **Importer le composant Tabs** depuis `@/components/ui/tabs` (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`)
2. **Envelopper les cartes** dans une structure `Tabs` :
   - Onglet "Communications" (icone Mail) : contient les cartes Email et SMS
   - Onglet "Base VIDAL" (icone Pill) : contient la carte VIDAL
   - Onglet "Parametres" (icone Settings) : contient les autres parametres
3. **Conserver** le header avec le bouton Enregistrer au-dessus des onglets
4. **Conserver** la carte "Etat de la Configuration" en dessous des onglets
5. L'onglet par defaut sera "Communications"

## Details techniques

- Utilisation du composant `Tabs` Radix deja installe dans le projet
- Aucune nouvelle dependance necessaire
- Aucune migration SQL
- Les onglets futurs pourront etre ajoutes simplement en ajoutant un `TabsTrigger` + `TabsContent`
