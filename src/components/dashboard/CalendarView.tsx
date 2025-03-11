
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CalendarClock, CalendarPlus, Users } from "lucide-react";

const CalendarView = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const appointments = [
    {
      time: "09:00",
      patient: "M. Dupont",
      type: "Consultation",
      status: "confirmed"
    },
    {
      time: "11:30",
      patient: "Mme Martin",
      type: "Suivi",
      status: "pending"
    },
    {
      time: "14:00",
      patient: "M. Bernard",
      type: "Vaccination",
      status: "confirmed"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-0">
        <CardHeader>
          <CardTitle>Calendrier</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border p-3"
            locale={fr}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>
            Rendez-vous du {date ? format(date, "d MMMM yyyy", { locale: fr }) : ""}
          </CardTitle>
          <Button variant="outline" size="icon">
            <CalendarPlus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.map((appointment, index) => (
              <div key={index} className="flex items-center space-x-4 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{appointment.patient}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarClock className="mr-1 h-3 w-3" />
                    {appointment.time} - {appointment.type}
                  </div>
                </div>
                <div className={`rounded-full px-2 py-1 text-xs ${
                  appointment.status === 'confirmed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {appointment.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
