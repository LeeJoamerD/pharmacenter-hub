import React from 'react';
import NetworkChatDashboard from './chat/NetworkChatDashboard';
import NetworkMessaging from './chat/NetworkMessaging';
import MultiPharmacyManagement from './chat/MultiPharmacyManagement';
import NetworkChannelManagement from './chat/NetworkChannelManagement';
import CentralAdministration from './chat/CentralAdministration';
import NetworkConversationalAI from './chat/NetworkConversationalAI';
import NetworkBusinessIntegrations from './chat/NetworkBusinessIntegrations';
import NetworkSecurityManager from './chat/NetworkSecurityManager';
import CollaborativeProductivityTools from './chat/CollaborativeProductivityTools';
import NetworkAdvancedAnalytics from './chat/NetworkAdvancedAnalytics';
import NetworkPharmaTools from './chat/NetworkPharmaTools';
import NetworkMultichannelHub from './chat/NetworkMultichannelHub';
import NetworkChatCustomization from './chat/NetworkChatCustomization';
import NetworkAdvancedAdministration from './chat/NetworkAdvancedAdministration';

interface ChatNetworkModuleProps {
  activeSubModule: string;
}

const ChatNetworkModule = ({ activeSubModule }: ChatNetworkModuleProps) => {
  const renderActiveSubModule = () => {
    switch (activeSubModule) {
      case 'messagerie réseau':
        return <NetworkMessaging />;
      case 'multi-officines':
        return <MultiPharmacyManagement />;
      case 'canaux réseau':
        return <NetworkChannelManagement />;
      case 'administration centrale':
        return <CentralAdministration />;
      case 'assistant ia réseau':
        return <NetworkConversationalAI />;
      case 'intégrations réseau':
        return <NetworkBusinessIntegrations />;
      case 'sécurité réseau':
        return <NetworkSecurityManager />;
      case 'productivité collaborative':
        return <CollaborativeProductivityTools />;
      case 'analytics réseau':
        return <NetworkAdvancedAnalytics />;
      case 'pharma tools réseau':
        return <NetworkPharmaTools />;
      case 'multi-canaux réseau':
        return <NetworkMultichannelHub />;
      case 'personnalisation réseau':
        return <NetworkChatCustomization />;
      case 'administration réseau':
        return <NetworkAdvancedAdministration />;
      case '':
        return <NetworkChatDashboard />;
      default:
        return <NetworkChatDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {renderActiveSubModule()}
    </div>
  );
};

export default ChatNetworkModule;