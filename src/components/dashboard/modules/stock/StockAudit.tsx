import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ExportButton from '@/components/ui/export-button';
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
  History,
  Clock,
  Globe,
  FileText,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useLotMovements } from '@/hooks/useLotMovements';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  
  // Fonction pour gérer l'exportation des données
  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    const dataToExport = auditEntries;
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `journal-audit-${timestamp}`;
    
    try {
      switch (format) {
        case 'csv':
          exportToCSV(dataToExport, filename);
          break;
        case 'xlsx':
          exportToExcel(dataToExport, filename);
          break;
        case 'pdf':
          exportToPDF(dataToExport, filename);
          break;
      }
      
      toast({
        title: "Export réussi",
        description: `Les données ont été exportées au format ${format.toUpperCase()}.`
      });
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'exportation des données.",
        variant: "destructive"
      });
    }
  };
  
  // Fonction pour exporter au format CSV
  const exportToCSV = (data: AuditEntry[], filename: string) => {
    const headers = [
      'ID', 'Date', 'Action', 'Type', 'Utilisateur', 'Entité', 
      'Détails', 'Impact', 'Source'
    ];
    
    const rows = data.map(item => [
      item.id,
      new Date(item.timestamp).toLocaleDateString('fr-FR'),
      item.action,
      item.type,
      item.utilisateur,
      item.entite,
      item.details,
      item.impact,
      item.source
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
  };
  
  // Fonction pour exporter au format Excel
  const exportToExcel = (data: AuditEntry[], filename: string) => {
    const worksheetData = data.map(item => ({
      'ID': item.id,
      'Date': new Date(item.timestamp).toLocaleDateString('fr-FR'),
      'Action': item.action,
      'Type': item.type,
      'Utilisateur': item.utilisateur,
      'Rôle': item.role || 'N/A',
      'Entité': item.entite,
      'Détails': item.details,
      'Impact': item.impact,
      'Source': item.source
    }));
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Ajuster les largeurs de colonnes
    const columnWidths = [
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 40 },
      { wch: 10 }, { wch: 15 }
    ];
    worksheet['!cols'] = columnWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };
  
  // Fonction pour exporter au format PDF
  const exportToPDF = (data: AuditEntry[], filename: string) => {
    const doc = new jsPDF('landscape');
    
    // Titre
    doc.setFontSize(16);
    doc.text('Journal d\'Audit', 14, 15);
    
    // Date d'export
    doc.setFontSize(10);
    doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);
    
    // Tableau
    const tableData = data.map(item => [
      item.id,
      new Date(item.timestamp).toLocaleDateString('fr-FR'),
      item.action,
      item.type,
      item.utilisateur,
      item.entite,
      item.impact,
      item.source
    ]);
    
    autoTable(doc, {
      startY: 28,
      head: [['ID', 'Date', 'Action', 'Type', 'Utilisateur', 'Entité', 'Impact', 'Source']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    doc.save(`${filename}.pdf`);
  };

  const { useTenantQueryWithCache } = useTenantQuery();
  const { useLotMovementsQuery } = useLotMovements();

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
    let details = '';
    
    if (log.table_name === 'mouvements_lots') {
      details = `Mouvement de stock - ${log.action}`;
      
      // Extraire les informations des valeurs si disponibles
      try {
        const oldValues = log.old_values ? JSON.parse(log.old_values) : null;
        const newValues = log.new_values ? JSON.parse(log.new_values) : null;
        
        // Récupérer les informations de produit et lot depuis les valeurs
        const produitInfo = newValues?.produit_libelle || oldValues?.produit_libelle || 'Produit inconnu';
        const lotInfo = newValues?.lot_numero || oldValues?.lot_numero || 'Lot inconnu';
        const quantite = newValues?.quantite_mouvement || oldValues?.quantite_mouvement;
        
        if (produitInfo !== 'Produit inconnu' || lotInfo !== 'Lot inconnu') {
          details += ` - ${produitInfo} (Lot: ${lotInfo})`;
          if (quantite) {
            details += ` - Quantité: ${quantite}`;
          }
        }
      } catch (error) {
        // Si l'analyse JSON échoue, garder les détails de base
      }
    } else if (log.table_name === 'lots') {
      details = `Lot de stock - ${log.action}`;
      
      // Extraire les informations du lot
      try {
        const oldValues = log.old_values ? JSON.parse(log.old_values) : null;
        const newValues = log.new_values ? JSON.parse(log.new_values) : null;
        
        const produitInfo = newValues?.produit_libelle || oldValues?.produit_libelle;
        const lotInfo = newValues?.numero_lot || oldValues?.numero_lot;
        
        if (produitInfo || lotInfo) {
          details += ` - ${produitInfo || 'Produit inconnu'} (Lot: ${lotInfo || 'Lot inconnu'})`;
        }
      } catch (error) {
        // Si l'analyse JSON échoue, garder les détails de base
      }
    }
    
    return details || 'Détails non disponibles';
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
    {}, // Pas de filtre initial
    {
      enabled: true,
      orderBy: { column: 'created_at', ascending: false },
      limit: 1000
    }
  );

  // Utiliser le fallback si audit_logs n'est pas accessible
  useEffect(() => {
    if (auditLogsError) {
      setUsingFallback(true);
    }
  }, [auditLogsError]);

  // Fallback: Charger depuis mouvements_lots
  const { data: movementsData, isLoading: movementsLoading } = useTenantQueryWithCache(
    ['mouvements-lots-audit'],
    'mouvements_lots',
    `
      id, created_at, date_mouvement, type_mouvement, quantite_mouvement, 
      quantite_avant, quantite_apres, motif, user_id, agent_id,
      produit:produits(libelle_produit),
      lot:lots(numero_lot)
    `,
    {},
    { 
      enabled: usingFallback,
      orderBy: { column: 'created_at', ascending: false },
      limit: 1000
    }
  );

  // Charger les données du personnel pour récupérer les noms et rôles
  const { data: personnelData } = useTenantQueryWithCache(
    ['personnel-for-audit'],
    'personnel',
    'id, noms, prenoms, role, auth_user_id',
    {},
    { enabled: true }
  );

  // Fonction pour récupérer les informations utilisateur
  const getUserInfo = (userId: string | null, personnelId: string | null) => {
    if (!personnelData) return { nom: 'Système', role: 'N/A' };
    
    // Chercher par personnel_id d'abord
    if (personnelId) {
      const personnel = personnelData.find((p: any) => p.id === personnelId);
      if (personnel) {
        return {
          nom: `${personnel.prenoms} ${personnel.noms}`,
          role: personnel.role || 'N/A'
        };
      }
    }
    
    // Chercher par auth_user_id
    if (userId) {
      const personnel = personnelData.find((p: any) => p.auth_user_id === userId);
      if (personnel) {
        return {
          nom: `${personnel.prenoms} ${personnel.noms}`,
          role: personnel.role || 'N/A'
        };
      }
    }
    
    return { nom: 'Système', role: 'N/A' };
  };

  // Convertir les données en format audit uniforme
  const auditEntries: AuditEntry[] = useMemo(() => {
    // Si audit_logs est accessible, l'utiliser
    if (auditLogsData && !auditLogsError && !usingFallback) {
      return auditLogsData.map((log: any) => {
        const userInfo = getUserInfo(log.user_id, log.personnel_id);
        return {
          id: log.id,
          timestamp: log.created_at,
          action: getActionFromLog(log),
          type: getTypeFromLog(log),
          utilisateur: userInfo.nom,
          role: userInfo.role,
          entite: getEntityFromTableName(log.table_name),
          entiteId: log.record_id || 'N/A',
          details: generateDetailsFromLog(log),
          adresseIP: log.ip_address,
          impact: determineImpactFromLog(log),
          ancienneValeur: log.old_values ? JSON.stringify(log.old_values) : undefined,
          nouvelleValeur: log.new_values ? JSON.stringify(log.new_values) : undefined,
          source: 'audit_logs'
        };
      });
    }

    // Fallback: Construire audit depuis mouvements_lots
    if (movementsData) {
      return movementsData.map((movement: any) => {
        const userInfo = getUserInfo(movement.user_id, movement.agent_id);
        return {
          id: movement.id,
          timestamp: movement.created_at || movement.date_mouvement,
          action: getActionFromMovement(movement),
          type: 'creation' as const,
          utilisateur: userInfo.nom,
          role: userInfo.role,
          entite: 'Mouvement de stock',
          entiteId: movement.id,
          details: generateDetailsFromMovement(movement),
          impact: determineImpactFromMovement(movement),
          ancienneValeur: `Quantité avant: ${movement.quantite_avant || 0}`,
          nouvelleValeur: `Quantité après: ${movement.quantite_apres || 0}`,
          source: 'movements'
        };
      });
    }

    return [];
  }, [auditLogsData, auditLogsError, movementsData, usingFallback, personnelData]);

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

  const handleViewDetails = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setIsDetailsOpen(true);
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'critique':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'eleve':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'moyen':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'faible':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'creation':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'modification':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'suppression':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'consultation':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
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
  
  // Calcul correct des événements d'aujourd'hui
  const todayCount = auditEntries.filter(e => {
    const entryDate = format(new Date(e.timestamp), 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    return entryDate === today;
  }).length;
  
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
              <p className="text-2xl font-bold text-blue-600">{todayCount}</p>
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
            <ExportButton onExport={handleExport} />
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
                   <TableRow key={entry.id} className="hover:bg-muted/50 transition-colors">
                     <TableCell className="font-mono text-sm py-3 px-4 align-top">
                       {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                     </TableCell>
                     <TableCell className="font-medium py-3 px-4 align-top">{entry.action}</TableCell>
                     <TableCell className="py-3 px-4 align-top">
                       <div className="flex items-center gap-2">
                         {getTypeIcon(entry.type)}
                         {getTypeBadge(entry.type)}
                       </div>
                     </TableCell>
                     <TableCell className="py-3 px-4 align-top">
                       <div>
                         <div className="font-medium">{entry.utilisateur}</div>
                         {entry.role && <div className="text-sm text-muted-foreground">{entry.role}</div>}
                       </div>
                     </TableCell>
                     <TableCell className="py-3 px-4 align-top">
                       <div>
                         <div className="font-medium">{entry.entite}</div>
                         <div className="text-sm text-muted-foreground break-all">{entry.entiteId}</div>
                       </div>
                     </TableCell>
                     <TableCell className="py-3 px-4 align-top">
                       {getImpactBadge(entry.impact)}
                     </TableCell>
                     <TableCell className="max-w-[300px] py-3 px-4 align-top">
                       <div className="space-y-1">
                         <div className="text-sm leading-relaxed" title={entry.details}>
                           {entry.details}
                         </div>
                         {entry.ancienneValeur && (
                           <div className="text-xs text-red-600 p-1 bg-red-50 rounded border-l-2 border-red-200">
                             <span className="font-medium">Ancien:</span> {entry.ancienneValeur}
                           </div>
                         )}
                         {entry.nouvelleValeur && (
                           <div className="text-xs text-green-600 p-1 bg-green-50 rounded border-l-2 border-green-200">
                             <span className="font-medium">Nouveau:</span> {entry.nouvelleValeur}
                           </div>
                         )}
                       </div>
                     </TableCell>
                     <TableCell className="py-3 px-4 align-top">
                       <Button 
                         variant="ghost" 
                         size="sm"
                         onClick={() => handleViewDetails(entry)}
                       >
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
          
          <div className="flex justify-end mt-4">
            {/* Bouton d'exportation déjà présent en haut de la page */}
          </div>
        </CardContent>
      </Card>

      {/* Dialog déplacé en dehors du tableau */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Détails de l'événement d'audit
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur l'événement d'audit sélectionné
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Informations temporelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Date et heure :</span>
                      <p className="text-sm">{format(new Date(selectedEntry.timestamp), 'PPpp', { locale: fr })}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">ID de l'événement :</span>
                      <p className="text-sm font-mono">{selectedEntry.id}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Utilisateur
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Nom :</span>
                      <p className="text-sm">{selectedEntry.utilisateur}</p>
                    </div>
                    {selectedEntry.role && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Rôle :</span>
                        <Badge variant="secondary" className="ml-2">{selectedEntry.role}</Badge>
                      </div>
                    )}
                    {selectedEntry.adresseIP && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Adresse IP :</span>
                        <p className="text-sm font-mono flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {selectedEntry.adresseIP}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Action et type */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Action effectuée
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Type d'action :</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeIcon(selectedEntry.type)}
                        <Badge variant={
                          selectedEntry.type === 'creation' ? 'default' :
                          selectedEntry.type === 'modification' ? 'secondary' :
                          selectedEntry.type === 'suppression' ? 'destructive' : 'outline'
                        }>
                          {selectedEntry.type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Impact :</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getImpactIcon(selectedEntry.impact)}
                        <Badge variant={
                          selectedEntry.impact === 'critique' ? 'destructive' :
                          selectedEntry.impact === 'eleve' ? 'destructive' :
                          selectedEntry.impact === 'moyen' ? 'secondary' : 'outline'
                        }>
                          {selectedEntry.impact}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Description :</span>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedEntry.action}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Entité concernée */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Entité concernée
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Type d'entité :</span>
                    <p className="text-sm">{selectedEntry.entite}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Identifiant :</span>
                    <p className="text-sm font-mono">{selectedEntry.entiteId}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Détails de la modification */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Détails de la modification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Description complète :</span>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-md leading-relaxed">{selectedEntry.details}</p>
                  </div>
                  
                  {(selectedEntry.ancienneValeur || selectedEntry.nouvelleValeur) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {selectedEntry.ancienneValeur && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Ancienne valeur :</span>
                          <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800 leading-relaxed break-all">
                              {selectedEntry.ancienneValeur}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {selectedEntry.nouvelleValeur && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Nouvelle valeur :</span>
                          <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-800 leading-relaxed break-all">
                              {selectedEntry.nouvelleValeur}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedEntry.ancienneValeur && selectedEntry.nouvelleValeur && (
                    <div className="flex items-center justify-center py-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informations techniques */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Informations techniques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Source :</span>
                    <Badge variant="outline" className="ml-2">
                      {selectedEntry.source === 'audit_logs' ? 'Journal d\'audit' : 'Mouvements'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Horodatage complet :</span>
                    <p className="text-sm font-mono">{selectedEntry.timestamp}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockAudit;