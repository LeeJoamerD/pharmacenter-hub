import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle } from 'lucide-react';

/**
 * ProductCatalogNew Component - Désactivé temporairement
 * 
 * Ce composant nécessite un schéma de base de données mis à jour pour la table 'produits'.
 * Certaines colonnes nécessaires (famille_id, is_active, etc.) sont manquantes.
 */
const ProductCatalogNew = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Catalogue des Produits
          </CardTitle>
          <CardDescription>
            Gestion complète du catalogue produits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fonctionnalité en développement</h3>
            <p className="text-muted-foreground max-w-md">
              Le catalogue des produits nécessite une mise à jour du schéma de base de données.
              Cette fonctionnalité sera disponible prochainement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductCatalogNew;
