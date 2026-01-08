import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Users } from 'lucide-react';
import { Employee } from './types';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export const EmployeeTable = ({ employees, onEdit, onDelete }: EmployeeTableProps) => {
  const { t } = useLanguage();
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Actif':
        return <Badge variant="default" className="bg-green-100 text-green-800">{t('active')}</Badge>;
      case 'Congé':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">{t('leaves')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('lastName')}</TableHead>
            <TableHead>{t('firstName')}</TableHead>
            <TableHead>{t('function')}</TableHead>
            <TableHead>{t('phone')}</TableHead>
            <TableHead>{t('email')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead>{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-blue-500" />
                  {employee.noms}
                </div>
              </TableCell>
              <TableCell>{employee.prenoms}</TableCell>
              <TableCell>{employee.fonction}</TableCell>
              <TableCell>{employee.telephone_appel}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{getStatusBadge(employee.statut_contractuel)}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEdit(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDelete(employee.id)}
                    className="text-red-600 hover:text-red-800 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};