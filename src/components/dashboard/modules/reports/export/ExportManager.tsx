import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Image, 
  Mail,
  Calendar,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportJob {
  id: string;
  name: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  size?: string;
  createdAt: string;
}

const ExportManager = () => {
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: '1',
      name: 'Rapport Ventes Journalier',
      format: 'PDF',
      status: 'completed',
      progress: 100,
      size: '2.4 MB',
      createdAt: '2024-02-07 14:30'
    },
    {
      id: '2',
      name: 'Analyse Stock Mensuel',
      format: 'Excel',
      status: 'completed',
      progress: 100,
      size: '1.8 MB',
      createdAt: '2024-02-07 12:15'
    },
    {
      id: '3',
      name: 'Dashboard Exécutif',
      format: 'PDF',
      status: 'processing',
      progress: 65,
      createdAt: '2024-02-07 15:45'
    }
  ]);

  const exportFormats = [
    { 
      id: 'pdf', 
      name: 'PDF', 
      description: 'Document portable, idéal pour impression',
      icon: FileText,
      options: ['includeCharts', 'includeData', 'landscape', 'watermark']
    },
    { 
      id: 'excel', 
      name: 'Excel', 
      description: 'Feuille de calcul pour analyse avancée',
      icon: FileSpreadsheet,
      options: ['multipleSheets', 'includeFormulas', 'includeCharts', 'rawData']
    },
    { 
      id: 'image', 
      name: 'Image', 
      description: 'PNG haute résolution pour présentation',
      icon: Image,
      options: ['highResolution', 'transparentBackground', 'customSize']
    }
  ];

  const exportOptions = {
    includeCharts: 'Inclure les graphiques',
    includeData: 'Inclure les données détaillées',
    landscape: 'Orientation paysage',
    watermark: 'Ajouter un filigrane',
    multipleSheets: 'Feuilles multiples',
    includeFormulas: 'Inclure les formules',
    rawData: 'Données brutes',
    highResolution: 'Haute résolution',
    transparentBackground: 'Arrière-plan transparent',
    customSize: 'Taille personnalisée'
  };

  const handleOptionToggle = (option: string) => {
    setSelectedOptions(prev => 
      prev.includes(option) 
        ? prev.filter(opt => opt !== option)
        : [...prev, option]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    // Simulation d'export
    const newJob: ExportJob = {
      id: Date.now().toString(),
      name: `Nouveau rapport ${selectedFormat.toUpperCase()}`,
      format: selectedFormat.toUpperCase(),
      status: 'processing',
      progress: 0,
      createdAt: new Date().toLocaleString('fr-FR')
    };

    setExportJobs(prev => [newJob, ...prev]);

    // Simulation de progression
    const progressInterval = setInterval(() => {
      setExportJobs(prev => 
        prev.map(job => 
          job.id === newJob.id && job.progress < 100
            ? { ...job, progress: Math.min(job.progress + 20, 100) }
            : job
        )
      );
    }, 500);

    setTimeout(() => {
      clearInterval(progressInterval);
      setExportJobs(prev => 
        prev.map(job => 
          job.id === newJob.id
            ? { ...job, status: 'completed', progress: 100, size: '1.2 MB' }
            : job
        )
      );
      setIsExporting(false);
      toast({
        title: "Export terminé",
        description: `Le rapport ${selectedFormat.toUpperCase()} a été généré avec succès`,
      });
    }, 3000);
  };

  const handleEmailSend = () => {
    if (!emailRecipients) {
      toast({
        title: "Destinataires manquants",
        description: "Veuillez saisir au moins une adresse email",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Email envoyé",
      description: "Le rapport a été envoyé par email aux destinataires",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'processing': return 'En cours';
      case 'error': return 'Erreur';
      default: return 'En attente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestionnaire d'Exports</h2>
          <p className="text-muted-foreground">
            Exportez vos rapports dans différents formats et gérez les téléchargements
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration d'export */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Format d'export</Label>
                {exportFormats.map(format => {
                  const IconComponent = format.icon;
                  return (
                    <div key={format.id} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id={format.id}
                        name="format"
                        value={format.id}
                        checked={selectedFormat === format.id}
                        onChange={(e) => setSelectedFormat(e.target.value)}
                        className="h-4 w-4"
                      />
                      <label htmlFor={format.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{format.name}</p>
                            <p className="text-xs text-muted-foreground">{format.description}</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Options spécifiques au format */}
              {selectedFormat && (
                <div className="space-y-3">
                  <Label>Options d'export</Label>
                  {exportFormats
                    .find(f => f.id === selectedFormat)
                    ?.options.map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={option}
                          checked={selectedOptions.includes(option)}
                          onCheckedChange={() => handleOptionToggle(option)}
                        />
                        <label
                          htmlFor={option}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {exportOptions[option as keyof typeof exportOptions]}
                        </label>
                      </div>
                    ))}
                </div>
              )}

              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExporting ? 'Export en cours...' : 'Exporter'}
              </Button>
            </CardContent>
          </Card>

          {/* Envoi par email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Envoi par Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipients">Destinataires</Label>
                <Textarea
                  id="recipients"
                  placeholder="email1@exemple.com, email2@exemple.com"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                />
              </div>

              <Button onClick={handleEmailSend} variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Envoyer par Email
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Historique des exports */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historique des Exports
              </CardTitle>
              <CardDescription>
                Suivi des exports récents et téléchargements disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{job.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.createdAt} • Format: {job.format}
                          {job.size && ` • Taille: ${job.size}`}
                        </p>
                        {job.status === 'processing' && (
                          <div className="mt-2">
                            <Progress value={job.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {job.progress}% terminé
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(job.status)}>
                        {getStatusText(job.status)}
                      </Badge>
                      {job.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExportManager;