import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Crown, Star, Search, Plus } from 'lucide-react';
import { useLoyaltyProgram } from '@/hooks/useLoyaltyProgram';
import { useCurrency } from '@/contexts/CurrencyContext';

const LoyaltyProgramTab = () => {
  const { programs, programsLoading } = useLoyaltyProgram();
  const { formatPrice } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Bronze':
        return <Badge className="bg-orange-100 text-orange-800">Bronze</Badge>;
      case 'Silver':
        return <Badge className="bg-gray-100 text-gray-800">Silver</Badge>;
      case 'Gold':
        return <Badge className="bg-yellow-100 text-yellow-800">Gold</Badge>;
      case 'Platinum':
        return <Badge className="bg-purple-100 text-purple-800">Platinum</Badge>;
      default:
        return <Badge variant="secondary">{tier}</Badge>;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Bronze':
        return <Trophy className="h-4 w-4 text-orange-600" />;
      case 'Silver':
        return <Trophy className="h-4 w-4 text-gray-600" />;
      case 'Gold':
        return <Trophy className="h-4 w-4 text-yellow-600" />;
      case 'Platinum':
        return <Crown className="h-4 w-4 text-purple-600" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const filteredPrograms = programs?.filter((program: any) => {
    const clientName = program.client?.nom_complet || '';
    return clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           program.numero_carte.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  if (programsLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Inscrire un client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membres du Programme de Fidélité</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>N° Carte</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Total Dépensé</TableHead>
                <TableHead>Récompenses</TableHead>
                <TableHead>Dernière Activité</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrograms.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{member.client?.nom_complet}</p>
                      <p className="text-sm text-muted-foreground">{member.client?.telephone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{member.numero_carte}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTierIcon(member.niveau_fidelite)}
                      {getTierBadge(member.niveau_fidelite)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{member.points_actuels.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>{formatPrice(member.montant_total_achats)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>Obtenues: {member.recompenses_gagnees}</p>
                      <p className="text-muted-foreground">Utilisées: {member.recompenses_utilisees}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.date_derniere_activite
                      ? new Date(member.date_derniere_activite).toLocaleDateString('fr-FR')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPrograms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Aucun membre trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyProgramTab;
