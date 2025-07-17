import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileText, 
  Download, 
  CalendarIcon,
  BarChart3,
  TrendingUp,
  Shield,
  AlertTriangle,
  Users,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useToast } from '@/hooks/use-toast';

const SecurityReports = () => {
  const { toast } = useToast();
  const { useTenantQueryWithCache } = useTenantQuery();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reportType, setReportType] = useState('security');

  // Récupérer les données pour les rapports
  const { data: securityAlerts = [] } = useTenantQueryWithCache(
    ['security-alerts-reports'],
    'security_alerts',
    '*',
    undefined,
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit: 100 
    }
  );

  const { data: auditLogs = [] } = useTenantQueryWithCache(
    ['audit-logs-reports'],
    'audit_logs',
    '*',
    undefined,
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit: 100 
    }
  );

  const { data: loginAttempts = [] } = useTenantQueryWithCache(
    ['login-attempts-reports'],
    'login_attempts',
    '*',
    undefined,
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit: 100 
    }
  );

  const generateReport = async () => {
    try {
      const reportData = {
        type: reportType,
        startDate,
        endDate,
        timestamp: new Date(),
        data: {
          securityAlerts: securityAlerts.length,
          criticalAlerts: securityAlerts.filter(a => a.severity === 'critical').length,
          auditEvents: auditLogs.length,
          loginAttempts: loginAttempts.length,
          failedLogins: loginAttempts.filter(l => !l.success).length
        }
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-securite-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Rapport généré",
        description: "Le rapport de sécurité a été téléchargé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport.",
        variant: "destructive",
      });
    }
  };

  const getAlertsBySeverity = () => {
    const counts = securityAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return [
      { severity: 'critical', count: counts.critical || 0, color: 'text-red-600' },
      { severity: 'high', count: counts.high || 0, color: 'text-orange-600' },
      { severity: 'medium', count: counts.medium || 0, color: 'text-yellow-600' },
      { severity: 'low', count: counts.low || 0, color: 'text-green-600' }
    ];
  };

  const getRecentActivity = () => {
    return auditLogs.slice(0, 10).map(log => ({
      id: log.id,
      action: log.action,
      table: log.table_name,
      timestamp: new Date(log.created_at),
      status: log.status || 'success'
    }));
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Rapports de Sécurité
          </h2>
          <p className="text-muted-foreground">
            Générer et analyser les rapports d'activité et de sécurité
          </p>
        </div>
        <Button onClick={generateReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Télécharger Rapport
        </Button>
      </div>

      {/* Configuration du rapport */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration du Rapport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de rapport</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security">Sécurité Complète</SelectItem>
                  <SelectItem value="alerts">Alertes Uniquement</SelectItem>
                  <SelectItem value="audit">Audit des Actions</SelectItem>
                  <SelectItem value="logins">Connexions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de début</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "P", { locale: fr }) : "Sélectionner..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de fin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "P", { locale: fr }) : "Sélectionner..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Alertes Totales</p>
                    <p className="text-2xl font-bold">{securityAlerts.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Alertes Critiques</p>
                    <p className="text-2xl font-bold text-red-600">
                      {securityAlerts.filter(a => a.severity === 'critical').length}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Événements Audit</p>
                    <p className="text-2xl font-bold">{auditLogs.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Connexions Échouées</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {loginAttempts.filter(l => !l.success).length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Répartition des Alertes par Sévérité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getAlertsBySeverity().map(({ severity, count, color }) => (
                  <div key={severity} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={color}>
                        {severity.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{count} alertes</span>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${color.replace('text', 'bg')}`}
                        style={{ width: `${Math.max((count / securityAlerts.length) * 100, 5)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getRecentActivity().map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={activity.status === 'success' ? 'default' : 'destructive'}>
                        {activity.action}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {activity.table}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(activity.timestamp, 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Métriques de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Temps de Réponse Moyen</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">120ms</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Disponibilité Système</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '99%' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">99.8%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityReports;