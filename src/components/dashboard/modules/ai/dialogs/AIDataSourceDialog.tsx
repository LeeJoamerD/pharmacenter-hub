import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { AIDataSource } from '@/hooks/useAIIntegrations';

interface AIDataSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: AIDataSource | null;
  onSave: (source: Partial<AIDataSource>) => void;
  mode: 'create' | 'edit';
}

const SOURCE_TYPES = [
  { value: 'table', label: 'Table de base de données' },
  { value: 'api', label: 'API externe' },
  { value: 'file', label: 'Fichier' },
  { value: 'webhook', label: 'Webhook' },
];

const SYNC_FREQUENCIES = [
  { value: 'realtime', label: 'Temps réel' },
  { value: 'hourly', label: 'Toutes les heures' },
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'manual', label: 'Manuel' },
];

const AVAILABLE_TABLES = [
  { value: 'produits', label: 'Produits' },
  { value: 'ventes', label: 'Ventes' },
  { value: 'clients', label: 'Clients' },
  { value: 'lots', label: 'Lots' },
  { value: 'fournisseurs', label: 'Fournisseurs' },
  { value: 'commandes_fournisseurs', label: 'Commandes' },
];

export function AIDataSourceDialog({ open, onOpenChange, source, onSave, mode }: AIDataSourceDialogProps) {
  const [formData, setFormData] = useState<Partial<AIDataSource>>({
    source_name: '',
    source_type: 'table',
    description: '',
    source_config: {},
    sync_frequency: 'daily',
    is_active: true,
    is_encrypted: false,
    retention_days: 365,
  });

  const [selectedTable, setSelectedTable] = useState('produits');
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    if (source && mode === 'edit') {
      setFormData({
        source_name: source.source_name,
        source_type: source.source_type,
        description: source.description || '',
        source_config: source.source_config || {},
        sync_frequency: source.sync_frequency,
        is_active: source.is_active,
        is_encrypted: source.is_encrypted,
        retention_days: source.retention_days,
      });
      if (source.source_type === 'table') {
        setSelectedTable(source.source_config?.table_name || 'produits');
      } else if (source.source_type === 'api') {
        setApiUrl(source.source_config?.api_url || '');
      }
    } else {
      setFormData({
        source_name: '',
        source_type: 'table',
        description: '',
        source_config: {},
        sync_frequency: 'daily',
        is_active: true,
        is_encrypted: false,
        retention_days: 365,
      });
      setSelectedTable('produits');
      setApiUrl('');
    }
  }, [source, mode, open]);

  const handleSave = () => {
    if (!formData.source_name) return;

    let sourceConfig = formData.source_config || {};
    if (formData.source_type === 'table') {
      sourceConfig = { table_name: selectedTable };
    } else if (formData.source_type === 'api') {
      sourceConfig = { api_url: apiUrl };
    }

    onSave({ ...formData, source_config: sourceConfig });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Ajouter une Source de Données' : 'Modifier la Source'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="source_name">Nom de la source *</Label>
            <Input
              id="source_name"
              value={formData.source_name}
              onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
              placeholder="Ex: Données produits"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_type">Type de source</Label>
            <Select
              value={formData.source_type}
              onValueChange={(value) => setFormData({ ...formData, source_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.source_type === 'table' && (
            <div className="space-y-2">
              <Label htmlFor="table_name">Table</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TABLES.map((table) => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.source_type === 'api' && (
            <div className="space-y-2">
              <Label htmlFor="api_url">URL de l'API</Label>
              <Input
                id="api_url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.example.com/data"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la source de données..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sync_frequency">Fréquence de synchronisation</Label>
            <Select
              value={formData.sync_frequency}
              onValueChange={(value) => setFormData({ ...formData, sync_frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYNC_FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retention_days">Rétention des données (jours)</Label>
            <Input
              id="retention_days"
              type="number"
              value={formData.retention_days}
              onChange={(e) => setFormData({ ...formData, retention_days: parseInt(e.target.value) || 365 })}
              min={1}
              max={3650}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Source active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_encrypted">Données chiffrées</Label>
            <Switch
              id="is_encrypted"
              checked={formData.is_encrypted}
              onCheckedChange={(checked) => setFormData({ ...formData, is_encrypted: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!formData.source_name}>
            {mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
