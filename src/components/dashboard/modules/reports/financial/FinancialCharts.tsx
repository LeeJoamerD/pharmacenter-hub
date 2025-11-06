import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BalanceSheet, IncomeStatement, CashFlowStatement } from '@/types/financialReports';

interface FinancialChartsProps {
  balanceSheet: BalanceSheet | null;
  incomeStatement: IncomeStatement | null;
  cashFlowStatement: CashFlowStatement | null;
  formatAmount: (amount: number) => string;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const FinancialCharts: React.FC<FinancialChartsProps> = ({
  balanceSheet,
  incomeStatement,
  cashFlowStatement,
  formatAmount,
}) => {
  // Asset distribution data
  const assetDistributionData = balanceSheet ? [
    {
      name: 'Immobilisations',
      value: balanceSheet.actif.immobilise.reduce((sum, item) => sum + item.montant_n, 0),
    },
    {
      name: 'Actif Circulant',
      value: balanceSheet.actif.circulant.reduce((sum, item) => sum + item.montant_n, 0),
    },
    {
      name: 'Trésorerie',
      value: balanceSheet.actif.tresorerie.reduce((sum, item) => sum + item.montant_n, 0),
    },
  ].filter(item => item.value > 0) : [];

  // Result evolution data (N vs N-1)
  const resultEvolutionData = incomeStatement ? [
    {
      periode: 'Exploitation',
      resultat_n: incomeStatement.resultatExploitation,
      resultat_n_1: incomeStatement.resultatExploitation_n_1 || 0,
    },
    {
      periode: 'Financier',
      resultat_n: incomeStatement.resultatFinancier,
      resultat_n_1: incomeStatement.resultatFinancier_n_1 || 0,
    },
    {
      periode: 'Net',
      resultat_n: incomeStatement.resultatNet,
      resultat_n_1: incomeStatement.resultatNet_n_1 || 0,
    },
  ] : [];

  // Cash flow chart data
  const cashFlowChartData = cashFlowStatement ? [
    {
      type: 'Exploitation',
      montant: cashFlowStatement.fluxExploitation.total,
    },
    {
      type: 'Investissement',
      montant: cashFlowStatement.fluxInvestissement.total,
    },
    {
      type: 'Financement',
      montant: cashFlowStatement.fluxFinancement.total,
    },
  ] : [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Asset Distribution Pie Chart */}
      {assetDistributionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Répartition de l'Actif</CardTitle>
            <CardDescription>Distribution des éléments d'actif</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatAmount(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Result Evolution Bar Chart */}
      {resultEvolutionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Résultats</CardTitle>
            <CardDescription>Comparaison N vs N-1</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resultEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periode" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatAmount(value)} />
                <Legend />
                <Bar dataKey="resultat_n" fill="#8b5cf6" name="Exercice N" />
                <Bar dataKey="resultat_n_1" fill="#06b6d4" name="Exercice N-1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Cash Flow Area Chart */}
      {cashFlowChartData.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Flux de Trésorerie</CardTitle>
            <CardDescription>Analyse des flux par type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashFlowChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatAmount(value)} />
                <Legend />
                <Bar 
                  dataKey="montant" 
                  fill="#10b981" 
                  name="Montant" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialCharts;
