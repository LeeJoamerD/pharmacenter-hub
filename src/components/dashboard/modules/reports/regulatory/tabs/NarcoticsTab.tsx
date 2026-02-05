 import React, { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Progress } from '@/components/ui/progress';
 import { 
   Lock, 
   Search,
   Filter,
   Eye,
   Plus,
   Pill,
   CheckCircle,
   Clock,
   AlertTriangle,
   Download
 } from 'lucide-react';
 import { NarcoticProduct, NarcoticMovement } from '@/services/RegulatoryService';
 import AddNarcoticMovementDialog from '../dialogs/AddNarcoticMovementDialog';
 
 interface NarcoticsTabProps {
   products: NarcoticProduct[];
   movements: NarcoticMovement[];
   onAddMovement: (data: any) => void;
   isLoading?: boolean;
   tenantId?: string;
 }
 
 const NarcoticsTab: React.FC<NarcoticsTabProps> = ({
   products,
   movements,
   onAddMovement,
   isLoading,
   tenantId
 }) => {
   const [searchTerm, setSearchTerm] = useState('');
   const [showAddDialog, setShowAddDialog] = useState(false);
   const [selectedProduct, setSelectedProduct] = useState<NarcoticProduct | null>(null);
 
   const filteredProducts = products.filter(p =>
     p.libelle_produit.toLowerCase().includes(searchTerm.toLowerCase())
   );
 
   const getComplianceIcon = (product: NarcoticProduct) => {
     if (product.stock_actuel > product.stock_critique) {
       return <CheckCircle className="h-4 w-4 text-green-600" />;
     } else if (product.stock_actuel > 0) {
       return <Clock className="h-4 w-4 text-yellow-600" />;
     }
     return <AlertTriangle className="h-4 w-4 text-red-600" />;
   };
 
   const getComplianceStatus = (product: NarcoticProduct) => {
     if (product.stock_actuel > product.stock_critique) return 'Conforme';
     if (product.stock_actuel > 0) return 'À vérifier';
     return 'Non conforme';
   };
 
   const getProductMovements = (productId: string) => {
     return movements.filter(m => m.produit_id === productId);
   };
 
   const calculateMovementStats = (productId: string) => {
     const prodMovements = getProductMovements(productId);
     const entrees = prodMovements
       .filter(m => m.type_mouvement === 'entree')
       .reduce((sum, m) => sum + m.quantite, 0);
     const sorties = prodMovements
       .filter(m => m.type_mouvement === 'sortie')
       .reduce((sum, m) => sum + m.quantite, 0);
     return { entrees, sorties };
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
                 <Lock className="h-5 w-5" />
                 Registre des Stupéfiants
               </CardTitle>
               <CardDescription>Suivi réglementaire des substances contrôlées</CardDescription>
             </div>
             <div className="flex gap-2">
               <Button variant="outline" size="sm">
                 <Download className="h-4 w-4 mr-2" />
                 Exporter PDF
               </Button>
               <Button size="sm" onClick={() => setShowAddDialog(true)}>
                 <Plus className="h-4 w-4 mr-2" />
                 Mouvement
               </Button>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             <div className="flex items-center gap-4">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Rechercher une substance..." 
                   className="pl-10"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               <Button variant="outline" size="sm">
                 <Filter className="h-4 w-4 mr-2" />
                 Filtrer
               </Button>
             </div>
             
             {filteredProducts.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">
                 <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                 <p>Aucun produit stupéfiant trouvé</p>
                 <p className="text-sm mt-2">
                   Marquez des produits comme stupéfiants dans le catalogue pour les voir ici.
                 </p>
               </div>
             ) : (
               <div className="space-y-3">
                 {filteredProducts.map((product) => {
                   const stats = calculateMovementStats(product.id);
                   const status = getComplianceStatus(product);
                   
                   return (
                     <div key={product.id} className="p-4 border rounded-lg">
                       <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-3">
                           <Pill className="h-5 w-5 text-purple-600" />
                           <div>
                             <h4 className="font-semibold">{product.libelle_produit}</h4>
                             <p className="text-sm text-muted-foreground">ID: {product.id.substring(0, 8)}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                           {getComplianceIcon(product)}
                           <Badge className={
                             status === 'Conforme' 
                               ? 'bg-green-50 text-green-600' 
                               : status === 'À vérifier'
                               ? 'bg-yellow-50 text-yellow-600'
                               : 'bg-red-50 text-red-600'
                           }>
                             {status}
                           </Badge>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                         <div>
                           <p className="text-muted-foreground">Stock Initial</p>
                           <p className="font-semibold">{product.stock_actuel + stats.sorties - stats.entrees}</p>
                         </div>
                         <div>
                           <p className="text-muted-foreground">Entrées</p>
                           <p className="font-semibold text-green-600">+{stats.entrees}</p>
                         </div>
                         <div>
                           <p className="text-muted-foreground">Sorties</p>
                           <p className="font-semibold text-red-600">-{stats.sorties}</p>
                         </div>
                         <div>
                           <p className="text-muted-foreground">Stock Final</p>
                           <p className="font-semibold">{product.stock_actuel}</p>
                         </div>
                         <div>
                           <p className="text-muted-foreground">Seuil Critique</p>
                           <p className="font-semibold">{product.stock_critique}</p>
                         </div>
                       </div>
                       
                       <div className="flex items-center justify-between mt-3">
                         <Progress 
                           value={Math.min((product.stock_actuel / (product.stock_critique * 2)) * 100, 100)} 
                           className="flex-1 mr-4 h-2" 
                         />
                         <Button 
                           size="sm" 
                           variant="outline"
                           onClick={() => setSelectedProduct(product)}
                         >
                           <Eye className="h-4 w-4 mr-2" />
                           Détails
                         </Button>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
           </div>
         </CardContent>
       </Card>
 
       <AddNarcoticMovementDialog
         open={showAddDialog}
         onOpenChange={setShowAddDialog}
         products={products}
         onSubmit={(data) => {
           onAddMovement(data);
           setShowAddDialog(false);
         }}
         tenantId={tenantId}
       />
     </>
   );
 };
 
 export default NarcoticsTab;