import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  LineChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart as BarChartIcon, 
  TrendingUp, 
  Send, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { MultichannelConnector, ChannelAnalytics } from '@/hooks/useNetworkMultichannel';
import { exportAnalyticsToExcel, exportAnalyticsToPDF } from '@/utils/multichannelExportUtils';

interface ChannelAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connector: MultichannelConnector | null;
  analytics: ChannelAnalytics[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const ChannelAnalyticsDialog: React.FC<ChannelAnalyticsDialogProps> = ({
  open,
  onOpenChange,
  connector,
  analytics
}) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  // Filter analytics for this connector
  const connectorAnalytics = analytics.filter(a => a.connector_id === connector?.id);

  // Generate mock trend data if no real analytics
  const trendData = connectorAnalytics.length > 0
    ? connectorAnalytics.map(a => ({
        date: format(new Date(a.period_start), 'dd/MM', { locale: fr }),
        envoyés: a.messages_sent,
        reçus: a.messages_received,
        livrés: a.messages_delivered,
        échoués: a.messages_failed
      }))
    : [
        { date: 'Lun', envoyés: 45, reçus: 38, livrés: 43, échoués: 2 },
        { date: 'Mar', envoyés: 52, reçus: 45, livrés: 50, échoués: 2 },
        { date: 'Mer', envoyés: 38, reçus: 32, livrés: 36, échoués: 2 },
        { date: 'Jeu', envoyés: 65, reçus: 58, livrés: 62, échoués: 3 },
        { date: 'Ven', envoyés: 48, reçus: 42, livrés: 46, échoués: 2 },
        { date: 'Sam', envoyés: 22, reçus: 18, livrés: 21, échoués: 1 },
        { date: 'Dim', envoyés: 15, reçus: 12, livrés: 14, échoués: 1 }
      ];

  const pieData = connector ? [
    { name: 'Livrés', value: Math.round(connector.messages_sent * (connector.response_rate / 100)) },
    { name: 'En attente', value: Math.round(connector.messages_sent * 0.1) },
    { name: 'Échoués', value: Math.round(connector.messages_sent * 0.05) }
  ] : [];

  const handleExport = (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      exportAnalyticsToExcel(connectorAnalytics);
    } else {
      exportAnalyticsToPDF(connectorAnalytics);
    }
  };

  if (!connector) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChartIcon className="h-5 w-5 text-primary" />
            Analytics - {connector.name}
          </DialogTitle>
          <DialogDescription>
            Statistiques et performances du canal {connector.channel_type.toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Envoyés</span>
              </div>
              <p className="text-2xl font-bold mt-1">{connector.messages_sent.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Reçus</span>
              </div>
              <p className="text-2xl font-bold mt-1">{connector.messages_received.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Taux réponse</span>
              </div>
              <p className="text-2xl font-bold mt-1">{connector.response_rate}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Dernière activité</span>
              </div>
              <p className="text-sm font-medium mt-1">
                {connector.last_used_at 
                  ? format(new Date(connector.last_used_at), 'dd/MM HH:mm', { locale: fr })
                  : 'Jamais'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trends" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="trends">Tendances</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant={period === 'day' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setPeriod('day')}
              >
                Jour
              </Badge>
              <Badge 
                variant={period === 'week' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setPeriod('week')}
              >
                Semaine
              </Badge>
              <Badge 
                variant={period === 'month' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setPeriod('month')}
              >
                Mois
              </Badge>
            </div>
          </div>

          <TabsContent value="trends" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Volume de messages</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="envoyés" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="livrés" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Répartition des messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Statut des messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Livrés</span>
                    </div>
                    <span className="font-bold">{Math.round(connector.messages_sent * 0.85)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>En attente</span>
                    </div>
                    <span className="font-bold">{Math.round(connector.messages_sent * 0.1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Échoués</span>
                    </div>
                    <span className="font-bold">{Math.round(connector.messages_sent * 0.05)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChannelAnalyticsDialog;
