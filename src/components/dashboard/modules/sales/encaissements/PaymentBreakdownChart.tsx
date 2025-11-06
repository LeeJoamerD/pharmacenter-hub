import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DollarSign, CreditCard, Smartphone, Building2 } from 'lucide-react';

interface PaymentBreakdownChartProps {
  breakdown: {
    especes: number;
    carte: number;
    mobile: number;
    assurance: number;
  };
}

const PaymentBreakdownChart = ({ breakdown }: PaymentBreakdownChartProps) => {
  const data = [
    {
      name: 'Espèces',
      value: breakdown.especes,
      color: 'hsl(var(--chart-1))',
      icon: DollarSign,
    },
    {
      name: 'Carte Bancaire',
      value: breakdown.carte,
      color: 'hsl(var(--chart-2))',
      icon: CreditCard,
    },
    {
      name: 'Mobile Money',
      value: breakdown.mobile,
      color: 'hsl(var(--chart-3))',
      icon: Smartphone,
    },
    {
      name: 'Assurance',
      value: breakdown.assurance,
      color: 'hsl(var(--chart-4))',
      icon: Building2,
    },
  ].filter((item) => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('fr-CG')} FCFA`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)}
          </p>
          <p className="text-sm font-medium text-primary">
            {((data.value / total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Mode de Paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Aucune transaction aujourd'hui
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par Mode de Paiement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Graphique */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Légende détaillée */}
          <div className="space-y-4">
            {data.map((item) => {
              const Icon = item.icon;
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {formatCurrency(item.value)}
                    </p>
                    <p className="text-sm text-muted-foreground">{percentage}%</p>
                  </div>
                </div>
              );
            })}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentBreakdownChart;
