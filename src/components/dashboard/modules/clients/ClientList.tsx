import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, Phone, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Client } from './types';

interface ClientListProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

const ClientList = ({ clients, onEditClient, onDeleteClient }: ClientListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredClients = clients.filter(client =>
    (client.nom_complet && client.nom_complet.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.telephone && client.telephone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = (clientId: string) => {
    onDeleteClient(clientId);
    toast({
      title: "Client supprimé",
      description: "Le client a été supprimé avec succès.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredClients.length} client(s)
          </span>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Taux Remise</TableHead>
              <TableHead>Date Création</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="font-medium">{client.nom_complet || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Client ordinaire</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Phone className="h-3 w-3" />
                    {client.telephone || 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {client.adresse || 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {client.taux_remise_automatique || 0}%
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(client.created_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditClient(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientList;