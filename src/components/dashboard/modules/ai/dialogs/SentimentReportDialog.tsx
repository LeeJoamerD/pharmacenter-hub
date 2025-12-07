import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download,
  FileSpreadsheet,
  Star,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import type { SentimentMetrics, SentimentAnalysis, SentimentKeyword } from '@/hooks/useSentimentAnalysis';
import { 
  exportSentimentReportPDF, 
  exportAnalysesToExcel 
} from '@/utils/sentimentExportUtils';

interface SentimentReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: SentimentMetrics | null;
  analyses: SentimentAnalysis[];
  keywords: SentimentKeyword[];
  pharmacyName: string;
}

const SentimentReportDialog: React.FC<SentimentReportDialogProps> = ({
  open,
  onOpenChange,
  metrics,
  analyses,
  keywords,
  pharmacyName
}) => {
  const handleExportPDF = () => {
    if (metrics) {
      exportSentimentReportPDF(metrics, analyses, keywords, pharmacyName);
    }
  };

  const handleExportExcel = () => {
    exportAnalysesToExcel(analyses, pharmacyName);
  };

  if (!metrics) return null;

  const getScoreIcon = (score: number) => {
    if (score >= 4) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (score >= 3) return <Minus className="h-4 w-4 text-gray-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapport d'Analyse de Sentiment
          </DialogTitle>
          <DialogDescription>
            Synthèse complète des analyses de sentiment pour {pharmacyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* KPI Summary */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-4">Indicateurs Clés</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-2xl font-bold">{metrics.globalScore?.toFixed(1) || '0'}</span>
                    <span className="text-muted-foreground">/5</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Score Global</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-green-600">{metrics.positiveRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">Avis Positifs</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{metrics.totalAnalyses || 0}</div>
                  <p className="text-xs text-muted-foreground">Total Analysés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribution */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-4">Distribution des Sentiments</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm">Positifs</span>
                  <Progress value={metrics.positiveRate || 0} className="flex-1 h-3" />
                  <span className="w-12 text-right text-sm font-medium">{metrics.positiveRate || 0}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm">Neutres</span>
                  <Progress value={metrics.neutralRate || 0} className="flex-1 h-3" />
                  <span className="w-12 text-right text-sm font-medium">{metrics.neutralRate || 0}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm">Négatifs</span>
                  <Progress value={metrics.negativeRate || 0} className="flex-1 h-3" />
                  <span className="w-12 text-right text-sm font-medium">{metrics.negativeRate || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          {metrics.categoryBreakdown && metrics.categoryBreakdown.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Performance par Catégorie</h4>
                <div className="space-y-2">
                  {metrics.categoryBreakdown.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-2">
                        {getScoreIcon(cat.score)}
                        <span className="font-medium capitalize">{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{cat.volume} avis</Badge>
                        <span className="font-semibold">{cat.score}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Keywords */}
          {keywords.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Mots-clés Principaux</h4>
                <div className="flex flex-wrap gap-2">
                  {keywords.slice(0, 12).map((kw, idx) => (
                    <Badge 
                      key={idx}
                      variant={kw.sentiment === 'positive' ? 'default' : 'destructive'}
                      className={kw.sentiment === 'positive' ? 'bg-green-100 text-green-700' : ''}
                    >
                      {kw.word} ({kw.frequency})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SentimentReportDialog;
