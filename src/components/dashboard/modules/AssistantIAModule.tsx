import React from 'react';
import AIDashboard from './ai/AIDashboard';
import ConversationalAI from './ai/ConversationalAI';
import IntelligentDiagnostic from './ai/IntelligentDiagnostic';
import StrategicRecommendations from './ai/StrategicRecommendations';

interface AssistantIAModuleProps {
  activeSubModule: string;
}

const AssistantIAModule = ({ activeSubModule }: AssistantIAModuleProps) => {
  const renderActiveSubModule = () => {
    switch (activeSubModule) {
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