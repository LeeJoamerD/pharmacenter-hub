import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Users, 
  PackageSearch, 
  LineChart, 
  RefreshCw, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Calendar
} from "lucide-react";;

// --- Fonctions utilitaires locales (pour remplacer celles du backend) ---

/**
 * Formate un nombre en devise (Franc CFA).
 * @param {number} amount - Le montant à formater.
 * @returns {string} - Le montant formaté.
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF', // Franc CFA d'Afrique Centrale
    minimumFractionDigits: 0,
  }).format(amount);
};

const DashboardHome = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    
  </div>


);

export default DashboardHome;
