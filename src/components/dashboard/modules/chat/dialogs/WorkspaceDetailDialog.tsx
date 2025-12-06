import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Folder, 
  Users, 
  CheckSquare, 
  FileText, 
  Target, 
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { 
  CollaborativeWorkspace, 
  WorkspaceMember,
  CollaborativeTask,
  SharedDocument
} from '@/hooks/useCollaborativeProductivity';

interface WorkspaceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: CollaborativeWorkspace | null;
  members: WorkspaceMember[];
  tasks: CollaborativeTask[];
  documents: SharedDocument[];
  pharmacies: Array<{ id: string; name: string }>;
  onUpdateProgress: (progress: number) => Promise<void>;
  onAddMember: (pharmacyId: string, role: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  isLoading?: boolean;
}

export function WorkspaceDetailDialog({
  open,
  onOpenChange,
  workspace,
  members,
  tasks,
  documents,
  pharmacies,
  onUpdateProgress,
  onAddMember,
  onRemoveMember,
  isLoading = false
}: WorkspaceDetailDialogProps) {
  const [newProgress, setNewProgress] = useState(workspace?.progress_percent || 0);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');

  useEffect(() => {
    if (workspace) {
      setNewProgress(workspace.progress_percent);
    }
  }, [workspace]);

  if (!workspace) return null;

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'target': return Target;
      case 'trending-up': return TrendingUp;
      case 'users': return Users;
      default: return Folder;
    }
  };

  const IconComponent = getIconComponent(workspace.icon);

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      primary: 'bg-primary',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500',
      red: 'bg-red-500',
      cyan: 'bg-cyan-500'
    };
    return colors[color] || 'bg-primary';
  };

  const workspaceTasks = tasks.filter(t => t.workspace_id === workspace.id);
  const workspaceDocs = documents.filter(d => d.workspace_id === workspace.id);
  const availablePharmacies = pharmacies.filter(
    p => !members.find(m => m.pharmacy_id === p.id)
  );

  const handleAddMember = async () => {
    if (selectedPharmacy) {
      await onAddMember(selectedPharmacy, 'member');
      setSelectedPharmacy('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClass(workspace.color)}/10`}>
              <IconComponent className={`h-6 w-6 text-${workspace.color === 'primary' ? 'primary' : workspace.color + '-500'}`} />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                {workspace.name}
                {workspace.is_network_workspace && (
                  <Badge variant="outline" className="text-xs">Réseau</Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {workspace.description || 'Aucune description'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Progression</Label>
              <span className="text-sm font-medium">{workspace.progress_percent}%</span>
            </div>
            <Progress value={workspace.progress_percent} className="h-2" />
            <div className="flex items-center gap-2">
              <Input
                type="range"
                min="0"
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right">{newProgress}%</span>
              {newProgress !== workspace.progress_percent && (
                <Button size="sm" onClick={() => onUpdateProgress(newProgress)}>
                  Sauvegarder
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Aperçu</TabsTrigger>
              <TabsTrigger value="members">
                Membres ({members.length})
              </TabsTrigger>
              <TabsTrigger value="tasks">
                Tâches ({workspaceTasks.length})
              </TabsTrigger>
              <TabsTrigger value="documents">
                Documents ({workspaceDocs.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[350px] mt-4">
              <TabsContent value="overview" className="space-y-4 m-0">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-2xl font-bold">{members.length}</div>
                    <div className="text-xs text-muted-foreground">Membres</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <CheckSquare className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-2xl font-bold">{workspaceTasks.length}</div>
                    <div className="text-xs text-muted-foreground">Tâches</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-2xl font-bold">{workspaceDocs.length}</div>
                    <div className="text-xs text-muted-foreground">Documents</div>
                  </div>
                </div>

                {/* Goals */}
                {workspace.goals && workspace.goals.length > 0 && (
                  <div className="space-y-2">
                    <Label>Objectifs</Label>
                    <div className="space-y-2">
                      {workspace.goals.map((goal) => (
                        <div
                          key={goal.id}
                          className={`flex items-center gap-2 p-2 rounded border ${
                            goal.completed ? 'bg-green-50 border-green-200' : 'bg-muted'
                          }`}
                        >
                          <CheckSquare className={`h-4 w-4 ${goal.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                          <span className={goal.completed ? 'line-through text-muted-foreground' : ''}>
                            {goal.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Créé le {format(new Date(workspace.created_at), 'dd MMMM yyyy', { locale: fr })}</p>
                  <p>Statut: <Badge variant="outline">{workspace.status}</Badge></p>
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4 m-0">
                {/* Add member */}
                {availablePharmacies.length > 0 && (
                  <div className="flex gap-2">
                    <select
                      value={selectedPharmacy}
                      onChange={(e) => setSelectedPharmacy(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">Ajouter un membre...</option>
                      {availablePharmacies.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <Button size="sm" onClick={handleAddMember} disabled={!selectedPharmacy}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Members list */}
                <div className="space-y-2">
                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun membre
                    </p>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {member.pharmacy_name || member.user_name || 'Membre'}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-2 m-0">
                {workspaceTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucune tâche dans cet espace
                  </p>
                ) : (
                  workspaceTasks.map((task) => (
                    <div key={task.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
                          {task.status}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-2 m-0">
                {workspaceDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun document dans cet espace
                  </p>
                ) : (
                  workspaceDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {doc.category} • {doc.download_count} téléchargements
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
