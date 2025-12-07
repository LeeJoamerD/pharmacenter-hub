import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, MapPin, Users, MessageCircle, Search, Filter, Phone, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface Pharmacy {
  id: string;
  name: string;
  city?: string;
  region?: string;
  pays?: string;
  type?: string;
  status?: string;
  email?: string;
  phone?: string;
  personnel_count?: number;
  last_activity?: string;
}

const PharmacyDirectory = () => {
  const { currentTenant } = useTenant();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadPharmacies();
  }, []);

  const loadPharmacies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .order('name');

      if (error) throw error;

      // Enrichir avec le nombre d'utilisateurs
      const enrichedPharmacies = await Promise.all((data || []).map(async (pharmacy) => {
        const { count } = await supabase
          .from('personnel')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', pharmacy.id)
          .eq('is_active', true);

        // Dernière activité (dernier message ou audit log)
        const { data: lastMessage } = await supabase
          .from('network_messages')
          .select('created_at')
          .eq('sender_pharmacy_id', pharmacy.id)
          .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

        return {
          id: pharmacy.id,
          name: pharmacy.name || 'Pharmacie',
          city: pharmacy.city,
          region: pharmacy.region,
          pays: pharmacy.pays,
          type: pharmacy.type,
          status: pharmacy.status,
          email: pharmacy.email,
          phone: pharmacy.phone,
          personnel_count: count || 0,
          last_activity: lastMessage?.created_at || pharmacy.created_at
        } as Pharmacy;
      }));

      setPharmacies(enrichedPharmacies as Pharmacy[]);
    } catch (error) {
      console.error('Erreur chargement pharmacies:', error);
      toast.error('Erreur lors du chargement des pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'centre-ville': return 'bg-blue-500/10 text-blue-600';
      case 'grande-surface': return 'bg-purple-500/10 text-purple-600';
      case 'rurale': return 'bg-green-500/10 text-green-600';
      case 'hospitalière': return 'bg-red-500/10 text-red-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}j`;
  };

  const filteredPharmacies = pharmacies.filter(pharmacy => {
    const matchesSearch = !searchTerm || 
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.region?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || pharmacy.type === filterType;
    const matchesStatus = filterStatus === 'all' || pharmacy.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const types = [...new Set(pharmacies.map(p => p.type).filter(Boolean))];
  const statuses = [...new Set(pharmacies.map(p => p.status).filter(Boolean))];

  const handleStartConversation = (pharmacyId: string) => {
    toast.info('Fonctionnalité de conversation directe à venir');
    // TODO: Implémenter la navigation vers la messagerie avec le destinataire pré-sélectionné
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <CardTitle>Répertoire Officines</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={loadPharmacies} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          {filteredPharmacies.length} officines connectées au réseau PharmaSoft
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Barre de recherche et filtres */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher une officine..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                {types.map(type => (
                  <SelectItem key={type} value={type!}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status!}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Liste des officines */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg border">
                  <div className="h-8 w-8 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPharmacies.map((pharmacy) => (
                <div 
                  key={pharmacy.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                    pharmacy.id === currentTenant?.id ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="relative">
                    <Building className="h-8 w-8 text-muted-foreground" />
                    <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${getStatusColor(pharmacy.status)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">
                        {pharmacy.name}
                        {pharmacy.id === currentTenant?.id && (
                          <span className="text-xs text-primary ml-2">(Vous)</span>
                        )}
                      </p>
                      {pharmacy.type && (
                        <Badge variant="secondary" className={`text-xs ${getTypeColor(pharmacy.type)}`}>
                          {pharmacy.type}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {pharmacy.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {pharmacy.city}{pharmacy.region && `, ${pharmacy.region}`}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {pharmacy.personnel_count} utilisateurs
                      </div>
                      {pharmacy.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {pharmacy.email}
                        </div>
                      )}
                      <span>Act. {getRelativeTime(pharmacy.last_activity)}</span>
                    </div>
                  </div>

                  {pharmacy.id !== currentTenant?.id && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleStartConversation(pharmacy.id)}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {filteredPharmacies.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune officine trouvée</p>
                </div>
              )}
            </div>
          )}

          {pharmacies.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="outline" size="sm">
                Voir toutes les officines ({pharmacies.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PharmacyDirectory;
