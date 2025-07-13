import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, GraduationCap, User, Users } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/types/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PersonnelModule = () => {
  const { canAccess } = usePermissions();
  const [activeTab, setActiveTab] = useState('employees');

  if (!canAccess(PERMISSIONS.USERS_VIEW)) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Vous n'avez pas les permissions nécessaires pour accéder à ce module.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion du Personnel
          </CardTitle>
          <CardDescription>
            Gestion des employés, horaires, congés et formations (hors gestion des utilisateurs système)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Employés
              </TabsTrigger>
              <TabsTrigger value="schedules" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horaires
              </TabsTrigger>
              <TabsTrigger value="leaves" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Congés
              </TabsTrigger>
              <TabsTrigger value="training" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Formations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="employees" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fiches Employés</CardTitle>
                  <CardDescription>
                    Gestion des informations personnelles et professionnelles des employés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Module en cours de développement
                    <br />
                    <small>Gérera les informations RH, contrats, salaires, etc.</small>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedules" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des Horaires</CardTitle>
                  <CardDescription>
                    Planning et horaires de travail des employés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Module en cours de développement
                    <br />
                    <small>Gérera les plannings, rotations, heures supplémentaires, etc.</small>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaves" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des Congés</CardTitle>
                  <CardDescription>
                    Demandes et validation des congés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Module en cours de développement
                    <br />
                    <small>Gérera les demandes de congés, validations, soldes, etc.</small>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="training" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Formations</CardTitle>
                  <CardDescription>
                    Suivi des formations et certifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Module en cours de développement
                    <br />
                    <small>Gérera les formations, certifications, évaluations, etc.</small>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonnelModule;