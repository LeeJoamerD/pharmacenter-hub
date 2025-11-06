import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subDays, subWeeks, subMonths, subQuarters, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SalesPeriod, DateRange, PeriodComparison } from '@/types/salesReports';

/**
 * Calcule les plages de dates pour une période donnée
 * @param period - La période sélectionnée
 * @returns Les plages de dates courante et précédente pour comparaison
 */
export function getDateRangeForPeriod(period: SalesPeriod): PeriodComparison {
  const now = new Date();
  
  switch (period) {
    case 'day':
      return {
        current: {
          startDate: startOfDay(now),
          endDate: endOfDay(now)
        },
        previous: {
          startDate: startOfDay(subDays(now, 1)),
          endDate: endOfDay(subDays(now, 1))
        }
      };
      
    case 'week':
      const weekStart = startOfWeek(now, { locale: fr, weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { locale: fr, weekStartsOn: 1 });
      return {
        current: {
          startDate: weekStart,
          endDate: weekEnd
        },
        previous: {
          startDate: startOfWeek(subWeeks(now, 1), { locale: fr, weekStartsOn: 1 }),
          endDate: endOfWeek(subWeeks(now, 1), { locale: fr, weekStartsOn: 1 })
        }
      };
      
    case 'month':
      return {
        current: {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        },
        previous: {
          startDate: startOfMonth(subMonths(now, 1)),
          endDate: endOfMonth(subMonths(now, 1))
        }
      };
      
    case 'quarter':
      return {
        current: {
          startDate: startOfQuarter(now),
          endDate: endOfQuarter(now)
        },
        previous: {
          startDate: startOfQuarter(subQuarters(now, 1)),
          endDate: endOfQuarter(subQuarters(now, 1))
        }
      };
      
    default:
      return getDateRangeForPeriod('day');
  }
}

/**
 * Formate une date pour l'affichage dans les graphiques
 */
export function formatDateForDisplay(date: Date | string, period: SalesPeriod): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (period) {
    case 'day':
      return format(d, 'HH:mm', { locale: fr });
    case 'week':
      return format(d, 'EEE dd', { locale: fr });
    case 'month':
      return format(d, 'dd/MM', { locale: fr });
    case 'quarter':
      return format(d, 'dd MMM', { locale: fr });
    default:
      return format(d, 'dd/MM', { locale: fr });
  }
}

/**
 * Formate une date pour les requêtes SQL
 */
export function formatDateForSQL(date: Date): string {
  return date.toISOString();
}

/**
 * Calcule le nombre de jours dans une période
 */
export function getDaysInPeriod(period: SalesPeriod): number {
  switch (period) {
    case 'day':
      return 1;
    case 'week':
      return 7;
    case 'month':
      return 30;
    case 'quarter':
      return 90;
    default:
      return 1;
  }
}
