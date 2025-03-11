
import React from 'react';
import { BarChart } from 'lucide-react';

const ReportsModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Analyses & Rapports</h2>
    <p className="text-muted-foreground">Accédez à des analyses détaillées et générer des rapports personnalisés.</p>
    <div className="h-[400px] w-full bg-muted/20 rounded-md flex items-center justify-center">
      <BarChart className="h-12 w-12 text-muted" />
      <span className="ml-4 text-xl text-muted-foreground">Module d'analyses et de rapports</span>
    </div>
  </div>
);

export default ReportsModule;
