import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

const NetworkConversationalAI = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>Assistant IA Réseau</CardTitle>
          </div>
          <CardDescription>
            Intelligence artificielle collaborative pour le réseau multi-officines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Module Assistant IA Réseau en cours de développement
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkConversationalAI;