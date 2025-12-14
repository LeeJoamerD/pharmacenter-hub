import React, { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';

interface AllocationKey {
  id?: string;
  code: string;
  libelle: string;
  type_cle: string;
  description?: string;
  est_active: boolean;
}

interface CreateAllocationKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (key: Partial<AllocationKey>) => Promise<void>;
  editingKey?: AllocationKey | null;
  isSaving?: boolean;
}

const keyTypes = [
  { value: 'chiffre_affaires', label: 'Chiffre d\'Affaires' },
  { value: 'nombre_employes', label: 'Nombre d\'Employés' },
  { value: 'surface_occupee', label: 'Surface Occupée' },
  { value: 'couts_directs', label: 'Coûts Directs' },
  { value: 'unites_produites', label: 'Unités Produites' },
  { value: 'heures_machine', label: 'Heures Machine' },
  { value: 'personnalisee', label: 'Personnalisée' },
];

const CreateAllocationKeyDialog: React.FC<CreateAllocationKeyDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  editingKey,
  isSaving = false,
}) => {
  const [code, setCode] = useState('');
  const [libelle, setLibelle] = useState('');
  const [typeCle, setTypeCle] = useState('chiffre_affaires');
  const [description, setDescription] = useState('');
  const [estActive, setEstActive] = useState(true);

  useEffect(() => {
    if (open) {
      if (editingKey) {
        setCode(editingKey.code);
        setLibelle(editingKey.libelle);
        setTypeCle(editingKey.type_cle);
        setDescription(editingKey.description || '');
        setEstActive(editingKey.est_active);
      } else {
        setCode('');
        setLibelle('');
        setTypeCle('chiffre_affaires');
        setDescription('');
        setEstActive(true);
      }
    }
  }, [open, editingKey]);

  const handleSubmit = async () => {
    if (!code.trim() || !libelle.trim()) return;

    await onSave({
      code: code.trim().toUpperCase(),
      libelle: libelle.trim(),
      type_cle: typeCle,
      description: description.trim() || undefined,
      est_active: estActive,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingKey ? 'Modifier la Clé de Répartition' : 'Nouvelle Clé de Répartition'}
          </DialogTitle>
          <DialogDescription>
            Les clés de répartition permettent de distribuer les charges indirectes entre les centres de coûts.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CA"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type_cle">Type de Clé *</Label>
              <Select value={typeCle} onValueChange={setTypeCle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {keyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="libelle">Libellé *</Label>
            <Input
              id="libelle"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Chiffre d'Affaires"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle de la clé de répartition..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="est_active">Clé Active</Label>
            <Switch
              id="est_active"
              checked={estActive}
              onCheckedChange={setEstActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving || !code.trim() || !libelle.trim()}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editingKey ? 'Modifier' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAllocationKeyDialog;
