import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { SystemSettingsProvider } from "@/contexts/SystemSettingsContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Tableau de bord";
import PharmacyCreation from "./pages/PharmacyCreation";
import PharmacyConnection from "./pages/PharmacyConnection";
import PharmacyPasswordReset from "./pages/PharmacyPasswordReset";
import PharmacySetPassword from "./pages/PharmacySetPassword";
import PharmacyPasswordResetVerify from "./pages/PharmacyPasswordResetVerify";
import NotFound from "./pages/NotFound";
import UserLogin from "./pages/UserLogin";
import UserRegister from "./pages/UserRegister";
import SetPassword from "./pages/SetPassword";
import PasswordReset from "./pages/PasswordReset";
import PlatformAdmin from "./pages/PlatformAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            <TenantProvider>
              <SystemSettingsProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/tableau-de-bord" element={<Dashboard />} />
                    <Route path="/pharmacy-creation" element={<PharmacyCreation />} />
                    <Route path="/pharmacy-connection" element={<PharmacyConnection />} />
                    <Route path="/pharmacy-password-reset" element={<PharmacyPasswordReset />} />
                    <Route path="/pharmacy-set-password" element={<PharmacySetPassword />} />
                    <Route path="/pharmacy-password-reset-verify" element={<PharmacyPasswordResetVerify />} />
                    <Route path="/user-login" element={<UserLogin />} />
                    <Route path="/user-register" element={<UserRegister />} />
                    <Route path="/set-password" element={<SetPassword />} />
                    <Route path="/password-reset" element={<PasswordReset />} />
                    <Route path="/platform-admin/*" element={<PlatformAdmin />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </SystemSettingsProvider>
            </TenantProvider>
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;