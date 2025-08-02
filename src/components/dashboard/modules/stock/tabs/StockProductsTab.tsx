import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ArrowRight } from 'lucide-react';

const StockProductsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Catalogue des Produits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Catalogue déplacé</h3>
            <p className="text-muted-foreground mb-4">
              Le catalogue des produits a été déplacé vers la section "Référentiel" du module Administration.
            </p>
            <Button 
              onClick={() => {
                // Rediriger vers le module Référentiel
                window.location.href = '#administration/referentiel/catalogue';
              }}
              className="gap-2"
            >
              Aller au Référentiel
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockProductsTab;