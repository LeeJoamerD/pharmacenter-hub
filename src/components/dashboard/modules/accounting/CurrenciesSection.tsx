import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccountingConfiguration } from '@/hooks/useAccountingConfiguration';

const CurrenciesSection = () => {
  const { toast } = useToast();
  const { currencies = [], saveCurrency, saveExchangeRate } = useAccountingConfiguration();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<any>(null);
  
  const [currencyForm, setCurrencyForm] = useState({
    currency_code: '',
    currency_name: '',
    currency_symbol: '',
    is_base_currency: false,
    is_active: true
  });

  const [rateForm, setRateForm] = useState({
    rate: '',
    rate_date: new Date().toISOString().split('T')[0],
    auto_update_enabled: false,
    update_frequency: 'daily'
  });

  const resetCurrencyForm = () => {
    setCurrencyForm({
      currency_code: '',
      currency_name: '',
      currency_symbol: '',
      is_base_currency: false,
      is_active: true
    });
    setEditingCurrency(null);
  };

  const resetRateForm = () => {
    setRateForm({
      rate: '',
      rate_date: new Date().toISOString().split('T')[0],
      auto_update_enabled: false,
      update_frequency: 'daily'
    });
    setSelectedCurrency(null);
  };

  const handleOpenCurrencyDialog = (currency?: any) => {
    if (currency) {
      setEditingCurrency(currency);
      setCurrencyForm({
        currency_code: currency.currency_code || '',
        currency_name: currency.currency_name || '',
        currency_symbol: currency.currency_symbol || '',
        is_base_currency: currency.is_base_currency || false,
        is_active: currency.is_active !== false
      });
    } else {
      resetCurrencyForm();
    }
    setDialogOpen(true);
  };

  const handleOpenRateDialog = (currency: any) => {
    setSelectedCurrency(currency);
    const latestRate = currency.exchange_rates?.[0];
    if (latestRate) {
      setRateForm({
        rate: latestRate.rate?.toString() || '',
        rate_date: latestRate.rate_date || new Date().toISOString().split('T')[0],
        auto_update_enabled: latestRate.auto_update_enabled || false,
        update_frequency: latestRate.update_frequency || 'daily'
      });
    } else {
      resetRateForm();
    }
    setRateDialogOpen(true);
  };

  const handleSaveCurrency = async () => {
    try {
      if (editingCurrency) {
        await saveCurrency({ ...currencyForm, id: editingCurrency.id });
        toast({
          title: "Devise modifiée",
          description: "La devise a été mise à jour avec succès."
        });
      } else {
        await saveCurrency(currencyForm);
        toast({
          title: "Devise créée",
          description: "La devise a été créée avec succès."
        });
      }
      setDialogOpen(false);
      resetCurrencyForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive"
      });
    }
  };

  const handleSaveExchangeRate = async () => {
    if (!selectedCurrency) return;
    
    try {
      await saveExchangeRate({
        currency_id: selectedCurrency.id,
        rate: parseFloat(rateForm.rate),
        rate_date: rateForm.rate_date,
        auto_update_enabled: rateForm.auto_update_enabled,
        update_frequency: rateForm.update_frequency
      });
      
      toast({
        title: "Taux de change mis à jour",
        description: "Le taux de change a été sauvegardé avec succès."
      });
      
      setRateDialogOpen(false);
      resetRateForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde du taux.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (currency: any) => {
    if (currency.is_base_currency) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Devise de base</Badge>;
    }
    return currency.is_active ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge> :
      <Badge variant="secondary">Inactive</Badge>;
  };

  const formatExchangeRate = (currency: any) => {
    const latestRate = currency.exchange_rates?.[0];
    if (!latestRate) return <span className="text-muted-foreground">Non défini</span>;
    
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono">{parseFloat(latestRate.rate).toFixed(4)}</span>
        {latestRate.auto_update_enabled && (
          <Badge variant="outline" className="text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Auto
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Gestion des Devises
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenCurrencyDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Devise
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCurrency ? 'Modifier la devise' : 'Nouvelle devise'}
                </DialogTitle>
                <DialogDescription>
                  Configurez les paramètres de la devise
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency_code">Code devise</Label>
                    <Input
                      id="currency_code"
                      value={currencyForm.currency_code}
                      onChange={(e) => setCurrencyForm({...currencyForm, currency_code: e.target.value.toUpperCase()})}
                      placeholder="USD, EUR, XAF..."
                      maxLength={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency_symbol">Symbole</Label>
                    <Input
                      id="currency_symbol"
                      value={currencyForm.currency_symbol}
                      onChange={(e) => setCurrencyForm({...currencyForm, currency_symbol: e.target.value})}
                      placeholder="$, €, FCFA..."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency_name">Nom de la devise</Label>
                  <Input
                    id="currency_name"
                    value={currencyForm.currency_name}
                    onChange={(e) => setCurrencyForm({...currencyForm, currency_name: e.target.value})}
                    placeholder="Ex: Franc CFA"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={currencyForm.is_base_currency}
                    onCheckedChange={(checked) => setCurrencyForm({...currencyForm, is_base_currency: checked})}
                  />
                  <Label>Devise de base</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={currencyForm.is_active}
                    onCheckedChange={(checked) => setCurrencyForm({...currencyForm, is_active: checked})}
                  />
                  <Label>Devise active</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveCurrency}>
                  {editingCurrency ? 'Modifier' : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog for Exchange Rates */}
          <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Taux de change - {selectedCurrency?.currency_name}
                </DialogTitle>
                <DialogDescription>
                  Configurez le taux de change par rapport à la devise de base
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate">Taux de change</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.0001"
                      value={rateForm.rate}
                      onChange={(e) => setRateForm({...rateForm, rate: e.target.value})}
                      placeholder="1.0000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rate_date">Date du taux</Label>
                    <Input
                      id="rate_date"
                      type="date"
                      value={rateForm.rate_date}
                      onChange={(e) => setRateForm({...rateForm, rate_date: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={rateForm.auto_update_enabled}
                    onCheckedChange={(checked) => setRateForm({...rateForm, auto_update_enabled: checked})}
                  />
                  <Label>Mise à jour automatique</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setRateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveExchangeRate}>
                  Sauvegarder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currencies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune devise configurée</p>
            <p className="text-sm">Créez votre première devise pour commencer</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Devise</TableHead>
                <TableHead>Symbole</TableHead>
                <TableHead>Taux de change</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map((currency: any) => (
                <TableRow key={currency.id}>
                  <TableCell className="font-mono">{currency.currency_code}</TableCell>
                  <TableCell className="font-medium">{currency.currency_name}</TableCell>
                  <TableCell>{currency.currency_symbol}</TableCell>
                  <TableCell>{formatExchangeRate(currency)}</TableCell>
                  <TableCell>{getStatusBadge(currency)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenRateDialog(currency)}
                        disabled={currency.is_base_currency}
                        title={currency.is_base_currency ? "La devise de base n'a pas de taux de change" : "Gérer le taux de change"}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenCurrencyDialog(currency)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrenciesSection;