import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Filter, 
  Eye, 
  Download,
  Shield,
  Calendar as CalendarIcon,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  type: 'creation' | 'modification' | 'suppression' | 'consultation';
  utilisateur: string;
  role: string;
  entite: string;
  entiteId: string;
  details: string;
  adresseIP: string;
  impact: 'faible' | 'moyen' | 'eleve' | 'critique';
  ancienneValeur?: string;
  nouvelleValeur?: string;
}

const StockAudit = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('tous');
  const [selectedImpact, setSelectedImpact] = useState<string>('tous');
  const [selectedUser, setSelectedUser] = useState<string>('tous');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Données mockées pour l'audit trail
  const auditEntries: AuditEntry[] = [
    {
      id: '1',
      timestamp: new Date('2024-01-15T10:30:00'),
      action: 'Création produit',
      type: 'creation',
      utilisateur: 'Marie Dubois',
      role: 'Pharmacien',
      entite: 'Produit',
      entiteId: 'PROD001',
      details: 'Nouveau produit: Paracétamol 500mg ajouté au catalogue',
      adresseIP: '192.168.1.100',
      impact: 'moyen',
      nouvelleValeur: 'Paracétamol 500mg - Code: PARA500'
    },
    {
      id: '2',
      timestamp: new Date('2024-01-15T14:15:00'),
      action: 'Modification stock',
      type: 'modification',
      utilisateur: 'Jean Martin',
      role: 'Préparateur',
      entite: 'Stock',
      entiteId: 'STK001',
      details: 'Mise à jour quantité en stock',
      adresseIP: '192.168.1.101',
      impact: 'eleve',
      ancienneValeur: 'Quantité: 50',
      nouvelleValeur: 'Quantité: 75'
    },
    {
      id: '3',
      timestamp: new Date('2024-01-15T16:45:00'),
      action: 'Ajustement stock',
      type: 'modification',
      utilisateur: 'Marie Dubois',
      role: 'Pharmacien',
      entite: 'Ajustement',
      entiteId: 'ADJ001',
      details: 'Correction de stock pour casse',
      adresseIP: '192.168.1.100',
      impact: 'eleve',
      ancienneValeur: 'Stock: 100',
      nouvelleValeur: 'Stock: 95 (Casse: -5)'
    },
    {
      id: '4',
      timestamp: new Date('2024-01-16T09:20:00'),
      action: 'Création transfert',
      type: 'creation',
      utilisateur: 'Pierre Durand',
      role: 'Responsable',
      entite: 'Transfert',
      entiteId: 'TRF001',
      details: 'Nouveau transfert vers succursale B',
      adresseIP: '192.168.1.102',
      impact: 'moyen',
      nouvelleValeur: 'Transfert 50 unités vers Succursale B'
    },
    {
      id: '5',
      timestamp: new Date('2024-01-16T11:30:00'),
      action: 'Consultation rapport',
      type: 'consultation',
      utilisateur: 'Sophie Martin',
      role: 'Directeur',
      entite: 'Rapport',
      entiteId: 'RPT001',
      details: 'Consultation rapport valorisation stock',
      adresseIP: '192.168.1.103',
      impact: 'faible'
    },
    {
      id: '6',
      timestamp: new Date('2024-01-16T15:10:00'),
      action: 'Suppression lot',
      type: 'suppression',
      utilisateur: 'Marie Dubois',
      role: 'Pharmacien',
      entite: 'Lot',
      entiteId: 'LOT999',
      details: 'Suppression lot périmé',
      adresseIP: '192.168.1.100',
      impact: 'critique',
      ancienneValeur: 'Lot LOT999 - Aspirine 100mg - Exp: 01/01/2024'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'creation':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'modification':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'suppression':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'consultation':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      creation: 'bg-green-100 text-green-800 border-green-200',
      modification: 'bg-blue-100 text-blue-800 border-blue-200',
      suppression: 'bg-red-100 text-red-800 border-red-200',
      consultation: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const labels = {
      creation: 'Création',
      modification: 'Modification',
      suppression: 'Suppression',
      consultation: 'Consultation'
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      faible: 'bg-green-100 text-green-800 border-green-200',
      moyen: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      eleve: 'bg-orange-100 text-orange-800 border-orange-200',
      critique: 'bg-red-100 text-red-800 border-red-200'
    };

    const labels = {
      faible: 'Faible',
      moyen: 'Moyen',
      eleve: 'Élevé',
      critique: 'Critique'
    };

    return (
      <Badge className={colors[impact as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[impact as keyof typeof labels] || impact}
      </Badge>
    );
  };

  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch = entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.utilisateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.entite.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'tous' || entry.type === selectedType;
    const matchesImpact = selectedImpact === 'tous' || entry.impact === selectedImpact;
    const matchesUser = selectedUser === 'tous' || entry.utilisateur === selectedUser;
    
    return matchesSearch && matchesType && matchesImpact && matchesUser;
  });

  const uniqueUsers = [...new Set(auditEntries.map(entry => entry.utilisateur))];

  return (
    <div className="space-y-6">
      {/* Métriques de l'audit */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Événements</p>
              <p className="text-2xl font-bold">{auditEntries.length}</p>
            </div>
            <History className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Événements Critiques</p>
              <p className="text-2xl font-bold text-red-600">
                {auditEntries.filter(e => e.impact === 'critique').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold">{uniqueUsers.length}</p>
            </div>
            <User className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Événements Aujourd'hui</p>
              <p className="text-2xl font-bold text-blue-600">3</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
      </div>

      {/* Journal d'audit */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Journal d'Audit
              </CardTitle>
              <CardDescription>Historique complet des actions utilisateurs et modifications système</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exporter Audit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 mb-6">
            {/* Première ligne de filtres */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher action, utilisateur, entité..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les types</SelectItem>
                  <SelectItem value="creation">Création</SelectItem>
                  <SelectItem value="modification">Modification</SelectItem>
                  <SelectItem value="suppression">Suppression</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedImpact} onValueChange={setSelectedImpact}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                  <SelectItem value="moyen">Moyen</SelectItem>
                  <SelectItem value="eleve">Élevé</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Deuxième ligne de filtres */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-[200px]">
                  <User className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les utilisateurs</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Période
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtres Avancés
              </Button>
            </div>
          </div>

          {/* Tableau des événements d'audit */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-sm">
                      {format(entry.timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-medium">{entry.action}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(entry.type)}
                        {getTypeBadge(entry.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.utilisateur}</div>
                        <div className="text-sm text-muted-foreground">{entry.role}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.entite}</div>
                        <div className="text-sm text-muted-foreground">{entry.entiteId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getImpactBadge(entry.impact)}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="truncate" title={entry.details}>
                        {entry.details}
                      </div>
                      {entry.ancienneValeur && (
                        <div className="text-xs text-red-600 mt-1">
                          Ancien: {entry.ancienneValeur}
                        </div>
                      )}
                      {entry.nouvelleValeur && (
                        <div className="text-xs text-green-600 mt-1">
                          Nouveau: {entry.nouvelleValeur}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun événement trouvé pour les critères sélectionnés
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockAudit;