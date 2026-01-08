import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileCode,
  Send
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PharmaMLTransmission {
  id: string;
  commande_id: string;
  fournisseur_id: string;
  xml_envoye: string | null;
  xml_reponse: string | null;
  statut: string;
  code_erreur: string | null;
  message: string | null;
  numero_commande_pharmaml: string | null;
  duree_ms: number | null;
  created_at: string;
  // Joined data
  fournisseur?: { nom: string };
}

interface PharmaMLHistoryProps {
  orderId?: string;
  supplierId?: string;
}

const PharmaMLHistory: React.FC<PharmaMLHistoryProps> = ({ orderId, supplierId }) => {
  const { t } = useLanguage();
  const [transmissions, setTransmissions] = useState<PharmaMLTransmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransmission, setSelectedTransmission] = useState<PharmaMLTransmission | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchTransmissions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pharmaml_transmissions')
        .select(`
          *,
          fournisseur:fournisseurs(nom)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (orderId) {
        query = query.eq('commande_id', orderId);
      }
      if (supplierId) {
        query = query.eq('fournisseur_id', supplierId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransmissions((data as unknown as PharmaMLTransmission[]) || []);
    } catch (error) {
      console.error('Error fetching transmissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransmissions();
  }, [orderId, supplierId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {t('pharmamlHistorySuccess')}
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {t('pharmamlHistoryError')}
          </Badge>
        );
      case 'timeout':
        return (
          <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {t('pharmamlHistoryTimeout')}
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t('pharmamlHistoryPending')}
          </Badge>
        );
    }
  };

  const handleViewDetails = (transmission: PharmaMLTransmission) => {
    setSelectedTransmission(transmission);
    setIsDetailsOpen(true);
  };

  const formatXml = (xml: string | null): string => {
    if (!xml) return '';
    try {
      // Simple XML formatting
      let formatted = '';
      let indent = 0;
      const lines = xml.replace(/>\s*</g, '>\n<').split('\n');
      
      lines.forEach(line => {
        if (line.match(/^<\/\w/)) indent--;
        formatted += '  '.repeat(Math.max(0, indent)) + line.trim() + '\n';
        if (line.match(/^<\w[^>]*[^\/]>/) && !line.match(/^<\?/)) indent++;
      });
      
      return formatted.trim();
    } catch {
      return xml;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t('pharmamlHistoryTitle')}
            </CardTitle>
            <CardDescription>
              {t('pharmamlHistoryDesc')}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTransmissions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            {t('loading')}
          </div>
        ) : transmissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('pharmamlHistoryEmpty')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('pharmamlHistoryDate')}</TableHead>
                <TableHead>{t('pharmamlHistoryOrderNumber')}</TableHead>
                <TableHead>{t('pharmamlHistorySupplier')}</TableHead>
                <TableHead>{t('pharmamlHistoryStatus')}</TableHead>
                <TableHead>{t('pharmamlHistoryDuration')}</TableHead>
                <TableHead>{t('pharmamlHistoryActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transmissions.map((transmission) => (
                <TableRow key={transmission.id}>
                  <TableCell>
                    {format(new Date(transmission.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {transmission.numero_commande_pharmaml || '-'}
                  </TableCell>
                  <TableCell>
                    {transmission.fournisseur?.nom || '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transmission.statut)}
                  </TableCell>
                  <TableCell>
                    {transmission.duree_ms ? `${transmission.duree_ms}ms` : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(transmission)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Dialog pour les détails */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                {t('pharmamlHistoryDetails')}
              </DialogTitle>
              <DialogDescription>
                {selectedTransmission?.numero_commande_pharmaml} - 
                {selectedTransmission && format(new Date(selectedTransmission.created_at), ' dd/MM/yyyy HH:mm:ss', { locale: fr })}
              </DialogDescription>
            </DialogHeader>
            
            {selectedTransmission && (
              <div className="space-y-4">
                {/* Informations générales */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>{t('pharmamlHistoryStatus')}:</strong>{' '}
                    {getStatusBadge(selectedTransmission.statut)}
                  </div>
                  <div>
                    <strong>{t('pharmamlHistoryDuration')}:</strong>{' '}
                    {selectedTransmission.duree_ms ? `${selectedTransmission.duree_ms}ms` : '-'}
                  </div>
                  {selectedTransmission.message && (
                    <div className="col-span-2">
                      <strong>{t('pharmamlHistoryMessage')}:</strong>{' '}
                      {selectedTransmission.message}
                    </div>
                  )}
                  {selectedTransmission.code_erreur && (
                    <div className="col-span-2">
                      <strong>{t('pharmamlHistoryErrorCode')}:</strong>{' '}
                      <Badge variant="destructive">{selectedTransmission.code_erreur}</Badge>
                    </div>
                  )}
                </div>

                {/* XML Tabs */}
                <Tabs defaultValue="sent" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sent">{t('pharmamlHistoryXmlSent')}</TabsTrigger>
                    <TabsTrigger value="response">{t('pharmamlHistoryXmlResponse')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="sent">
                    <ScrollArea className="h-[300px] w-full rounded-md border bg-muted/50 p-4">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {formatXml(selectedTransmission.xml_envoye)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="response">
                    <ScrollArea className="h-[300px] w-full rounded-md border bg-muted/50 p-4">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {selectedTransmission.xml_reponse 
                          ? formatXml(selectedTransmission.xml_reponse)
                          : t('pharmamlHistoryNoResponse')}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PharmaMLHistory;
