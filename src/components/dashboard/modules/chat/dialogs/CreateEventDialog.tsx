import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CollaborativeEvent } from '@/hooks/useCollaborativeProductivity';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: Partial<CollaborativeEvent>) => Promise<void>;
  pharmacies: Array<{ id: string; name: string }>;
  isSubmitting?: boolean;
}

export function CreateEventDialog({
  open,
  onOpenChange,
  onSubmit,
  pharmacies,
  isSubmitting = false
}: CreateEventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<'meeting' | 'training' | 'event' | 'deadline'>('meeting');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [isNetworkEvent, setIsNetworkEvent] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !eventDate) return;
    
    await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      event_type: eventType,
      event_date: new Date(eventDate).toISOString(),
      event_time: eventTime || null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      location: location.trim() || null,
      is_virtual: isVirtual,
      meeting_link: isVirtual ? meetingLink.trim() || null : null,
      is_network_event: isNetworkEvent,
      reminder_enabled: reminderEnabled,
      reminder_minutes: reminderMinutes,
      participants: selectedParticipants.map(id => ({ pharmacy_id: id, status: 'pending' }))
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setEventType('meeting');
    setEventDate('');
    setEventTime('');
    setEndDate('');
    setLocation('');
    setIsVirtual(false);
    setMeetingLink('');
    setIsNetworkEvent(false);
    setReminderEnabled(true);
    setReminderMinutes(30);
    setSelectedParticipants([]);
    onOpenChange(false);
  };

  const toggleParticipant = (pharmacyId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(pharmacyId) 
        ? prev.filter(id => id !== pharmacyId)
        : [...prev, pharmacyId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nouvel Événement</DialogTitle>
            <DialogDescription>
              Planifier un événement collaboratif
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de l'événement"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description détaillée..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={eventType} onValueChange={(v) => setEventType(v as typeof eventType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Réunion</SelectItem>
                      <SelectItem value="training">Formation</SelectItem>
                      <SelectItem value="event">Événement</SelectItem>
                      <SelectItem value="deadline">Échéance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="eventDate">Date *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="eventTime">Heure</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Événement virtuel</Label>
                  <p className="text-xs text-muted-foreground">
                    Visioconférence ou en ligne
                  </p>
                </div>
                <Switch
                  checked={isVirtual}
                  onCheckedChange={setIsVirtual}
                />
              </div>

              {isVirtual ? (
                <div className="grid gap-2">
                  <Label htmlFor="meetingLink">Lien de la réunion</Label>
                  <Input
                    id="meetingLink"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.example.com/..."
                  />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="location">Lieu</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Adresse ou lieu"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rappel</Label>
                  <p className="text-xs text-muted-foreground">
                    Notification avant l'événement
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={reminderEnabled}
                    onCheckedChange={setReminderEnabled}
                  />
                  {reminderEnabled && (
                    <Select 
                      value={reminderMinutes.toString()} 
                      onValueChange={(v) => setReminderMinutes(parseInt(v))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">1 heure</SelectItem>
                        <SelectItem value="1440">1 jour</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Événement réseau</Label>
                  <p className="text-xs text-muted-foreground">
                    Visible par les autres officines
                  </p>
                </div>
                <Switch
                  checked={isNetworkEvent}
                  onCheckedChange={setIsNetworkEvent}
                />
              </div>

              <div className="grid gap-2">
                <Label>Participants ({selectedParticipants.length})</Label>
                <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-2">
                  {pharmacies.map((pharmacy) => (
                    <div key={pharmacy.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`participant-${pharmacy.id}`}
                        checked={selectedParticipants.includes(pharmacy.id)}
                        onCheckedChange={() => toggleParticipant(pharmacy.id)}
                      />
                      <label 
                        htmlFor={`participant-${pharmacy.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {pharmacy.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !eventDate}>
              {isSubmitting ? 'Création...' : 'Créer l\'événement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
