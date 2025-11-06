import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';

interface CashierPerformanceChartProps {
  data?: Array<{ name: string; sales: number; count: number }>;
}

const CashierPerformanceChart = ({ data = [] }: CashierPerformanceChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Performance des caissiers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'Ventes') return [`${value.toLocaleString()} FCFA`, name];
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="sales" fill="hsl(var(--primary))" name="Ventes" />
            <Bar dataKey="count" fill="hsl(var(--chart-2))" name="Transactions" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CashierPerformanceChart;
