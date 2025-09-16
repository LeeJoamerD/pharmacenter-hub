import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Copy, FileText, Tags } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AITemplate {
  id: string;
  name: string;
  type: string;
  category: string;
  prompt_template: string;
  variables: any;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
}

interface DocumentCategory {
  name: string;
}

const TemplateManager = () => {
  const { toast } = useToast();
  const { user, personnel } = useAuth();
  const [templates, setTemplates] = useState<AITemplate[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AITemplate | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: '',
    prompt_template: '',
    variables: [] as string[],
    is_active: true
  });

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      const processedTemplates = (data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables : []
      }));
      setTemplates(processedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('document_categories')
        .select('name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const extractVariables = (template: string) => {
    const matches = template.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const handleTemplateChange = (template: string) => {
    const variables = extractVariables(template);
    setFormData(prev => ({
      ...prev,
      prompt_template: template,
      variables
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      category: '',
      prompt_template: '',
      variables: [],
      is_active: true
    });
    setEditingTemplate(null);
  };

  const handleSaveTemplate = async () => {
    try {
      if (!formData.name || !formData.type || !formData.category || !formData.prompt_template) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive",
        });
        return;
      }

      const templateData = {
        ...formData,
        tenant_id: personnel?.tenant_id,
        is_system: false
      };

      let result;
      if (editingTemplate) {
        result = await supabase
          .from('ai_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('ai_templates')
          .insert(templateData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      await loadTemplates();
      setTemplateDialog(false);
      resetForm();

      toast({
        title: "Succès",
        description: editingTemplate ? "Template modifié avec succès" : "Template créé avec succès",
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le template",
        variant: "destructive",
      });
    }
  };

  const handleEditTemplate = (template: AITemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      category: template.category,
      prompt_template: template.prompt_template,
      variables: template.variables,
      is_active: template.is_active
    });
    setTemplateDialog(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('ai_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await loadTemplates();
      toast({
        title: "Succès",
        description: "Template supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le template",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_templates')
        .update({ is_active: isActive })
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(templates.map(template => 
        template.id === templateId ? { ...template, is_active: isActive } : template
      ));

      toast({
        title: "Succès",
        description: `Template ${isActive ? 'activé' : 'désactivé'} avec succès`,
      });
    } catch (error) {
      console.error('Error toggling template:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le template",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Templates IA</h2>
          <p className="text-muted-foreground">
            Créez et gérez vos templates de génération de documents
          </p>
        </div>
        <Dialog open={templateDialog} onOpenChange={(open) => {
          setTemplateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Modifier le Template' : 'Nouveau Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Nom du Template *</Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom du template"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-type">Type *</Label>
                  <Input
                    id="template-type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    placeholder="ex: patient_communication"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-category">Catégorie *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-prompt">Template de Prompt *</Label>
                <Textarea
                  id="template-prompt"
                  value={formData.prompt_template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  placeholder="Rédigez votre template avec des variables entre accolades {variable}..."
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Utilisez des accolades pour définir les variables : {'{variable}'}
                </p>
              </div>

              {formData.variables.length > 0 && (
                <div className="space-y-2">
                  <Label>Variables détectées</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.variables.map(variable => (
                      <Badge key={variable} variant="outline" className="flex items-center gap-1">
                        <Tags className="h-3 w-3" />
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="template-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="template-active">Template actif</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setTemplateDialog(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleSaveTemplate}>
                  {editingTemplate ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates Disponibles</CardTitle>
          <CardDescription>
            {templates.length} template{templates.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {template.name}
                      {template.is_system && (
                        <Badge variant="outline" className="text-xs">Système</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{template.type}</Badge>
                  </TableCell>
                  <TableCell>{template.category}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 3).map(variable => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={(checked) => handleToggleActive(template.id, checked)}
                        disabled={template.is_system}
                      />
                      <span className="text-sm text-muted-foreground">
                        {template.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        disabled={template.is_system}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        disabled={template.is_system}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {templates.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun template trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateManager;