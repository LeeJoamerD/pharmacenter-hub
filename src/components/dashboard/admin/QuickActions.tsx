import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Building, Package, FileText, Settings, Shield } from 'lucide-react';

const QuickActions = () => {
  const quickActions = [
    {
      icon: UserPlus,
      label: 'Ajouter Personnel',
      description: 'Nouveau membre de l\'équipe',
      action: () => console.log('Ajouter personnel')
    },
    {
      icon: Building,
      label: 'Nouveau Partenaire',
      description: 'Fournisseur ou laboratoire',
      action: () => console.log('Ajouter partenaire')
    },
    {
      icon: Package,
      label: 'Nouveau Produit',
      description: 'Ajouter au référentiel',
      action: () => console.log('Ajouter produit')
    },
    {
      icon: FileText,
      label: 'Upload Document',
      description: 'Certificats et licences',
      action: () => console.log('Upload document')
    },
    {
      icon: Shield,
      label: 'Gestion Rôles',
      description: 'Permissions et accès',
      action: () => console.log('Gérer rôles')
    },
    {
      icon: Settings,
      label: 'Configuration',
      description: 'Paramètres système',
      action: () => console.log('Configuration')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions Rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={action.action}
            >
              <div className="flex items-center gap-2">
                <action.icon className="h-4 w-4" />
                <span className="font-medium">{action.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {action.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;