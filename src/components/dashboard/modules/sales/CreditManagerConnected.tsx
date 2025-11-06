import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign } from "lucide-react";
import { useCreditManager } from "@/hooks/useCreditManager";
import { CreditStatisticsCards } from "./credit/CreditStatisticsCards";
import { CreditAccountsTab } from "./credit/CreditAccountsTab";
import { CreditTransactionsTab } from "./credit/CreditTransactionsTab";
import { PaymentSchedulesTab } from "./credit/PaymentSchedulesTab";
import { CreditAlertsTab } from "./credit/CreditAlertsTab";
import { CreditReportsTab } from "./credit/CreditReportsTab";
import { CreateCreditAccountDialog } from "./credit/CreateCreditAccountDialog";
import { RecordPaymentDialog } from "./credit/RecordPaymentDialog";

export const CreditManagerConnected = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const {
    creditAccounts,
    creditAccountsLoading,
    creditStats,
    creditTransactions,
    transactionsLoading,
    paymentSchedules,
    schedulesLoading,
    upcomingPayments,
    overduePayments,
    createCreditAccount,
    recordPayment,
    suspendAccount,
    adjustCreditLimit,
    sendReminder
  } = useCreditManager({ search: searchTerm, statut: statusFilter });

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion du Crédit</h1>
          <p className="text-muted-foreground">
            Gérer les comptes crédit clients et les échéanciers de paiement
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsNewAccountOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Compte
          </Button>
          <Button onClick={() => setIsPaymentModalOpen(true)} variant="outline">
            <DollarSign className="h-4 w-4 mr-2" />
            Enregistrer Paiement
          </Button>
        </div>
      </div>

      {/* Métriques KPI */}
      <CreditStatisticsCards stats={creditStats} loading={creditAccountsLoading} />

      {/* Onglets */}
      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Comptes Crédit</TabsTrigger>
          <TabsTrigger value="transactions">Historique</TabsTrigger>
          <TabsTrigger value="schedules">Échéanciers</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <CreditAccountsTab
            accounts={creditAccounts}
            loading={creditAccountsLoading}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            onSearchChange={setSearchTerm}
            onStatusChange={setStatusFilter}
            onPayment={(account) => {
              setSelectedAccount(account);
              setIsPaymentModalOpen(true);
            }}
            onSuspend={suspendAccount.mutate}
            onAdjustLimit={adjustCreditLimit.mutate}
          />
        </TabsContent>

        <TabsContent value="transactions">
          <CreditTransactionsTab
            transactions={creditTransactions}
            loading={transactionsLoading}
          />
        </TabsContent>

        <TabsContent value="schedules">
          <PaymentSchedulesTab
            schedules={paymentSchedules}
            upcomingPayments={upcomingPayments}
            loading={schedulesLoading}
          />
        </TabsContent>

        <TabsContent value="alerts">
          <CreditAlertsTab
            overduePayments={overduePayments}
          />
        </TabsContent>

        <TabsContent value="reports">
          <CreditReportsTab />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateCreditAccountDialog
        open={isNewAccountOpen}
        onOpenChange={setIsNewAccountOpen}
        onSubmit={createCreditAccount.mutate}
      />

      <RecordPaymentDialog
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        selectedAccount={selectedAccount}
        onSubmit={recordPayment.mutate}
      />
    </div>
  );
};
