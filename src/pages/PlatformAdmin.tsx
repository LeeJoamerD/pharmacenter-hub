import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import PlatformAdminLayout from '@/components/platform-admin/PlatformAdminLayout';
import GlobalCatalogManager from '@/components/platform-admin/GlobalCatalogManager';
import PlatformOverview from '@/components/platform-admin/PlatformOverview';
import PlatformTestSuite from '@/components/platform-admin/PlatformTestSuite';
import { PlatformConfiguration } from '@/components/platform-admin/PlatformConfiguration';
import { Loader2 } from 'lucide-react';
const PlatformAdmin = () => {
  const { isPlatformAdmin, loading } = usePlatformAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <PlatformAdminLayout>
      <Routes>
        <Route index element={<PlatformOverview />} />
        <Route path="catalogue" element={<GlobalCatalogManager />} />
        <Route path="tests" element={<PlatformTestSuite />} />
        <Route path="configuration" element={<PlatformConfiguration />} />
      </Routes>
    </PlatformAdminLayout>
  );
};

export default PlatformAdmin;
