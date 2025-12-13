import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { RotationChartData } from '@/services/StockRotationService';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface StockRotationChartProps {
  data: RotationChartData[];
}

const StockRotationChart: React.FC<StockRotationChartProps> = ({ data }) => {
  const { formatAmount } = useCurrencyFormatting();
  const getStatusColor = (statut: RotationChartData['statut']) => {
    switch (statut) {
      case 'excellent': return 'hsl(142, 76%, 36%)'; // Green
      case 'bon': return 'hsl(221, 83%, 53%)'; // Blue
      case 'moyen': return 'hsl(45, 93%, 47%)'; // Yellow
      case 'faible': return 'hsl(25, 95%, 53%)'; // Orange
      case 'critique': return 'hsl(0, 84%, 60%)'; // Red
      default: return 'hsl(var(--muted))';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{data.categorie}</p>
          <div className="space-y-1 text-xs">
            <p>
              <span className="text-muted-foreground">Taux rotation:</span>{' '}
              <span className="font-bold">{data.tauxRotation.toFixed(2)}/an</span>
            </p>
            <p>
              <span className="text-muted-foreground">Durée écoulement:</span>{' '}
              <span className="font-bold">{data.dureeEcoulement} jours</span>
            </p>
            <p>
              <span className="text-muted-foreground">Valeur stock:</span>{' '}
              <span className="font-bold">{formatAmount(data.valeurStock)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Statut:</span>{' '}
              <span className={`font-bold capitalize ${
                data.statut === 'excellent' ? 'text-green-600' :
                data.statut === 'bon' ? 'text-blue-600' :
                data.statut === 'moyen' ? 'text-yellow-600' :
                data.statut === 'faible' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {data.statut}
              </span>
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
          <CardTitle>Rotation des Stocks</CardTitle>
          <CardDescription>Vitesse de rotation par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Aucune donnée de rotation disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rotation des Stocks</CardTitle>
        <CardDescription>
          Taux de rotation annuel par catégorie (Top 15)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              type="category" 
              dataKey="categorie" 
              width={150}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="tauxRotation" 
              name="Taux de rotation (fois/an)"
              radius={[0, 4, 4, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.statut)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Légende des statuts */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }} />
            <span>Excellent (&gt;10)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(221, 83%, 53%)' }} />
            <span>Bon (6-10)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(45, 93%, 47%)' }} />
            <span>Moyen (3-6)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(25, 95%, 53%)' }} />
            <span>Faible (1-3)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }} />
            <span>Critique (&lt;1)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockRotationChart;
