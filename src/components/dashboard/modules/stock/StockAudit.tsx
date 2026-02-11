import React, { useState, useMemo } from 'react';
import StockConsistencyChecker from './StockConsistencyChecker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ExportButton from '@/components/ui/export-button';
import { 
  Search, Filter, Eye, Shield, Calendar as CalendarIcon, User, Activity,
  AlertTriangle, CheckCircle, History, Clock, Globe, FileText,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useMovementsPaginated } from '@/hooks/useMovementsPaginated';
import { useTenantQuery } from '@/hooks/useTenantQuery';
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
  source: string;
}

const StockAudit = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('tous');
  const [selectedImpact, setSelectedImpact] = useState<string>('tous');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  const { useTenantQueryWithCache } = useTenantQuery();

  // Server-side paginated movements
  const {
    movements: movementsData,
    count,
    totalPages,
    isLoading,
    isFetching,
    page,
    setPage,
    pageSize,
  } = useMovementsPaginated({
    search: searchTerm,
    date_debut: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : null,
    date_fin: dateTo ? format(dateTo, "yyyy-MM-dd'T'23:59:59") : null,
  });

  // Personnel data for user names
  const { data: personnelData } = useTenantQueryWithCache(
    ['personnel-for-audit'], 'personnel', 'id, noms, prenoms, role, auth_user_id', {}, { enabled: true }
  );

  const getUserInfo = (userId: string | null, personnelId: string | null) => {
    if (!personnelData) return { nom: 'Système', role: 'N/A' };
    if (personnelId) {
      const p = personnelData.find((p: any) => p.id === personnelId);
      if (p) return { nom: `${p.prenoms} ${p.noms}`, role: p.role || 'N/A' };
    }
    if (userId) {
      const p = personnelData.find((p: any) => p.auth_user_id === userId);
      if (p) return { nom: `${p.prenoms} ${p.noms}`, role: p.role || 'N/A' };
    }
    return { nom: 'Système', role: 'N/A' };
  };

  const getActionFromMovement = (m: any) => {
    const map: Record<string, string> = {
      entree: 'Entrée de stock', sortie: 'Sortie de stock', ajustement: 'Ajustement de stock',
      transfert: 'Transfert de stock', retour: 'Retour de stock', destruction: 'Destruction de stock'
    };
    return map[m.type_mouvement] || 'Mouvement de stock';
  };

  const determineImpact = (m: any): AuditEntry['impact'] => {
    if (m.type_mouvement === 'destruction') return 'critique';
    if (['ajustement', 'transfert'].includes(m.type_mouvement)) return 'eleve';
    if (['entree', 'sortie'].includes(m.type_mouvement)) return 'moyen';
    return 'faible';
  };

  const auditEntries: AuditEntry[] = useMemo(() => {
    if (!movementsData) return [];
    return movementsData.map((m: any) => {
      const userInfo = getUserInfo(m.user_id || null, m.agent_id || null);
      return {
        id: m.id,
        timestamp: m.created_at || m.date_mouvement,
        action: getActionFromMovement(m),
        type: 'creation' as const,
        utilisateur: userInfo.nom,
        role: userInfo.role,
        entite: 'Mouvement de stock',
        entiteId: m.id,
        details: `${m.produit?.libelle_produit || 'Produit inconnu'} - Lot ${m.lot?.numero_lot || 'inconnu'} - Qté: ${m.quantite_mouvement}${m.motif ? ` - ${m.motif}` : ''}`,
        impact: determineImpact(m),
        ancienneValeur: `Qté avant: ${m.quantite_avant || 0}`,
        nouvelleValeur: `Qté après: ${m.quantite_apres || 0}`,
        source: 'movements'
      };
    });
  }, [movementsData, personnelData]);

  // Client-side filtering for type/impact
  const filteredEntries = useMemo(() => {
    return auditEntries.filter(entry => {
      const matchesType = selectedType === 'tous' || entry.type === selectedType;
      const matchesImpact = selectedImpact === 'tous' || entry.impact === selectedImpact;
      return matchesType && matchesImpact;
    });
  }, [auditEntries, selectedType, selectedImpact]);

  const uniqueUsers = [...new Set(auditEntries.map(e => e.utilisateur))];
  const todayCount = auditEntries.filter(e => {
    try { return format(new Date(e.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'); } catch { return false; }
  }).length;

  // Export
  const handleExport = (fmt: 'csv' | 'xlsx' | 'pdf') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `journal-audit-${timestamp}`;
    try {
      if (fmt === 'csv') {
        const headers = ['Date', 'Action', 'Type', 'Utilisateur', 'Entité', 'Impact', 'Détails'];
        const csv = [headers.join(','), ...filteredEntries.map(e => [
          format(new Date(e.timestamp), 'dd/MM/yyyy HH:mm'), e.action, e.type, e.utilisateur, e.entite, e.impact, `"${e.details}"`
        ].join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${filename}.csv`; link.click();
      } else if (fmt === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(filteredEntries.map(e => ({
          Date: format(new Date(e.timestamp), 'dd/MM/yyyy HH:mm'), Action: e.action, Type: e.type, Utilisateur: e.utilisateur, Entité: e.entite, Impact: e.impact, Détails: e.details
        })));
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Audit'); XLSX.writeFile(wb, `${filename}.xlsx`);
      } else {
        const doc = new jsPDF('landscape');
        doc.setFontSize(16); doc.text("Journal d'Audit", 14, 15);
        autoTable(doc, {
          startY: 22,
          head: [['Date', 'Action', 'Utilisateur', 'Entité', 'Impact', 'Détails']],
          body: filteredEntries.map(e => [format(new Date(e.timestamp), 'dd/MM/yyyy HH:mm'), e.action, e.utilisateur, e.entite, e.impact, e.details]),
          styles: { fontSize: 8 }
        });
        doc.save(`${filename}.pdf`);
      }
      toast({ title: "Export réussi", description: `Données exportées en ${fmt.toUpperCase()}` });
    } catch (err) {
      toast({ title: "Erreur", description: "Erreur lors de l'export", variant: "destructive" });
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'critique': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'eleve': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'moyen': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'faible': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors: Record<string, string> = { faible: 'bg-green-100 text-green-800', moyen: 'bg-yellow-100 text-yellow-800', eleve: 'bg-orange-100 text-orange-800', critique: 'bg-red-100 text-red-800' };
    const labels: Record<string, string> = { faible: 'Faible', moyen: 'Moyen', eleve: 'Élevé', critique: 'Critique' };
    return <Badge className={colors[impact] || 'bg-gray-100 text-gray-800'}>{labels[impact] || impact}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'creation': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'modification': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'suppression': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-muted-foreground">Total Événements</p><p className="text-2xl font-bold">{count}</p></div><History className="h-8 w-8 text-muted-foreground" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-muted-foreground">Événements Critiques</p><p className="text-2xl font-bold text-red-600">{auditEntries.filter(e => e.impact === 'critique').length}</p></div><AlertTriangle className="h-8 w-8 text-red-600" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-muted-foreground">Utilisateurs Actifs</p><p className="text-2xl font-bold">{uniqueUsers.length}</p></div><User className="h-8 w-8 text-muted-foreground" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-muted-foreground">Événements Aujourd'hui</p><p className="text-2xl font-bold text-blue-600">{todayCount}</p></div><Activity className="h-8 w-8 text-blue-600" /></CardContent></Card>
      </div>

      {/* Audit journal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Journal d'Audit</CardTitle>
              <CardDescription>Historique complet des actions utilisateurs et modifications système</CardDescription>
            </div>
            <ExportButton onExport={handleExport} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher action, utilisateur, entité..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div></div>
              <Select value={selectedImpact} onValueChange={setSelectedImpact}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Impact" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                  <SelectItem value="moyen">Moyen</SelectItem>
                  <SelectItem value="eleve">Élevé</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline"><CalendarIcon className="mr-2 h-4 w-4" />{dateFrom ? format(dateFrom, 'dd/MM/yy') : 'Du'}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end"><Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus /></PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline"><CalendarIcon className="mr-2 h-4 w-4" />{dateTo ? format(dateTo, 'dd/MM/yy') : 'Au'}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end"><Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Timestamp</TableHead><TableHead>Action</TableHead><TableHead>Utilisateur</TableHead>
                <TableHead>Entité</TableHead><TableHead>Impact</TableHead><TableHead>Détails</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredEntries.map(entry => (
                  <TableRow key={entry.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-sm">{format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}</TableCell>
                    <TableCell className="font-medium">{entry.action}</TableCell>
                    <TableCell><div><div className="font-medium">{entry.utilisateur}</div>{entry.role && <div className="text-sm text-muted-foreground">{entry.role}</div>}</div></TableCell>
                    <TableCell><div className="text-sm break-all">{entry.entiteId?.slice(0, 8)}...</div></TableCell>
                    <TableCell>{getImpactBadge(entry.impact)}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="space-y-1">
                        <div className="text-sm leading-relaxed truncate" title={entry.details}>{entry.details}</div>
                        {entry.ancienneValeur && <div className="text-xs text-red-600 p-1 bg-red-50 rounded">{entry.ancienneValeur}</div>}
                        {entry.nouvelleValeur && <div className="text-xs text-green-600 p-1 bg-green-50 rounded">{entry.nouvelleValeur}</div>}
                      </div>
                    </TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => { setSelectedEntry(entry); setIsDetailsOpen(true); }}><Eye className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {count > 0 ? `Page ${page} / ${totalPages || 1} — ${count} événements au total` : 'Aucun événement'}
              {isFetching && <span className="ml-2 text-primary">(mise à jour...)</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /> Précédent</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Suivant <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          {filteredEntries.length === 0 && !isLoading && <div className="text-center py-8 text-muted-foreground">Aucun événement trouvé</div>}
          {isLoading && <div className="text-center py-8 text-muted-foreground">Chargement des données d'audit...</div>}
        </CardContent>
      </Card>

      {/* Details dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Détails de l'événement</DialogTitle>
            <DialogDescription>Informations complètes sur l'événement sélectionné</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4" />Informations temporelles</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div><span className="text-sm font-medium text-muted-foreground">Date et heure :</span><p className="text-sm">{format(new Date(selectedEntry.timestamp), 'PPpp', { locale: fr })}</p></div>
                    <div><span className="text-sm font-medium text-muted-foreground">ID :</span><p className="text-sm font-mono">{selectedEntry.id}</p></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><User className="h-4 w-4" />Utilisateur</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div><span className="text-sm font-medium text-muted-foreground">Nom :</span><p className="text-sm">{selectedEntry.utilisateur}</p></div>
                    {selectedEntry.role && <div><span className="text-sm font-medium text-muted-foreground">Rôle :</span><Badge variant="secondary" className="ml-2">{selectedEntry.role}</Badge></div>}
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4" />Détails</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2"><span className="text-sm font-medium">Action :</span>{selectedEntry.action}</div>
                  <div className="flex items-center gap-2"><span className="text-sm font-medium">Impact :</span>{getImpactBadge(selectedEntry.impact)}</div>
                  <div><span className="text-sm font-medium">Description :</span><p className="text-sm mt-1">{selectedEntry.details}</p></div>
                  {selectedEntry.ancienneValeur && <div className="p-2 bg-red-50 rounded text-sm"><span className="font-medium">Avant :</span> {selectedEntry.ancienneValeur}</div>}
                  {selectedEntry.nouvelleValeur && <div className="p-2 bg-green-50 rounded text-sm"><span className="font-medium">Après :</span> {selectedEntry.nouvelleValeur}</div>}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Consistency Checker */}
      <StockConsistencyChecker />
    </div>
  );
};

export default StockAudit;
