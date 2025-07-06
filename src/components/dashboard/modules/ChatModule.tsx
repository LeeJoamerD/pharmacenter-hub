import React, { useState } from 'react';
import ChatDashboard from './chat/ChatDashboard';
import InternalMessaging from './chat/InternalMessaging';
import CustomerSupport from './chat/CustomerSupport';
import NotificationCenter from './chat/NotificationCenter';

interface ChatModuleProps {
  activeSubModule: string;
}

const ChatModule = ({ activeSubModule }: ChatModuleProps) => {
  const renderActiveSubModule = () => {
    switch (activeSubModule) {
      case 'messagerie':
        return <InternalMessaging />;
      case 'support-client':
        return <CustomerSupport />;
      case 'notifications':
        return <NotificationCenter />;
      case '':
        return <ChatDashboard />;
      default:
        return <ChatDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {renderActiveSubModule()}
    </div>
  );
};

export default ChatModule;