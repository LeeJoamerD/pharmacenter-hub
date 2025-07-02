import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, Phone, Mail, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '../ClientModule';

interface ClientListProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: number) => void;
}

const ClientList = ({ clients, onEditClient, onDeleteClient }: ClientListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredClients = clients.filter(client =>
    client.noms.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.prenoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone_appel.includes(searchTerm)
  );

  const handleDelete = (clientId: number) => {
    onDeleteClient(clientId);
    toast({
      title: "Client supprimé",
      description: "Le client a été supprimé avec succès.",
    });
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge variant="default" className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactif':
        return <Badge variant="secondary">Inactif</Badge>;
      case 'suspendu':
        return <Badge variant="destructive">Suspendu</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getClientTypeBadge = (type: string) => {
    switch (type) {
      case 'particulier':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Particulier</Badge>;
      case 'professionnel':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Professionnel</Badge>;
      case 'entreprise':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Entreprise</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '0 FCFA';
    return `${amount.toLocaleString()} FCFA`;
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
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Total Achats</TableHead>
              <TableHead>Dernière Visite</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{client.noms} {client.prenoms}</div>
                    <div className="text-sm text-muted-foreground">{client.profession}</div>
                    <div className="text-xs text-muted-foreground">{client.adresse}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" />
                      {client.telephone_appel}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3" />
                      {client.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getClientTypeBadge(client.type_client)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(client.statut)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{formatCurrency(client.total_achats)}</div>
                    <div className="text-sm text-muted-foreground">
                      {client.nombre_commandes} commande(s)
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {client.derniere_visite ? new Date(client.derniere_visite).toLocaleDateString('fr-FR') : 'Jamais'}
                  </div>
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
                      onClick={() => client.id && handleDelete(client.id)}
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