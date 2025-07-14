
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { TenantProvider } from "./contexts/TenantContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { TestingIndicator } from "./components/TestingIndicator";
import Index from "./pages/Index";
import Dashboard from "./pages/Tableau de bord";
import Auth from "./pages/Auth";
import PharmacyRegistration from "./pages/PharmacyRegistration";
import NotFound from "./pages/NotFound";
import { PERMISSIONS } from './types/permissions';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TenantProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pharmacy-registration" element={<PharmacyRegistration />} />
              <Route 
                path="/tableau-de-bord" 
                element={
                  <ProtectedRoute permissions={[PERMISSIONS.PHARMACY_VIEW]}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute permissions={[PERMISSIONS.PHARMACY_VIEW]}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <TestingIndicator />
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </TenantProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
