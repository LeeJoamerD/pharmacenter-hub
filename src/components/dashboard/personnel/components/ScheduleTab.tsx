import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CalendarIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { Schedule } from '../types';

interface ScheduleTabProps {
  schedules: Schedule[];
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  scheduleViewMode: 'day' | 'week';
  setScheduleViewMode: (mode: 'day' | 'week') => void;
  onNewSchedule: () => void;
  onEditSchedule: (schedule: Schedule) => void;
  onDeleteSchedule: (id: number) => void;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  schedules,
  selectedDate,
  setSelectedDate,
  scheduleViewMode,
  setScheduleViewMode,
  onNewSchedule,
  onEditSchedule,
  onDeleteSchedule
}) => {
  const getSchedulesForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === dateString);
  };

  const getScheduleStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmé':
        return <Badge variant="default" className="bg-green-100 text-green-800">Confirmé</Badge>;
      case 'Planifié':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Planifié</Badge>;
      case 'En cours':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En cours</Badge>;
      case 'Terminé':
        return <Badge variant="default" className="bg-gray-100 text-gray-800">Terminé</Badge>;
      case 'Annulé':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Gestion des Plannings
            </CardTitle>
            <CardDescription>
              Planification des horaires et affectation du personnel
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <ToggleGroup type="single" value={scheduleViewMode} onValueChange={(value) => value && setScheduleViewMode(value as 'day' | 'week')}>
              <ToggleGroupItem value="day" aria-label="Vue journalière">
                Jour
              </ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="Vue hebdomadaire">
                Semaine
              </ToggleGroupItem>
            </ToggleGroup>
            <Button 
              onClick={onNewSchedule}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau planning
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calendrier</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
          
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Planning du {selectedDate ? selectedDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'jour sélectionné'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate && getSchedulesForDate(selectedDate).length > 0 ? (
                  <div className="space-y-3">
                    {getSchedulesForDate(selectedDate).map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{schedule.employe}</p>
                              <p className="text-sm text-muted-foreground">
                                {schedule.heureDebut} - {schedule.heureFin} • {schedule.poste}
                              </p>
                              {schedule.notes && (
                                <p className="text-xs text-muted-foreground mt-1">{schedule.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {getScheduleStatusBadge(schedule.statut)}
                              <Badge variant="outline">{schedule.typeShift}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onEditSchedule(schedule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onDeleteSchedule(schedule.id)}
                            className="text-red-600 hover:text-red-800 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Aucun planning pour cette date</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={onNewSchedule}
                    >
                      Ajouter un planning
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résumé hebdomadaire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">Total heures planifiées</div>
                    <div className="text-2xl font-bold text-primary">132h</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">Employés actifs</div>
                    <div className="text-2xl font-bold text-primary">3</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">Créneaux à confirmer</div>
                    <div className="text-2xl font-bold text-yellow-600">2</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">Conflits détectés</div>
                    <div className="text-2xl font-bold text-red-600">0</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};