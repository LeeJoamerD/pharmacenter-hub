

# Plan de Correction - Bouton "Voir" Inactif

## Diagnostic

Le bouton "Voir" dans le composant `MandatoryReportsTab.tsx` (ligne 162-165) n'a **aucun gestionnaire de clic** :

```tsx
<Button size="sm" variant="outline">
  <Eye className="h-4 w-4 mr-2" />
  Voir
</Button>
```

Ce bouton est purement décoratif actuellement - il ne réagit à aucune action.

---

## Solution Proposée

Implémenter un **dialog de visualisation** pour afficher les détails complets du rapport sélectionné.

### Modifications à effectuer

| Fichier | Action |
|---------|--------|
| `src/components/dashboard/modules/reports/regulatory/tabs/MandatoryReportsTab.tsx` | Ajouter état + dialog de visualisation |
| Nouveau fichier (optionnel) | `ViewMandatoryReportDialog.tsx` si séparation souhaitée |

---

## Détail de l'implémentation

### 1. Ajouter un état pour le rapport sélectionné

```tsx
const [viewReport, setViewReport] = useState<MandatoryReport | null>(null);
```

### 2. Ajouter le gestionnaire onClick au bouton "Voir"

```tsx
<Button 
  size="sm" 
  variant="outline"
  onClick={() => setViewReport(report)}
>
  <Eye className="h-4 w-4 mr-2" />
  Voir
</Button>
```

### 3. Ajouter un Dialog de visualisation des détails

```tsx
<Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        {viewReport?.nom}
      </DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      {/* Détails complets du rapport */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Type</p>
          <p className="font-medium">{viewReport?.type_rapport}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Fréquence</p>
          <p className="font-medium">{getFrequenceLabel(viewReport?.frequence)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Autorité destinataire</p>
          <p className="font-medium">{viewReport?.autorite_destinataire}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Responsable</p>
          <p className="font-medium">{viewReport?.responsable_nom}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Prochaine échéance</p>
          <p className="font-medium">{viewReport?.prochaine_echeance}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Dernière soumission</p>
          <p className="font-medium">{viewReport?.derniere_soumission || 'Jamais'}</p>
        </div>
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground mb-2">Progression</p>
        <Progress value={viewReport?.progression} className="h-2" />
        <p className="text-sm mt-1">{viewReport?.progression}%</p>
      </div>
      
      {viewReport?.notes && (
        <div>
          <p className="text-sm text-muted-foreground">Notes</p>
          <p className="text-sm">{viewReport.notes}</p>
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>
```

### 4. Imports à ajouter

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
```

---

## Résultat attendu

- Le bouton "Voir" ouvre un dialog modal
- Les détails complets du rapport sont affichés : type, fréquence, autorité, responsable, échéances, progression, notes
- Le dialog se ferme en cliquant à l'extérieur ou via le bouton de fermeture standard

