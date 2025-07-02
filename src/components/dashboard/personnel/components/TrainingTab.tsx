import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Award, CheckCircle } from 'lucide-react';
import { Training } from '../types';

interface TrainingTabProps {
  trainings: Training[];
  onNewTraining: () => void;
  onEditTraining: (training: Training) => void;
  onDeleteTraining: (id: number) => void;
  onGenerateCertificate: (id: number) => void;
  onMarkTrainingComplete: (id: number) => void;
}

export const TrainingTab: React.FC<TrainingTabProps> = ({
  trainings,
  onNewTraining,
  onEditTraining,
  onDeleteTraining,
  onGenerateCertificate,
  onMarkTrainingComplete
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
            <CardTitle>Formations et Certifications</CardTitle>
            <CardDescription>
              Suivi des formations obligatoires et certifications professionnelles
            </CardDescription>
          </div>
          <Button 
            onClick={onNewTraining}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle formation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Formation</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Date début</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainings.map((training) => (
                <TableRow key={training.id}>
                  <TableCell className="font-medium">{training.nom}</TableCell>
                  <TableCell>{training.employes.join(', ')}</TableCell>
                  <TableCell>{new Date(training.dateDebut).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{new Date(training.dateFin).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{getStatusBadge(training.statut)}</TableCell>
                   <TableCell>
                     <div className="flex items-center space-x-2">
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => onEditTraining(training)}
                       >
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => onDeleteTraining(training.id)}
                         className="text-red-600 hover:text-red-800 hover:border-red-300"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                       {training.certificat_requis && training.statut === 'Terminé' && (
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => onGenerateCertificate(training.id)}
                           className="text-blue-600 hover:text-blue-800"
                         >
                           <Award className="h-4 w-4" />
                         </Button>
                       )}
                       {training.statut === 'En cours' && (
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => onMarkTrainingComplete(training.id)}
                           className="text-green-600 hover:text-green-800"
                         >
                           <CheckCircle className="h-4 w-4" />
                         </Button>
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