import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PromotionStatisticsCards from './promotions/PromotionStatisticsCards';
import PromotionsTab from './promotions/PromotionsTab';
import LoyaltyProgramTab from './promotions/LoyaltyProgramTab';
import RewardsTab from './promotions/RewardsTab';
import PromotionsAnalyticsTab from './promotions/PromotionsAnalyticsTab';

const PromotionsManagerConnected = () => {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Promotions & Fidélité</h2>
        <p className="text-muted-foreground">
          Gestion des promotions, réductions et programme de fidélité
        </p>
      </div>

      {/* Métriques */}
      <PromotionStatisticsCards />

      {/* Onglets principaux */}
      <Tabs defaultValue="promotions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="loyalty">Programme Fidélité</TabsTrigger>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="promotions">
          <PromotionsTab />
        </TabsContent>

        <TabsContent value="loyalty">
          <LoyaltyProgramTab />
        </TabsContent>

        <TabsContent value="rewards">
          <RewardsTab />
        </TabsContent>

        <TabsContent value="analytics">
          <PromotionsAnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PromotionsManagerConnected;
