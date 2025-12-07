import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutGrid, 
  Package, 
  FileText, 
  Users, 
  Calendar,
  Bell,
  Zap,
  Check
} from 'lucide-react';
import type { AutomationTemplate } from '@/hooks/useAIAutomation';

interface TemplateGalleryDialogProps {
  templates: AutomationTemplate[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateId: string, name: string) => Promise<boolean>;
}

const TemplateGalleryDialog: React.FC<TemplateGalleryDialogProps> = ({
  templates,
  open,
  onOpenChange,
  onSelectTemplate
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'package-minus': return <Package className="h-6 w-6" />;
      case 'file-text': return <FileText className="h-6 w-6" />;
      case 'users': return <Users className="h-6 w-6" />;
      case 'calendar-clock': return <Calendar className="h-6 w-6" />;
      case 'bell': return <Bell className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'stock': return 'bg-orange-100 text-orange-700';
      case 'reporting': return 'bg-blue-100 text-blue-700';
      case 'crm': return 'bg-purple-100 text-purple-700';
      case 'orders': return 'bg-green-100 text-green-700';
      case 'alerts': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSelectTemplate = (template: AutomationTemplate) => {
    setSelectedTemplate(template);
    setWorkflowName(template.name);
  };

  const handleCreate = async () => {
    if (!selectedTemplate || !workflowName.trim()) return;
    
    setIsCreating(true);
    try {
      const success = await onSelectTemplate(selectedTemplate.id, workflowName);
      if (success) {
        setSelectedTemplate(null);
        setWorkflowName('');
        onOpenChange(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setWorkflowName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Galerie de Templates
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un template pour créer rapidement un nouveau workflow
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid grid-cols-2 gap-4 py-4">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-all
                  hover:border-primary hover:shadow-md
                  ${selectedTemplate?.id === template.id 
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                    : 'border-border'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(template.category)}`}>
                    {getIconComponent(template.icon)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{template.name}</h4>
                      {template.is_system && (
                        <Badge variant="secondary" className="text-xs">Système</Badge>
                      )}
                      {selectedTemplate?.id === template.id && (
                        <Check className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {template.description || 'Aucune description'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.trigger_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {selectedTemplate && (
          <div className="border-t pt-4 mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-wf-name">Nom du workflow</Label>
              <Input
                id="template-wf-name"
                placeholder="Entrez un nom pour le workflow..."
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!selectedTemplate || !workflowName.trim() || isCreating}
          >
            {isCreating ? 'Création...' : 'Créer le workflow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateGalleryDialog;
