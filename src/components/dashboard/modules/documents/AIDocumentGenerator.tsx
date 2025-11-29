import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, Download, Copy } from 'lucide-react';
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
}

const AIDocumentGenerator = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<AITemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AITemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_templates')
        .select('*')
        .eq('is_active', true)
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
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    
    if (template) {
      // Initialize variables with empty values
      const initialVars: Record<string, string> = {};
      template.variables.forEach(variable => {
        initialVars[variable] = '';
      });
      setVariables(initialVars);
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const generateDocument = async () => {
    if (!useCustomPrompt && !selectedTemplate) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un template ou utiliser un prompt personnalisé",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const payload = useCustomPrompt 
        ? { customPrompt, variables: {} }
        : {
            templateId: selectedTemplate?.id,
            variables: variables
          };

      const { data, error } = await supabase.functions.invoke('generate-document-gemini', {
        body: payload
      });

      if (error) throw error;

      if (data?.success) {
        setGeneratedText(data.generatedText);
        toast({
          title: "Succès",
          description: "Document généré avec succès",
        });
      } else {
        throw new Error(data?.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Erreur",
        description: "Échec de la génération du document",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    toast({
      title: "Copié",
      description: "Texte copié dans le presse-papiers",
    });
  };

  const downloadAsFile = () => {
    const blob = new Blob([generatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Générateur de Documents IA
          </CardTitle>
          <CardDescription>
            Créez des documents personnalisés avec l'assistance de Google Gemini
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-4">
            <Button
              variant={!useCustomPrompt ? "default" : "outline"}
              onClick={() => setUseCustomPrompt(false)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Utiliser un Template
            </Button>
            <Button
              variant={useCustomPrompt ? "default" : "outline"}
              onClick={() => setUseCustomPrompt(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Prompt Personnalisé
            </Button>
          </div>

          {!useCustomPrompt ? (
            <>
              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Aucun template actif disponible
                  </p>
                ) : (
                  <Select value={selectedTemplate?.id || ''} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Variables */}
              {selectedTemplate && selectedTemplate.variables.length > 0 && (
                <div className="space-y-4">
                  <Label>Variables du Template</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTemplate.variables.map(variable => (
                      <div key={variable} className="space-y-2">
                        <Label htmlFor={variable}>{variable}</Label>
                        <Input
                          id={variable}
                          value={variables[variable] || ''}
                          onChange={(e) => handleVariableChange(variable, e.target.value)}
                          placeholder={`Saisir ${variable}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="customPrompt">Prompt Personnalisé</Label>
              <Textarea
                id="customPrompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Décrivez le document que vous souhaitez générer..."
                rows={6}
              />
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={generateDocument} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer le Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedText && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Document Généré</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsFile}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {generatedText}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIDocumentGenerator;