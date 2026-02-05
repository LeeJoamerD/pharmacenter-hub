 import React, { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { 
   FileText, 
   Plus,
   Eye,
   Upload,
   Trash2
 } from 'lucide-react';
 import { MandatoryReport, CreateMandatoryReport } from '@/services/RegulatoryService';
 import AddMandatoryReportDialog from '../dialogs/AddMandatoryReportDialog';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 
 interface MandatoryReportsTabProps {
   reports: MandatoryReport[];
   onAdd: (data: CreateMandatoryReport) => void;
   onSubmit: (id: string) => void;
   onDelete: (id: string) => void;
   isLoading?: boolean;
   tenantId?: string;
 }
 
 const MandatoryReportsTab: React.FC<MandatoryReportsTabProps> = ({
   reports,
   onAdd,
   onSubmit,
   onDelete,
   isLoading,
   tenantId
 }) => {
   const [showAddDialog, setShowAddDialog] = useState(false);
   const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewReport, setViewReport] = useState<MandatoryReport | null>(null);
 
   const getStatusColor = (statut: string) => {
     switch (statut) {
       case 'complete': return 'text-green-600 bg-green-50';
       case 'en_cours': return 'text-blue-600 bg-blue-50';
       case 'urgent': return 'text-red-600 bg-red-50';
       case 'en_retard': return 'text-red-600 bg-red-50';
       case 'planifie': return 'text-gray-600 bg-gray-50';
       default: return 'text-gray-600 bg-gray-50';
     }
   };
 
   const getStatusLabel = (statut: string) => {
     switch (statut) {
       case 'complete': return 'Complété';
       case 'en_cours': return 'En cours';
       case 'urgent': return 'Urgent';
       case 'en_retard': return 'En retard';
       case 'planifie': return 'Planifié';
       default: return statut;
     }
   };
 
   const getFrequenceLabel = (frequence: string) => {
     switch (frequence) {
       case 'quotidien': return 'Quotidien';
       case 'hebdomadaire': return 'Hebdomadaire';
       case 'mensuel': return 'Mensuel';
       case 'trimestriel': return 'Trimestriel';
       case 'annuel': return 'Annuel';
       case 'immediat': return 'Immédiat';
       default: return frequence;
     }
   };
 
   if (isLoading) {
     return (
       <Card>
         <CardContent className="flex items-center justify-center py-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <>
       <Card>
         <CardHeader>
           <div className="flex items-center justify-between">
             <div>
               <CardTitle className="flex items-center gap-2">
                 <FileText className="h-5 w-5" />
                 Rapports Obligatoires
               </CardTitle>
               <CardDescription>Planning et suivi des déclarations réglementaires</CardDescription>
             </div>
             <Button size="sm" onClick={() => setShowAddDialog(true)}>
               <Plus className="h-4 w-4 mr-2" />
               Nouveau Rapport
             </Button>
           </div>
         </CardHeader>
         <CardContent>
           {reports.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
               <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>Aucun rapport obligatoire planifié</p>
               <Button 
                 variant="outline" 
                 className="mt-4"
                 onClick={() => setShowAddDialog(true)}
               >
                 <Plus className="h-4 w-4 mr-2" />
                 Planifier un rapport
               </Button>
             </div>
           ) : (
             <div className="space-y-4">
               {reports.map((report) => (
                 <div key={report.id} className="p-4 border rounded-lg">
                   <div className="flex items-center justify-between mb-3">
                     <div>
                       <h4 className="font-semibold">{report.nom}</h4>
                       <p className="text-sm text-muted-foreground">
                         {getFrequenceLabel(report.frequence)} • Responsable: {report.responsable_nom}
                       </p>
                     </div>
                     <Badge className={getStatusColor(report.statut)}>
                       {getStatusLabel(report.statut)}
                     </Badge>
                   </div>
                   
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                     <div>
                       <p className="text-muted-foreground">Prochaine Échéance</p>
                       <p className={`font-semibold ${report.statut === 'urgent' || report.statut === 'en_retard' ? 'text-red-600' : ''}`}>
                         {report.prochaine_echeance}
                       </p>
                     </div>
                     <div>
                       <p className="text-muted-foreground">Autorité</p>
                       <p className="font-semibold">{report.autorite_destinataire}</p>
                     </div>
                     <div>
                       <p className="text-muted-foreground">Progression</p>
                       <p className="font-semibold">{report.progression}%</p>
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                     <Progress value={report.progression} className="h-2" />
                     <div className="flex justify-between items-center">
                       <span className="text-xs text-muted-foreground">
                         {report.progression < 50 ? 'Début' : report.progression < 80 ? 'En cours' : 'Finalisation'}
                       </span>
                       <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setViewReport(report)}
                          >
                           <Eye className="h-4 w-4 mr-2" />
                           Voir
                         </Button>
                         {report.statut !== 'complete' && (
                           <Button 
                             size="sm" 
                             variant={report.statut === 'urgent' ? 'default' : 'outline'}
                             onClick={() => onSubmit(report.id)}
                           >
                             <Upload className="h-4 w-4 mr-2" />
                             Soumettre
                           </Button>
                         )}
                         <Button 
                           size="sm" 
                           variant="ghost"
                           className="text-red-600"
                           onClick={() => setDeleteId(report.id)}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
 
       <AddMandatoryReportDialog
         open={showAddDialog}
         onOpenChange={setShowAddDialog}
         onSubmit={(data) => {
           onAdd(data);
           setShowAddDialog(false);
         }}
         tenantId={tenantId}
       />
 
       <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
             <AlertDialogDescription>
               Êtes-vous sûr de vouloir supprimer ce rapport obligatoire ?
               Cette action est irréversible.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Annuler</AlertDialogCancel>
             <AlertDialogAction 
               className="bg-red-600 hover:bg-red-700"
               onClick={() => {
                 if (deleteId) {
                   onDelete(deleteId);
                   setDeleteId(null);
                 }
               }}
             >
               Supprimer
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

      <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewReport?.nom}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{viewReport?.type_rapport}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fréquence</p>
                <p className="font-medium">{viewReport?.frequence ? getFrequenceLabel(viewReport.frequence) : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Autorité destinataire</p>
                <p className="font-medium">{viewReport?.autorite_destinataire}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responsable</p>
                <p className="font-medium">{viewReport?.responsable_nom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prochaine échéance</p>
                <p className="font-medium">{viewReport?.prochaine_echeance}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dernière soumission</p>
                <p className="font-medium">{viewReport?.derniere_soumission || 'Jamais'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">Progression</p>
              <Progress value={viewReport?.progression} className="h-2" />
              <p className="text-sm mt-1">{viewReport?.progression}%</p>
            </div>
            
            {viewReport?.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{viewReport.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
     </>
   );
 };
 
 export default MandatoryReportsTab;