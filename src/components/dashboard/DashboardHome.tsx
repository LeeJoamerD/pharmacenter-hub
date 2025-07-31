
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, PackageSearch, LineChart, User } from "lucide-react";

const DashboardHome = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Services clients</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">42</div>
        <p className="text-xs text-muted-foreground">+8% par rapport à hier</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Produits à renouveler</CardTitle>
        <PackageSearch className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">7</div>
        <p className="text-xs text-muted-foreground">Produits sous le seuil minimum</p>
      </CardContent>
    </Card>
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Ventes des 7 derniers jours</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
          <LineChart className="h-8 w-8 text-muted" />
          <span className="ml-2 text-muted-foreground">Graphique des ventes</span>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Prochains rendez-vous</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">10:00 - Consultation M. Dupont</p>
              <p className="text-xs text-muted-foreground">Suivi traitement diabète</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">14:30 - Livraison fournisseur</p>
              <p className="text-xs text-muted-foreground">Médicaments génériques</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">16:00 - Formation équipe</p>
              <p className="text-xs text-muted-foreground">Nouveaux produits dermatologiques</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>


);

export default DashboardHome;
