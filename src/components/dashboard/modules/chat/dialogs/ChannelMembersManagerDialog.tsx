import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  Building,
  Search,
  Plus,
  Trash2,
  Crown,
  UserCheck,
  UserMinus
} from 'lucide-react';

interface ChannelMember {
  id: string;
  pharmacy_id: string;
  pharmacy_name: string;
  role: 'admin' | 'member' | 'readonly';
  joined_at: string;
}

interface AvailablePharmacy {
  id: string;
  name: string;
  code?: string;
  city?: string;
}

interface ChannelMembersManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  channelName: string;
  members: ChannelMember[];
  availablePharmacies: AvailablePharmacy[];
  onAddMember: (pharmacyId: string, role: 'admin' | 'member' | 'readonly') => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onUpdateMemberRole: (memberId: string, role: 'admin' | 'member' | 'readonly') => Promise<void>;
  loading?: boolean;
}

const ROLE_LABELS = {
  admin: { label: 'Administrateur', icon: Crown, color: 'text-yellow-600' },
  member: { label: 'Membre', icon: UserCheck, color: 'text-blue-600' },
  readonly: { label: 'Lecture seule', icon: Users, color: 'text-gray-600' }
};

const ChannelMembersManagerDialog = ({
  open,
  onOpenChange,
  channelId,
  channelName,
  members,
  availablePharmacies,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
  loading = false
}: ChannelMembersManagerDialogProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member' | 'readonly'>('member');

  // Filter out already added pharmacies
  const memberPharmacyIds = new Set(members.map(m => m.pharmacy_id));
  const availableToAdd = availablePharmacies.filter(p => !memberPharmacyIds.has(p.id));

  const filteredMembers = members.filter(m =>
    m.pharmacy_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMember = async () => {
    if (!selectedPharmacy) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une pharmacie.",
        variant: "destructive"
      });
      return;
    }

    try {
      await onAddMember(selectedPharmacy, selectedRole);
      const pharmacy = availablePharmacies.find(p => p.id === selectedPharmacy);
      toast({
        title: "Membre ajouté",
        description: `${pharmacy?.name} a été ajouté au canal.`
      });
      setSelectedPharmacy('');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le membre.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (member: ChannelMember) => {
    try {
      await onRemoveMember(member.id);
      toast({
        title: "Membre retiré",
        description: `${member.pharmacy_name} a été retiré du canal.`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de retirer le membre.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRole = async (member: ChannelMember, newRole: 'admin' | 'member' | 'readonly') => {
    try {
      await onUpdateMemberRole(member.id, newRole);
      toast({
        title: "Rôle mis à jour",
        description: `Le rôle de ${member.pharmacy_name} a été modifié.`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membres du Canal
          </DialogTitle>
          <DialogDescription>
            Gérez les membres du canal "{channelName}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ajouter un membre */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un membre
            </h4>
            <div className="flex gap-2">
              <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner une pharmacie..." />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.length > 0 ? (
                    availableToAdd.map((pharmacy) => (
                      <SelectItem key={pharmacy.id} value={pharmacy.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {pharmacy.name}
                          {pharmacy.city && (
                            <span className="text-muted-foreground">• {pharmacy.city}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-pharmacy-available" disabled>
                      Toutes les pharmacies sont déjà membres
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select 
                value={selectedRole} 
                onValueChange={(v) => setSelectedRole(v as 'admin' | 'member' | 'readonly')}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="member">Membre</SelectItem>
                  <SelectItem value="readonly">Lecture seule</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleAddMember} disabled={loading || !selectedPharmacy}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Liste des membres */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Membres actuels ({members.length})</h4>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const roleInfo = ROLE_LABELS[member.role];
                    const RoleIcon = roleInfo.icon;
                    return (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{member.pharmacy_name}</div>
                            <div className="text-xs text-muted-foreground">
                              Membre depuis {new Date(member.joined_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select 
                            value={member.role} 
                            onValueChange={(v) => handleUpdateRole(member, v as 'admin' | 'member' | 'readonly')}
                          >
                            <SelectTrigger className="w-36">
                              <div className="flex items-center gap-2">
                                <RoleIcon className={`h-3 w-3 ${roleInfo.color}`} />
                                <span>{roleInfo.label}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Crown className="h-3 w-3 text-yellow-600" />
                                  Administrateur
                                </div>
                              </SelectItem>
                              <SelectItem value="member">
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-3 w-3 text-blue-600" />
                                  Membre
                                </div>
                              </SelectItem>
                              <SelectItem value="readonly">
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3 text-gray-600" />
                                  Lecture seule
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Aucun membre trouvé' : 'Aucun membre dans ce canal'}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChannelMembersManagerDialog;
