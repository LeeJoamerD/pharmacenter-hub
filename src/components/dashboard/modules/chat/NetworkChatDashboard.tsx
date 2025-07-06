import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NetworkOverview from './NetworkOverview';
import PharmacyDirectory from './PharmacyDirectory';
import GlobalActivity from './GlobalActivity';
import NetworkMetrics from './NetworkMetrics';
import QuickNetworkActions from './QuickNetworkActions';

const NetworkChatDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat PharmaSoft Réseau</h1>
          <p className="text-muted-foreground">
            Hub central de communication multi-officines
          </p>
        </div>
      </div>

      {/* Vue d'ensemble réseau */}
      <NetworkOverview />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Répertoire officines */}
        <div className="lg:col-span-1">
          <PharmacyDirectory />
        </div>

        {/* Activité globale */}
        <div className="lg:col-span-1">
          <GlobalActivity />
        </div>

        {/* Métriques réseau */}
        <div className="lg:col-span-1">
          <NetworkMetrics />
        </div>
      </div>

      {/* Actions rapides réseau */}
      <QuickNetworkActions />
    </div>
  );
};

export default NetworkChatDashboard;