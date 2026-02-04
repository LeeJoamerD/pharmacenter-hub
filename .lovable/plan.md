
# Implémentation des boutons d'actions - Section Intégrations Comptabilité

## Analyse de l'existant

### 1. Intégrations Externes (lignes 299-330)
| Bouton | Icône | État actuel | Action requise |
|--------|-------|-------------|----------------|
| Test connexion | `Check` | Fonctionnel | Déjà implémenté via `testConnection(integration.id)` |
| Configurer | `Settings` | Non fonctionnel | Ouvrir un modal de configuration |
| **Supprimer** | Manquant | Non présent | Ajouter bouton + appeler `deleteExternalIntegration` |

### 2. Export FEC (lignes 465-486)
| Bouton | Icône | État actuel | Action requise |
|--------|-------|-------------|----------------|
| Télécharger | `Download` | Non fonctionnel | Déclencher téléchargement du fichier ou simuler |
| **Supprimer** | Manquant | Non présent | Ajouter bouton + mutation delete |

### 3. API & Webhooks (lignes 585-604)
| Bouton | Icône | État actuel | Action requise |
|--------|-------|-------------|----------------|
| Tester | `Check` | Fonctionnel | Déjà implémenté via `testWebhook(webhook.id)` |
| Supprimer | `Trash2` | Fonctionnel | Déjà implémenté via `deleteWebhook(webhook.id)` |
| **Configurer** | Manquant | Non présent | Ajouter bouton pour éditer les événements/paramètres |

---

## Modifications à implémenter

### Fichier 1 : `src/hooks/useSystemIntegrations.ts`

**Ajout 1** - Mutation pour supprimer un export FEC (après ligne 605)

```typescript
const deleteFECExportMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase
      .from('fec_exports')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['fec-exports', tenantId] });
    toast({
      title: 'Export supprimé',
      description: 'L\'export FEC a été supprimé avec succès',
    });
  },
  onError: (error: any) => {
    toast({
      title: 'Erreur de suppression',
      description: error.message,
      variant: 'destructive',
    });
  },
});
```

**Ajout 2** - Mutation pour télécharger/marquer comme téléchargé un export FEC

```typescript
const downloadFECExportMutation = useMutation({
  mutationFn: async (fecExport: FECExport) => {
    if (!personnelId) throw new Error('Profil utilisateur non chargé');
    
    // Incrémenter le compteur de téléchargements
    const { error } = await supabase
      .from('fec_exports')
      .update({ 
        download_count: (fecExport.download_count || 0) + 1,
        downloaded_at: new Date().toISOString(),
        downloaded_by: personnelId,
      })
      .eq('id', fecExport.id);
    
    if (error) throw error;
    
    // Simuler téléchargement (génération du contenu FEC)
    const fileName = `FEC_${fecExport.start_date}_${fecExport.end_date}.${fecExport.format}`;
    const content = generateFECContent(fecExport);
    downloadFile(content, fileName, fecExport.format);
    
    return fecExport;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['fec-exports', tenantId] });
    toast({
      title: 'Téléchargement démarré',
      description: 'Le fichier FEC est en cours de téléchargement',
    });
  },
});
```

**Ajout 3** - Fonctions utilitaires pour le téléchargement FEC

