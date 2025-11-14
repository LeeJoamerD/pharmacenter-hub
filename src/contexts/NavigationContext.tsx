import React, { createContext, useContext, ReactNode } from 'react';

interface NavigationContextType {
  activeModule: string;
  activeSubModule: string;
  setActiveModule: (module: string) => void;
  setActiveSubModule: (subModule: string) => void;
  navigateToModule: (module: string, subModule?: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
  activeModule: string;
  activeSubModule: string;
  setActiveModule: (module: string) => void;
  setActiveSubModule: (subModule: string) => void;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  activeModule,
  activeSubModule,
  setActiveModule,
  setActiveSubModule,
}) => {
  const navigateToModule = (module: string, subModule?: string) => {
    setActiveModule(module);
    if (subModule) {
      setActiveSubModule(subModule);
    }
  };

  return (
    <NavigationContext.Provider
      value={{
        activeModule,
        activeSubModule,
        setActiveModule,
        setActiveSubModule,
        navigateToModule,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
