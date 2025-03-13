
import React, { useState } from 'react';
import { BarChart, PieChart, LineChart, FileSpreadsheet, Download, Calendar, BarChart2, FileText, FileBarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const ReportsModule = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    setDateRange({
      ...dateRange,
      [type]: e.target.value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analyses & Rapports</h2>
          <p className="text-muted-foreground">Accédez à des analyses détaillées et générez des rapports personnalisés.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => handleDateChange(e, 'start')}
              className="w-auto"
            />
            <span className="text-muted-foreground">à</span>
            <Input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => handleDateChange(e, 'end')}
              className="w-auto"
            />
          </div>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Appliquer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="sales">
            <BarChart className="mr-2 h-4 w-4" />
            Ventes
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <PieChart className="mr-2 h-4 w-4" />
            Inventaire
          </TabsTrigger>
          <TabsTrigger value="clients">
            <LineChart className="mr-2 h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="mr-2 h-4 w-4" />
            Rendez-vous
          </TabsTrigger>
          <TabsTrigger value="financial">
            <BarChart2 className="mr-2 h-4 w-4" />
            Finances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ventes par catégorie</CardTitle>
                <CardDescription>Répartition des ventes par catégorie de produit</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <PieChart className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Rapport détaillé
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Évolution des ventes</CardTitle>
                <CardDescription>Tendance des ventes sur la période sélectionnée</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <LineChart className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Rapport détaillé
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Stock par catégorie</CardTitle>
                <CardDescription>Répartition du stock par catégorie</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <PieChart className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produits en rupture</CardTitle>
                <CardDescription>Liste des produits sous le seuil minimum</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <FileBarChart className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Nouveaux clients</CardTitle>
                <CardDescription>Évolution du nombre de nouveaux clients</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <LineChart className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Rapport détaillé
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profil des clients</CardTitle>
                <CardDescription>Répartition par âge et type de traitement</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <PieChart className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Rapport détaillé
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Rendez-vous par type</CardTitle>
                <CardDescription>Répartition des rendez-vous par type de consultation</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <PieChart className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Rapport détaillé
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendance des rendez-vous</CardTitle>
                <CardDescription>Évolution du nombre de rendez-vous</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <LineChart className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Rapport détaillé
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Chiffre d'affaires</CardTitle>
                <CardDescription>Évolution du chiffre d'affaires</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <LineChart className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Rapport détaillé
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des revenus</CardTitle>
                <CardDescription>Revenus par type de produit et service</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <BarChart className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Rapport détaillé
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsModule;
