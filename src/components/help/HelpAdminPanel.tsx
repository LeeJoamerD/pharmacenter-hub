import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText,
  Settings,
  BarChart
} from 'lucide-react';
import { useHelpCenter, HelpArticle, HelpCategory } from '@/hooks/useHelpCenter';
import { useToast } from '@/hooks/use-toast';

interface HelpAdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpAdminPanel({ open, onOpenChange }: HelpAdminPanelProps) {
  const { 
    articles, 
    categories, 
    createArticle, 
    updateArticle, 
    deleteArticle 
  } = useHelpCenter();
  const { toast } = useToast();

  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category_id: '',
    keywords: '',
    video_url: '',
    is_featured: false,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      category_id: '',
      keywords: '',
      video_url: '',
      is_featured: false,
    });
    setEditingArticle(null);
    setIsCreating(false);
  };

  const handleEdit = (article: HelpArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      summary: article.summary || '',
      content: article.content,
      category_id: article.category_id || '',
      keywords: article.keywords?.join(', ') || '',
      video_url: article.video_url || '',
      is_featured: article.is_featured,
    });
    setIsCreating(true);
  };

  const handleSubmit = () => {
    const articleData = {
      title: formData.title,
      summary: formData.summary || null,
      content: formData.content,
      category_id: formData.category_id || null,
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
      video_url: formData.video_url || null,
      is_featured: formData.is_featured,
    };

    if (editingArticle) {
      updateArticle({ id: editingArticle.id, ...articleData });
    } else {
      createArticle(articleData);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      deleteArticle(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Administration du Centre d'Aide
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="articles" className="flex-1">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="articles">
                <FileText className="h-4 w-4 mr-2" />
                Articles ({articles.length})
              </TabsTrigger>
              <TabsTrigger value="editor">
                <Edit className="h-4 w-4 mr-2" />
                Éditeur
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart className="h-4 w-4 mr-2" />
                Statistiques
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="articles" className="px-6 pb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Liste des articles</h3>
              <Button onClick={() => { resetForm(); setIsCreating(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel article
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {articles.map((article) => (
                  <Card key={article.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{article.title}</h4>
                            {article.is_featured && (
                              <Badge variant="secondary">Recommandé</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {article.summary || article.content.substring(0, 100)}...
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{article.view_count} vues</span>
                            {article.category_name && (
                              <Badge variant="outline">{article.category_name}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(article)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(article.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="editor" className="px-6 pb-6">
            {isCreating ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Titre *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titre de l'article"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Résumé</Label>
                  <Input
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Résumé court de l'article"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contenu *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Contenu de l'article (Markdown supporté)"
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mots-clés (séparés par virgule)</Label>
                    <Input
                      value={formData.keywords}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                      placeholder="mot1, mot2, mot3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL Vidéo (YouTube, Vimeo)</Label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://youtube.com/embed/..."
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label>Article recommandé (mis en avant)</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button onClick={handleSubmit} disabled={!formData.title || !formData.content}>
                    {editingArticle ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez un article à modifier ou créez-en un nouveau</p>
                <Button className="mt-4" onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel article
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{articles.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Articles Recommandés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {articles.filter(a => a.is_featured).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Catégories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categories.length}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
