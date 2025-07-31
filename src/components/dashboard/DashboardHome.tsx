import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, PackageSearch, LineChart, User } from "lucide-react";

const DashboardHome = () => {
  // Utilisation des données statiques définies ci-dessus
  const { 
    todaySales, 
    todayTransactions, 
    lowStockCount, 
    expiringCount, 
    activeSessions 
  } = staticData;

  // La fonction de rafraîchissement est maintenant une simple alerte pour la démo.
  const handleRefresh = () => {
    alert("Ceci est une démo statique. Le rafraîchissement n'est pas actif.");
  };


);

export default DashboardHome;
