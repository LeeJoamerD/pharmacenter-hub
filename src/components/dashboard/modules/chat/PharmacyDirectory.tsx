import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building, MapPin, Users, MessageCircle, Search, Filter } from 'lucide-react';

const PharmacyDirectory = () => {
  const pharmacies = [
    {
      id: 1,
      name: "Pharmacie du Centre",
      location: "Paris 1er",
      type: "Centre-ville",
      users: 12,
      status: "online",
      lastActivity: "2 min"
    },
    {
      id: 2,
      name: "Pharmacie de la Gare",
      location: "Lyon 2ème",
      type: "Grande surface",
      users: 8,
      status: "online",
      lastActivity: "5 min"
    },
    {
      id: 3,
      name: "Pharmacie Rurale",
      location: "Provence",
      type: "Rurale",
      users: 4,
      status: "away",
      lastActivity: "1h"
    },
    {
      id: 4,
      name: "Pharmacie Hospitalière",
      location: "Marseille",
      type: "Hospitalière",
      users: 15,
      status: "online",
      lastActivity: "1 min"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPharmacyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'standard': 'Standard',
      'hospital': 'Hospitalière',
      'clinic': 'Clinique'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Centre-ville': return 'bg-blue-500/10 text-blue-600';
      case 'Grande surface': return 'bg-purple-500/10 text-purple-600';
      case 'Rurale': return 'bg-green-500/10 text-green-600';
      case 'Hospitalière': return 'bg-red-500/10 text-red-600';
      case 'standard': return 'bg-blue-500/10 text-blue-600';
      case 'hospital': return 'bg-red-500/10 text-red-600';
      case 'clinic': return 'bg-purple-500/10 text-purple-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          <CardTitle>Répertoire Officines</CardTitle>
        </div>
        <CardDescription>
          Officines connectées au réseau PharmaSoft
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher une officine..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Liste des officines */}
          <div className="space-y-3">
            {pharmacies.map((pharmacy) => (
              <div key={pharmacy.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="relative">
                  <Building className="h-8 w-8 text-muted-foreground" />
                  <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${getStatusColor(pharmacy.status)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{pharmacy.name}</p>
                    <Badge variant="secondary" className={`text-xs ${getTypeColor(pharmacy.type)}`}>
                      {pharmacy.type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {pharmacy.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {pharmacy.users}
                    </div>
                    <span>Act. {pharmacy.lastActivity}</span>
                  </div>
                </div>

                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <Button variant="outline" size="sm">
              Voir toutes les officines ({pharmacies.length + 143})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PharmacyDirectory;