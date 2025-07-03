import React from 'react';
import { Settings } from 'lucide-react';

const StockConfigurationTab = () => {
  return (
    <div className="text-center py-12">
      <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Configuration Stock</h3>
      <p className="text-muted-foreground">Paramètres du module à implémenter</p>
    </div>
  );
};

export default StockConfigurationTab;