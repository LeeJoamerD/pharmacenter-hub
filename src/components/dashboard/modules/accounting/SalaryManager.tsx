import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Receipt, Settings, BarChart } from 'lucide-react';
import BulletinsList from './salary/BulletinsList';
import PayrollSettings from './salary/PayrollSettings';
import PayrollSummary from './salary/PayrollSummary';

const SalaryManager = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestion de la Paie</h2>
        <p className="text-muted-foreground">
          Bulletins de paie, paramètres CNSS/IRPP et historique des salaires
        </p>
      </div>

      <Tabs defaultValue="bulletins" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bulletins" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Bulletins de paie
          </TabsTrigger>
          <TabsTrigger value="parametres" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="historique" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulletins">
          <BulletinsList />
        </TabsContent>
        <TabsContent value="parametres">
          <PayrollSettings />
        </TabsContent>
        <TabsContent value="historique">
          <PayrollSummary />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalaryManager;
