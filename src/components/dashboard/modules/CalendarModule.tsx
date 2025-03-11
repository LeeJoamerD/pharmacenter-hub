
import React from 'react';
import CalendarView from '@/components/dashboard/CalendarView';

const CalendarModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Calendrier & Rendez-vous</h2>
    <p className="text-muted-foreground">Planifiez et gérez vos rendez-vous et événements.</p>
    <CalendarView />
  </div>
);

export default CalendarModule;
