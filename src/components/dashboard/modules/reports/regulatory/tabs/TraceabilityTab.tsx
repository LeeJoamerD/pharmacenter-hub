 import React, { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Progress } from '@/components/ui/progress';
 import { 
   Package, 
   Search,
   Filter,
   Eye,
   Download
 } from 'lucide-react';
 import { TrackedLot } from '@/services/RegulatoryService';
 
 interface TraceabilityTabProps {
   lots: TrackedLot[];
   isLoading?: boolean;
 }
 
 const TraceabilityTab: React.FC<TraceabilityTabProps> = ({ lots, isLoading }) => {
   const [searchTerm, setSearchTerm] = useState('');
   const [statusFilter, setStatusFilter] = useState<string>('all');
 
   const filteredLots = lots.filter(lot => {
     const matchesSearch = 
       lot.numero_lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
       lot.produit_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
       lot.fournisseur_nom.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesStatus = statusFilter === 'all' || lot.statut === statusFilter;
     return matchesSearch && matchesStatus;
   });
 
   const getStatusColor = (statut: string) => {
     switch (statut) {
       case 'Active': return 'bg-blue-50 text-blue-600';
       case 'Expirée': return 'bg-red-50 text-red-600';
       case 'Rappelée': return 'bg-yellow-50 text-yellow-600';
       default: return 'bg-gray-50 text-gray-600';
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
     <Card>
       <CardHeader>
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               <Package className="h-5 w-5" />
               Traçabilité des Médicaments
             </CardTitle>
             <CardDescription>Suivi complet des lots pharmaceutiques</CardDescription>
           </div>
           <Button variant="outline" size="sm">
             <Download className="h-4 w-4 mr-2" />
             Exporter
           </Button>
         </div>
       </CardHeader>
       <CardContent>
         <div className="space-y-4">
           <div className="flex items-center gap-4">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Rechercher par lot, produit ou fournisseur..." 
                 className="pl-10"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <Button 
               variant={statusFilter === 'all' ? 'default' : 'outline'} 
               size="sm"
               onClick={() => setStatusFilter('all')}
             >
               Tous
             </Button>
             <Button 
               variant={statusFilter === 'Active' ? 'default' : 'outline'} 
               size="sm"
               onClick={() => setStatusFilter('Active')}
             >
               Actifs
             </Button>
             <Button 
               variant={statusFilter === 'Expirée' ? 'default' : 'outline'} 
               size="sm"
               onClick={() => setStatusFilter('Expirée')}
             >
               Expirés
             </Button>
           </div>
           
           {filteredLots.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
               <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>Aucun lot trouvé</p>
             </div>
           ) : (
             <div className="space-y-3">
               {filteredLots.map((lot) => {
                 const quantiteVendue = lot.quantite_initiale - lot.quantite_restante;
                 const progressionVentes = lot.quantite_initiale > 0 
                   ? (quantiteVendue / lot.quantite_initiale) * 100 
                   : 0;
 
                 return (
                   <div key={lot.id} className="p-4 border rounded-lg">
                     <div className="flex items-center justify-between mb-3">
                       <div>
                         <h4 className="font-semibold">{lot.produit_nom}</h4>
                         <p className="text-sm text-muted-foreground">
                           Lot: {lot.numero_lot} • Fournisseur: {lot.fournisseur_nom}
                         </p>
                       </div>
                       <Badge className={getStatusColor(lot.statut)}>
                         {lot.statut}
                       </Badge>
                     </div>
                     
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                       <div>
                         <p className="text-muted-foreground">Date Réception</p>
                         <p className="font-semibold">{lot.date_reception || 'N/A'}</p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">Date Péremption</p>
                         <p className={`font-semibold ${lot.statut === 'Expirée' ? 'text-red-600' : ''}`}>
                           {lot.date_peremption || 'N/A'}
                         </p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">Quantité Reçue</p>
                         <p className="font-semibold">{lot.quantite_initiale}</p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">Restant</p>
                         <p className="font-semibold">{lot.quantite_restante}</p>
                       </div>
                     </div>
                     
                     <div className="mt-3">
                       <div className="flex justify-between text-xs mb-1">
                         <span>Progression ventes</span>
                         <span>{progressionVentes.toFixed(1)}%</span>
                       </div>
                       <Progress value={progressionVentes} className="h-2" />
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
         </div>
       </CardContent>
     </Card>
   );
 };
 
 export default TraceabilityTab;