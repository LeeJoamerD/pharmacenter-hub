import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface TopProduct {
  produit_id: string;
  libelle: string;
  code_cip: string;
  quantite: number;
  ca: number;
}

interface TopProductsListProps {
  products: TopProduct[];
  loading?: boolean;
}

export const TopProductsList = ({ products, loading }: TopProductsListProps) => {
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('topProducts')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('noTopProducts')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxCA = Math.max(...products.map(p => p.ca));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('topProducts')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.produit_id} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      #{index + 1}
                    </Badge>
                    <p className="font-medium text-sm line-clamp-1">
                      {product.libelle}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.code_cip}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold text-sm">
                    {formatPrice(product.ca)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.quantite} {t('units')}
                  </p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${(product.ca / maxCA) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
