import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Users, Mail, Phone, Calendar, Award } from 'lucide-react';
import { Employee } from './types';

interface EmployeeCardProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export const EmployeeCard = ({ employees, onEdit, onDelete }: EmployeeCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Actif':
        return <Badge variant="default" className="bg-green-100 text-green-800">Actif</Badge>;
      case 'Congé':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Congé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {employees.map((employee) => (
        <Card key={employee.id} className="relative">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Users className="mr-2 h-5 w-5" />
                {employee.prenoms} {employee.noms}
              </CardTitle>
              {getStatusBadge(employee.statut_contractuel)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <Badge variant="outline" className="mr-3">
                  {employee.fonction}
                </Badge>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="mr-2 h-4 w-4" />
                {employee.telephone_appel}
              </div>
              
              {employee.telephone_whatsapp && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="mr-2 h-4 w-4" />
                  WhatsApp: {employee.telephone_whatsapp}
                </div>
              )}
              
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="mr-2 h-4 w-4" />
                {employee.email}
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                Recruté le {new Date(employee.date_recrutement).toLocaleDateString('fr-FR')}
              </div>
              
              {employee.profession && (
                <div className="space-y-2">
                  <div className="flex items-center text-sm font-medium">
                    <Award className="mr-2 h-4 w-4" />
                    Profession: {employee.profession}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(employee)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDelete(employee.id)}
                className="text-red-600 hover:text-red-800 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};