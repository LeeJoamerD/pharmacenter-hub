import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, CheckCircle, X } from 'lucide-react';
import { LeaveRequest } from '../types';

interface LeavesTabProps {
  leaveRequests: LeaveRequest[];
  onNewLeaveRequest: () => void;
  onEditLeaveRequest: (request: LeaveRequest) => void;
  onDeleteLeaveRequest: (id: number) => void;
}

export const LeavesTab: React.FC<LeavesTabProps> = ({
  leaveRequests,
  onNewLeaveRequest,
  onEditLeaveRequest,
  onDeleteLeaveRequest
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approuvé':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approuvé</Badge>;
      case 'En attente':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'Planifié':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Planifié</Badge>;
      case 'Terminé':
        return <Badge variant="default" className="bg-green-100 text-green-800">Terminé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Demandes de Congés</CardTitle>
            <CardDescription>
              Gestion des congés et absences du personnel
            </CardDescription>
          </div>
          <Button 
            onClick={() => {
              console.log('Bouton Nouvelle demande cliqué');
              onNewLeaveRequest();
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle demande
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date début</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.employe}</TableCell>
                  <TableCell>{request.type}</TableCell>
                  <TableCell>{new Date(request.dateDebut).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{new Date(request.dateFin).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{getStatusBadge(request.statut)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditLeaveRequest(request)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onDeleteLeaveRequest(request.id)}
                        className="text-red-600 hover:text-red-800 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {request.statut === 'En attente' && (
                        <>
                          <Button variant="outline" size="sm" className="text-green-600 hover:text-green-800">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-800">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};