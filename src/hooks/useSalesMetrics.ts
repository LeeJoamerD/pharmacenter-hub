import { useState, useEffect } from 'react';

export interface SalesMetrics {
  dailyRevenue: number;
  dailyTransactions: number;
  averageBasket: number;
  monthlyProgress: number;
  monthlyTarget: number;
  pendingInvoices: number;
  cashRegisters: CashRegister[];
}

export interface CashRegister {
  id: number;
  name: string;
  status: 'open' | 'closed';
  currentAmount: number;
  openedAt?: Date;
  lastTransaction?: Date;
}

export interface RecentTransaction {
  id: number;
  invoice_number: string;
  customer_name: string;
  amount: number;
  timestamp: Date;
  payment_type: string;
}

const useSalesMetrics = () => {
  const [metrics, setMetrics] = useState<SalesMetrics>({
    dailyRevenue: 45250,
    dailyTransactions: 156,
    averageBasket: 2890,
    monthlyProgress: 68,
    monthlyTarget: 1000000,
    pendingInvoices: 3,
    cashRegisters: [
      {
        id: 1,
        name: 'Caisse 1 - Principal',
        status: 'open',
        currentAmount: 45250,
        openedAt: new Date('2024-01-15T08:00:00'),
        lastTransaction: new Date()
      },
      {
        id: 2,
        name: 'Caisse 2 - Secondaire',
        status: 'closed',
        currentAmount: 0
      }
    ]
  });

  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([
    {
      id: 1,
      invoice_number: 'VT-2024-001',
      customer_name: 'Client Ordinaire',
      amount: 12500,
      timestamp: new Date('2024-01-15T14:35:00'),
      payment_type: 'Espèces'
    },
    {
      id: 2,
      invoice_number: 'VT-2024-002',
      customer_name: 'Jean Dupont',
      amount: 8750,
      timestamp: new Date('2024-01-15T14:28:00'),
      payment_type: 'Carte'
    },
    {
      id: 3,
      invoice_number: 'VT-2024-003',
      customer_name: 'Marie Kouakou',
      amount: 15200,
      timestamp: new Date('2024-01-15T14:15:00'),
      payment_type: 'Mobile Money'
    },
    {
      id: 4,
      invoice_number: 'VT-2024-004',
      customer_name: 'Client Assuré',
      amount: 22100,
      timestamp: new Date('2024-01-15T14:08:00'),
      payment_type: 'Assureur'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulation de rafraîchissement des données
  const refreshMetrics = async () => {
    setLoading(true);
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mise à jour simulée des métriques
      setMetrics(prev => ({
        ...prev,
        dailyRevenue: prev.dailyRevenue + Math.floor(Math.random() * 5000),
        dailyTransactions: prev.dailyTransactions + Math.floor(Math.random() * 10)
      }));
    } catch (err) {
      setError('Erreur lors du rafraîchissement des métriques');
    } finally {
      setLoading(false);
    }
  };

  // Calcul des métriques dérivées
  const calculatedMetrics = {
    ...metrics,
    monthlyRevenue: Math.floor(metrics.monthlyTarget * (metrics.monthlyProgress / 100)),
    averageBasket: metrics.dailyTransactions > 0 ? Math.floor(metrics.dailyRevenue / metrics.dailyTransactions) : 0,
    activeCashRegisters: metrics.cashRegisters.filter(cr => cr.status === 'open').length,
    totalCashAmount: metrics.cashRegisters.reduce((total, cr) => total + cr.currentAmount, 0)
  };

  return {
    metrics: calculatedMetrics,
    recentTransactions,
    loading,
    error,
    refreshMetrics
  };
};

export default useSalesMetrics;