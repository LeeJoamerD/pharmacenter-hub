import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, Building, Mail, Phone, MessageCircle, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface Expert {
  id: string;
  noms: string;
  prenoms: string;
  role: string;
  email?: string;
  telephone_appel?: string;
  tenant_id: string;
  pharmacy?: {
    nom_pharmacie: string;
    ville?: string;
  };
}

interface ExpertSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExpertSearchDialog = ({ open, onOpenChange }: ExpertSearchDialogProps) => {
  const { currentTenant } = useTenant();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadExperts();
    }
  }, [open, searchTerm, roleFilter]);

  const loadExperts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('personnel')
        .select(`
          id,
          noms,
          prenoms,
          role,
          email,
          telephone_appel,
          tenant_id,
          pharmacies!tenant_id(nom_pharmacie, ville)
        `)
        .eq('is_active', true)
        .neq('tenant_id', currentTenant?.id);

      if (roleFilter && roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      if (searchTerm) {
        query = query.or(`noms.ilike.%${searchTerm}%,prenoms.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      const expertsData = (data || []).map(item => ({
        ...item,
        pharmacy: Array.isArray(item.pharmacies) ? item.pharmacies[0] : item.pharmacies
      })) as Expert[];

      setExperts(expertsData);

      // Extraire les rôles uniques
      if (roles.length === 0) {
        const { data: rolesData } = await supabase
          .from('personnel')
          .select('role')
          .eq('is_active', true);
        
        const uniqueRoles = [...new Set((rolesData || []).map(r => r.role).filter(Boolean))];
        setRoles(uniqueRoles);
      }
    } catch (error) {
      console.error('Erreur recherche experts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (expert: Expert, method: 'email' | 'phone' | 'message') => {
    switch (method) {
      case 'email':
        if (expert.email) {
          window.location.href = `mailto:${expert.email}`;
        } else {
          toast.error('Pas d\'adresse email disponible');
        }
        break;
      case 'phone':
        if (expert.telephone_appel) {
          window.location.href = `tel:${expert.telephone_appel}`;
        } else {
          toast.error('Pas de numéro de téléphone disponible');
        }
        break;
      case 'message':
        toast.info('Fonctionnalité de messagerie directe à venir');
        break;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'pharmacien titulaire':
      case 'pharmacien adjoint':
        return 'bg-blue-500/10 text-blue-600';
      case 'préparateur':
      case 'preparateur':
      case 'technicien':
        return 'bg-green-500/10 text-green-600';
      case 'admin':
        return 'bg-purple-500/10 text-purple-600';
      case 'gestionnaire de stock':
      case 'comptable':
        return 'bg-orange-500/10 text-orange-600';
      case 'caissier':
      case 'vendeur':
        return 'bg-cyan-500/10 text-cyan-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche d'Expert
          </DialogTitle>
          <DialogDescription>
            Trouvez un expert dans le réseau PharmaSoft par spécialité ou compétence
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Filtres */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="sr-only">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, prénom ou fonction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label className="sr-only">Filtrer par rôle</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Résultats */}
          <ScrollArea className="h-96">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse flex items-start gap-4 p-4 border rounded-lg">
                    <div className="h-12 w-12 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : experts.length > 0 ? (
              <div className="space-y-4">
                {experts.map(expert => (
                  <div key={expert.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {expert.prenoms} {expert.noms}
                        </h4>
                        <Badge variant="secondary" className={getRoleColor(expert.role)}>
                          <Briefcase className="h-3 w-3 mr-1" />
                          {expert.role}
                        </Badge>
                      </div>
                      
                      {expert.pharmacy && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <Building className="h-3 w-3" />
                          {expert.pharmacy.nom_pharmacie}
                          {expert.pharmacy.ville && ` - ${expert.pharmacy.ville}`}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {expert.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {expert.email}
                          </div>
                        )}
                        {expert.telephone_appel && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {expert.telephone_appel}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleContact(expert, 'message')}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      {expert.email && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleContact(expert, 'email')}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      )}
                      {expert.telephone_appel && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleContact(expert, 'phone')}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Appeler
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucun expert trouvé</p>
                <p className="text-sm">Essayez de modifier vos critères de recherche</p>
              </div>
            )}
          </ScrollArea>

          {/* Statistiques */}
          {!loading && experts.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
              <span>{experts.length} expert(s) trouvé(s)</span>
              <span>{roles.length} spécialités disponibles</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpertSearchDialog;
