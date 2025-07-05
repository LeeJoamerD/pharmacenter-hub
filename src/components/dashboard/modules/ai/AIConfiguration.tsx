import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings, Shield, Database, Zap, Brain, CheckCircle } from 'lucide-react';

const AIConfiguration = () => {
  const [autoLearning, setAutoLearning] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState([85]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuration IA</h2>
          <p className="text-muted-foreground">Paramètres et gouvernance de l'intelligence artificielle</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Paramètres Généraux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Apprentissage Automatique</label>
                <p className="text-sm text-muted-foreground">Formation continue des modèles</p>
              </div>
              <Switch checked={autoLearning} onCheckedChange={setAutoLearning} />
            </div>
            
            <div>
              <label className="font-medium mb-2 block">Seuil de Confiance: {confidenceThreshold[0]}%</label>
              <Slider
                value={confidenceThreshold}
                onValueChange={setConfidenceThreshold}
                max={100}
                min={50}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité & Éthique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Audit IA activé</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Conformité RGPD</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Explicabilité IA</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIConfiguration;