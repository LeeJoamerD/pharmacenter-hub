import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, Eye, Edit, Percent, Tag, Gift, Target } from 'lucide-react';
import { usePromotions } from '@/hooks/usePromotions';
import { useCurrency } from '@/contexts/CurrencyContext';
import CreatePromotionDialog from './CreatePromotionDialog';
import EditPromotionDialog from './EditPromotionDialog';
import PromotionDetailsDialog from './PromotionDetailsDialog';

const PromotionsTab = () => {
  const { promotions, promotionsLoading, togglePromotion } = usePromotions();
  const { formatPrice } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [viewingPromotion, setViewingPromotion] = useState<any>(null);

  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'Pourcentage':
        return <Percent className="h-4 w-4 text-green-600" />;
      case 'Montant fixe':
        return <Tag className="h-4 w-4 text-blue-600" />;
      case 'Achetez-Obtenez':
        return <Gift className="h-4 w-4 text-purple-600" />;
      case 'Quantité':
        return <Target className="h-4 w-4 text-orange-600" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const filteredPromotions = promotions?.filter(promo => {
    const matchesSearch = promo.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || promo.type_promotion === filterType;
    return matchesSearch && matchesType;
  }) || [];

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await togglePromotion({ id, isActive: !currentStatus });
    } catch (error) {
      console.error('Error toggling promotion:', error);
    }
  };

  if (promotionsLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
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
            <SelectItem value="Pourcentage">Pourcentage</SelectItem>
            <SelectItem value="Montant fixe">Montant fixe</SelectItem>
            <SelectItem value="Achetez-Obtenez">Achetez/Obtenez</SelectItem>
            <SelectItem value="Quantité">Quantité</SelectItem>
          </SelectContent>
        </Select>
        <CreatePromotionDialog />
      </div>

      {/* Liste des promotions */}
      <div className="grid gap-4">
        {filteredPromotions.map((promotion) => (
          <Card key={promotion.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getPromotionTypeIcon(promotion.type_promotion)}
                  <div>
                    <h3 className="font-semibold">{promotion.nom}</h3>
                    <p className="text-sm text-muted-foreground">{promotion.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={promotion.est_actif ? "default" : "secondary"}>
                    {promotion.est_actif ? 'Actif' : 'Inactif'}
                  </Badge>
                  <Switch
                    checked={promotion.est_actif}
                    onCheckedChange={() => handleToggle(promotion.id, promotion.est_actif)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Valeur</p>
                  <p className="text-sm text-muted-foreground">
                    {promotion.type_promotion === 'Pourcentage' ? `${promotion.valeur_promotion}%` :
                     promotion.type_promotion === 'Montant fixe' ? formatPrice(promotion.valeur_promotion) :
                     promotion.type_promotion === 'Achetez-Obtenez' ? `+${promotion.valeur_promotion} gratuit` :
                     `${promotion.valeur_promotion} min`}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Période</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(promotion.date_debut).toLocaleDateString('fr-FR')} - {new Date(promotion.date_fin).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Utilisation</p>
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={promotion.limite_utilisations ? (promotion.nombre_utilisations / promotion.limite_utilisations) * 100 : 0}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      {promotion.nombre_utilisations}/{promotion.limite_utilisations || '∞'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewingPromotion(promotion)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingPromotion(promotion)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPromotions.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune promotion trouvée</p>
              <p className="text-sm text-muted-foreground mb-4">
                Créez votre première promotion pour commencer
              </p>
              <CreatePromotionDialog />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      {editingPromotion && (
        <EditPromotionDialog
          promotion={editingPromotion}
          onClose={() => setEditingPromotion(null)}
        />
      )}

      {viewingPromotion && (
        <PromotionDetailsDialog
          promotion={viewingPromotion}
          onClose={() => setViewingPromotion(null)}
        />
      )}
    </div>
  );
};

export default PromotionsTab;
