import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, FileText, Download, Eye, Trash2, Filter, FolderOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  size: string;
  uploadDate: string;
  author: string;
  description: string;
  tags: string[];
}

const DocumentModule = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Mock data - sera remplacé par de vraies données
  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'Manuel Utilisateur PharmaSoft.pdf',
      type: 'PDF',
      category: 'Manuel',
      size: '2.5 MB',
      uploadDate: '2024-01-15',
      author: 'Admin',
      description: 'Manuel complet d\'utilisation du logiciel PharmaSoft',
      tags: ['manuel', 'formation', 'guide']
    },
    {
      id: '2',
      name: 'Procédure Inventaire.docx',
      type: 'DOCX',
      category: 'Procédure',
      size: '1.2 MB',
      uploadDate: '2024-01-10',
      author: 'Manager',
      description: 'Procédure détaillée pour la réalisation des inventaires',
      tags: ['inventaire', 'procédure', 'stock']
    },
    {
      id: '3',
      name: 'Rapport Ventes Q4.xlsx',
      type: 'XLSX',
      category: 'Rapport',
      size: '800 KB',
      uploadDate: '2024-01-08',
      author: 'Comptable',
      description: 'Rapport détaillé des ventes du quatrième trimestre',
      tags: ['ventes', 'rapport', 'Q4']
    },
    {
      id: '4',
      name: 'Certificat ISO.pdf',
      type: 'PDF',
      category: 'Certification',
      size: '500 KB',
      uploadDate: '2024-01-05',
      author: 'Qualité',
      description: 'Certificat de conformité ISO de la pharmacie',
      tags: ['iso', 'certificat', 'qualité']
    }
  ]);

  const categories = ['all', 'Manuel', 'Procédure', 'Rapport', 'Certification', 'Formation'];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

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
                <Label htmlFor="file">Fichier</Label>
                <Input id="file" type="file" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nom du document</Label>
                <Input id="name" placeholder="Nom du document" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manuel">Manuel</SelectItem>
                    <SelectItem value="procedure">Procédure</SelectItem>
                    <SelectItem value="rapport">Rapport</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="formation">Formation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Description du document" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                <Input id="tags" placeholder="manuel, formation, guide" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => setIsUploadDialogOpen(false)}>
                Télécharger
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                  {categories.slice(1).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
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
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(doc.type)}
                      <Badge variant="secondary">{doc.type}</Badge>
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
                      <span>Taille: {doc.size}</span>
                      <span>{doc.uploadDate}</span>
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
                        Par {doc.author}
                      </span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
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
                      {getFileIcon(doc.type)}
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-muted-foreground">{doc.description}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                          <Badge variant="secondary" className="text-xs">{doc.type}</Badge>
                          <span className="text-xs text-muted-foreground">{doc.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">Par {doc.author}</div>
                        <div className="text-muted-foreground">{doc.uploadDate}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
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
      </Tabs>
    </div>
  );
};

export default DocumentModule;