import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface SalesEvolutionChartProps {
  data?: Array<{ date: string; sales: number; transactions: number }>;
}

const SalesEvolutionChart = ({ data = [] }: SalesEvolutionChartProps) => {
  const { formatAmount } = useCurrencyFormatting();

  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Évolution des ventes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'Ventes') return [formatAmount(value), name];
                return [value, name];
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="sales" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Ventes"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="transactions" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              name="Transactions"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SalesEvolutionChart;
