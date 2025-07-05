import React from 'react';
import AIDashboard from './ai/AIDashboard';
import ConversationalAI from './ai/ConversationalAI';
import IntelligentDiagnostic from './ai/IntelligentDiagnostic';
import AdvancedForecasting from './ai/AdvancedForecasting';
import SentimentAnalysis from './ai/SentimentAnalysis';
import ComputerVision from './ai/ComputerVision';
import PharmaceuticalExpert from './ai/PharmaceuticalExpert';

interface AssistantIAModuleProps {
  activeSubModule: string;
}

const AssistantIAModule = ({ activeSubModule }: AssistantIAModuleProps) => {
  const renderActiveSubModule = () => {
    switch (activeSubModule) {
        return <AdvancedForecasting />;
      case 'sentiment':
        return <SentimentAnalysis />;
      case 'vision':
        return <ComputerVision />;
      case 'expert pharma':
        return <PharmaceuticalExpert />;
      case 'diagnostic':
        return <IntelligentDiagnostic />;
      case 'recommandations':
        return <StrategicRecommendations />;
      case 'chat ia':
        return <ConversationalAI />;
      case '':
        return <AIDashboard />;
      default:
        return <AIDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {renderActiveSubModule()}
    </div>
  );
};

export default AssistantIAModule;