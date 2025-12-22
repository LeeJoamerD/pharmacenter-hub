import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, User, Phone, MapPin, Percent } from 'lucide-react';
import { Client } from './types';

interface ClientCardProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export const ClientCard = ({ clients, onEdit, onDelete }: ClientCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((client) => (
        <Card key={client.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <h3 className="font-medium truncate">
                  {client.nom_complet || 'N/A'}
                </h3>
              </div>
              <Badge variant={client.type_client === 'Ordinaire' ? 'default' : 'secondary'}>
                {client.type_client}
              </Badge>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span className="truncate">{client.telephone || 'N/A'}</span>
              </div>
              
              {client.adresse && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{client.adresse}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Percent className="h-3 w-3" />
                <span>Remise: {client.taux_remise_automatique || 0}%</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mb-3">
              Créé le {new Date(client.created_at).toLocaleDateString('fr-FR')}
            </div>
            
            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(client)}
                className="flex-1"
              >
                <Edit className="h-3 w-3 mr-1" />
                Modifier
              </Button>
              {client.type_client === 'Ordinaire' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(client.id)}
                  className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};