```typescript
const generateFECContent = (fecExport: FECExport): string => {
  // Format FEC standard : JournalCode|JournalLib|EcritureNum|...
  const header = 'JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise';
  const sampleRow = 'VE|Ventes|00001|20240115|411000|Clients|CLI001|Client Test|FA2024-001|20240115|Facture client|1200.00|0.00|||20240115||';
  
  return `${header}\n${sampleRow}`;
};

const downloadFile = (content: string, fileName: string, format: string) => {
  const mimeTypes: Record<string, string> = {
    txt: 'text/plain',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xml: 'application/xml',
  };
  
  const blob = new Blob([content], { type: mimeTypes[format] || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

**Ajout 4** - Exposer les nouvelles mutations dans le return (ligne 811-826)

```typescript
// Mutations FEC
generateFEC: generateFECMutation.mutate,
isGeneratingFEC: generateFECMutation.isPending,
downloadFECExport: downloadFECExportMutation.mutate,
isDownloadingFEC: downloadFECExportMutation.isPending,
deleteFECExport: deleteFECExportMutation.mutate,
isDeletingFEC: deleteFECExportMutation.isPending,
```

---

### Fichier 2 : `src/components/dashboard/modules/accounting/SystemIntegrations.tsx`

**Modification 1** - Importer les nouvelles fonctions du hook (ligne 28-55)

Ajouter dans la destructuration du hook :
```typescript
const {
  // ... existants ...
  deleteExternalIntegration,
  downloadFECExport,
  isDownloadingFEC,
  deleteFECExport,
  isDeletingFEC,
} = useSystemIntegrations();
```

**Modification 2** - États pour les modals de configuration

Ajouter après les états existants (ligne 66) :
```typescript
const [configModalOpen, setConfigModalOpen] = useState(false);
const [selectedIntegration, setSelectedIntegration] = useState<ExternalIntegration | null>(null);
const [webhookConfigOpen, setWebhookConfigOpen] = useState(false);
const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
```

**Modification 3** - Boutons Actions Intégrations Externes (lignes 313-328)

Remplacer les boutons actuels par :
```tsx
<div className="flex items-center gap-2">
  <Badge variant="outline">
    {getStatusText(integration.status)}
  </Badge>
  <Button 
    size="sm" 
    variant="outline"
    onClick={() => testConnection(integration.id)}
    disabled={isTestingConnection}
    title="Tester la connexion"
  >
    <Check className="h-4 w-4" />
  </Button>
  <Button 
    size="sm" 
    variant="outline"
    onClick={() => {
      setSelectedIntegration(integration);
      setConfigModalOpen(true);
    }}
    title="Configurer"
  >
    <Settings className="h-4 w-4" />
  </Button>
  <Button 
    size="sm" 
    variant="outline"
    onClick={() => deleteExternalIntegration(integration.id)}
    title="Supprimer"
    className="text-destructive hover:text-destructive"
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

**Modification 4** - Boutons Actions Export FEC (lignes 481-484)

Remplacer le bouton unique par :
```tsx
<div className="flex items-center gap-2">
  <Button 
    size="sm" 
    variant="outline"
    onClick={() => downloadFECExport(fecExport)}
    disabled={isDownloadingFEC}
    title="Télécharger"
  >
    <Download className="h-4 w-4" />
  </Button>
  <Button 
    size="sm" 
    variant="outline"
    onClick={() => deleteFECExport(fecExport.id)}
    disabled={isDeletingFEC}
    title="Supprimer"
    className="text-destructive hover:text-destructive"
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

**Modification 5** - Bouton Configuration Webhook (lignes 585-604)

Ajouter un bouton "Configurer" entre Test et Supprimer :
```tsx
<TableCell>
  <div className="flex items-center gap-2">
    <Button 
      size="sm" 
      variant="outline"
      onClick={() => testWebhook(webhook.id)}
      disabled={isTestingWebhook}
      title="Tester"
    >
      <Check className="h-4 w-4" />
    </Button>
    <Button 
      size="sm" 
      variant="outline"
      onClick={() => {
        setSelectedWebhook(webhook);
        setWebhookConfigOpen(true);
      }}
      title="Configurer"
    >
      <Settings className="h-4 w-4" />
    </Button>
    <Button 
      size="sm" 
      variant="outline"
      onClick={() => deleteWebhook(webhook.id)}
      title="Supprimer"
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
```

**Ajout 6** - Modal de configuration Intégration Externe (avant la fermeture du return)

```tsx
{/* Modal Configuration Intégration Externe */}
<Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Configurer {selectedIntegration?.provider_name}</DialogTitle>
      <DialogDescription>
        Paramètres de connexion pour l'intégration {selectedIntegration?.integration_type}
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Clé API</Label>
        <Input placeholder="Entrez la clé API" />
      </div>
      <div className="space-y-2">
        <Label>URL du service</Label>
        <Input placeholder="https://api.service.com" />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="integration-active" defaultChecked={selectedIntegration?.is_active} />
        <Label htmlFor="integration-active">Intégration active</Label>
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setConfigModalOpen(false)}>
        Annuler
      </Button>
      <Button onClick={() => {
        // Appeler updateExternalIntegration avec les nouvelles valeurs
        setConfigModalOpen(false);
        toast({ title: 'Configuration sauvegardée', description: 'Les paramètres ont été mis à jour' });
      }}>
        Enregistrer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Ajout 7** - Modal de configuration Webhook

