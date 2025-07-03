import { useState, useCallback } from 'react';

export interface CashSession {
  id: number;
  cashRegisterId: number;
  agentId: number;
  openingDate: Date;
  closingDate?: Date;
  openingAmount: number;
  closingAmount?: number;
  status: 'Ouverte' | 'Fermée';
  expectedRevenue?: number;
  variance?: number;
  notes?: string;
}

export interface CashMovement {
  id: number;
  sessionId: number;
  type: 'deposit' | 'withdrawal' | 'expense' | 'sale';
  amount: number;
  description: string;
  timestamp: Date;
  reference?: string;
}

export interface CashExpense {
  id: number;
  sessionId: number;
  amount: number;
  description: string;
  category: string;
  timestamp: Date;
  receipt?: string;
}

const useCashRegister = () => {
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [expenses, setExpenses] = useState<CashExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ouvrir une session de caisse
  const openSession = useCallback(async (
    cashRegisterId: number, 
    agentId: number, 
    openingAmount: number
  ) => {
    setLoading(true);
    try {
      const newSession: CashSession = {
        id: Date.now(),
        cashRegisterId,
        agentId,
        openingDate: new Date(),
        openingAmount,
        status: 'Ouverte'
      };

      setCurrentSession(newSession);
      setSessions(prev => [...prev, newSession]);
      
      // Enregistrer le mouvement d'ouverture
      const openingMovement: CashMovement = {
        id: Date.now(),
        sessionId: newSession.id,
        type: 'deposit',
        amount: openingAmount,
        description: 'Ouverture de caisse',
        timestamp: new Date()
      };
      
      setMovements(prev => [...prev, openingMovement]);
      
      return newSession;
    } catch (err) {
      setError('Erreur lors de l\'ouverture de la session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fermer une session de caisse
  const closeSession = useCallback(async (
    sessionId: number,
    closingAmount: number,
    notes?: string
  ) => {
    setLoading(true);
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session non trouvée');
      }

      // Calculer les revenus attendus basés sur les ventes
      const salesMovements = movements.filter(
        m => m.sessionId === sessionId && m.type === 'sale'
      );
      const expectedRevenue = session.openingAmount + 
        salesMovements.reduce((total, m) => total + m.amount, 0);

      const variance = closingAmount - expectedRevenue;

      const updatedSession: CashSession = {
        ...session,
        closingDate: new Date(),
        closingAmount,
        status: 'Fermée',
        expectedRevenue,
        variance,
        notes
      };

      setSessions(prev => 
        prev.map(s => s.id === sessionId ? updatedSession : s)
      );

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }

      return updatedSession;
    } catch (err) {
      setError('Erreur lors de la fermeture de la session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessions, movements, currentSession]);

  // Enregistrer un mouvement de caisse
  const recordMovement = useCallback(async (
    sessionId: number,
    type: CashMovement['type'],
    amount: number,
    description: string,
    reference?: string
  ) => {
    try {
      const movement: CashMovement = {
        id: Date.now(),
        sessionId,
        type,
        amount,
        description,
        timestamp: new Date(),
        reference
      };

      setMovements(prev => [...prev, movement]);
      return movement;
    } catch (err) {
      setError('Erreur lors de l\'enregistrement du mouvement');
      throw err;
    }
  }, []);

  // Enregistrer une dépense de caisse
  const recordExpense = useCallback(async (
    sessionId: number,
    amount: number,
    description: string,
    category: string,
    receipt?: string
  ) => {
    try {
      const expense: CashExpense = {
        id: Date.now(),
        sessionId,
        amount,
        description,
        category,
        timestamp: new Date(),
        receipt
      };

      setExpenses(prev => [...prev, expense]);

      // Enregistrer aussi comme mouvement
      await recordMovement(sessionId, 'expense', -amount, `Dépense: ${description}`);

      return expense;
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de la dépense');
      throw err;
    }
  }, [recordMovement]);

  // Calculer le solde actuel d'une session
  const getSessionBalance = useCallback((sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return 0;

    const sessionMovements = movements.filter(m => m.sessionId === sessionId);
    return session.openingAmount + 
      sessionMovements.reduce((total, m) => total + m.amount, 0);
  }, [sessions, movements]);

  // Obtenir le rapport de caisse pour une session
  const getSessionReport = useCallback((sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return null;

    const sessionMovements = movements.filter(m => m.sessionId === sessionId);
    const sessionExpenses = expenses.filter(e => e.sessionId === sessionId);

    const totalSales = sessionMovements
      .filter(m => m.type === 'sale')
      .reduce((total, m) => total + m.amount, 0);

    const totalExpenses = sessionExpenses
      .reduce((total, e) => total + e.amount, 0);

    const totalDeposits = sessionMovements
      .filter(m => m.type === 'deposit')
      .reduce((total, m) => total + m.amount, 0);

    const totalWithdrawals = sessionMovements
      .filter(m => m.type === 'withdrawal')
      .reduce((total, m) => total + m.amount, 0);

    return {
      session,
      movements: sessionMovements,
      expenses: sessionExpenses,
      summary: {
        openingAmount: session.openingAmount,
        totalSales,
        totalExpenses,
        totalDeposits,
        totalWithdrawals,
        expectedClosing: session.openingAmount + totalSales + totalDeposits - totalWithdrawals - totalExpenses,
        actualClosing: session.closingAmount || 0,
        variance: session.variance || 0
      }
    };
  }, [sessions, movements, expenses]);

  return {
    currentSession,
    sessions,
    movements,
    expenses,
    loading,
    error,
    openSession,
    closeSession,
    recordMovement,
    recordExpense,
    getSessionBalance,
    getSessionReport
  };
};

export default useCashRegister;