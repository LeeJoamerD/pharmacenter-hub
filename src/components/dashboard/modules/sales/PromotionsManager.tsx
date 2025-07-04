import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Tag,
  Plus,
  Search,
  Filter,
  Star,
  Gift,
  Percent,
  Calendar,
  Users,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Edit,
  Trash2,
  Eye,
  Crown
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';

// Types pour la gestion des promotions
interface Promotion {
  id: number;
  name: string;
  type: 'percentage' | 'fixed' | 'buy_get' | 'quantity';
  value: number;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  conditions: string;
  applicableProducts: string[];
  usageCount: number;
  maxUsage?: number;
  targetCustomers: 'all' | 'loyalty' | 'new' | 'vip';
}

interface LoyaltyProgram {
  id: number;
  customerName: string;
  customerPhone: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  joinDate: Date;
  lastActivity: Date;
  totalSpent: number;
  rewardsEarned: number;
  rewardsUsed: number;
}

interface Reward {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'freeProduct' | 'cashback';
  value: number;
  isActive: boolean;
  expirationDays: number;
}

// Données mockées
const promotions: Promotion[] = [
  {
    id: 1,
    name: 'Remise 15% Médicaments',
    type: 'percentage',
    value: 15,
    description: 'Remise de 15% sur tous les médicaments de base',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    isActive: true,
    conditions: 'Achat minimum 50,000 FCFA',
    applicableProducts: ['Paracétamol', 'Amoxicilline', 'Aspirine'],
    usageCount: 45,
    maxUsage: 100,
    targetCustomers: 'all'
  },
  {
    id: 2,
    name: 'Achetez 2, Obtenez 1 Gratuit',
    type: 'buy_get',
    value: 1,
    description: 'Pour chaque 2 articles achetés, obtenez le 3ème gratuit',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-02-15'),
    isActive: true,
    conditions: 'Valable sur produits d\'hygiène uniquement',
    applicableProducts: ['Savons', 'Crèmes', 'Shampooings'],
    usageCount: 23,
    maxUsage: 50,
    targetCustomers: 'loyalty'
  },
  {
    id: 3,
    name: 'Bonus Nouveaux Clients',
    type: 'fixed',
    value: 10000,
    description: 'Réduction de 10,000 FCFA pour les nouveaux clients',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    isActive: true,
    conditions: 'Première visite uniquement',
    applicableProducts: [],
    usageCount: 12,
    targetCustomers: 'new'
  }
];

const loyaltyMembers: LoyaltyProgram[] = [
  {
    id: 1,
    customerName: 'Fatou Keita',
    customerPhone: '07 11 22 33 44',
    points: 2850,
    tier: 'gold',
    joinDate: new Date('2023-06-15'),
    lastActivity: new Date('2024-01-20'),
    totalSpent: 1425000,
    rewardsEarned: 15,
    rewardsUsed: 8
  },
  {
    id: 2,
    customerName: 'Mamadou Toure',
    customerPhone: '05 99 88 77 66',
    points: 1240,
    tier: 'silver',
    joinDate: new Date('2023-09-10'),
    lastActivity: new Date('2024-01-18'),
    totalSpent: 620000,
    rewardsEarned: 8,
    rewardsUsed: 3
  },
  {
    id: 3,
    customerName: 'Aissata Diallo',
    customerPhone: '01 44 55 66 77',
    points: 4200,
    tier: 'platinum',
    joinDate: new Date('2023-03-20'),
    lastActivity: new Date('2024-01-19'),
    totalSpent: 2100000,
    rewardsEarned: 25,
    rewardsUsed: 12
  }
];

const rewards: Reward[] = [
  {
    id: 1,
    name: 'Remise 5%',
    description: 'Remise de 5% sur votre prochain achat',
    pointsCost: 500,
    type: 'discount',
    value: 5,
    isActive: true,
    expirationDays: 30
  },
  {
    id: 2,
    name: 'Paracétamol Gratuit',
    description: 'Boîte de Paracétamol 500mg gratuite',
    pointsCost: 1000,
    type: 'freeProduct',
    value: 2500,
    isActive: true,
    expirationDays: 60
  },
  {
    id: 3,
    name: 'Cashback 20,000 FCFA',
    description: 'Cashback de 20,000 FCFA sur votre compte',
    pointsCost: 2000,
    type: 'cashback',
    value: 20000,
    isActive: true,
    expirationDays: 90
  }
];

