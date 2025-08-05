import { useState } from "react";
import { useFIFOConfiguration } from "@/hooks/useFIFOConfiguration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, Settings, Plus, Edit, Trash2, CheckCircle, 
  RotateCcw, TrendingUp, AlertCircle, Info 
} from "lucide-react";

export const FIFOConfig = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    useFIFOConfigurationsQuery,
  } = useFIFOConfiguration();

  const { data: configurations, isLoading } = useFIFOConfigurationsQuery();

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Info className="h-8 w-8 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">Configuration FIFO (First In, First Out)</h3>
              <p className="text-blue-700 mt-1">
                Le système FIFO garantit que les lots les plus anciens sont vendus en premier.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurations FIFO</CardTitle>
          <CardDescription>Module FIFO en cours de développement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Interface de configuration FIFO disponible prochainement
          </div>
        </CardContent>
      </Card>
    </div>
  );
};