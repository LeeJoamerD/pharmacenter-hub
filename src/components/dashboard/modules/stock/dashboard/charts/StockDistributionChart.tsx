import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface StockDistributionChartProps {
  statusDistribution?: {
    rupture: number;
    critique: number;
    faible: number;
    normal: number;
    surstock: number;
    total: number;
  };
}

const StockDistributionChart = ({ statusDistribution }: StockDistributionChartProps) => {
  if (!statusDistribution) return null;

  const data = [
    { name: 'Normal', value: statusDistribution.normal, color: 'hsl(var(--success))' },
    { name: 'Surstock', value: statusDistribution.surstock, color: 'hsl(var(--info))' },
    { name: 'Faible', value: statusDistribution.faible, color: 'hsl(var(--warning))' },
    { name: 'Critique', value: statusDistribution.critique, color: 'hsl(var(--destructive))' },
    { name: 'Rupture', value: statusDistribution.rupture, color: 'hsl(var(--muted-foreground))' },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / statusDistribution.total) * 100).toFixed(1);
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} produits ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution du Stock</CardTitle>
        <CardDescription>Répartition par statut ({statusDistribution.total} produits)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default StockDistributionChart;
