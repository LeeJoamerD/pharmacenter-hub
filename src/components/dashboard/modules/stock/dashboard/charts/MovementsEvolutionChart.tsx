import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface MovementData {
  date: string;
  entrees: number;
  sorties: number;
  solde: number;
}

interface MovementsEvolutionChartProps {
  data: MovementData[];
}

const MovementsEvolutionChart = ({ data }: MovementsEvolutionChartProps) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{format(new Date(label), 'dd MMMM yyyy', { locale: fr })}</p>
          <div className="space-y-1">
            <p className="text-sm text-green-600">
              Entrées: {payload[0].value.toLocaleString()}
            </p>
            <p className="text-sm text-red-600">
              Sorties: {payload[1].value.toLocaleString()}
            </p>
            <p className="text-sm font-semibold">
              Solde: {payload[2].value.toLocaleString()}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution des Mouvements</CardTitle>
          <CardDescription>Aucune donnée disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Aucun mouvement de stock enregistré
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution des Mouvements</CardTitle>
        <CardDescription>Entrées et sorties sur les {data.length} derniers jours</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: fr })}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="entrees" 
              stroke="hsl(var(--success))" 
              strokeWidth={2}
              name="Entrées"
              dot={{ fill: 'hsl(var(--success))' }}
            />
            <Line 
              type="monotone" 
              dataKey="sorties" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              name="Sorties"
              dot={{ fill: 'hsl(var(--destructive))' }}
            />
            <Line 
              type="monotone" 
              dataKey="solde" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Solde"
              dot={{ fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MovementsEvolutionChart;
