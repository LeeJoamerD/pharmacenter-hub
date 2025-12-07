import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Trash2, Save, Edit } from 'lucide-react';
import { ClientSegment } from '@/hooks/useBusinessIntelligence';

interface SegmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: ClientSegment | null;
  onUpdate: (segmentId: string, updates: Partial<ClientSegment>) => Promise<void>;
  onDelete: (segmentId: string) => Promise<void>;
}

export const SegmentDetailDialog: React.FC<SegmentDetailDialogProps> = ({
  open,
  onOpenChange,
  segment,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    segment_name: '',
    next_action: '',
    color: '#3b82f6'
  });

  React.useEffect(() => {
    if (segment) {
      setFormData({
        segment_name: segment.segment_name,
        next_action: segment.next_action || '',
        color: segment.color
      });
    }
  }, [segment]);

  if (!segment) return null;

  const handleSave = async () => {
    await onUpdate(segment.id, formData);
    setIsEditing(false);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce segment ?')) {
      await onDelete(segment.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: segment.color }}
            />
            {isEditing ? 'Modifier Segment' : segment.segment_name}
          </DialogTitle>
          <DialogDescription>
            {segment.is_auto_generated ? 'Segment généré automatiquement' : 'Segment créé manuellement'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du segment</Label>
                <Input
                  value={formData.segment_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, segment_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Action recommandée</Label>
                <Input
                  value={formData.next_action}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_action: e.target.value }))}
                  placeholder="Ex: Programme VIP, Campagne réactivation..."
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-primary' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // View Mode
            <>
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{segment.size}</div>
                  <div className="text-sm text-muted-foreground">Clients</div>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{segment.clv.toLocaleString('fr-FR')}</div>
                  <div className="text-sm text-muted-foreground">CLV (FCFA)</div>
                </div>
              </div>

              {/* Characteristics */}
              <div className="space-y-2">
                <Label>Caractéristiques</Label>
                <div className="flex flex-wrap gap-2">
                  {segment.characteristics.map((char, idx) => (
                    <Badge key={idx} variant="secondary">{char}</Badge>
                  ))}
                  {segment.characteristics.length === 0 && (
                    <span className="text-sm text-muted-foreground">Aucune caractéristique définie</span>
                  )}
                </div>
              </div>

              {/* Next Action */}
              {segment.next_action && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Action recommandée:</strong> {segment.next_action}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge variant={segment.is_active ? 'default' : 'secondary'}>
                  {segment.is_active ? 'Actif' : 'Inactif'}
                </Badge>
                <Badge variant="outline">
                  {segment.is_auto_generated ? 'Auto-généré' : 'Manuel'}
                </Badge>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!segment.is_auto_generated && (
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          )}
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
