import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, MessageSquare, Edit } from 'lucide-react';

interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  category: string;
}

interface WhatsAppTemplateDialogProps {
  templates: WhatsAppTemplate[];
  onTemplatesChange: (templates: WhatsAppTemplate[]) => void;
}

const WhatsAppTemplateDialog: React.FC<WhatsAppTemplateDialogProps> = ({
  templates,
  onTemplatesChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'alerts'
  });

  const handleSave = () => {
    if (editingTemplate) {
      // Update existing template
      const updatedTemplates = templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...formData, status: 'pending' as const }
          : t
      );
      onTemplatesChange(updatedTemplates);
    } else {
      // Add new template
      const newTemplate: WhatsAppTemplate = {
        id: Date.now().toString(),
        ...formData,
        status: 'pending'
      };
      onTemplatesChange([...templates, newTemplate]);
    }
    
    // Reset form
    setFormData({ name: '', content: '', category: 'alerts' });
    setEditingTemplate(null);
  };

  const handleDelete = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    onTemplatesChange(updatedTemplates);
  };

  const handleEdit = (template: WhatsAppTemplate) => {
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category
    });
    setEditingTemplate(template);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return 'En attente';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MessageSquare className="h-4 w-4 mr-2" />
          Gérer les Templates WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Templates WhatsApp Business</DialogTitle>
          <DialogDescription>
            Gérez vos templates WhatsApp approuvés pour les notifications automatiques.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                {editingTemplate ? 'Modifier le Template' : 'Nouveau Template'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-name">Nom du Template</Label>
                <Input
                  id="template-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: alerte_stock_faible"
                />
              </div>
              
              <div>
                <Label htmlFor="template-category">Catégorie</Label>
                <select
                  id="template-category"
                  className="w-full p-2 border rounded-md"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="alerts">Alertes</option>
                  <option value="notifications">Notifications</option>
                  <option value="reminders">Rappels</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="template-content">Contenu du Template</Label>
                <Textarea
                  id="template-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Bonjour {{1}}, votre stock de {{2}} est faible ({{3}} unités restantes)."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisez {`{{1}}, {{2}}, etc.`} pour les variables dynamiques
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave}
                  disabled={!formData.name || !formData.content}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {editingTemplate ? 'Mettre à jour' : 'Ajouter'}
                </Button>
                {editingTemplate && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(null);
                      setFormData({ name: '', content: '', category: 'alerts' });
                    }}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          <Card>
            <CardHeader>
              <CardTitle>Templates Existants ({templates.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Aucun template configuré
                  </div>
                ) : (
                  templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`${getStatusColor(template.status)} text-white text-xs`}
                          >
                            {getStatusLabel(template.status)}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.content}
                      </p>
                      <div className="text-xs text-muted-foreground mt-1">
                        Catégorie: {template.category}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppTemplateDialog;