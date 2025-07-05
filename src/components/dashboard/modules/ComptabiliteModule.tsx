import React from 'react';
import ChartOfAccounts from './accounting/ChartOfAccounts';
import JournalManager from './accounting/JournalManager';
import InvoiceManager from './accounting/InvoiceManager';
import PaymentManager from './accounting/PaymentManager';
import FinancialReports from './accounting/FinancialReports';
import AnalyticalAccounting from './accounting/AnalyticalAccounting';
import FiscalManagement from './accounting/FiscalManagement';
import BankingIntegration from './accounting/BankingIntegration';

interface ComptabiliteModuleProps {
  activeSubModule: string;
}

const ComptabiliteModule = ({ activeSubModule }: ComptabiliteModuleProps) => {
  const renderContent = () => {
    switch (activeSubModule) {
      case 'plan comptable':
        return <ChartOfAccounts />;
      case 'journalisation':
        return <JournalManager />;
      case 'factures':
        return <InvoiceManager />;
      case 'paiements':
        return <PaymentManager />;
      case 'analytique':
        return <AnalyticalAccounting />;
      case 'fiscal':
        return <FiscalManagement />;
      case 'bancaire':
        return <BankingIntegration />;
      case 'rapports':
        return <FinancialReports />;
      case 'audit':
        return (
          <div className="space-y-6">
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Audit & Sécurité</h3>
              <p className="text-muted-foreground">Pistes d'audit et contrôles de sécurité</p>
              <p className="text-sm text-muted-foreground mt-2">Module en cours de développement</p>
            </div>
          </div>
        );
      case 'intégrations':
        return (
          <div className="space-y-6">
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Intégrations Système</h3>
              <p className="text-muted-foreground">Synchronisation modules et export FEC</p>
              <p className="text-sm text-muted-foreground mt-2">Module en cours de développement</p>
            </div>
          </div>
        );
      case 'tableaux de bord':
        return (
          <div className="space-y-6">
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Tableaux de Bord</h3>
              <p className="text-muted-foreground">Dashboard comptable et indicateurs clés</p>
              <p className="text-sm text-muted-foreground mt-2">Module en cours de développement</p>
            </div>
          </div>
        );
      case 'configuration':
        return (
          <div className="space-y-6">
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Configuration Comptable</h3>
              <p className="text-muted-foreground">Paramètres généraux et exercices comptables</p>
              <p className="text-sm text-muted-foreground mt-2">Module en cours de développement</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Plan Comptable</h3>
                <p className="text-sm text-muted-foreground">Structure OHADA des comptes</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Journalisation</h3>
                <p className="text-sm text-muted-foreground">Saisie et validation écritures</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">États Financiers</h3>
                <p className="text-sm text-muted-foreground">Bilan et compte de résultat</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Gestion Fiscale</h3>
                <p className="text-sm text-muted-foreground">TVA et déclarations</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Rapprochement</h3>
                <p className="text-sm text-muted-foreground">Synchronisation bancaire</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Analytique</h3>
                <p className="text-sm text-muted-foreground">Centres de coûts et marges</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Module Comptabilité</h2>
        <p className="text-muted-foreground">
          Gestion comptable complète conforme aux normes OHADA
        </p>
      </div>

      {renderContent()}
    </div>
  );
};

export default ComptabiliteModule;