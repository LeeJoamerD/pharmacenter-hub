import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Play,
  Square,
  Eye,
  Edit,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InventorySession {
  id: string;
  nom: string;
  description: string;
  dateCreation: Date;
  dateDebut?: Date;
  dateFin?: Date;
  statut: 'planifiée' | 'en_cours' | 'terminée' | 'suspendue';
  type: 'complet' | 'partiel' | 'cyclique';
  responsable: string;
  participants: string[];
  secteurs: string[];
  progression: number;
  produitsComptes: number;
  produitsTotal: number;
  ecarts: number;
}

const InventorySessions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('tous');
  const [selectedType, setSelectedType] = useState<string>('tous');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Données mockées pour les sessions d'inventaire
  const sessions: InventorySession[] = [
    {
      id: '1',
      nom: 'Inventaire Général Q1 2024',
      description: 'Inventaire complet de tous les produits pharmaceutiques',
      dateCreation: new Date('2024-01-01'),
      dateDebut: new Date('2024-01-15'),
      dateFin: new Date('2024-01-17'),
      statut: 'terminée',
      type: 'complet',
      responsable: 'Marie Dubois',
      participants: ['Jean Martin', 'Pierre Durand', 'Sophie Moreau'],
      secteurs: ['Officine', 'Réserve', 'Frigo'],
      progression: 100,
      produitsComptes: 1250,
      produitsTotal: 1250,
      ecarts: 15
    },
    {
      id: '2',
      nom: 'Inventaire Cyclique Antibiotiques',
      description: 'Contrôle périodique des antibiotiques',
      dateCreation: new Date('2024-01-20'),
      dateDebut: new Date('2024-01-25'),
      statut: 'en_cours',
      type: 'cyclique',
      responsable: 'Jean Martin',
      participants: ['Marie Dubois'],
      secteurs: ['Officine'],
      progression: 65,
      produitsComptes: 78,
      produitsTotal: 120,
      ecarts: 3
    },
    {
      id: '3',
      nom: 'Inventaire Partiel Génériques',
      description: 'Vérification des médicaments génériques',
      dateCreation: new Date('2024-02-01'),
      statut: 'planifiée',
      type: 'partiel',
      responsable: 'Sophie Moreau',
      participants: ['Pierre Durand', 'Jean Martin'],
      secteurs: ['Réserve'],
      progression: 0,
      produitsComptes: 0,
      produitsTotal: 300,
      ecarts: 0
    }
  ];

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'planifiée':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'en_cours':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'terminée':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'suspendue':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    const colors = {
      planifiée: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      en_cours: 'bg-blue-100 text-blue-800 border-blue-200',
      terminée: 'bg-green-100 text-green-800 border-green-200',
      suspendue: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <Badge className={colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {statut.charAt(0).toUpperCase() + statut.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      complet: 'bg-purple-100 text-purple-800 border-purple-200',
      partiel: 'bg-blue-100 text-blue-800 border-blue-200',
      cyclique: 'bg-green-100 text-green-800 border-green-200'
    };

    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.responsable.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'tous' || session.statut === selectedStatus;
    const matchesType = selectedType === 'tous' || session.type === selectedType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Métriques des sessions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sessions Actives</p>
              <p className="text-2xl font-bold text-blue-600">
                {sessions.filter(s => s.statut === 'en_cours').length}
              </p>
            </div>
            <Play className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sessions Planifiées</p>
              <p className="text-2xl font-bold text-yellow-600">
                {sessions.filter(s => s.statut === 'planifiée').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sessions Terminées</p>
              <p className="text-2xl font-bold text-green-600">
                {sessions.filter(s => s.statut === 'terminée').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Écarts</p>
              <p className="text-2xl font-bold text-orange-600">
                {sessions.reduce((acc, s) => acc + s.ecarts, 0)}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>
      </div>

      {/* Gestion des sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sessions d'Inventaire</CardTitle>
              <CardDescription>Gestion et suivi des sessions d'inventaire</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Créer une Session d'Inventaire</DialogTitle>
                  <DialogDescription>
                    Configurez une nouvelle session d'inventaire
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nom" className="text-right">
                      Nom
                    </Label>
                    <Input id="nom" className="col-span-3" placeholder="Nom de la session" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Type
                    </Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Type d'inventaire" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complet">Complet</SelectItem>
                        <SelectItem value="partiel">Partiel</SelectItem>
                        <SelectItem value="cyclique">Cyclique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea id="description" className="col-span-3" placeholder="Description de la session" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={() => setIsCreateDialogOpen(false)}>
                    Créer Session
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="planifiée">Planifiée</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="terminée">Terminée</SelectItem>
                <SelectItem value="suspendue">Suspendue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="complet">Complet</SelectItem>
                <SelectItem value="partiel">Partiel</SelectItem>
                <SelectItem value="cyclique">Cyclique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tableau des sessions */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{session.nom}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {session.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(session.type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(session.statut)}
                        {getStatusBadge(session.statut)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {session.responsable}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${session.progression}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{session.progression}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Créée: {format(session.dateCreation, 'dd/MM/yyyy', { locale: fr })}</div>
                        {session.dateDebut && (
                          <div>Début: {format(session.dateDebut, 'dd/MM/yyyy', { locale: fr })}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {session.statut === 'planifiée' && (
                          <Button variant="ghost" size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {session.statut === 'en_cours' && (
                          <Button variant="ghost" size="sm">
                            <Square className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune session trouvée pour les critères sélectionnés
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventorySessions;