import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Folder, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useDocumentCategoriesQuery, useDocumentCategoryMutation } from '@/hooks/useTenantQuery';

interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_system: boolean;
}

interface CategoryForm {
  name: string;
  description: string;
  color: string;
}

const DocumentCategoryManager = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  const { toast } = useToast();

  // Queries
  const { data: categories = [], isLoading } = useDocumentCategoriesQuery();

  // Mutations
  const createCategory = useDocumentCategoryMutation('insert');
  const updateCategory = useDocumentCategoryMutation('update');
  const deleteCategory = useDocumentCategoryMutation('delete');

  // Colors disponibles
  const availableColors = [
    { value: '#3b82f6', label: 'Bleu' },
    { value: '#10b981', label: 'Vert' },
    { value: '#f59e0b', label: 'Orange' },
    { value: '#ef4444', label: 'Rouge' },
    { value: '#8b5cf6', label: 'Violet' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#84cc16', label: 'Lime' },
    { value: '#f97316', label: 'Orange foncé' }
  ];

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6'
    });
    setEditingCategory(null);
  };

  // Handle add category
  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la catégorie est obligatoire.",
        variant: "destructive",
      });
      return;
    }

    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        is_system: false
      };

      await createCategory.mutateAsync(categoryData);
      
      toast({
        title: "Succès",
        description: "Catégorie ajoutée avec succès.",
      });
      
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la catégorie.",
        variant: "destructive",
      });
    }
  };

  // Handle edit
  const handleEdit = (category: DocumentCategory) => {
    if (category.is_system) {
      toast({
        title: "Information",
        description: "Les catégories système ne peuvent pas être modifiées.",
        variant: "default",
      });
      return;
    }

    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color
    });
    setIsEditDialogOpen(true);
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la catégorie est obligatoire.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData = {
        id: editingCategory.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color
      };

      await updateCategory.mutateAsync(updateData);
      
      toast({
        title: "Succès",
        description: "Catégorie modifiée avec succès.",
      });
      
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la modification de la catégorie:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la catégorie.",
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = async (category: DocumentCategory) => {
    if (category.is_system) {
      toast({
        title: "Information",
        description: "Les catégories système ne peuvent pas être supprimées.",
        variant: "default",
      });
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      return;
    }

    try {
      await deleteCategory.mutateAsync({ id: category.id });
      
      toast({
        title: "Succès",
        description: "Catégorie supprimée avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Catégories de Documents</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les catégories pour organiser vos documents
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter une Catégorie</DialogTitle>
              <DialogDescription>
                Créez une nouvelle catégorie pour organiser vos documents
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom de la catégorie *</Label>
                <Input 
                  id="name" 
                  placeholder="Nom de la catégorie" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Description de la catégorie" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color.value ? 'border-black' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({...formData, color: color.value})}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {setIsAddDialogOpen(false); resetForm();}}>
                Annuler
              </Button>
              <Button onClick={handleAdd} disabled={createCategory.isPending}>
                {createCategory.isPending ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier la Catégorie</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la catégorie
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nom de la catégorie *</Label>
              <Input 
                id="edit-name" 
                placeholder="Nom de la catégorie" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                placeholder="Description de la catégorie" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color.value ? 'border-black' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({...formData, color: color.value})}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {setIsEditDialogOpen(false); resetForm();}}>
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={updateCategory.isPending}>
              {updateCategory.isPending ? 'Modification...' : 'Modifier'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category: DocumentCategory) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <CardTitle className="text-base">{category.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  {category.is_system && (
                    <Badge variant="secondary" className="text-xs">
                      <Settings className="w-3 h-3 mr-1" />
                      Système
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription className="text-sm">
                {category.description || 'Aucune description'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-end space-x-1">
                {!category.is_system && (
                  <>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleEdit(category)}
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDelete(category)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune catégorie</h3>
            <p className="text-muted-foreground text-center mb-4">
              Aucune catégorie de document n'a été créée pour le moment.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer une catégorie
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentCategoryManager;