import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect, type Option as MultiSelectOption } from "@/components/ui/multi-select";
import { usePersonnelQuery } from "@/hooks/useTenantQuery";
import { Plus, Search, CheckCircle, Clock, XCircle, Play, Square, Eye, Edit, Users, Trash2, Pause, Package, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useInventorySessions, InventorySession, CreateSessionData } from "@/hooks/useInventorySessions";
import { useInventoryFilters } from "@/hooks/useInventoryFilters";

interface InventorySessionsProps {
  onViewSession?: (sessionId: string) => void;
}

const InventorySessions: React.FC<InventorySessionsProps> = ({ onViewSession }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("tous");
  const [selectedType, setSelectedType] = useState<string>("tous");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<InventorySession | null>(null);
  
  // État du formulaire de création
  const [newSession, setNewSession] = useState<CreateSessionData>({
    nom: "",
    description: "",
    type: "complet",
    responsable: "",
    participants: [],
    secteurs: [],
    filtresRayon: [],
    filtresFournisseur: [],
    filtresEmplacement: [],
    filtresPeremptionJours: undefined,
    cycliqueJours: 30,
  });

  // Prévisualisation
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const { sessions, loading, createSession, startSession, stopSession, suspendSession, resumeSession, updateSession, deleteSession } = useInventorySessions();
  const { rayons, fournisseurs, emplacements, previewItemsCount } = useInventoryFilters();

  // Options de participants depuis la liste du personnel
  const { data: personnelList } = usePersonnelQuery();
  const participantOptions: MultiSelectOption[] = (personnelList || []).map((p: any) => ({
    value: `${p.prenoms} ${p.noms}`,
    label: `${p.prenoms} ${p.noms}`,
  }));

  // Options pour les multi-selects
  const rayonOptions: MultiSelectOption[] = rayons.map(r => ({
    value: r.id,
    label: r.libelle,
  }));

  const fournisseurOptions: MultiSelectOption[] = fournisseurs.map(f => ({
    value: f.id,
    label: f.nom,
  }));

  const emplacementOptions: MultiSelectOption[] = emplacements.map(e => ({
    value: e.value,
    label: e.label,
  }));

  // Prévisualisation automatique quand les filtres changent
  useEffect(() => {
    const loadPreview = async () => {
      if (!isCreateDialogOpen) return;
      
      setIsLoadingPreview(true);
      const result = await previewItemsCount(
        newSession.type,
        newSession.filtresRayon,
        newSession.filtresFournisseur,
        newSession.filtresEmplacement,
        newSession.filtresPeremptionJours,
        newSession.cycliqueJours
      );
      if (result.success) {
        setPreviewCount(result.count);
      }
      setIsLoadingPreview(false);
    };

    const timeoutId = setTimeout(loadPreview, 300);
    return () => clearTimeout(timeoutId);
  }, [
    isCreateDialogOpen,
    newSession.type,
    newSession.filtresRayon,
    newSession.filtresFournisseur,
    newSession.filtresEmplacement,
    newSession.filtresPeremptionJours,
    newSession.cycliqueJours,
    previewItemsCount
  ]);

  const handleViewSession = (sessionId: string) => {
    if (onViewSession) {
      onViewSession(sessionId);
    }
  };

  const handleEditSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setEditingSession(session);
      setIsEditDialogOpen(true);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    await startSession(sessionId);
  };

  const handleStopSession = async (sessionId: string) => {
    await stopSession(sessionId);
  };

  const handleSuspendSession = async (sessionId: string) => {
    await suspendSession(sessionId);
  };

  const handleResumeSession = async (sessionId: string) => {
    await resumeSession(sessionId);
  };

  const handleUpdateSession = async () => {
    if (editingSession) {
      await updateSession(editingSession.id, {
        nom: editingSession.nom,
        description: editingSession.description,
        type: editingSession.type,
        responsable: editingSession.responsable,
        participants: editingSession.participants,
        secteurs: editingSession.secteurs,
      });
      setIsEditDialogOpen(false);
      setEditingSession(null);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
  };

  const handleCreateSession = async () => {
    try {
      await createSession(newSession);
      setIsCreateDialogOpen(false);
      setNewSession({
        nom: "",
        description: "",
        type: "complet",
        responsable: "",
        participants: [],
        secteurs: [],
        filtresRayon: [],
        filtresFournisseur: [],
        filtresEmplacement: [],
        filtresPeremptionJours: undefined,
        cycliqueJours: 30,
      });
      setPreviewCount(null);
    } catch (error) {
      console.error("Erreur création session:", error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement des sessions...</div>;
  }

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case "planifiee":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "en_cours":
        return <Play className="h-4 w-4 text-blue-600" />;
      case "terminee":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "suspendue":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    const colors = {
      planifiee: "bg-yellow-100 text-yellow-800 border-yellow-200",
      en_cours: "bg-blue-100 text-blue-800 border-blue-200",
      terminee: "bg-green-100 text-green-800 border-green-200",
      suspendue: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <Badge className={colors[statut as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {statut.charAt(0).toUpperCase() + statut.slice(1).replace("_", " ")}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      complet: "bg-purple-100 text-purple-800 border-purple-200",
      partiel: "bg-blue-100 text-blue-800 border-blue-200",
      cyclique: "bg-green-100 text-green-800 border-green-200",
    };

    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.responsable.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "tous" || session.statut === selectedStatus;
    const matchesType = selectedType === "tous" || session.type === selectedType;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Métriques des sessions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sessions Actives</p>
              <p className="text-2xl font-bold text-blue-600">
                {sessions.filter((s) => s.statut === "en_cours").length}
              </p>
            </div>
            <Play className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sessions Planifiées</p>
              <p className="text-2xl font-bold text-yellow-600">
                {sessions.filter((s) => s.statut === "planifiee").length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sessions Terminées</p>
              <p className="text-2xl font-bold text-green-600">
                {sessions.filter((s) => s.statut === "terminee").length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sessions Suspendues</p>
              <p className="text-2xl font-bold text-orange-600">
                {sessions.filter((s) => s.statut === "suspendue").length}
              </p>
            </div>
            <Pause className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>
      </div>

      {/* Gestion des sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sessions d'Inventaire</CardTitle>
              <CardDescription>Gestion et suivi des sessions d'inventaire</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer une Session d'Inventaire</DialogTitle>
                  <DialogDescription>Configurez une nouvelle session d'inventaire avec les critères de sélection</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Nom */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nom" className="text-right">
                      Nom
                    </Label>
                    <Input
                      id="nom"
                      className="col-span-3"
                      placeholder="Nom de la session"
                      value={newSession.nom}
                      onChange={(e) => setNewSession((prev) => ({ ...prev, nom: e.target.value }))}
                    />
                  </div>

                  {/* Type d'inventaire */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Type
                    </Label>
                    <Select
                      value={newSession.type}
                      onValueChange={(value) => setNewSession((prev) => ({ 
                        ...prev, 
                        type: value,
                        // Réinitialiser les filtres lors du changement de type
                        filtresRayon: [],
                        filtresFournisseur: [],
                        filtresEmplacement: [],
                        filtresPeremptionJours: undefined,
                      }))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Type d'inventaire" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complet">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>Complet - Tous les produits en stock</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="partiel">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>Partiel - Filtré par critères</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cyclique">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Cyclique - Produits non inventoriés récemment</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Affichage de la prévisualisation */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="col-span-1"></div>
                    <div className="col-span-3">
                      {isLoadingPreview ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Calcul du nombre de produits...</span>
                        </div>
                      ) : previewCount !== null ? (
                        <div className={`flex items-center gap-2 p-2 rounded-md ${previewCount === 0 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          {previewCount === 0 ? (
                            <>
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-medium">Aucun produit ne correspond aux critères sélectionnés</span>
                            </>
                          ) : (
                            <>
                              <Package className="h-4 w-4" />
                              <span className="font-medium">{previewCount} produit(s) seront inclus dans cette session</span>
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Filtres pour inventaire PARTIEL */}
                  {newSession.type === "partiel" && (
                    <>
                      <div className="col-span-4 border-t pt-4 mt-2">
                        <h4 className="font-medium text-sm text-muted-foreground mb-3">Critères de filtrage (optionnels)</h4>
                      </div>

                      {/* Filtre par Rayon */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Rayons</Label>
                        <div className="col-span-3">
                          <MultiSelect
                            options={rayonOptions}
                            selected={newSession.filtresRayon || []}
                            onSelectedChange={(selected) => setNewSession((prev) => ({ ...prev, filtresRayon: selected }))}
                            placeholder="Tous les rayons"
                          />
                        </div>
                      </div>

                      {/* Filtre par Fournisseur */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Fournisseurs</Label>
                        <div className="col-span-3">
                          <MultiSelect
                            options={fournisseurOptions}
                            selected={newSession.filtresFournisseur || []}
                            onSelectedChange={(selected) => setNewSession((prev) => ({ ...prev, filtresFournisseur: selected }))}
                            placeholder="Tous les fournisseurs"
                          />
                        </div>
                      </div>

                      {/* Filtre par Emplacement */}
                      {emplacementOptions.length > 0 && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Emplacements</Label>
                          <div className="col-span-3">
                            <MultiSelect
                              options={emplacementOptions}
                              selected={newSession.filtresEmplacement || []}
                              onSelectedChange={(selected) => setNewSession((prev) => ({ ...prev, filtresEmplacement: selected }))}
                              placeholder="Tous les emplacements"
                            />
                          </div>
                        </div>
                      )}

                      {/* Filtre par Date de péremption */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Péremption dans</Label>
                        <div className="col-span-3 flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Ex: 90"
                            value={newSession.filtresPeremptionJours || ""}
                            onChange={(e) => setNewSession((prev) => ({ 
                              ...prev, 
                              filtresPeremptionJours: e.target.value ? parseInt(e.target.value) : undefined 
                            }))}
                            className="w-24"
                          />
                          <span className="text-muted-foreground">jours (laisser vide pour ignorer)</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Paramètre pour inventaire CYCLIQUE */}
                  {newSession.type === "cyclique" && (
                    <>
                      <div className="col-span-4 border-t pt-4 mt-2">
                        <h4 className="font-medium text-sm text-muted-foreground mb-3">Paramètres cyclique</h4>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Inventorié depuis plus de</Label>
                        <div className="col-span-3 flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={newSession.cycliqueJours || 30}
                            onChange={(e) => setNewSession((prev) => ({ 
                              ...prev, 
                              cycliqueJours: parseInt(e.target.value) || 30 
                            }))}
                            className="w-24"
                          />
                          <span className="text-muted-foreground">jours (ou jamais inventorié)</span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="col-span-4 border-t pt-4 mt-2">
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Informations de la session</h4>
                  </div>

                  {/* Responsable */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="responsable" className="text-right">
                      Responsable
                    </Label>
                    <Input
                      id="responsable"
                      className="col-span-3"
                      placeholder="Nom du responsable"
                      value={newSession.responsable}
                      onChange={(e) => setNewSession((prev) => ({ ...prev, responsable: e.target.value }))}
                    />
                  </div>

                  {/* Participants */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="participants" className="text-right">
                      Participants
                    </Label>
                    <div className="col-span-3">
                      <MultiSelect
                        options={participantOptions}
                        selected={newSession.participants}
                        onSelectedChange={(selected) => setNewSession((prev) => ({ ...prev, participants: selected }))}
                        placeholder="Sélectionner les participants"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      className="col-span-3"
                      placeholder="Description de la session"
                      value={newSession.description}
                      onChange={(e) => setNewSession((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    onClick={handleCreateSession}
                    disabled={!newSession.nom || previewCount === 0}
                  >
                    Créer Session
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog de modification */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Modifier la Session d'Inventaire</DialogTitle>
                  <DialogDescription>Modifiez les informations de la session d'inventaire</DialogDescription>
                </DialogHeader>
                {editingSession && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-nom" className="text-right">
                        Nom
                      </Label>
                      <Input
                        id="edit-nom"
                        className="col-span-3"
                        value={editingSession.nom}
                        onChange={(e) => setEditingSession((prev) => (prev ? { ...prev, nom: e.target.value } : null))}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-type" className="text-right">
                        Type
                      </Label>
                      <Select
                        value={editingSession.type}
                        onValueChange={(value) =>
                          setEditingSession((prev) => (prev ? { ...prev, type: value as InventorySession["type"] } : null))
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="complet">Complet</SelectItem>
                          <SelectItem value="partiel">Partiel</SelectItem>
                          <SelectItem value="cyclique">Cyclique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-responsable" className="text-right">
                        Responsable
                      </Label>
                      <Input
                        id="edit-responsable"
                        className="col-span-3"
                        value={editingSession.responsable}
                        onChange={(e) =>
                          setEditingSession((prev) => (prev ? { ...prev, responsable: e.target.value } : null))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-participants" className="text-right">
                        Participants
                      </Label>
                      <div className="col-span-3">
                        <MultiSelect
                          options={participantOptions}
                          selected={editingSession.participants}
                          onSelectedChange={(selected) =>
                            setEditingSession((prev) => (prev ? { ...prev, participants: selected } : null))
                          }
                          placeholder="Sélectionner les participants"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="edit-description"
                        className="col-span-3"
                        value={editingSession.description}
                        onChange={(e) =>
                          setEditingSession((prev) => (prev ? { ...prev, description: e.target.value } : null))
                        }
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit" onClick={handleUpdateSession}>
                    Modifier Session
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="planifiee">Planifiée</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="terminee">Terminée</SelectItem>
                <SelectItem value="suspendue">Suspendue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="complet">Complet</SelectItem>
                <SelectItem value="partiel">Partiel</SelectItem>
                <SelectItem value="cyclique">Cyclique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tableau des sessions */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{session.nom}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {session.description}
                        </div>
                        {session.produitsTotal > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {session.produitsComptes}/{session.produitsTotal} produits
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(session.type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(session.statut)}
                        {getStatusBadge(session.statut)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {session.responsable}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${session.progression}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{session.progression}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Créée: {format(session.dateCreation, "dd/MM/yyyy", { locale: fr })}</div>
                        {session.dateDebut && (
                          <div>Début: {format(session.dateDebut, "dd/MM/yyyy", { locale: fr })}</div>
                        )}
                        {session.dateFin && (
                          <div>Fin: {format(session.dateFin, "dd/MM/yyyy", { locale: fr })}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSession(session.id)}
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {session.statut === "planifiee" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartSession(session.id)}
                            title="Démarrer la session"
                          >
                            <Play className="h-4 w-4 text-green-600" />
                          </Button>
                        )}

                        {session.statut === "en_cours" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuspendSession(session.id)}
                            title="Suspendre la session"
                          >
                            <Pause className="h-4 w-4 text-orange-600" />
                          </Button>
                        )}

                        {session.statut === "suspendue" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResumeSession(session.id)}
                            title="Reprendre la session"
                          >
                            <Play className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}

                        {(session.statut === "en_cours" || session.statut === "suspendue") && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Terminer l'inventaire">
                                <Square className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Terminer l'inventaire</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir terminer cette session d'inventaire ? Cette action clôturera
                                  définitivement la session.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleStopSession(session.id)}>
                                  Terminer l'inventaire
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {(session.statut === "planifiee" || session.statut === "suspendue") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSession(session.id)}
                            title="Modifier la session"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}

                        {(session.statut === "planifiee" || session.statut === "terminee") && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Supprimer la session">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer la session</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer cette session d'inventaire ? Cette action est
                                  irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSession(session.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune session trouvée pour les critères sélectionnés
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventorySessions;
