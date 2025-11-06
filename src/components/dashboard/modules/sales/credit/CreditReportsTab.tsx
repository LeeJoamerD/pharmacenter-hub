import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Download } from "lucide-react";

export const CreditReportsTab = () => {
  const handleExportExcel = () => {
    // TODO: Implémenter l'export Excel
    console.log("Export Excel");
  };

  const handleExportPDF = () => {
    // TODO: Implémenter l'export PDF
    console.log("Export PDF");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rapports et Exports</CardTitle>
          <p className="text-sm text-muted-foreground">
            Générer et exporter des rapports détaillés sur la gestion du crédit
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Export Excel
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Exporter toutes les données de crédit au format Excel
                </p>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportExcel} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger Excel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  Export PDF
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Générer un rapport PDF complet de la situation crédit
                </p>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportPDF} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Rapports Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Balance des Comptes - Liste complète avec soldes</li>
                <li>• Ancienneté des Créances - Analyse par période (0-30j, 31-60j, 61-90j, 90+j)</li>
                <li>• Activité par Période - Évolution des crédits sur la période sélectionnée</li>
                <li>• Résumé Global - Statistiques détaillées et KPIs</li>
                <li>• Historique des Transactions - Détail complet des mouvements</li>
                <li>• Échéanciers Actifs - Liste des échéanciers en cours</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
