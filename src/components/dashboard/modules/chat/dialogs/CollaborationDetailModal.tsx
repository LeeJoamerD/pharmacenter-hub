import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Users, MessageSquare, Clock, Calendar, Building, 
  Edit, Trash2, UserPlus, LogOut, Save, X, Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface Collaboration {
  id: string;
  name: string;
  description: string;
  participants_count: number;
  status: 'active' | 'scheduled' | 'completed' | 'draft';
  created_at: string;
  last_activity: string;
  tenant_id: string;
  participants?: { pharmacy_id: string; pharmacy_name: string; role: string }[];
}

interface CollaborationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration: Collaboration | null;
  onUpdate?: () => void;
  onDelete?: (id: string) => void;
  onLeave?: (id: string) => void;
}

const CollaborationDetailModal = ({
  open,
  onOpenChange,
  collaboration,
  onUpdate,
  onDelete,
  onLeave
}: CollaborationDetailModalProps) => {
  const { currentTenant } = useTenant();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && collaboration) {
      setEditName(collaboration.name);
      setEditDescription(collaboration.description || '');
      loadCollaborationMessages();
    }
  }, [open, collaboration]);

  const loadCollaborationMessages = async () => {
    if (!collaboration) return;
    setLoading(true);

    try {
      const { data } = await supabase
        .from('network_messages')
        .select('id, content, sender_name, sender_pharmacy_id, created_at')
        .eq('channel_id', collaboration.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setMessages(data || []);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!collaboration || !editName.trim()) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('network_channels')
        .update({
          name: editName.trim(),
          description: editDescription.trim()
        })
        .eq('id', collaboration.id);

      if (error) throw error;

      toast.success('Collaboration mise à jour');
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!collaboration) return;
    onDelete?.(collaboration.id);
    onOpenChange(false);
  };

  const handleLeave = async () => {
    if (!collaboration) return;
    onLeave?.(collaboration.id);
    onOpenChange(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800'
    };
    const labels: Record<string, string> = {
      active: 'Actif',
      scheduled: 'Planifié',
      completed: 'Terminé',
      draft: 'Brouillon'
    };
    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (!collaboration) return null;

  const isOwner = collaboration.tenant_id === currentTenant?.id;
  const isParticipant = collaboration.participants?.some(
    p => p.pharmacy_id === currentTenant?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="max-w-xs"
                />
              ) : (
                collaboration.name
              )}
            </div>
            {getStatusBadge(collaboration.status)}
          </DialogTitle>
          <DialogDescription>
            Projet inter-officines • {collaboration.participants_count} participants
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[350px] mt-4">
            {/* Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {collaboration.description || 'Aucune description'}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date de création
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        {new Date(collaboration.created_at).toLocaleDateString('fr-FR', {
                          dateStyle: 'long'
                        })}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Dernière activité
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        {new Date(collaboration.last_activity).toLocaleDateString('fr-FR', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        } as any)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Statistiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {collaboration.participants_count}
                        </div>
                        <p className="text-xs text-muted-foreground">Participants</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {messages.length}
                        </div>
                        <p className="text-xs text-muted-foreground">Messages</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.ceil((new Date().getTime() - new Date(collaboration.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                        </div>
                        <p className="text-xs text-muted-foreground">Jours actifs</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Participants */}
            <TabsContent value="participants" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {collaboration.participants_count} Participants
                </h4>
                {isOwner && (
                  <Button size="sm" variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Inviter
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {collaboration.participants && collaboration.participants.length > 0 ? (
                  collaboration.participants.map((participant, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{participant.pharmacy_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {participant.role}
                          </p>
                        </div>
                      </div>
                      <Badge variant={participant.role === 'admin' ? 'default' : 'secondary'}>
                        {participant.role === 'admin' ? 'Admin' : 'Membre'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun participant trouvé
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Messages */}
            <TabsContent value="messages" className="space-y-4">
              <h4 className="font-medium">Messages Récents</h4>
              
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-16 bg-muted rounded" />
                  ))}
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-2">
                  {messages.map(msg => (
                    <div key={msg.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{msg.sender_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{msg.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun message dans cette collaboration</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="gap-2 flex-wrap">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </>
          ) : (
            <>
              {isOwner && (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la collaboration ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Tous les messages et données seront supprimés.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {isParticipant && !isOwner && (
                <Button variant="outline" onClick={handleLeave}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Quitter
                </Button>
              )}

              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CollaborationDetailModal;
