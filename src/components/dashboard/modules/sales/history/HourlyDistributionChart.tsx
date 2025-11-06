import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';

interface HourlyDistributionChartProps {
  data?: Array<{ hour: string; sales: number; transactions: number }>;
}

const HourlyDistributionChart = ({ data = [] }: HourlyDistributionChartProps) => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Distribution horaire des ventes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'Ventes') return [`${value.toLocaleString()} FCFA`, name];
                return [value, name];
              }}
            />
            <Bar dataKey="transactions" fill="hsl(var(--chart-4))" name="Transactions" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default HourlyDistributionChart;
