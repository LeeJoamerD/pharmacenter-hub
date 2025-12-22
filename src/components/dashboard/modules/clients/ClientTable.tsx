import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, User } from 'lucide-react';
import { Client } from './types';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const ClientTable = ({ clients, onEdit, onDelete }: ClientTableProps) => {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom complet</TableHead>
              <TableHead>Type de client</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Taux remise</TableHead>
              <TableHead>Date création</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-blue-500" />
                  {client.nom_complet || 'N/A'}
                </div>
                </TableCell>
                <TableCell>
                  <Badge variant={client.type_client === 'Ordinaire' ? 'default' : 'secondary'}>
                    {client.type_client}
                  </Badge>
                </TableCell>
                <TableCell>{client.telephone || 'N/A'}</TableCell>
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
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {client.type_client === 'Ordinaire' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(client.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};