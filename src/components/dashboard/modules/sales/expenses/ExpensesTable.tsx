import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, Trash2, ArrowUpDown, Lock, Ban, Info } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import type { CashExpense, CashExpensePermissions } from '@/hooks/useCashExpenses';

interface ExpensesTableProps {
  expenses: CashExpense[];
  loading: boolean;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  getPermissions: (expense: CashExpense) => CashExpensePermissions;
  onEdit: (expense: CashExpense) => void;
  onCancel: (expense: CashExpense) => void;
}

const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenses,
  loading,
  sortField,
  sortDirection,
  onSortChange,
  getPermissions,
  onEdit,
  onCancel
}) => {
  const renderSortButton = (field: string, label: string) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSortChange(field)}
      className="-ml-3 h-8 data-[state=open]:bg-accent"
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Ban className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucune dépense trouvée</p>
        <p className="text-sm">Modifiez vos filtres ou attendez de nouvelles dépenses</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">
                {renderSortButton('date_mouvement', 'Date')}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead className="text-right">
                {renderSortButton('montant', 'Montant')}
              </TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              const permissions = getPermissions(expense);
              const isCancelled = expense.est_annule === true;
              const isSessionClosed = expense.session?.statut === 'Fermée';

              return (
                <TableRow 
                  key={expense.id} 
                  className={isCancelled ? 'opacity-60 bg-muted/30' : ''}
                >
                  <TableCell className="font-medium">
                    {expense.date_mouvement 
                      ? format(new Date(expense.date_mouvement), 'dd/MM/yyyy HH:mm', { locale: fr })
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={expense.description || '-'}>
                      {expense.description || '-'}
                    </div>
                    {expense.reference && (
                      <span className="text-xs text-muted-foreground">
                        Réf: {expense.reference}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {expense.motif || 'Non spécifié'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {expense.montant.toLocaleString('fr-FR')} FCFA
                  </TableCell>
                  <TableCell>
                    {expense.agent ? `${expense.agent.prenoms} ${expense.agent.noms}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isSessionClosed ? 'secondary' : 'default'}>
                      {isSessionClosed ? 'Fermée' : 'Ouverte'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isCancelled ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="destructive" className="cursor-help">
                            <Ban className="h-3 w-3 mr-1" />
                            Annulée
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm space-y-1">
                            <p><strong>Motif:</strong> {expense.motif_annulation || 'Non spécifié'}</p>
                            {expense.cancelled_by && (
                              <p><strong>Par:</strong> {expense.cancelled_by.prenoms} {expense.cancelled_by.noms}</p>
                            )}
                            {expense.date_annulation && (
                              <p><strong>Le:</strong> {format(new Date(expense.date_annulation), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {permissions.canEdit ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(expense)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Modifier</TooltipContent>
                        </Tooltip>
                      ) : (
                        !isCancelled && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Button variant="ghost" size="icon" disabled>
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isSessionClosed 
                                ? 'Session fermée - Modification impossible' 
                                : 'Vous n\'avez pas la permission de modifier'
                              }
                            </TooltipContent>
                          </Tooltip>
                        )
                      )}

                      {permissions.canDelete ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onCancel(expense)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Annuler cette dépense</TooltipContent>
                        </Tooltip>
                      ) : (
                        !isCancelled && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Button variant="ghost" size="icon" disabled>
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isSessionClosed 
                                ? 'Session fermée - Annulation impossible' 
                                : 'Vous n\'avez pas la permission d\'annuler'
                              }
                            </TooltipContent>
                          </Tooltip>
                        )
                      )}

                      {isCancelled && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Dépense déjà annulée</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};

export default ExpensesTable;