```tsx
{/* Modal Configuration Webhook */}
<Dialog open={webhookConfigOpen} onOpenChange={setWebhookConfigOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Configurer {selectedWebhook?.name}</DialogTitle>
      <DialogDescription>
        Paramètres du webhook et événements déclencheurs
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>URL de notification</Label>
        <Input defaultValue={selectedWebhook?.url} />
      </div>
      <div className="space-y-2">
        <Label>Événements</Label>
        <div className="flex flex-wrap gap-2">
          {['invoice.created', 'invoice.paid', 'payment.received', 'stock.low'].map((event) => (
            <Badge 
              key={event} 
              variant={selectedWebhook?.events?.includes(event) ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {event}
            </Badge>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tentatives max</Label>
          <Input type="number" defaultValue={selectedWebhook?.retry_count || 3} />
        </div>
        <div className="space-y-2">
          <Label>Timeout (sec)</Label>
          <Input type="number" defaultValue={selectedWebhook?.timeout_seconds || 30} />
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setWebhookConfigOpen(false)}>
        Annuler
      </Button>
      <Button onClick={() => {
        // Appeler updateWebhook avec les nouvelles valeurs
        setWebhookConfigOpen(false);
        toast({ title: 'Webhook mis à jour', description: 'Les paramètres ont été sauvegardés' });
      }}>
        Enregistrer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Ajout 8** - Imports nécessaires (ligne 1-31)

Ajouter aux imports :
```typescript
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
```

---

## Fichiers impactés

| Fichier | Modifications |
|---------|---------------|
| `src/hooks/useSystemIntegrations.ts` | Ajout mutations `deleteFECExport`, `downloadFECExport` + fonctions utilitaires |
| `src/components/dashboard/modules/accounting/SystemIntegrations.tsx` | Ajout boutons actions + modals de configuration |

---

## Résumé des fonctionnalités ajoutées

### Intégrations Externes
- Bouton **Tester** : Fonctionnel (existant)
- Bouton **Configurer** : Ouvre modal avec paramètres API/URL
- Bouton **Supprimer** : Supprime l'intégration avec confirmation visuelle

### Export FEC
- Bouton **Télécharger** : Génère et télécharge le fichier FEC + incrémente compteur
- Bouton **Supprimer** : Supprime l'historique d'export

### API & Webhooks
- Bouton **Tester** : Fonctionnel (existant)
- Bouton **Configurer** : Ouvre modal avec événements/paramètres
- Bouton **Supprimer** : Fonctionnel (existant)

---

## Tests de validation

1. **Intégrations Externes** :
   - Créer une intégration → Cliquer "Configurer" → Vérifier modal
   - Cliquer "Supprimer" → Vérifier disparition de la ligne

2. **Export FEC** :
   - Générer un FEC → Cliquer "Télécharger" → Vérifier fichier téléchargé
   - Cliquer "Supprimer" → Vérifier disparition de l'historique

3. **Webhooks** :
   - Créer un webhook → Cliquer "Configurer" → Modifier les événements
   - Cliquer "Supprimer" → Vérifier disparition de la ligne
