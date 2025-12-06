import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload, FileText } from 'lucide-react';

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, metadata: {
    description?: string;
    category?: string;
    file_type?: string;
    file_size?: number;
    file_url?: string;
    workspace_id?: string;
    is_network_document?: boolean;
    shared_with_pharmacies?: string[];
    tags?: string[];
  }) => Promise<void>;
  workspaces?: Array<{ id: string; name: string }>;
  isSubmitting?: boolean;
}

const DOCUMENT_CATEGORIES = [
  { value: 'general', label: 'Général' },
  { value: 'protocols', label: 'Protocoles' },
  { value: 'reports', label: 'Rapports' },
  { value: 'training', label: 'Formation' },
  { value: 'regulations', label: 'Réglementation' },
  { value: 'catalogs', label: 'Catalogues' },
  { value: 'templates', label: 'Modèles' },
  { value: 'other', label: 'Autre' }
];

export function UploadDocumentDialog({
  open,
  onOpenChange,
  onSubmit,
  workspaces = [],
  isSubmitting = false
}: UploadDocumentDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [fileType, setFileType] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [isNetworkDocument, setIsNetworkDocument] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    await onSubmit(name.trim(), {
      description: description.trim() || undefined,
      category,
      file_type: fileType || undefined,
      file_url: fileUrl.trim() || undefined,
      workspace_id: workspaceId || undefined,
      is_network_document: isNetworkDocument,
      tags: tags.length > 0 ? tags : undefined
    });
    
    // Reset form
    setName('');
    setDescription('');
    setCategory('general');
    setFileType('');
    setFileUrl('');
    setWorkspaceId('');
    setIsNetworkDocument(false);
    setTags([]);
    onOpenChange(false);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Ajouter un Document
            </DialogTitle>
            <DialogDescription>
              Ajouter un document à la bibliothèque partagée
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom du document *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Protocole COVID-19 V3.pdf"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du document..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Type de fichier</Label>
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Word">Word</SelectItem>
                    <SelectItem value="Excel">Excel</SelectItem>
                    <SelectItem value="PowerPoint">PowerPoint</SelectItem>
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="Other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fileUrl">URL du fichier</Label>
              <Input
                id="fileUrl"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://example.com/document.pdf"
              />
              <p className="text-xs text-muted-foreground">
                Lien vers le fichier stocké (optionnel)
              </p>
            </div>

            {workspaces.length > 0 && (
              <div className="grid gap-2">
                <Label>Espace de travail</Label>
                <Select value={workspaceId} onValueChange={setWorkspaceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun espace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {workspaces.map((ws) => (
                      <SelectItem key={ws.id} value={ws.id}>
                        {ws.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Ajouter un tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" size="icon" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Document réseau</Label>
                <p className="text-xs text-muted-foreground">
                  Partageable avec d'autres officines
                </p>
              </div>
              <Switch
                checked={isNetworkDocument}
                onCheckedChange={setIsNetworkDocument}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Ajout...' : 'Ajouter le document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
