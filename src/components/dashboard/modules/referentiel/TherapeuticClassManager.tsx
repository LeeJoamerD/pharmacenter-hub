import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2, Stethoscope } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTenantQuery } from "@/hooks/useTenantQuery";
import { useToast } from "@/hooks/use-toast";

interface TherapeuticClass {
  id: string;
  tenant_id: string;
  libelle_classe: string;
  systeme_anatomique: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface TherapeuticClassFormData {
  libelle_classe: string;
  systeme_anatomique: string;
  description?: string;
}

export const TherapeuticClassManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<TherapeuticClass | null>(null);
  const { toast } = useToast();

  const { 
    useTenantQueryWithCache, 
    useTenantMutation 
  } = useTenantQuery();

  // Fetch therapeutic classes
  const { 
    data: therapeuticClasses = [], 
    isLoading,
    error 
  } = useTenantQueryWithCache(
    ['classes-therapeutiques'],
    'classes_therapeutiques',
    '*',
    undefined,
    { orderBy: { column: 'libelle_classe', ascending: true } }
  );

  // Mutations
  const createMutation = useTenantMutation('classes_therapeutiques', 'insert', {
    invalidateQueries: ['classes-therapeutiques'],
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Classe thérapeutique créée avec succès",
      });
      handleDialogClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message?.includes('unique_classe_per_tenant') 
          ? "Une classe avec ce libellé existe déjà"
          : "Erreur lors de la création de la classe thérapeutique",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useTenantMutation('classes_therapeutiques', 'update', {
    invalidateQueries: ['classes-therapeutiques'],
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Classe thérapeutique modifiée avec succès",
      });
      handleDialogClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message?.includes('unique_classe_per_tenant') 
          ? "Une classe avec ce libellé existe déjà"
          : "Erreur lors de la modification de la classe thérapeutique",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useTenantMutation('classes_therapeutiques', 'delete', {
    invalidateQueries: ['classes-therapeutiques'],
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Classe thérapeutique supprimée avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de la classe thérapeutique",
        variant: "destructive",
      });
    },
  });

  // Form handling
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TherapeuticClassFormData>();

  const filteredClasses = therapeuticClasses.filter((therapeuticClass: TherapeuticClass) =>
    therapeuticClass.libelle_classe.toLowerCase().includes(searchTerm.toLowerCase()) ||
    therapeuticClass.systeme_anatomique.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClass = () => {
    setEditingClass(null);
    reset({
      libelle_classe: "",
      systeme_anatomique: "",
      description: ""
    });
    setIsDialogOpen(true);
  };

  const handleEditClass = (therapeuticClass: TherapeuticClass) => {
    setEditingClass(therapeuticClass);
    reset({
      libelle_classe: therapeuticClass.libelle_classe,
      systeme_anatomique: therapeuticClass.systeme_anatomique,
      description: therapeuticClass.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClass = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette classe thérapeutique ?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingClass(null);
    reset();
  };

  const onSubmit = (data: TherapeuticClassFormData) => {
    if (editingClass) {
      updateMutation.mutate({
        id: editingClass.id,
        ...data
      });
    } else {
      createMutation.mutate(data);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Erreur lors du chargement des classes thérapeutiques
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classes Thérapeutiques</CardTitle>
        <CardDescription>
          Gérer les classes thérapeutiques et leurs systèmes anatomiques
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={handleAddClass} className="ml-4">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé de la classe</TableHead>
                <TableHead>Système anatomique</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Aucune classe trouvée pour cette recherche" : "Aucune classe thérapeutique"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((therapeuticClass: TherapeuticClass) => (
                  <TableRow key={therapeuticClass.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span>{therapeuticClass.libelle_classe}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {therapeuticClass.systeme_anatomique}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {therapeuticClass.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClass(therapeuticClass)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClass(therapeuticClass.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingClass ? "Modifier la classe thérapeutique" : "Ajouter une classe thérapeutique"}
              </DialogTitle>
              <DialogDescription>
                {editingClass ? "Modifiez les informations de la classe thérapeutique" : "Créez une nouvelle classe thérapeutique"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="libelle_classe">Libellé de la classe *</Label>
                  <Input
                    id="libelle_classe"
                    placeholder="Ex: Anti-inflammatoires non stéroïdiens"
                    {...register("libelle_classe", { 
                      required: "Le libellé de la classe est requis",
                      minLength: {
                        value: 2,
                        message: "Le libellé doit contenir au moins 2 caractères"
                      }
                    })}
                  />
                  {errors.libelle_classe && (
                    <p className="text-sm text-destructive">{errors.libelle_classe.message}</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="systeme_anatomique">Système anatomique *</Label>
                  <Input
                    id="systeme_anatomique"
                    placeholder="Ex: Système musculo-squelettique"
                    {...register("systeme_anatomique", { 
                      required: "Le système anatomique est requis",
                      minLength: {
                        value: 2,
                        message: "Le système anatomique doit contenir au moins 2 caractères"
                      }
                    })}
                  />
                  {errors.systeme_anatomique && (
                    <p className="text-sm text-destructive">{errors.systeme_anatomique.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Description de la classe thérapeutique..."
                    rows={3}
                    {...register("description")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingClass ? "Modifier" : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};