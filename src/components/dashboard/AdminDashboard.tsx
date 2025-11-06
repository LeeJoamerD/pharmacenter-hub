import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Users, Briefcase, Package, AlertTriangle, Activity, FileText, RefreshCw
} from 'lucide-react';
import QuickActions from './admin/QuickActions';
import AlertsWidget from './admin/AlertsWidget';
import RecentActivity from './admin/RecentActivity';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';
import { useAdminApprovals } from '@/hooks/useAdminApprovals';

const AdminDashboard = () => {
  const { personnel, partenaires, referentiel, systeme, isLoading, refetch } = useAdminDashboardData();
  const { getAlertStats } = useSystemAlerts();
  const { approvals, total: approvalsTotal } = useAdminApprovals();
  
  const alertStats = getAlertStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-20 mb-2" /><Skeleton className="h-3 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord Administration</h2>
          <p className="text-muted-foreground">Vue d'ensemble temps réel</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personnel Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personnel?.total || 0}</div>
            <p className="text-xs text-muted-foreground">{personnel?.actifs || 0} actifs</p>
            {personnel?.nouveaux_ce_mois ? <Badge variant="outline" className="mt-1">+{personnel.nouveaux_ce_mois} ce mois</Badge> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partenaires</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partenaires?.total || 0}</div>
            <p className="text-xs text-muted-foreground">{partenaires?.fournisseurs || 0} fournisseurs · {partenaires?.laboratoires || 0} labos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Référentiel Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referentiel?.total_produits || 0}</div>
            <p className="text-xs text-muted-foreground">{referentiel?.produits_actifs || 0} actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Système</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${alertStats.critical > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.total}</div>
            <p className="text-xs text-muted-foreground">{alertStats.critical > 0 ? `${alertStats.critical} critiques` : 'Stable'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <QuickActions />
        <AlertsWidget />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RecentActivity />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Approbations</span>
              {approvalsTotal > 0 && <Badge variant="secondary">{approvalsTotal}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approvalsTotal === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Aucune approbation en attente</p>
            ) : (
              <div className="space-y-3">
                {approvals.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1"><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.description}</p></div>
                    <Badge variant="outline">{item.type === 'personnel' ? 'Personnel' : 'Document'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows (7j)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systeme?.workflows_actifs || 0}</div>
            <p className="text-xs text-muted-foreground">Opérations récentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systeme?.documents_total || 0}</div>
            <p className="text-xs text-muted-foreground">{systeme?.documents_en_attente || 0} en attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systeme?.clients_total || 0}</div>
            <p className="text-xs text-muted-foreground">{systeme?.clients_actifs || 0} actifs</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
