import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Hash, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccountingConfiguration } from '@/hooks/useAccountingConfiguration';

const NumberingRulesSection = () => {
  const { toast } = useToast();
  const { numberingRules = [], saveNumberingRule } = useAccountingConfiguration();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState({
    rule_type: '',
    format_pattern: '',
    reset_frequency: 'annuel',
    current_number: 1
  });

  const ruleTypes = [
    { value: 'facture', label: 'Factures de vente' },
    { value: 'facture_achat', label: 'Factures d\'achat' },
    { value: 'piece_comptable', label: 'Pièces comptables' },
    { value: 'avoir', label: 'Avoirs' },
    { value: 'devis', label: 'Devis' }
  ];

  const resetFrequencies = [
    { value: 'jamais', label: 'Jamais' },
    { value: 'annuel', label: 'Annuel' },
    { value: 'mensuel', label: 'Mensuel' }
  ];

  const availableVariables = [
    { var: '{YYYY}', desc: 'Année sur 4 chiffres (2024)' },
    { var: '{YY}', desc: 'Année sur 2 chiffres (24)' },
    { var: '{MM}', desc: 'Mois sur 2 chiffres (01-12)' },
    { var: '{DD}', desc: 'Jour sur 2 chiffres (01-31)' },
    { var: '{####}', desc: 'Numéro séquentiel sur 4 chiffres' },
    { var: '{JOURNAL}', desc: 'Code du journal (VT, AC...)' }
  ];

  const generatePreview = (pattern: string) => {
    const now = new Date();
    let preview = pattern;
    preview = preview.replace('{YYYY}', now.getFullYear().toString());
    preview = preview.replace('{YY}', now.getFullYear().toString().slice(-2));
    preview = preview.replace('{MM}', (now.getMonth() + 1).toString().padStart(2, '0'));
    preview = preview.replace('{DD}', now.getDate().toString().padStart(2, '0'));
    preview = preview.replace('{####}', '0001');
    preview = preview.replace('{JOURNAL}', 'VT');
    return preview;
  };

  const resetForm = () => {
    setFormData({
      rule_type: '',
      format_pattern: '',
      reset_frequency: 'annuel',
      current_number: 1
    });
    setEditingRule(null);
  };

  const handleOpenDialog = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        rule_type: rule.rule_type || '',
        format_pattern: rule.format_pattern || '',
        reset_frequency: rule.reset_frequency || 'annuel',
        current_number: rule.current_number || 1
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingRule) {
        await saveNumberingRule({ ...formData, id: editingRule.id });
        toast({
          title: "Règle modifiée",
          description: "La règle de numérotation a été mise à jour avec succès."
        });
      } else {
        await saveNumberingRule(formData);
        toast({
          title: "Règle créée",
          description: "La règle de numérotation a été créée avec succès."
        });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive"
      });
    }
  };

  const getRuleTypeLabel = (type: string) => {
    const ruleType = ruleTypes.find(t => t.value === type);
    return ruleType ? ruleType.label : type;
  };

  const getResetFrequencyLabel = (frequency: string) => {
    const freq = resetFrequencies.find(f => f.value === frequency);
    return freq ? freq.label : frequency;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Règles de Numérotation
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Règle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Modifier la règle' : 'Nouvelle règle de numérotation'}
                </DialogTitle>
                <DialogDescription>
                  Configurez les règles de numérotation automatique
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule_type">Type de document</Label>
                    <Select 
                      value={formData.rule_type} 
                      onValueChange={(value) => setFormData({...formData, rule_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ruleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reset_frequency">Remise à zéro</Label>
                    <Select 
                      value={formData.reset_frequency} 
                      onValueChange={(value) => setFormData({...formData, reset_frequency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resetFrequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="format_pattern">Format de numérotation</Label>
                  <Input
                    id="format_pattern"
                    value={formData.format_pattern}
                    onChange={(e) => setFormData({...formData, format_pattern: e.target.value})}
                    placeholder="Ex: FAC-{YYYY}-{####}"
                  />
                  {formData.format_pattern && (
                    <div className="mt-2">
                      <Label className="text-sm text-muted-foreground">Aperçu:</Label>
                      <div className="font-mono text-sm bg-muted p-2 rounded">
                        {generatePreview(formData.format_pattern)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Variables disponibles</Label>
                    <div className="space-y-2">
                      {availableVariables.map((variable) => (
                        <div key={variable.var} className="flex items-center justify-between text-sm">
                          <code className="bg-muted px-2 py-1 rounded text-xs">{variable.var}</code>
                          <span className="text-muted-foreground">{variable.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="current_number">Numéro de départ</Label>
                    <Input
                      id="current_number"
                      type="number"
                      min="1"
                      value={formData.current_number}
                      onChange={(e) => setFormData({...formData, current_number: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Utilisez les variables entre accolades pour créer des formats dynamiques. 
                    Le numéro séquentiel sera automatiquement incrémenté à chaque nouveau document.
                  </AlertDescription>
                </Alert>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  {editingRule ? 'Modifier' : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {numberingRules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune règle de numérotation configurée</p>
            <p className="text-sm">Créez votre première règle pour automatiser la numérotation</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type de document</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Prochain numéro</TableHead>
                <TableHead>Remise à zéro</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {numberingRules.map((rule: any) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{getRuleTypeLabel(rule.rule_type)}</TableCell>
                  <TableCell className="font-mono text-sm">{rule.format_pattern}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.current_number}</Badge>
                  </TableCell>
                  <TableCell>{getResetFrequencyLabel(rule.reset_frequency)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Aperçu",
                            description: `Format: ${generatePreview(rule.format_pattern)}`
                          });
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenDialog(rule)}
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

export default NumberingRulesSection;