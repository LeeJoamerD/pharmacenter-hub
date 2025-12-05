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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, Users, Search, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface Pharmacy {
  id: string;
  nom_pharmacie: string;
  ville?: string;
  type?: string;
}

interface CreateCollaborationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CreateCollaborationDialog = ({ open, onOpenChange, onSuccess }: CreateCollaborationDialogProps) => {
  const { currentTenant } = useTenant();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPharmacies, setSelectedPharmacies] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      loadPharmacies();
    }
  }, [open]);

  const loadPharmacies = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('pharmacies')
        .select('id, nom_pharmacie, ville, type')
        .neq('id', currentTenant?.id);

      setPharmacies(data || []);
    } catch (error) {
      console.error('Erreur chargement pharmacies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Veuillez saisir un titre pour la collaboration');
      return;
    }

    if (selectedPharmacies.length === 0) {
      toast.error('Veuillez sélectionner au moins un participant');
      return;
    }

    setCreating(true);
    try {
      // Créer le canal de collaboration
      const { data: channel, error: channelError } = await supabase
        .from('network_channels')
        .insert({
          name: title,
          description,
          channel_type: 'collaboration',
          is_public: false,
          tenant_id: currentTenant?.id
        })
        .select()
        .single();

      if (channelError) throw channelError;

      // Ajouter les participants (incluant l'officine créatrice)
      const allParticipants = [currentTenant?.id, ...selectedPharmacies];
      const participantsInsert = allParticipants.map(pharmacyId => ({
        channel_id: channel.id,
        pharmacy_id: pharmacyId,
        tenant_id: currentTenant?.id,
        role: pharmacyId === currentTenant?.id ? 'admin' : 'member'
      }));

      await supabase.from('channel_participants').insert(participantsInsert);

      // Logger l'action
      await supabase.from('network_audit_logs').insert({
        tenant_id: currentTenant?.id,
        actor_pharmacy_id: currentTenant?.id,
        actor_name: currentTenant?.nom_pharmacie,
        action_type: 'collaboration_created',
        action_description: `Création de la collaboration "${title}"`,
        target_name: title,
        metadata: { channel_id: channel.id, participants: allParticipants.length }
      });

      toast.success('Collaboration créée avec succès');
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('Erreur création collaboration:', error);
      toast.error('Erreur lors de la création de la collaboration');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedPharmacies([]);
    setSearchTerm('');
  };

  const filteredPharmacies = pharmacies.filter(p =>
    p.nom_pharmacie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ville?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePharmacy = (pharmacyId: string) => {
    setSelectedPharmacies(prev =>
      prev.includes(pharmacyId)
        ? prev.filter(id => id !== pharmacyId)
        : [...prev, pharmacyId]
    );
  };

  const removeParticipant = (pharmacyId: string) => {
    setSelectedPharmacies(prev => prev.filter(id => id !== pharmacyId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Créer une Collaboration
          </DialogTitle>
          <DialogDescription>
            Démarrez un projet inter-officines avec les participants de votre choix
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label>Titre de la collaboration *</Label>
            <Input
              placeholder="Ex: Achats Groupés Q1 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Décrivez l'objectif de cette collaboration..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Participants sélectionnés */}
          {selectedPharmacies.length > 0 && (
            <div className="space-y-2">
              <Label>Participants sélectionnés ({selectedPharmacies.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedPharmacies.map(id => {
                  const pharmacy = pharmacies.find(p => p.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {pharmacy?.nom_pharmacie}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeParticipant(id)}
                      />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recherche et sélection */}
          <div className="space-y-2">
            <Label>Ajouter des participants</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une officine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-48 border rounded-md p-2">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-center gap-2 p-2">
                      <div className="h-4 w-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded flex-1" />
                    </div>
                  ))}
                </div>
              ) : (
                filteredPharmacies.map(pharmacy => (
                  <div
                    key={pharmacy.id}
                    className={`flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer ${
                      selectedPharmacies.includes(pharmacy.id) ? 'bg-muted' : ''
                    }`}
                    onClick={() => togglePharmacy(pharmacy.id)}
                  >
                    <Checkbox checked={selectedPharmacies.includes(pharmacy.id)} />
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{pharmacy.nom_pharmacie}</p>
                      <p className="text-xs text-muted-foreground">{pharmacy.ville}</p>
                    </div>
                    {pharmacy.type && (
                      <Badge variant="outline" className="text-xs">{pharmacy.type}</Badge>
                    )}
                  </div>
                ))
              )}
              {!loading && filteredPharmacies.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Aucune officine trouvée
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={creating || !title.trim() || selectedPharmacies.length === 0}>
            {creating ? 'Création...' : 'Créer la collaboration'}
            <Plus className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCollaborationDialog;
