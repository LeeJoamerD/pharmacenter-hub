import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  DollarSign, 
  User, 
  FileText,
  AlertTriangle,
  CheckCircle,
  Calculator
} from 'lucide-react';
import { CashSession } from '@/hooks/useCashRegister';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CashSessionListProps {
  sessions: CashSession[];
  onSelectSession: (sessionId: string) => void;
  onViewReport: (sessionId: string) => void;
}

const CashSessionList = ({ sessions, onSelectSession, onViewReport }: CashSessionListProps) => {
  const { formatPrice } = useCurrency();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ouverte':
        return <Clock className="h-4 w-4 text-green-600" />;
      case 'fermee':
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ouverte':
        return 'bg-green-100 text-green-800';
      case 'fermee':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ouverte':
        return 'Ouverte';
      case 'fermee':
        return 'Fermée';
      default:
        return status;
    }
  };

  const getVarianceColor = (variance?: number) => {
    if (!variance) return 'text-muted-foreground';
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune session de caisse trouvée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Sessions de Caisse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div 
              key={session.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(session.statut)}
                    <h4 className="font-medium">
                      Session #{session.numero_session}
                    </h4>
                  </div>
                  <Badge variant="outline" className={getStatusColor(session.statut)}>
                    {getStatusLabel(session.statut)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onViewReport(session.id)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Rapport
                  </Button>
                  {session.statut === 'ouverte' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onSelectSession(session.id)}
                    >
                      Fermer
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Ouverture
                  </p>
                  <p className="font-semibold">{formatPrice(session.montant_ouverture)}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(session.date_ouverture), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                </div>

                {session.statut === 'fermee' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Fermeture
                      </p>
                      <p className="font-semibold">{formatPrice(session.montant_fermeture || 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.date_fermeture && format(new Date(session.date_fermeture), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Écart</p>
                      <p className={`font-semibold ${getVarianceColor(session.ecart)}`}>
                        {session.ecart !== undefined ? formatPrice(session.ecart) : '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Théorique: {formatPrice(session.montant_theorique || 0)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Agent
                      </p>
                      <p className="font-semibold">{session.agent_id}</p>
                      <p className="text-xs text-muted-foreground">
                        Durée: {session.date_fermeture ? Math.round((new Date(session.date_fermeture).getTime() - new Date(session.date_ouverture).getTime()) / (1000 * 60 * 60)) : 0}h
                      </p>
                    </div>
                  </>
                )}

                {session.statut === 'ouverte' && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Agent: {session.agent_id} - En cours
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ouverte depuis {Math.round((new Date().getTime() - new Date(session.date_ouverture).getTime()) / (1000 * 60 * 60))}h
                    </p>
                  </div>
                )}
              </div>

              {session.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Notes:</p>
                  <p className="text-sm">{session.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CashSessionList;