import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, GraduationCap, User, Users } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/types/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmployeeManagement } from '@/components/dashboard/personnel/EmployeeManagement';
import { ScheduleManagement } from '@/components/dashboard/personnel/ScheduleManagement';
import { LeaveManagement } from '@/components/dashboard/personnel/LeaveManagement';
import { TrainingManagement } from '@/components/dashboard/personnel/TrainingManagement';
import { useLanguage } from '@/contexts/LanguageContext';

const PersonnelModule = () => {
  const { canAccess } = usePermissions();
  const [activeTab, setActiveTab] = useState('employees');
  const { t } = useLanguage();

  if (!canAccess(PERMISSIONS.USERS_VIEW)) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t('noPermission')}
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
            {t('personnelManagement')}
          </CardTitle>
          <CardDescription>
            {t('personnelDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('employees')}
              </TabsTrigger>
              <TabsTrigger value="schedules" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('schedules')}
              </TabsTrigger>
              <TabsTrigger value="leaves" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('leaves')}
              </TabsTrigger>
              <TabsTrigger value="training" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                {t('trainings')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="employees" className="mt-6">
              <EmployeeManagement />
            </TabsContent>

            <TabsContent value="schedules" className="mt-6">
              <ScheduleManagement />
            </TabsContent>

            <TabsContent value="leaves" className="mt-6">
              <LeaveManagement />
            </TabsContent>

            <TabsContent value="training" className="mt-6">
              <TrainingManagement />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonnelModule;