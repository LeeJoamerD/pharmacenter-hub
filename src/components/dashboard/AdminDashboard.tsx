import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Package, FileText, AlertTriangle, Activity, Briefcase, Settings } from 'lucide-react';
import QuickActions from './admin/QuickActions';
import AlertsWidget from './admin/AlertsWidget';
import RecentActivity from './admin/RecentActivity';

const AdminDashboard = () => {
  // Données fictives pour les métriques d'administration
  const adminMetrics = {
    totalPersonnel: 12,
    activeUsers: 8,
    pendingApprovals: 3,
    totalPartners: 25,
    totalProducts: 1234,
    pendingDocuments: 7,
    systemAlerts: 2,
    activeWorkflows: 15
  };

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personnel Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminMetrics.totalPersonnel}</div>
            <p className="text-xs text-green-500">
              {adminMetrics.activeUsers} actifs aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partenaires</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminMetrics.totalPartners}</div>
            <p className="text-xs text-muted-foreground">
              Assureurs, fournisseurs, laboratoires
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Référentiel Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminMetrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produits catalogués
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Système</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminMetrics.systemAlerts}</div>
            <p className="text-xs text-amber-500">
              Nécessitent votre attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Widgets d'administration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions rapides */}
        <QuickActions />
        
        {/* Alertes importantes */}
        <AlertsWidget />
      </div>

      {/* Activité récente et approbations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Approbations en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Nouveau personnel</p>
                  <p className="text-xs text-muted-foreground">Dr. Marie Dupont</p>
                </div>
                <div className="text-amber-500 text-sm">En attente</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Modification tarif</p>
                  <p className="text-xs text-muted-foreground">Produit #1245</p>
                </div>
                <div className="text-amber-500 text-sm">En attente</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Nouveau partenaire</p>
                  <p className="text-xs text-muted-foreground">Laboratoire XYZ</p>
                </div>
                <div className="text-amber-500 text-sm">En attente</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques des workflows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows Actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminMetrics.activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">Processus en cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Pendants</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminMetrics.pendingDocuments}</div>
            <p className="text-xs text-amber-500">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuration</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-green-500">Système configuré</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;