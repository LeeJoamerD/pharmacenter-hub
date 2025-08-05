import { useState } from "react";
import { useExpirationAlerts } from "@/hooks/useExpirationAlerts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, AlertTriangle, Calendar, CheckCircle, X, Settings, 
  Plus, Edit, Trash2, RefreshCw 
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const ExpirationAlert = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");

  const {
    useExpirationAlertsQuery,
    useAlertStatsQuery,
    generateExpirationAlerts,
  } = useExpirationAlerts();

  const { data: alerts, isLoading } = useExpirationAlertsQuery({
    ...(urgencyFilter !== "all" && { niveau_urgence: urgencyFilter }),
  });

  const { data: stats } = useAlertStatsQuery();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Alertes Actives</p>
                <p className="text-2xl font-bold text-red-600">{stats?.active || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertes d'Expiration</CardTitle>
          <CardDescription>Module d'alertes en cours de développement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Interface des alertes d'expiration disponible prochainement
          </div>
        </CardContent>
      </Card>
    </div>
  );
};