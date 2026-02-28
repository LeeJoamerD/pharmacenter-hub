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
  Calculator,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CashSessionSearchResult } from '@/hooks/useCashSessionSearch';

interface CashSessionListProps {
  sessions: CashSessionSearchResult[];
  totalCount: number;
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onSelectSession: (sessionId: string) => void;
  onViewReport: (sessionId: string) => void;
}

const CashSessionList = ({ sessions, totalCount, page, totalPages, loading, onPageChange, onSelectSession, onViewReport }: CashSessionListProps) => {
  const { formatPrice } = useCurrency();

  const getCaissierName = (session: CashSessionSearchResult): string => {
    if (session.caissier_prenoms || session.caissier_noms) {
      return `${session.caissier_prenoms || ''} ${session.caissier_noms || ''}`.trim();
    }
    return session.caissier_id || 'Agent non défini';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ouverte': return <Clock className="h-4 w-4 text-green-600" />;
      case 'Fermée': return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ouverte': return 'bg-green-100 text-green-800';
      case 'Fermée': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getVarianceColor = (variance?: number) => {
    if (!variance) return 'text-muted-foreground';
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  if (!loading && sessions.length === 0) {
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
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Sessions de Caisse
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {totalCount} résultat(s)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : (
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
                      <h4 className="font-medium">Session #{session.numero_session}</h4>
                    </div>
                    <Badge variant="outline" className={getStatusColor(session.statut)}>
                      {session.statut}
                    </Badge>
                    {session.type_session && (
                      <Badge variant="secondary">{session.type_session}</Badge>
                    )}
                    {session.caisse_nom && (
                      <Badge variant="outline">{session.caisse_nom}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewReport(session.id)}>
                      <FileText className="h-4 w-4 mr-1" />
                      Rapport
                    </Button>
                    {session.statut === 'Ouverte' && (
                      <Button variant="outline" size="sm" onClick={() => onSelectSession(session.id)}>
                        Fermer
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Ouverture
                    </p>
                    <p className="font-semibold">{formatPrice(session.fond_caisse_ouverture)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(session.date_ouverture), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </p>
                  </div>

                  {session.statut === 'Fermée' && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Fermeture
                        </p>
                        <p className="font-semibold">{formatPrice(session.montant_reel_fermeture || 0)}</p>
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
                          Théorique: {formatPrice(session.montant_theorique_fermeture || 0)}
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Agent
                    </p>
                    <p className="font-semibold">{getCaissierName(session)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CashSessionList;
