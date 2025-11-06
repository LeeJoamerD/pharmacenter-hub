import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, TrendingUp, Receipt, DollarSign, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportGeneratorProps {
  onGenerateDaily: (date: Date) => void;
  onGenerateWeekly: (startDate: Date, endDate: Date) => void;
  onGenerateMonthly: (year: number, month: number) => void;
  onGenerateFiscal: (startDate: Date, endDate: Date) => void;
}

const ReportGenerator = ({
  onGenerateDaily,
  onGenerateWeekly,
  onGenerateMonthly,
  onGenerateFiscal,
}: ReportGeneratorProps) => {
  const { toast } = useToast();
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyStartDate, setWeeklyStartDate] = useState('');
  const [weeklyEndDate, setWeeklyEndDate] = useState('');
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear().toString());
  const [monthlyMonth, setMonthlyMonth] = useState((new Date().getMonth() + 1).toString());
  const [fiscalStartDate, setFiscalStartDate] = useState('');
  const [fiscalEndDate, setFiscalEndDate] = useState('');

  const handleGenerateDaily = () => {
    if (!dailyDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une date.',
        variant: 'destructive',
      });
      return;
    }
    onGenerateDaily(new Date(dailyDate));
    toast({
      title: 'Rapport en cours de génération',
      description: 'Le rapport journalier est en cours de préparation...',
    });
  };

  const handleGenerateWeekly = () => {
    if (!weeklyStartDate || !weeklyEndDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une période.',
        variant: 'destructive',
      });
      return;
    }
    onGenerateWeekly(new Date(weeklyStartDate), new Date(weeklyEndDate));
    toast({
      title: 'Rapport en cours de génération',
      description: 'Le rapport hebdomadaire est en cours de préparation...',
    });
  };

  const handleGenerateMonthly = () => {
    if (!monthlyYear || !monthlyMonth) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un mois et une année.',
        variant: 'destructive',
      });
      return;
    }
    onGenerateMonthly(parseInt(monthlyYear), parseInt(monthlyMonth) - 1);
    toast({
      title: 'Rapport en cours de génération',
      description: 'Le rapport mensuel est en cours de préparation...',
    });
  };

  const handleGenerateFiscal = () => {
    if (!fiscalStartDate || !fiscalEndDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une période fiscale.',
        variant: 'destructive',
      });
      return;
    }
    onGenerateFiscal(new Date(fiscalStartDate), new Date(fiscalEndDate));
    toast({
      title: 'Rapport en cours de génération',
      description: 'Le rapport fiscal est en cours de préparation...',
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Rapport Journalier */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <CardTitle>Rapport Journalier</CardTitle>
          </div>
          <CardDescription>
            Synthèse des encaissements d'une journée spécifique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="daily-date">Date</Label>
            <Input
              id="daily-date"
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerateDaily} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Générer PDF
          </Button>
        </CardContent>
      </Card>

      {/* Rapport Hebdomadaire */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Rapport Hebdomadaire</CardTitle>
          </div>
          <CardDescription>
            Analyse détaillée des encaissements sur une semaine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weekly-start">Date début</Label>
              <Input
                id="weekly-start"
                type="date"
                value={weeklyStartDate}
                onChange={(e) => setWeeklyStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-end">Date fin</Label>
              <Input
                id="weekly-end"
                type="date"
                value={weeklyEndDate}
                onChange={(e) => setWeeklyEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleGenerateWeekly} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Générer Excel
          </Button>
        </CardContent>
      </Card>

      {/* Rapport Mensuel */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Rapport Mensuel</CardTitle>
          </div>
          <CardDescription>
            Synthèse complète des encaissements du mois
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly-month">Mois</Label>
              <Input
                id="monthly-month"
                type="number"
                min="1"
                max="12"
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-year">Année</Label>
              <Input
                id="monthly-year"
                type="number"
                min="2020"
                max="2100"
                value={monthlyYear}
                onChange={(e) => setMonthlyYear(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleGenerateMonthly} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Générer Excel
          </Button>
        </CardContent>
      </Card>

      {/* Rapport Fiscal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle>Rapport Fiscal</CardTitle>
          </div>
          <CardDescription>
            Document fiscal conforme à la législation congolaise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fiscal-start">Date début</Label>
              <Input
                id="fiscal-start"
                type="date"
                value={fiscalStartDate}
                onChange={(e) => setFiscalStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscal-end">Date fin</Label>
              <Input
                id="fiscal-end"
                type="date"
                value={fiscalEndDate}
                onChange={(e) => setFiscalEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleGenerateFiscal} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Générer PDF Fiscal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportGenerator;
