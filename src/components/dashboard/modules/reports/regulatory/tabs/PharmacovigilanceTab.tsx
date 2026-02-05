 import React, { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { 
   Activity, 
   Search,
   Plus,
   AlertTriangle,
   CheckCircle,
   Send,
   Trash2
 } from 'lucide-react';
 import { PharmacovigilanceReport, CreatePharmacovigilance } from '@/services/RegulatoryService';
 import AddPharmacovigilanceDialog from '../dialogs/AddPharmacovigilanceDialog';
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
 
 interface PharmacovigilanceTabProps {
   reports: PharmacovigilanceReport[];
   onAdd: (data: CreatePharmacovigilance) => void;
   onUpdateStatus: (data: { id: string; statut: string; ansm_reference?: string }) => void;
   onDelete: (id: string) => void;
   isLoading?: boolean;
   tenantId?: string;
 }
 
 const PharmacovigilanceTab: React.FC<PharmacovigilanceTabProps> = ({
   reports,
   onAdd,
   onUpdateStatus,
   onDelete,
   isLoading,
   tenantId
 }) => {
   const [searchTerm, setSearchTerm] = useState('');
   const [showAddDialog, setShowAddDialog] = useState(false);
   const [deleteId, setDeleteId] = useState<string | null>(null);
 
   const filteredReports = reports.filter(r =>
     r.effet_indesirable.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (r.produit_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
   );
 
   const getGraviteColor = (gravite: string) => {
     switch (gravite) {
       case 'mineure': return 'text-green-600';
       case 'moderee': return 'text-yellow-600';
       case 'grave': return 'text-orange-600';
       case 'fatale': return 'text-red-600';
       default: return 'text-gray-600';
     }
   };
 
   const getGraviteLabel = (gravite: string) => {
     switch (gravite) {
       case 'mineure': return 'Mineure';
       case 'moderee': return 'Modérée';
       case 'grave': return 'Grave';
       case 'fatale': return 'Fatale';
       default: return gravite;
     }
   };
 
   const getStatutColor = (statut: string) => {
     switch (statut) {
       case 'declare_ansm': return 'bg-green-50 text-green-600';
       case 'clos': return 'bg-gray-50 text-gray-600';
       case 'suivi': return 'bg-blue-50 text-blue-600';
       default: return 'bg-yellow-50 text-yellow-600';
     }
   };
 
   const getStatutLabel = (statut: string) => {
     switch (statut) {
       case 'declare_ansm': return 'Déclaré ANSM';
       case 'clos': return 'Clos';
       case 'suivi': return 'En suivi';
       default: return 'En cours';
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
                 <Activity className="h-5 w-5" />
                 Pharmacovigilance
               </CardTitle>
               <CardDescription>Surveillance des effets indésirables</CardDescription>
             </div>
             <Button size="sm" onClick={() => setShowAddDialog(true)}>
               <Plus className="h-4 w-4 mr-2" />
               Nouvelle Déclaration
             </Button>
           </div>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Rechercher par effet ou médicament..." 
                 className="pl-10"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             
             {filteredReports.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">
                 <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                 <p>Aucune déclaration de pharmacovigilance</p>
                 <Button 
                   variant="outline" 
                   className="mt-4"
                   onClick={() => setShowAddDialog(true)}
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Créer une déclaration
                 </Button>
               </div>
             ) : (
               <div className="space-y-3">
                 {filteredReports.map((report) => (
                   <div key={report.id} className="p-4 border rounded-lg">
                     <div className="flex items-center justify-between mb-3">
                       <div>
                         <h4 className="font-semibold">{report.produit_nom || 'Médicament non spécifié'}</h4>
                         <p className="text-sm text-muted-foreground">ID: {report.id.substring(0, 8)}</p>
                       </div>
                       <div className="flex items-center gap-2">
                         {report.suivi_requis && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                         <Badge className={getStatutColor(report.statut)}>
                           {getStatutLabel(report.statut)}
                         </Badge>
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                       <div>
                         <p className="text-muted-foreground">Effet Indésirable</p>
                         <p className="font-semibold">{report.effet_indesirable}</p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">Gravité</p>
                         <p className={`font-semibold ${getGraviteColor(report.gravite)}`}>
                           {getGraviteLabel(report.gravite)}
                         </p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">Âge Patient</p>
                         <p className="font-semibold">{report.patient_age ? `${report.patient_age} ans` : 'N/A'}</p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">Date Déclaration</p>
                         <p className="font-semibold">{report.date_declaration}</p>
                       </div>
                     </div>
                     
                     {report.suivi_requis && (
                       <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                         <p className="text-yellow-800 font-medium">⚠️ Suivi médical requis</p>
                       </div>
                     )}
 
                     <div className="flex items-center gap-2 mt-3">
                       {report.statut === 'en_cours' && (
                         <Button 
                           size="sm" 
                           variant="outline"
                           onClick={() => onUpdateStatus({ id: report.id, statut: 'declare_ansm' })}
                         >
                           <Send className="h-4 w-4 mr-2" />
                           Déclarer ANSM
                         </Button>
                       )}
                       {report.statut !== 'clos' && (
                         <Button 
                           size="sm" 
                           variant="outline"
                           onClick={() => onUpdateStatus({ id: report.id, statut: 'clos' })}
                         >
                           <CheckCircle className="h-4 w-4 mr-2" />
                           Clore
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
                 ))}
               </div>
             )}
           </div>
         </CardContent>
       </Card>
 
       <AddPharmacovigilanceDialog
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
               Êtes-vous sûr de vouloir supprimer cette déclaration de pharmacovigilance ?
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
     </>
   );
 };
 
 export default PharmacovigilanceTab;