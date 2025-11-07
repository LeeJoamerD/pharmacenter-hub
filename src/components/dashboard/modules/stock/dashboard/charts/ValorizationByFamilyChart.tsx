import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export interface FamilyValorization {
  famille: string;
  valeur: number;
  quantite: number;
  pourcentage: number;
  nb_produits: number;
}

interface ValorizationByFamilyChartProps {
  data: FamilyValorization[];
}

const ValorizationByFamilyChart = ({ data }: ValorizationByFamilyChartProps) => {
  const { settings } = useSystemSettings();

  const formatPrice = (value: number): string => {
    const currency = settings?.default_currency || 'XAF';
    try {
      return new Intl.NumberFormat('fr-CG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        notation: 'compact',
        compactDisplay: 'short'
      }).format(value);
    } catch {
      return `${(value / 1000).toFixed(0)}K F`;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.famille}</p>
          <p className="text-sm">Valeur: {formatPrice(data.valeur)}</p>
          <p className="text-sm text-muted-foreground">
            {data.quantite.toLocaleString()} unités • {data.nb_produits} produits
          </p>
          <p className="text-sm text-muted-foreground">
            {data.pourcentage.toFixed(1)}% du stock total
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valorisation par Famille</CardTitle>
          <CardDescription>Aucune donnée disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Aucune famille de produits trouvée
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valorisation par Famille</CardTitle>
        <CardDescription>Top {data.length} familles par valeur de stock</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" tickFormatter={formatPrice} className="text-xs" />
            <YAxis 
              type="category" 
              dataKey="famille" 
              width={90}
              className="text-xs"
              tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="valeur" fill="hsl(var(--primary))" name="Valeur du stock" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ValorizationByFamilyChart;
