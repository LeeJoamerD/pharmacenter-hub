import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, CreditCard, Wallet, Package, FileText, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const QuickActionsPanel = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const actions = [
    {
      icon: ShoppingCart,
      label: t('newSale'),
      description: t('pos'),
      path: '/ventes/pos',
      variant: 'default' as const,
    },
    {
      icon: CreditCard,
      label: t('openRegister'),
      description: t('cashManagementAction'),
      path: '/ventes/caisses',
      variant: 'outline' as const,
    },
    {
      icon: Wallet,
      label: t('payment'),
      description: t('collections'),
      path: '/ventes/encaissements',
      variant: 'outline' as const,
    },
    {
      icon: Package,
      label: t('inventory'),
      description: t('stockManagementAction'),
      path: '/stock/inventaires',
      variant: 'outline' as const,
    },
    {
      icon: FileText,
      label: t('reports'),
      description: t('analytics'),
      path: '/rapports',
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {t('quickActions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.path}
                variant={action.variant}
                className="h-auto flex-col gap-2 p-4"
                onClick={() => navigate(action.path)}
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold text-sm">{action.label}</div>
                  <div className="text-xs opacity-70">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
