import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MoreVertical, DollarSign, Lock, Unlock, Edit } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditAccount {
  id: string;
  nom_complet: string;
  telephone?: string;
  email?: string;
  type_client: string;
  limite_credit: number;
  credit_actuel: number;
  credit_disponible: number;
  statut: string | null;
  created_at: string;
  updated_at: string;
}

interface CreditAccountsTabProps {
  accounts: CreditAccount[];
  loading?: boolean;
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPayment: (account: CreditAccount) => void;
  onSuspend: (params: { client_id: string; action: 'suspend' | 'activate' }) => void;
  onAdjustLimit: (params: { client_id: string; nouvelle_limite: number; raison?: string }) => void;
  onViewDetails?: (account: CreditAccount) => void;
}

export const CreditAccountsTab = ({
  accounts,
  loading,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onPayment,
  onSuspend,
  onAdjustLimit,
  onViewDetails
}: CreditAccountsTabProps) => {
  const { formatPrice } = useCurrency();
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);

  const getStatusBadge = (statut: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      actif: { variant: "default", label: "Actif" },
      suspendu: { variant: "destructive", label: "Suspendu" },
      inactif: { variant: "secondary", label: "Inactif" },
      ferme: { variant: "outline", label: "Fermé" }
    };

    const status = variants[statut] || { variant: "outline" as const, label: statut };
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  const getCreditUtilization = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return (used / limit) * 100;
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-orange-600";
    return "text-green-600";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = !searchTerm || 
      account.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.telephone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || account.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comptes Crédit</CardTitle>
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou téléphone..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="suspendu">Suspendu</SelectItem>
              <SelectItem value="inactif">Inactif</SelectItem>
              <SelectItem value="ferme">Fermé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucun compte crédit trouvé</p>
            {searchTerm && (
              <p className="text-sm mt-2">Essayez de modifier votre recherche</p>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Limite</TableHead>
                  <TableHead className="text-right">Utilisé</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead>Utilisation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => {
                  const utilization = getCreditUtilization(account.credit_actuel, account.limite_credit);
                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{account.nom_complet}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {account.type_client}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {account.telephone && <div>{account.telephone}</div>}
                          {account.email && (
                            <div className="text-xs text-muted-foreground">{account.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(account.limite_credit)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(account.credit_actuel)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(account.credit_disponible)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                utilization >= 90
                                  ? "bg-red-600"
                                  : utilization >= 75
                                  ? "bg-orange-600"
                                  : "bg-green-600"
                              }`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${getUtilizationColor(utilization)}`}>
                            {utilization.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(account.statut)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {onViewDetails && (
                              <DropdownMenuItem onClick={() => onViewDetails(account)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onPayment(account)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Enregistrer paiement
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const newLimit = prompt(
                                `Nouvelle limite de crédit pour ${account.nom_complet} (actuelle: ${account.limite_credit} FCFA):`,
                                account.limite_credit.toString()
                              );
                              if (newLimit) {
                                const limite = parseFloat(newLimit);
                                if (!isNaN(limite) && limite >= account.credit_actuel) {
                                  const raison = prompt("Raison de l'ajustement (optionnel):");
                                  onAdjustLimit({ 
                                    client_id: account.id, 
                                    nouvelle_limite: limite,
                                    raison: raison || undefined
                                  });
                                } else {
                                  alert("La nouvelle limite doit être supérieure ou égale au crédit actuel");
                                }
                              }
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Ajuster limite
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {account.statut === 'actif' ? (
                              <DropdownMenuItem 
                                onClick={() => onSuspend({ client_id: account.id, action: 'suspend' })}
                                className="text-red-600"
                              >
                                <Lock className="h-4 w-4 mr-2" />
                                Suspendre compte
                              </DropdownMenuItem>
                            ) : account.statut === 'suspendu' ? (
                              <DropdownMenuItem 
                                onClick={() => onSuspend({ client_id: account.id, action: 'activate' })}
                                className="text-green-600"
                              >
                                <Unlock className="h-4 w-4 mr-2" />
                                Réactiver compte
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
