import React from 'react';
import AIDashboard from './ai/AIDashboard';
import ConversationalAI from './ai/ConversationalAI';
import IntelligentDiagnostic from './ai/IntelligentDiagnostic';
import StrategicRecommendations from './ai/StrategicRecommendations';
import AdvancedForecasting from './ai/AdvancedForecasting';
import SentimentAnalysis from './ai/SentimentAnalysis';
import ComputerVision from './ai/ComputerVision';
import PharmaceuticalExpert from './ai/PharmaceuticalExpert';
import AIBusinessIntelligence from './ai/AIBusinessIntelligence';
import ContinuousLearning from './ai/ContinuousLearning';
import AIConfiguration from './ai/AIConfiguration';
import AIAutomation from './ai/AIAutomation';
import AIStockManagement from './ai/AIStockManagement';

interface AssistantIAModuleProps {
  activeSubModule: string;
}

const AssistantIAModule = ({ activeSubModule }: AssistantIAModuleProps) => {
  const renderActiveSubModule = () => {
    switch (activeSubModule) {
      case 'configuration':
        return <AIConfiguration />;
      case 'analytics avancées':
        return <AIBusinessIntelligence />;
      case 'apprentissage':
        return <ContinuousLearning />;
      case 'prévisions':
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
      case 'automatisation':
        return <AIAutomation />;
      case 'stocks ia':
        return <AIStockManagement />;
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