const PromotionsManager = () => {
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isNewPromotionOpen, setIsNewPromotionOpen] = useState(false);
  const [isNewRewardOpen, setIsNewRewardOpen] = useState(false);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return <Badge className="bg-orange-100 text-orange-800">Bronze</Badge>;
      case 'silver':
        return <Badge className="bg-gray-100 text-gray-800">Silver</Badge>;
      case 'gold':
        return <Badge className="bg-yellow-100 text-yellow-800">Gold</Badge>;
      case 'platinum':
        return <Badge className="bg-purple-100 text-purple-800">Platinum</Badge>;
      default:
        return <Badge variant="secondary">{tier}</Badge>;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return <Trophy className="h-4 w-4 text-orange-600" />;
      case 'silver':
        return <Trophy className="h-4 w-4 text-gray-600" />;
      case 'gold':
        return <Trophy className="h-4 w-4 text-yellow-600" />;
      case 'platinum':
        return <Crown className="h-4 w-4 text-purple-600" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-4 w-4 text-green-600" />;
      case 'fixed':
        return <Tag className="h-4 w-4 text-blue-600" />;
      case 'buy_get':
        return <Gift className="h-4 w-4 text-purple-600" />;
      case 'quantity':
        return <Target className="h-4 w-4 text-orange-600" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const handleCreatePromotion = () => {
    toast({
      title: "Promotion créée",
      description: "La nouvelle promotion a été créée avec succès.",
    });
    setIsNewPromotionOpen(false);
  };

  const handleCreateReward = () => {
    toast({
      title: "Récompense créée",
      description: "La nouvelle récompense a été ajoutée au programme.",
    });
    setIsNewRewardOpen(false);
  };

  const totalActivePromotions = promotions.filter(p => p.isActive).length;
  const totalLoyaltyMembers = loyaltyMembers.length;
  const totalPointsDistributed = loyaltyMembers.reduce((sum, member) => sum + member.points, 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Promotions & Fidélité</h2>
          <p className="text-muted-foreground">
            Gestion des promotions, réductions et programme de fidélité
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog open={isNewRewardOpen} onOpenChange={setIsNewRewardOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Gift className="h-4 w-4 mr-2" />
                Nouvelle Récompense
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isNewPromotionOpen} onOpenChange={setIsNewPromotionOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Promotion
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promotions Actives</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivePromotions}</div>
            <p className="text-xs text-muted-foreground">
              Sur {promotions.length} promotions totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres Fidélité</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLoyaltyMembers}</div>
            <p className="text-xs text-muted-foreground">
              +5 nouveaux ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points en Circulation</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPointsDistributed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Points accumulés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              Promotions utilisées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="promotions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="loyalty">Programme Fidélité</TabsTrigger>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="promotions" className="space-y-4">
          {/* Filtres pour promotions */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une promotion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="percentage">Pourcentage</SelectItem>
                <SelectItem value="fixed">Montant fixe</SelectItem>
                <SelectItem value="buy_get">Achetez/Obtenez</SelectItem>
                <SelectItem value="quantity">Quantité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des promotions */}
          <div className="grid gap-4">
            {promotions.map((promotion) => (
              <Card key={promotion.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getPromotionTypeIcon(promotion.type)}
                      <div>
                        <h3 className="font-semibold">{promotion.name}</h3>
                        <p className="text-sm text-muted-foreground">{promotion.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={promotion.isActive ? "default" : "secondary"}>
                        {promotion.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Switch checked={promotion.isActive} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium">Valeur</p>
                      <p className="text-sm text-muted-foreground">
                        {promotion.type === 'percentage' ? `${promotion.value}%` : 
                         promotion.type === 'fixed' ? formatPrice(promotion.value) :
                         promotion.type === 'buy_get' ? `+${promotion.value} gratuit` :
                         `${promotion.value} min`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Période</p>
                      <p className="text-sm text-muted-foreground">
                        {promotion.startDate.toLocaleDateString('fr-FR')} - {promotion.endDate.toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Utilisation</p>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={promotion.maxUsage ? (promotion.usageCount / promotion.maxUsage) * 100 : 0} 
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">
                          {promotion.usageCount}/{promotion.maxUsage}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Membres du Programme de Fidélité</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Total Dépensé</TableHead>
                    <TableHead>Récompenses</TableHead>
                    <TableHead>Dernière Activité</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loyaltyMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.customerName}</p>
                          <p className="text-sm text-muted-foreground">{member.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTierIcon(member.tier)}
                          {getTierBadge(member.tier)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{member.points.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>{formatPrice(member.totalSpent)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>Obtenues: {member.rewardsEarned}</p>
                          <p className="text-muted-foreground">Utilisées: {member.rewardsUsed}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.lastActivity.toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            Voir Profil
                          </Button>
                          <Button size="sm">
                            Ajuster Points
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Gift className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{reward.name}</h3>
                    </div>
                    <Switch checked={reward.isActive} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Coût en points:</span>
                      <span className="font-medium">{reward.pointsCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Valeur:</span>
                      <span className="font-medium">
                        {reward.type === 'discount' ? `${reward.value}%` : formatPrice(reward.value)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Expiration:</span>
                      <span className="font-medium">{reward.expirationDays} jours</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance des Promotions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {promotions.slice(0, 3).map((promotion) => (
                    <div key={promotion.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{promotion.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {promotion.usageCount} utilisations
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {promotion.maxUsage ? Math.round((promotion.usageCount / promotion.maxUsage) * 100) : 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">Taux d'utilisation</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des Niveaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['platinum', 'gold', 'silver', 'bronze'].map((tier) => {
                    const count = loyaltyMembers.filter(m => m.tier === tier).length;
                    const percentage = (count / loyaltyMembers.length) * 100;
                    
                    return (
                      <div key={tier} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getTierIcon(tier)}
                          <span className="capitalize">{tier}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Progress value={percentage} className="w-20" />
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Nouvelle Promotion */}
      <Dialog open={isNewPromotionOpen} onOpenChange={setIsNewPromotionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une Nouvelle Promotion</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="promotionName">Nom de la Promotion</Label>
              <Input id="promotionName" placeholder="Ex: Remise Été 2024" />
            </div>
            
            <div className="space-y-2">
              <Label>Type de Promotion</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage</SelectItem>
                  <SelectItem value="fixed">Montant fixe</SelectItem>
                  <SelectItem value="buy_get">Achetez/Obtenez</SelectItem>
                  <SelectItem value="quantity">Quantité minimale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotionValue">Valeur</Label>
              <Input id="promotionValue" type="number" placeholder="15" />
            </div>
            
            <div className="space-y-2">
              <Label>Clients Cibles</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  <SelectItem value="new">Nouveaux clients</SelectItem>
                  <SelectItem value="loyalty">Membres fidélité</SelectItem>
                  <SelectItem value="vip">Clients VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de Début</Label>
              <Input id="startDate" type="date" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de Fin</Label>
              <Input id="endDate" type="date" />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="promotionDescription">Description</Label>
              <Textarea id="promotionDescription" placeholder="Description de la promotion..." />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="conditions">Conditions d'Application</Label>
              <Textarea id="conditions" placeholder="Ex: Achat minimum de 50,000 FCFA..." />
            </div>
            
            <div className="col-span-2 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNewPromotionOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreatePromotion}>
                Créer la Promotion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouvelle Récompense */}
      <Dialog open={isNewRewardOpen} onOpenChange={setIsNewRewardOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une Nouvelle Récompense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rewardName">Nom de la Récompense</Label>
              <Input id="rewardName" placeholder="Ex: Remise 10%" />
            </div>
            
            <div className="space-y-2">
              <Label>Type de Récompense</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Remise</SelectItem>
                  <SelectItem value="freeProduct">Produit gratuit</SelectItem>
                  <SelectItem value="cashback">Cashback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pointsCost">Coût en Points</Label>
              <Input id="pointsCost" type="number" placeholder="500" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rewardValue">Valeur</Label>
              <Input id="rewardValue" type="number" placeholder="10" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expirationDays">Expiration (jours)</Label>
              <Input id="expirationDays" type="number" placeholder="30" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rewardDescription">Description</Label>
              <Textarea id="rewardDescription" placeholder="Description de la récompense..." />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNewRewardOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateReward}>
                Créer la Récompense
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionsManager;