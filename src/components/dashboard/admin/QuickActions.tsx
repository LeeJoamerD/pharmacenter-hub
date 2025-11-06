import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Building, Package, FileText, Settings, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: UserPlus,
      label: 'Ajouter Personnel',
      description: 'Nouveau membre de l\'équipe',
      action: () => navigate('/dashboard/administration/personnel')
    },
    {
      icon: Building,
      label: 'Nouveau Partenaire',
      description: 'Fournisseur ou laboratoire',
      action: () => navigate('/dashboard/administration/partenaires')
    },
    {
      icon: Package,
      label: 'Nouveau Produit',
      description: 'Ajouter au référentiel',
      action: () => navigate('/dashboard/administration/referentiel')
    },
    {
      icon: FileText,
      label: 'Upload Document',
      description: 'Certificats et licences',
      action: () => navigate('/dashboard/administration/documents')
    },
    {
      icon: Shield,
      label: 'Gestion Rôles',
      description: 'Permissions et accès',
      action: () => navigate('/dashboard/parametres')
    },
    {
      icon: Settings,
      label: 'Configuration',
      description: 'Paramètres système',
      action: () => navigate('/dashboard/parametres')
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
              className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent/50 transition-colors"
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
