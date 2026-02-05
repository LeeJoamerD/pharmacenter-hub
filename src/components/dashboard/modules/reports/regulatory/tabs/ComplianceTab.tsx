 import React, { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { 
   BookOpen, 
   Settings,
   Plus,
   CheckCircle,
   Clock,
   AlertTriangle
 } from 'lucide-react';
 import { AuditEntry, ComplianceAction } from '@/services/RegulatoryService';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 
 interface ComplianceTabProps {
   audits: AuditEntry[];
   actions: ComplianceAction[];
   onAddAction: (data: { titre: string; description: string; echeance?: string }) => void;
   isLoading?: boolean;
 }
 
 const ComplianceTab: React.FC<ComplianceTabProps> = ({
   audits,
   actions,
   onAddAction,
   isLoading
 }) => {
   const [showAddDialog, setShowAddDialog] = useState(false);
   const [newAction, setNewAction] = useState({ titre: '', description: '', echeance: '' });
 
   const getAuditStatusColor = (statut: string) => {
     switch (statut) {
       case 'Conforme': return 'bg-green-50 text-green-600';
       case 'Non conforme': return 'bg-red-50 text-red-600';
       case 'Préparation': return 'bg-blue-50 text-blue-600';
       default: return 'bg-gray-50 text-gray-600';
     }
   };
 
   const getActionStatusColor = (statut: string) => {
     switch (statut) {
       case 'complete': return 'bg-green-50 border-green-200 text-green-800';
       case 'en_cours': return 'bg-blue-50 border-blue-200 text-blue-800';
       case 'planifie': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
       default: return 'bg-gray-50 border-gray-200 text-gray-800';
     }
   };
 
   const getActionIcon = (statut: string) => {
     switch (statut) {
       case 'complete': return '✓';
       case 'en_cours': return '🔄';
       case 'planifie': return '⚠️';
       default: return '•';
     }
   };
 
   const handleSubmit = () => {
     if (newAction.titre && newAction.description) {
       onAddAction({
         titre: newAction.titre,
         description: newAction.description,
         echeance: newAction.echeance || undefined
       });
       setNewAction({ titre: '', description: '', echeance: '' });
       setShowAddDialog(false);
     }
   };
 
   if (isLoading) {
     return (
       <div className="grid gap-6 md:grid-cols-2">
         <Card>
           <CardContent className="flex items-center justify-center py-12">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="flex items-center justify-center py-12">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
           </CardContent>
         </Card>
       </div>
     );
   }
 
   return (
     <>
       <div className="grid gap-6 md:grid-cols-2">
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <BookOpen className="h-5 w-5" />
               Audits de Conformité
             </CardTitle>
             <CardDescription>Historique et planning des audits</CardDescription>
           </CardHeader>
           <CardContent>
             {audits.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                 <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                 <p>Aucun audit enregistré</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {audits.map((audit) => (
                   <div key={audit.id} className="p-3 border rounded-lg">
                     <div className="flex justify-between items-center">
                       <div>
                         <p className="font-medium">{audit.nom}</p>
                         <p className="text-sm text-muted-foreground">{audit.date}</p>
                       </div>
                       <Badge className={getAuditStatusColor(audit.statut)}>
                         {audit.statut}
                       </Badge>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <div className="flex items-center justify-between">
               <div>
                 <CardTitle className="flex items-center gap-2">
                   <Settings className="h-5 w-5" />
                   Actions de Mise en Conformité
                 </CardTitle>
                 <CardDescription>Recommandations et actions correctives</CardDescription>
               </div>
               <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
                 <Plus className="h-4 w-4 mr-2" />
                 Ajouter
               </Button>
             </div>
           </CardHeader>
           <CardContent>
             {actions.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                 <Settings className="h-10 w-10 mx-auto mb-3 opacity-50" />
                 <p>Aucune action corrective</p>
                 <Button 
                   variant="outline" 
                   className="mt-4"
                   onClick={() => setShowAddDialog(true)}
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Créer une action
                 </Button>
               </div>
             ) : (
               <div className="space-y-3">
                 {actions.map((action) => (
                   <div 
                     key={action.id} 
                     className={`p-3 border rounded-lg ${getActionStatusColor(action.statut)}`}
                   >
                     <p className="text-sm font-medium">
                       {getActionIcon(action.statut)} {action.titre}
                     </p>
                     <p className="text-xs opacity-80">{action.description}</p>
                     {action.echeance && (
                       <p className="text-xs opacity-60 mt-1">Échéance: {action.echeance}</p>
                     )}
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
       </div>
 
       <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Nouvelle Action Corrective</DialogTitle>
             <DialogDescription>
               Créez une nouvelle action de mise en conformité
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="titre">Titre</Label>
               <Input
                 id="titre"
                 value={newAction.titre}
                 onChange={(e) => setNewAction({ ...newAction, titre: e.target.value })}
                 placeholder="Formation Personnel"
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="description">Description</Label>
               <Textarea
                 id="description"
                 value={newAction.description}
                 onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                 placeholder="Mise à jour réglementaire à effectuer..."
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="echeance">Échéance (optionnel)</Label>
               <Input
                 id="echeance"
                 type="date"
                 value={newAction.echeance}
                 onChange={(e) => setNewAction({ ...newAction, echeance: e.target.value })}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowAddDialog(false)}>
               Annuler
             </Button>
             <Button onClick={handleSubmit} disabled={!newAction.titre || !newAction.description}>
               Créer
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </>
   );
 };
 
 export default ComplianceTab;