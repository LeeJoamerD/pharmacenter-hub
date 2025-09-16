import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, FileText, Download, Eye, Trash2, Filter, FolderOpen, Edit, Plus, Settings, Mail, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { useDocumentsQuery, useDocumentCategoriesQuery, useDocumentMutation, useDocumentCategoryMutation } from '@/hooks/useTenantQuery';
import DocumentCategoryManager from './DocumentCategoryManager';
import AIDocumentGenerator from './documents/AIDocumentGenerator';
import CourrierManager from './documents/CourrierManager';
import EmailManager from './documents/EmailManager';
import TemplateManager from './documents/TemplateManager';

interface Document {
  id: string;
  name: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  category: string;
  description?: string;
  tags: string[];
  file_path?: string;
  file_url?: string;
  author_id?: string;
  author?: { id: string; noms: string; prenoms: string };
  created_at: string;
  updated_at: string;
}

interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_system: boolean;
}

interface DocumentForm {
  name: string;
  category: string;
  description: string;
  tags: string;
  file?: File;
}

const DocumentModule = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [formData, setFormData] = useState<DocumentForm>({
    name: '',
    category: '',
    description: '',
    tags: ''
  });
  
  const { toast } = useToast();
  const { currentUser } = useTenant();

  // Queries
  const { data: documents = [], isLoading: documentsLoading, refetch: refetchDocuments } = useDocumentsQuery();
  const { data: categories = [], isLoading: categoriesLoading } = useDocumentCategoriesQuery();

  // Mutations
  const createDocument = useDocumentMutation('insert');
  const updateDocument = useDocumentMutation('update');
  const deleteDocument = useDocumentMutation('delete');

  // Filters
  const filteredDocuments = documents.filter((doc: Document) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Get author name
  const getAuthorName = (document: Document): string => {
    if (document.author) {
      return `${document.author.prenoms} ${document.author.noms}`;
    }
    return 'Système';
  };

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    const iconClasses = "h-8 w-8";
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className={`${iconClasses} text-red-500`} />;
      case 'doc':
      case 'docx':
        return <FileText className={`${iconClasses} text-blue-500`} />;
      case 'xls':
      case 'xlsx':
        return <FileText className={`${iconClasses} text-green-500`} />;
      case 'ppt':
      case 'pptx':
        return <FileText className={`${iconClasses} text-orange-500`} />;
      case 'txt':
        return <FileText className={`${iconClasses} text-gray-500`} />;
      default:
        return <FileText className={`${iconClasses} text-purple-500`} />;
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      tags: ''
    });
    setEditingDocument(null);
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!formData.file || !formData.name || !formData.category) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const documentData = {
        name: formData.name,
        original_filename: formData.file.name,
        file_type: formData.file.type || formData.file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        file_size: formData.file.size,
        category: formData.category,
        description: formData.description || null,
        tags: tagsArray,
        author_id: currentUser?.id || null,
        // Note: Dans une vraie application, le fichier serait uploadé vers un storage
        // et on aurait file_path et file_url
        file_path: `/documents/${formData.file.name}`,
        file_url: null
      };

      await createDocument.mutateAsync(documentData);
      
      toast({
        title: "Succès",
        description: "Document ajouté avec succès.",
      });
      
      setIsUploadDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du document:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le document.",
        variant: "destructive",
      });
    }
  };

  // Handle edit
  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      name: document.name,
      category: document.category,
      description: document.description || '',
      tags: document.tags.join(', ')
    });
    setIsEditDialogOpen(true);
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingDocument || !formData.name || !formData.category) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const updateData = {
        id: editingDocument.id,
        name: formData.name,
        category: formData.category,
        description: formData.description || null,
        tags: tagsArray
      };

      await updateDocument.mutateAsync(updateData);
      
      toast({
        title: "Succès",
        description: "Document modifié avec succès.",
      });
      
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la modification du document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le document.",
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = async (document: Document) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      await deleteDocument.mutateAsync({ id: document.id });
      
      toast({
        title: "Succès",
        description: "Document supprimé avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document.",
        variant: "destructive",
      });
    }
  };

  // Handle download (simulation)
  const handleDownload = (document: Document) => {
    toast({
      title: "Info",
      description: "Fonctionnalité de téléchargement à implémenter.",
    });
  };

  // Handle view (simulation)
  const handleView = (document: Document) => {
    toast({
      title: "Info",
      description: "Fonctionnalité de visualisation à implémenter.",
    });
  };

  if (documentsLoading || categoriesLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bibliothèque de Documents</h2>
          <p className="text-muted-foreground">
            Gérez et organisez tous vos documents d'entreprise
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Nouveau Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Ajouter un Document</DialogTitle>
              <DialogDescription>
                Téléchargez un nouveau document dans la bibliothèque
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Fichier *</Label>
                <Input 
                  id="file" 
                  type="file" 
                  onChange={(e) => setFormData({...formData, file: e.target.files?.[0]})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nom du document *</Label>
                <Input 
                  id="name" 
                  placeholder="Nom du document" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: DocumentCategory) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Description du document" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                <Input 
                  id="tags" 
                  placeholder="manuel, formation, guide" 
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {setIsUploadDialogOpen(false); resetForm();}}>
                Annuler
              </Button>
              <Button onClick={handleFileUpload} disabled={createDocument.isPending}>
                {createDocument.isPending ? 'Téléchargement...' : 'Télécharger'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier le Document</DialogTitle>
            <DialogDescription>
              Modifiez les informations du document
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nom du document *</Label>
              <Input 
                id="edit-name" 
                placeholder="Nom du document" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: DocumentCategory) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                placeholder="Description du document" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tags">Tags (séparés par des virgules)</Label>
              <Input 
                id="edit-tags" 
                placeholder="manuel, formation, guide" 
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {setIsEditDialogOpen(false); resetForm();}}>
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={updateDocument.isPending}>
              {updateDocument.isPending ? 'Modification...' : 'Modifier'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((category: DocumentCategory) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manuels</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.category === 'Manuel').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procédures</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.category === 'Procédure').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rapports</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.category === 'Rapport').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Vue Grille</TabsTrigger>
          <TabsTrigger value="list">Vue Liste</TabsTrigger>
          <TabsTrigger value="courriers"><Mail className="w-4 h-4 mr-2" />Courriers</TabsTrigger>
          <TabsTrigger value="emails"><Mail className="w-4 h-4 mr-2" />Emails</TabsTrigger>
          <TabsTrigger value="ai-generator"><Sparkles className="w-4 h-4 mr-2" />Rédaction IA</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="w-4 h-4 mr-2" />Templates</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                       {getFileIcon(doc.file_type)}
                       <Badge variant="secondary">{doc.file_type}</Badge>
                     </div>
                     <Badge variant="outline">{doc.category}</Badge>
                   </div>
                   <CardTitle className="text-sm">{doc.name}</CardTitle>
                   <CardDescription className="text-xs">
                     {doc.description}
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="pt-0">
                   <div className="space-y-2">
                     <div className="flex justify-between text-xs text-muted-foreground">
                       <span>Taille: {formatFileSize(doc.file_size)}</span>
                       <span>{formatDate(doc.created_at)}</span>
                     </div>
                     <div className="flex flex-wrap gap-1">
                       {doc.tags.map((tag, index) => (
                         <Badge key={index} variant="outline" className="text-xs">
                           {tag}
                         </Badge>
                       ))}
                     </div>
                     <div className="flex justify-between items-center pt-2">
                       <span className="text-xs text-muted-foreground">
                         Par {getAuthorName(doc)}
                       </span>
                       <div className="flex gap-1">
                         <Button size="sm" variant="ghost" onClick={() => handleView(doc)}>
                           <Eye className="h-3 w-3" />
                         </Button>
                         <Button size="sm" variant="ghost" onClick={() => handleEdit(doc)}>
                           <Edit className="h-3 w-3" />
                         </Button>
                         <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                           <Download className="h-3 w-3" />
                         </Button>
                         <Button size="sm" variant="ghost" onClick={() => handleDelete(doc)}>
                           <Trash2 className="h-3 w-3" />
                         </Button>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                     <div className="flex items-center space-x-4">
                       {getFileIcon(doc.file_type)}
                       <div>
                         <div className="font-medium">{doc.name}</div>
                         <div className="text-sm text-muted-foreground">{doc.description}</div>
                         <div className="flex items-center space-x-2 mt-1">
                           <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                           <Badge variant="secondary" className="text-xs">{doc.file_type}</Badge>
                           <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center space-x-2">
                       <div className="text-right text-sm">
                         <div className="text-muted-foreground">Par {getAuthorName(doc)}</div>
                         <div className="text-muted-foreground">{formatDate(doc.created_at)}</div>
                       </div>
                       <div className="flex gap-1">
                         <Button size="sm" variant="ghost" onClick={() => handleView(doc)}>
                           <Eye className="h-4 w-4" />
                         </Button>
                         <Button size="sm" variant="ghost" onClick={() => handleEdit(doc)}>
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                           <Download className="h-4 w-4" />
                         </Button>
                         <Button size="sm" variant="ghost" onClick={() => handleDelete(doc)}>
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="courriers">
          <CourrierManager />
        </TabsContent>
        
        <TabsContent value="emails">
          <EmailManager />
        </TabsContent>
        
        <TabsContent value="ai-generator">
          <AIDocumentGenerator />
        </TabsContent>
        
        <TabsContent value="templates">
          <TemplateManager />
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <DocumentCategoryManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentModule;