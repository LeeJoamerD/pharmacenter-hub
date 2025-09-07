import React, { useState, useMemo, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useLotMovements } from '@/hooks/useLotMovements';
import { supabase } from '@/integrations/supabase/client';

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  type: 'creation' | 'modification' | 'suppression' | 'consultation';
  utilisateur: string;
  role?: string;
  entite: string;
  entiteId: string;
  details: string;
  adresseIP?: string;
  impact: 'faible' | 'moyen' | 'eleve' | 'critique';
  ancienneValeur?: string;
  nouvelleValeur?: string;
  source: 'audit_logs' | 'movements';
}

const StockAudit = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('tous');
  const [selectedImpact, setSelectedImpact] = useState<string>('tous');
  const [selectedUser, setSelectedUser] = useState<string>('tous');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [usingFallback, setUsingFallback] = useState(false);
  const { toast } = useToast();

  const { useTenantQueryWithCache } = useTenantQuery();
  const { useLotMovementsQuery } = useLotMovements();

  // Essai 1: Charger depuis audit_logs
  const { 
    data: auditLogsData, 
    isLoading: auditLogsLoading, 
    error: auditLogsError 
  } = useTenantQueryWithCache(
    ['audit-logs', 'stock'],
    'audit_logs',
    `
      id, created_at, action, table_name, record_id, old_values, new_values, 
      user_id, personnel_id, ip_address, status, error_message
    `,
    {
      table_name: ['mouvements_lots', 'lots']
    },
    {
      enabled: true,
      orderBy: { column: 'created_at', ascending: false }
    }
  );

  // Utiliser le fallback si audit_logs n'est pas accessible
  useEffect(() => {
    if (auditLogsError) {
      setUsingFallback(true);
    }
  }, [auditLogsError]);

  // Fallback: Charger depuis mouvements_lots
  const { data: movementsData, isLoading: movementsLoading } = useLotMovementsQuery();

  // Convertir les données en format audit uniforme
  const auditEntries: AuditEntry[] = useMemo(() => {
    // Si audit_logs est accessible, l'utiliser
    if (auditLogsData && !auditLogsError && !usingFallback) {
      return auditLogsData.map((log: any) => ({
        id: log.id,
        timestamp: log.created_at,
        action: getActionFromLog(log),
        type: getTypeFromLog(log),
        utilisateur: 'Système', // TODO: Récupérer depuis personnel si personnel_id existe
        role: 'N/A',
        entite: getEntityFromTableName(log.table_name),
        entiteId: log.record_id || 'N/A',
        details: generateDetailsFromLog(log),
        adresseIP: log.ip_address,
        impact: determineImpactFromLog(log),
        ancienneValeur: log.old_values ? JSON.stringify(log.old_values) : undefined,
        nouvelleValeur: log.new_values ? JSON.stringify(log.new_values) : undefined,
        source: 'audit_logs'
      }));
    }

    // Fallback: Construire audit depuis mouvements_lots
    if (movementsData) {
      return movementsData.map((movement: any) => ({
        id: movement.id,
        timestamp: movement.created_at || movement.date_mouvement,
        action: getActionFromMovement(movement),
        type: 'creation' as const,
        utilisateur: 'Utilisateur', // TODO: Récupérer depuis personnel si agent_id existe
        role: 'N/A',
        entite: 'Mouvement de stock',
        entiteId: movement.id,
        details: generateDetailsFromMovement(movement),
        impact: determineImpactFromMovement(movement),
        ancienneValeur: `Quantité avant: ${movement.quantite_avant || 0}`,
        nouvelleValeur: `Quantité après: ${movement.quantite_apres || 0}`,
        source: 'movements'
      }));
    }

    return [];
  }, [auditLogsData, auditLogsError, movementsData, usingFallback]);

  // Fonctions utilitaires pour traiter les données
  const getActionFromLog = (log: any) => {
    const actionMap: { [key: string]: string } = {
      'INSERT': 'Création',
      'UPDATE': 'Modification', 
      'DELETE': 'Suppression',
      'SELECT': 'Consultation'
    };
    return actionMap[log.action] || log.action || 'Action inconnue';
  };

  const getTypeFromLog = (log: any): AuditEntry['type'] => {
    const typeMap: { [key: string]: AuditEntry['type'] } = {
      'INSERT': 'creation',
      'UPDATE': 'modification',
      'DELETE': 'suppression', 
      'SELECT': 'consultation'
    };
    return typeMap[log.action] || 'modification';
  };

  const getEntityFromTableName = (tableName: string) => {
    const entityMap: { [key: string]: string } = {
      'mouvements_lots': 'Mouvement de lot',
      'lots': 'Lot de stock'
    };
    return entityMap[tableName] || tableName;
  };

  const generateDetailsFromLog = (log: any) => {
    if (log.table_name === 'mouvements_lots') {
      return `Mouvement de stock - ${log.action}`;
    }
    if (log.table_name === 'lots') {
      return `Lot de stock - ${log.action}`;
    }
    return log.action || 'Opération système';
  };

  const determineImpactFromLog = (log: any): AuditEntry['impact'] => {
    if (log.action === 'DELETE') return 'critique';
    if (log.table_name === 'mouvements_lots') return 'eleve';
    if (log.table_name === 'lots') return 'moyen';
    return 'faible';
  };

  const getActionFromMovement = (movement: any) => {
    const actionMap: { [key: string]: string } = {
      'entree': 'Entrée de stock',
      'sortie': 'Sortie de stock',
      'ajustement': 'Ajustement de stock',
      'transfert': 'Transfert de stock',
      'retour': 'Retour de stock',
      'destruction': 'Destruction de stock'
    };
    return actionMap[movement.type_mouvement] || 'Mouvement de stock';
  };

  const generateDetailsFromMovement = (movement: any) => {
    const produit = movement.produit?.libelle_produit || 'Produit inconnu';
    const lot = movement.lot?.numero_lot || 'Lot inconnu';
    const quantite = movement.quantite_mouvement || 0;
    
    return `${produit} - Lot ${lot} - Quantité: ${quantite}${movement.motif ? ` - Motif: ${movement.motif}` : ''}`;
  };

  const determineImpactFromMovement = (movement: any): AuditEntry['impact'] => {
    if (movement.type_mouvement === 'destruction') return 'critique';
    if (['ajustement', 'transfert'].includes(movement.type_mouvement)) return 'eleve';
    if (['entree', 'sortie'].includes(movement.type_mouvement)) return 'moyen';
    return 'faible';
  };

  // Export des données d'audit
  const handleExportAudit = () => {
    const csvHeaders = [
      'Timestamp', 'Action', 'Type', 'Utilisateur', 'Entité', 'ID Entité', 
      'Impact', 'Détails', 'Ancienne Valeur', 'Nouvelle Valeur'
    ].join(',');

    const csvData = filteredEntries.map(entry => [
      format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm:ss'),
      entry.action,
      entry.type,
      entry.utilisateur,
      entry.entite,
      entry.entiteId,
      entry.impact,
      `"${entry.details.replace(/"/g, '""')}"`,
      `"${entry.ancienneValeur?.replace(/"/g, '""') || ''}"`,
      `"${entry.nouvelleValeur?.replace(/"/g, '""') || ''}"`
    ].join(',')).join('\n');

    const csv = csvHeaders + '\n' + csvData;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-stock-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: "Le journal d'audit a été exporté avec succès",
    });
  };

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

    // Filtrage par date
    const entryDate = new Date(entry.timestamp);
    const matchesDateFrom = !dateFrom || entryDate >= dateFrom;
    const matchesDateTo = !dateTo || entryDate <= dateTo;
    
    return matchesSearch && matchesType && matchesImpact && matchesUser && matchesDateFrom && matchesDateTo;
  });

  const uniqueUsers = [...new Set(auditEntries.map(entry => entry.utilisateur))];
  const isLoading = auditLogsLoading || movementsLoading;

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
              <CardDescription>
                Historique complet des actions utilisateurs et modifications système 
                {usingFallback && (
                  <span className="text-orange-600 ml-2">
                    (Mode dégradé - Données depuis les mouvements)
                  </span>
                )}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleExportAudit}>
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
                       {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
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
                         {entry.role && <div className="text-sm text-muted-foreground">{entry.role}</div>}
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

          {filteredEntries.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun événement trouvé pour les critères sélectionnés
            </div>
          )}
          
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des données d'audit...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockAudit;