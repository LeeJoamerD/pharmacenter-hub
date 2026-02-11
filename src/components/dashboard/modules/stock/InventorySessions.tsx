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
import { Plus, Search, CheckCircle, Clock, XCircle, Play, Square, Eye, Edit, Users, Trash2, Pause, Package, AlertTriangle, Loader2, ShoppingCart, Truck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useInventorySessions, InventorySession, CreateSessionData } from "@/hooks/useInventorySessions";
import { useInventoryFilters } from "@/hooks/useInventoryFilters";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface InventorySessionsProps {
  onViewSession?: (sessionId: string, sessionType?: string) => void;
}

interface ReceptionOption {
  id: string;
  numero: string;
  fournisseur: string;
  date: string;
  nb_produits: number;
}

interface SessionCaisseOption {
  id: string;
  numero_session: string;
  caissier: string;
  date: string;
  nb_ventes: number;
}

const InventorySessions: React.FC<InventorySessionsProps> = ({ onViewSession }) => {
  const { t } = useLanguage();
  const { tenantId } = useTenant();
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

  // État pour sélection réception / session caisse
  const [receptionSearch, setReceptionSearch] = useState("");
  const [receptions, setReceptions] = useState<ReceptionOption[]>([]);
  const [selectedReception, setSelectedReception] = useState<ReceptionOption | null>(null);
  const [sessionCaisseSearch, setSessionCaisseSearch] = useState("");
  const [sessionsCaisse, setSessionsCaisse] = useState<SessionCaisseOption[]>([]);
  const [selectedSessionCaisse, setSelectedSessionCaisse] = useState<SessionCaisseOption | null>(null);

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

  // Recherche de réceptions
  useEffect(() => {
    if (newSession.type !== "reception" || !tenantId) return;
    const fetchReceptions = async () => {
      const { data } = await supabase
        .from("receptions_fournisseurs")
        .select("id, numero_reception, date_reception, fournisseurs(nom), lignes_reception_fournisseur(id)")
        .eq("tenant_id", tenantId)
        .eq("statut", "validee")
        .order("date_reception", { ascending: false })
        .limit(20);
      
      if (data) {
        setReceptions(data.map((r: any) => ({
          id: r.id,
          numero: r.numero_reception || "N/A",
          fournisseur: r.fournisseurs?.nom || "Inconnu",
          date: r.date_reception || "",
          nb_produits: r.lignes_reception_fournisseur?.length || 0,
        })));
      }
    };
    fetchReceptions();
  }, [newSession.type, tenantId]);

  // Recherche de sessions de caisse
  useEffect(() => {
    if (newSession.type !== "vente" || !tenantId) return;
    const fetchSessionsCaisse = async () => {
      const { data } = await supabase
        .from("sessions_caisse")
        .select("id, numero_session, date_ouverture, statut, personnel:caissier_id(noms, prenoms)")
        .eq("tenant_id", tenantId)
        .in("statut", ["fermee", "cloturee"])
        .order("date_ouverture", { ascending: false })
        .limit(20);
      
      if (data) {
        setSessionsCaisse(data.map((s: any) => ({
          id: s.id,
          numero_session: s.numero_session || "N/A",
          caissier: s.personnel ? `${s.personnel.prenoms || ""} ${s.personnel.noms || ""}`.trim() : "Inconnu",
          date: s.date_ouverture || "",
          nb_ventes: 0,
        })));
      }
    };
    fetchSessionsCaisse();
  }, [newSession.type, tenantId]);

  // Prévisualisation automatique quand les filtres changent
  useEffect(() => {
    const loadPreview = async () => {
      if (!isCreateDialogOpen) return;
      if (newSession.type === "reception" || newSession.type === "vente") {
        // For reception/vente, preview count is the linked entity's product count
        if (newSession.type === "reception" && selectedReception) {
          setPreviewCount(selectedReception.nb_produits);
        } else if (newSession.type === "vente" && selectedSessionCaisse) {
          setPreviewCount(selectedSessionCaisse.nb_ventes || null);
        } else {
          setPreviewCount(null);
        }
        return;
      }
      
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
    previewItemsCount,
    selectedReception,
    selectedSessionCaisse,
  ]);

  const handleViewSession = (sessionId: string) => {
    if (onViewSession) {
      const session = sessions.find(s => s.id === sessionId);
      onViewSession(sessionId, session?.type);
    }
  };

  const handleEditSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setEditingSession(session);
      setIsEditDialogOpen(true);
    }
  };

  const handleStartSession = async (sessionId: string) => await startSession(sessionId);
  const handleStopSession = async (sessionId: string) => await stopSession(sessionId);
  const handleSuspendSession = async (sessionId: string) => await suspendSession(sessionId);
  const handleResumeSession = async (sessionId: string) => await resumeSession(sessionId);

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

  const handleDeleteSession = async (sessionId: string) => await deleteSession(sessionId);

  const handleCreateSession = async () => {
    try {
      const sessionData: CreateSessionData = {
        ...newSession,
        receptionId: selectedReception?.id,
        sessionCaisseId: selectedSessionCaisse?.id,
      };
      await createSession(sessionData);
      setIsCreateDialogOpen(false);
      setNewSession({
        nom: "", description: "", type: "complet", responsable: "", participants: [],
        secteurs: [], filtresRayon: [], filtresFournisseur: [], filtresEmplacement: [],
        filtresPeremptionJours: undefined, cycliqueJours: 30,
      });
      setPreviewCount(null);
      setSelectedReception(null);
      setSelectedSessionCaisse(null);
    } catch (error) {
      console.error("Erreur création session:", error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">{t('invLoadingSessions')}</div>;
  }

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case "planifiee": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "en_cours": return <Play className="h-4 w-4 text-blue-600" />;
      case "terminee": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "suspendue": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (statut: string) => {
    const map: Record<string, string> = {
      planifiee: t('invStatusPlanifiee'),
      en_cours: t('invStatusEnCours'),
      terminee: t('invStatusTerminee'),
      suspendue: t('invStatusSuspendue'),
    };
    return map[statut] || statut;
  };

  const getStatusBadge = (statut: string) => {
    const colors: Record<string, string> = {
      planifiee: "bg-yellow-100 text-yellow-800 border-yellow-200",
      en_cours: "bg-blue-100 text-blue-800 border-blue-200",
      terminee: "bg-green-100 text-green-800 border-green-200",
      suspendue: "bg-red-100 text-red-800 border-red-200",
    };
    return <Badge className={colors[statut] || "bg-gray-100 text-gray-800"}>{getStatusLabel(statut)}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      complet: t('invTypeComplet'),
      partiel: t('invTypePartiel'),
      cyclique: t('invTypeCyclique'),
      reception: t('invTypeReception'),
      vente: t('invTypeVente'),
    };
    return map[type] || type;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      complet: "bg-purple-100 text-purple-800 border-purple-200",
      partiel: "bg-blue-100 text-blue-800 border-blue-200",
      cyclique: "bg-green-100 text-green-800 border-green-200",
      reception: "bg-orange-100 text-orange-800 border-orange-200",
      vente: "bg-pink-100 text-pink-800 border-pink-200",
    };
    return <Badge variant="outline" className={colors[type] || "bg-gray-100 text-gray-800"}>{getTypeLabel(type)}</Badge>;
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

  const filteredReceptions = receptions.filter(r =>
    r.numero.toLowerCase().includes(receptionSearch.toLowerCase()) ||
    r.fournisseur.toLowerCase().includes(receptionSearch.toLowerCase())
  );

  const filteredSessionsCaisse = sessionsCaisse.filter(s =>
    s.numero_session.toLowerCase().includes(sessionCaisseSearch.toLowerCase()) ||
    s.caissier.toLowerCase().includes(sessionCaisseSearch.toLowerCase())
  );

  const canCreate = () => {
    if (!newSession.nom) return false;
    if (newSession.type === "reception" && !selectedReception) return false;
    if (newSession.type === "vente" && !selectedSessionCaisse) return false;
    if (newSession.type !== "reception" && newSession.type !== "vente" && previewCount === 0) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Métriques des sessions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('invActiveSessions')}</p>
              <p className="text-2xl font-bold text-blue-600">{sessions.filter((s) => s.statut === "en_cours").length}</p>
            </div>
            <Play className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('invPlannedSessions')}</p>
              <p className="text-2xl font-bold text-yellow-600">{sessions.filter((s) => s.statut === "planifiee").length}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('invCompletedSessions')}</p>
              <p className="text-2xl font-bold text-green-600">{sessions.filter((s) => s.statut === "terminee").length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('invSuspendedSessions')}</p>
              <p className="text-2xl font-bold text-orange-600">{sessions.filter((s) => s.statut === "suspendue").length}</p>
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
              <CardTitle>{t('invSessionsTitle')}</CardTitle>
              <CardDescription>{t('invSessionsDesc')}</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('invNewSession')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('invCreateSession')}</DialogTitle>
                  <DialogDescription>{t('invCreateSessionDesc')}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Nom */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nom" className="text-right">{t('invSessionName')}</Label>
                    <Input
                      id="nom"
                      className="col-span-3"
                      placeholder={t('invSessionNamePlaceholder')}
                      value={newSession.nom}
                      onChange={(e) => setNewSession((prev) => ({ ...prev, nom: e.target.value }))}
                    />
                  </div>

                  {/* Type d'inventaire */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">{t('invSessionType')}</Label>
                    <Select
                      value={newSession.type}
                      onValueChange={(value) => {
                        setNewSession((prev) => ({ 
                          ...prev, type: value,
                          filtresRayon: [], filtresFournisseur: [], filtresEmplacement: [],
                          filtresPeremptionJours: undefined,
                        }));
                        setSelectedReception(null);
                        setSelectedSessionCaisse(null);
                      }}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={t('invSessionTypePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complet">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{t('invTypeComplet')} - {t('invTypeCompletDesc')}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="partiel">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{t('invTypePartiel')} - {t('invTypePartielDesc')}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cyclique">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{t('invTypeCyclique')} - {t('invTypeCycliqueDesc')}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="reception">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            <span>{t('invTypeReception')} - {t('invTypeReceptionDesc')}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="vente">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            <span>{t('invTypeVente')} - {t('invTypeVenteDesc')}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Prévisualisation */}
                  {newSession.type !== "reception" && newSession.type !== "vente" && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="col-span-1"></div>
                      <div className="col-span-3">
                        {isLoadingPreview ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{t('invPreviewLoading')}</span>
                          </div>
                        ) : previewCount !== null ? (
                          <div className={`flex items-center gap-2 p-2 rounded-md ${previewCount === 0 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                            {previewCount === 0 ? (
                              <>
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-medium">{t('invPreviewNone')}</span>
                              </>
                            ) : (
                              <>
                                <Package className="h-4 w-4" />
                                <span className="font-medium">{previewCount} {t('invPreviewCount')}</span>
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Sélection de réception */}
                  {newSession.type === "reception" && (
                    <div className="col-span-4 border-t pt-4 mt-2 space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">{t('invSelectReception')}</h4>
                      <Input
                        placeholder={t('invSearchReception')}
                        value={receptionSearch}
                        onChange={(e) => setReceptionSearch(e.target.value)}
                      />
                      <div className="max-h-40 overflow-y-auto border rounded-md">
                        {filteredReceptions.map((r) => (
                          <div
                            key={r.id}
                            className={`p-3 cursor-pointer hover:bg-accent border-b last:border-b-0 ${selectedReception?.id === r.id ? 'bg-primary/10' : ''}`}
                            onClick={() => setSelectedReception(r)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{r.numero}</span>
                                <span className="text-muted-foreground ml-2">- {r.fournisseur}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {r.date && format(new Date(r.date), "dd/MM/yyyy")} • {r.nb_produits} {t('invProducts')}
                              </div>
                            </div>
                          </div>
                        ))}
                        {filteredReceptions.length === 0 && (
                          <div className="p-3 text-center text-muted-foreground text-sm">{t('invNoSessionsFound')}</div>
                        )}
                      </div>
                      {selectedReception && (
                        <div className="bg-primary/5 p-3 rounded-md">
                          <p className="text-sm font-medium">{t('invReceptionSummary')}</p>
                          <p className="text-sm">{selectedReception.numero} - {selectedReception.fournisseur} ({selectedReception.nb_produits} {t('invProducts')})</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sélection de session de caisse */}
                  {newSession.type === "vente" && (
                    <div className="col-span-4 border-t pt-4 mt-2 space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">{t('invSelectSessionCaisse')}</h4>
                      <Input
                        placeholder={t('invSearchSessionCaisse')}
                        value={sessionCaisseSearch}
                        onChange={(e) => setSessionCaisseSearch(e.target.value)}
                      />
                      <div className="max-h-40 overflow-y-auto border rounded-md">
                        {filteredSessionsCaisse.map((s) => (
                          <div
                            key={s.id}
                            className={`p-3 cursor-pointer hover:bg-accent border-b last:border-b-0 ${selectedSessionCaisse?.id === s.id ? 'bg-primary/10' : ''}`}
                            onClick={() => setSelectedSessionCaisse(s)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{s.numero_session}</span>
                                <span className="text-muted-foreground ml-2">- {s.caissier}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {s.date && format(new Date(s.date), "dd/MM/yyyy HH:mm")}
                              </div>
                            </div>
                          </div>
                        ))}
                        {filteredSessionsCaisse.length === 0 && (
                          <div className="p-3 text-center text-muted-foreground text-sm">{t('invNoSessionsFound')}</div>
                        )}
                      </div>
                      {selectedSessionCaisse && (
                        <div className="bg-primary/5 p-3 rounded-md">
                          <p className="text-sm font-medium">{t('invSessionCaisseSummary')}</p>
                          <p className="text-sm">{selectedSessionCaisse.numero_session} - {selectedSessionCaisse.caissier}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Filtres pour inventaire PARTIEL */}
                  {newSession.type === "partiel" && (
                    <>
                      <div className="col-span-4 border-t pt-4 mt-2">
                        <h4 className="font-medium text-sm text-muted-foreground mb-3">{t('invFilterCriteria')}</h4>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">{t('invRayons')}</Label>
                        <div className="col-span-3">
                          <MultiSelect
                            options={rayonOptions}
                            selected={newSession.filtresRayon || []}
                            onSelectedChange={(selected) => setNewSession((prev) => ({ ...prev, filtresRayon: selected }))}
                            placeholder={t('invAllRayons')}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">{t('invFournisseurs')}</Label>
                        <div className="col-span-3">
                          <MultiSelect
                            options={fournisseurOptions}
                            selected={newSession.filtresFournisseur || []}
                            onSelectedChange={(selected) => setNewSession((prev) => ({ ...prev, filtresFournisseur: selected }))}
                            placeholder={t('invAllFournisseurs')}
                          />
                        </div>
                      </div>
                      {emplacementOptions.length > 0 && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">{t('invEmplacements')}</Label>
                          <div className="col-span-3">
                            <MultiSelect
                              options={emplacementOptions}
                              selected={newSession.filtresEmplacement || []}
                              onSelectedChange={(selected) => setNewSession((prev) => ({ ...prev, filtresEmplacement: selected }))}
                              placeholder={t('invAllEmplacements')}
                            />
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">{t('invPeremptionDans')}</Label>
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
                          <span className="text-muted-foreground">{t('invJours')}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Paramètre pour inventaire CYCLIQUE */}
                  {newSession.type === "cyclique" && (
                    <>
                      <div className="col-span-4 border-t pt-4 mt-2">
                        <h4 className="font-medium text-sm text-muted-foreground mb-3">{t('invCycliqueParams')}</h4>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">{t('invCycliqueSince')}</Label>
                        <div className="col-span-3 flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={newSession.cycliqueJours || 30}
                            onChange={(e) => setNewSession((prev) => ({ ...prev, cycliqueJours: parseInt(e.target.value) || 30 }))}
                            className="w-24"
                          />
                          <span className="text-muted-foreground">{t('invCycliqueJoursDesc')}</span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="col-span-4 border-t pt-4 mt-2">
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">{t('invSessionInfo')}</h4>
                  </div>

                  {/* Responsable */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="responsable" className="text-right">{t('invResponsable')}</Label>
                    <Input
                      id="responsable"
                      className="col-span-3"
                      placeholder={t('invResponsablePlaceholder')}
                      value={newSession.responsable}
                      onChange={(e) => setNewSession((prev) => ({ ...prev, responsable: e.target.value }))}
                    />
                  </div>

                  {/* Participants */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="participants" className="text-right">{t('invParticipants')}</Label>
                    <div className="col-span-3">
                      <MultiSelect
                        options={participantOptions}
                        selected={newSession.participants}
                        onSelectedChange={(selected) => setNewSession((prev) => ({ ...prev, participants: selected }))}
                        placeholder={t('invParticipantsPlaceholder')}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">{t('invDescription')}</Label>
                    <Textarea
                      id="description"
                      className="col-span-3"
                      placeholder={t('invDescriptionPlaceholder')}
                      value={newSession.description}
                      onChange={(e) => setNewSession((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateSession} disabled={!canCreate()}>
                    {t('invCreateBtn')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog de modification */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{t('invEditSession')}</DialogTitle>
                  <DialogDescription>{t('invEditSessionDesc')}</DialogDescription>
                </DialogHeader>
                {editingSession && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-nom" className="text-right">{t('invSessionName')}</Label>
                      <Input id="edit-nom" className="col-span-3" value={editingSession.nom}
                        onChange={(e) => setEditingSession((prev) => (prev ? { ...prev, nom: e.target.value } : null))} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-type" className="text-right">{t('invSessionType')}</Label>
                      <Select value={editingSession.type}
                        onValueChange={(value) => setEditingSession((prev) => (prev ? { ...prev, type: value as InventorySession["type"] } : null))}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="complet">{t('invTypeComplet')}</SelectItem>
                          <SelectItem value="partiel">{t('invTypePartiel')}</SelectItem>
                          <SelectItem value="cyclique">{t('invTypeCyclique')}</SelectItem>
                          <SelectItem value="reception">{t('invTypeReception')}</SelectItem>
                          <SelectItem value="vente">{t('invTypeVente')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-responsable" className="text-right">{t('invResponsable')}</Label>
                      <Input id="edit-responsable" className="col-span-3" value={editingSession.responsable}
                        onChange={(e) => setEditingSession((prev) => (prev ? { ...prev, responsable: e.target.value } : null))} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-participants" className="text-right">{t('invParticipants')}</Label>
                      <div className="col-span-3">
                        <MultiSelect options={participantOptions} selected={editingSession.participants}
                          onSelectedChange={(selected) => setEditingSession((prev) => (prev ? { ...prev, participants: selected } : null))}
                          placeholder={t('invParticipantsPlaceholder')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-description" className="text-right">{t('invDescription')}</Label>
                      <Textarea id="edit-description" className="col-span-3" value={editingSession.description}
                        onChange={(e) => setEditingSession((prev) => (prev ? { ...prev, description: e.target.value } : null))} />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit" onClick={handleUpdateSession}>{t('invEditBtn')}</Button>
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
                  placeholder={t('invSearchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('invAllStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">{t('invAllStatuses')}</SelectItem>
                <SelectItem value="planifiee">{t('invStatusPlanifiee')}</SelectItem>
                <SelectItem value="en_cours">{t('invStatusEnCours')}</SelectItem>
                <SelectItem value="terminee">{t('invStatusTerminee')}</SelectItem>
                <SelectItem value="suspendue">{t('invStatusSuspendue')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('invAllTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">{t('invAllTypes')}</SelectItem>
                <SelectItem value="complet">{t('invTypeComplet')}</SelectItem>
                <SelectItem value="partiel">{t('invTypePartiel')}</SelectItem>
                <SelectItem value="cyclique">{t('invTypeCyclique')}</SelectItem>
                <SelectItem value="reception">{t('invTypeReception')}</SelectItem>
                <SelectItem value="vente">{t('invTypeVente')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tableau des sessions */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invSession')}</TableHead>
                  <TableHead>{t('invSessionType')}</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>{t('invResponsable')}</TableHead>
                  <TableHead>{t('invProgression')}</TableHead>
                  <TableHead>{t('invDates')}</TableHead>
                  <TableHead>{t('invActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{session.nom}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">{session.description}</div>
                        {session.produitsTotal > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {session.produitsComptes}/{session.produitsTotal} {t('invProducts')}
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
                          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${session.progression}%` }} />
                        </div>
                        <span className="text-sm font-medium">{session.progression}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{t('invCreated')}: {format(session.dateCreation, "dd/MM/yyyy", { locale: fr })}</div>
                        {session.dateDebut && <div>{t('invStarted')}: {format(session.dateDebut, "dd/MM/yyyy", { locale: fr })}</div>}
                        {session.dateFin && <div>{t('invEnded')}: {format(session.dateFin, "dd/MM/yyyy", { locale: fr })}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewSession(session.id)} title={t('invViewDetails')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {session.statut === "planifiee" && (
                          <Button variant="ghost" size="sm" onClick={() => handleStartSession(session.id)} title={t('invStartSession')}>
                            <Play className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {session.statut === "en_cours" && (
                          <Button variant="ghost" size="sm" onClick={() => handleSuspendSession(session.id)} title={t('invSuspendSession')}>
                            <Pause className="h-4 w-4 text-orange-600" />
                          </Button>
                        )}
                        {session.statut === "suspendue" && (
                          <Button variant="ghost" size="sm" onClick={() => handleResumeSession(session.id)} title={t('invResumeSession')}>
                            <Play className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {(session.statut === "en_cours" || session.statut === "suspendue") && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title={t('invStopSession')}>
                                <Square className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('invStopSession')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('invStopSessionDesc')}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('invCancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleStopSession(session.id)}>
                                  {t('invStopSession')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {(session.statut === "planifiee" || session.statut === "suspendue") && (
                          <Button variant="ghost" size="sm" onClick={() => handleEditSession(session.id)} title={t('invEditTooltip')}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {(session.statut === "planifiee" || session.statut === "terminee") && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title={t('invDeleteTooltip')}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('invDeleteSession')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('invDeleteSessionDesc')}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('invCancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSession(session.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  {t('invDelete')}
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
            <div className="text-center py-8 text-muted-foreground">{t('invNoSessionsFound')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventorySessions;
