import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

const CollaborativeProductivityTools = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Productivité Collaborative</CardTitle>
          </div>
          <CardDescription>
            Outils de productivité et collaboration inter-officines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Module Productivité Collaborative en cours de développement
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaborativeProductivityTools;