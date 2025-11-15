import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Printer, 
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  AlertTriangle
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CashReportProps {
  sessionId: string;
  report: any; // Type will come from useCashRegister hook
}

const CashReport = ({ sessionId, report }: CashReportProps) => {
  const { formatPrice } = useCurrency();

  if (!report) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Rapport non disponible pour cette session</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { session, movements, summary } = report;
  
  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <DollarSign className="h-4 w-4 text-muted-foreground" />;
  };

  const getMovementTypeLabel = (type: string) => {
    const typeLabels = {
      'entree': 'Entrée',
      'sortie': 'Sortie',
      'vente': 'Vente',
      'remboursement': 'Remboursement',
      'depense': 'Dépense'
    };
    return typeLabels[type] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const typeColors = {
      'entree': 'bg-green-100 text-green-800',
      'sortie': 'bg-red-100 text-red-800',
      'vente': 'bg-blue-100 text-blue-800',
      'remboursement': 'bg-orange-100 text-orange-800',
      'depense': 'bg-purple-100 text-purple-800'
    };
    return typeColors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* En-tête du rapport */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rapport de Caisse - Session #{session.numero_session}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Informations
              </p>
              <p className="font-semibold">Session #{session.numero_session}</p>
              <p className="text-sm">
                Agent: {session.caissier ? `${session.caissier.prenoms} ${session.caissier.noms}` : 'Non défini'}
              </p>
              <Badge variant="outline" className={
                session.statut === 'ouverte' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }>
                {session.statut === 'ouverte' ? 'Ouverte' : 'Fermée'}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Période
              </p>
              <p className="font-semibold">
                {format(new Date(session.date_ouverture), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </p>
              {session.date_fermeture && (
                <p className="text-sm">
                  au {format(new Date(session.date_fermeture), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                {getVarianceIcon(summary.variance)}
                Écart
              </p>
              <p className={`font-semibold text-lg ${getVarianceColor(summary.variance)}`}>
                {formatPrice(summary.variance)}
              </p>
              {Math.abs(summary.variance) > 1000 && (
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-xs">Écart significatif</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résumé financier */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé Financier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Montant d'ouverture</span>
                <span className="font-semibold">{formatPrice(summary.openingAmount)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">+ Ventes</span>
                <span className="font-semibold">{formatPrice(summary.totalSales)}</span>
              </div>
              
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">+ Entrées</span>
                <span className="font-semibold">{formatPrice(summary.totalEntries)}</span>
              </div>
              
              <div className="flex justify-between items-center text-red-600">
                <span className="text-sm">- Sorties</span>
                <span className="font-semibold">{formatPrice(summary.totalExits)}</span>
              </div>
              
              <div className="flex justify-between items-center text-red-600">
                <span className="text-sm">- Dépenses</span>
                <span className="font-semibold">{formatPrice(summary.totalExpenses)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center font-semibold">
                <span>Solde théorique</span>
                <span>{formatPrice(summary.theoreticalClosing)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Solde réel</span>
                <span className="font-semibold">{formatPrice(summary.actualClosing)}</span>
              </div>
              
              <Separator />
              
              <div className={`flex justify-between items-center font-semibold text-lg ${getVarianceColor(summary.variance)}`}>
                <span>Écart final</span>
                <span>{formatPrice(summary.variance)}</span>
              </div>
              
              {summary.variance !== 0 && summary.theoreticalClosing !== 0 && (
                <div className="text-xs text-muted-foreground">
                  {summary.variance > 0 ? 'Excédent' : 'Manquant'}: {Math.abs((summary.variance / summary.theoreticalClosing) * 100).toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détail des mouvements */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des Mouvements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {movements.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Aucun mouvement enregistré
              </p>
            ) : (
              movements.map((movement) => (
                <div 
                  key={movement.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-xs ${getMovementTypeColor(movement.type_mouvement)}`}>
                        {getMovementTypeLabel(movement.type_mouvement)}
                      </Badge>
                      <span className="font-medium">{movement.description}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(movement.date_mouvement), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      {movement.reference && ` - Réf: ${movement.reference}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      movement.montant >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.montant >= 0 ? '+' : ''}{formatPrice(movement.montant)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes de session */}
      {session.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes de Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{session.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CashReport;