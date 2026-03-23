// Platform Admin Layout - v3 (cache-bust 2026-03-09)
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  Package, 
  LayoutDashboard, 
  LogOut,
  TestTube,
  Settings,
  BookOpen,
  MailCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

interface PlatformAdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    title: 'Vue d\'ensemble',
    icon: LayoutDashboard,
    href: '/platform-admin',
  },
  {
    title: 'Catalogue Produits',
    icon: Package,
    href: '/platform-admin/catalogue',
  },
  {
    title: 'Plans Comptables',
    icon: BookOpen,
    href: '/platform-admin/plans-comptables',
  },
  {
    title: 'Tests & Développement',
    icon: TestTube,
    href: '/platform-admin/tests',
  },
  {
    title: 'Configuration',
    icon: Settings,
    href: '/platform-admin/configuration',
  },
  {
    title: 'Emails Test',
    icon: MailCheck,
    href: '/platform-admin/emails-test',
  },
];

const PlatformAdminLayout: React.FC<PlatformAdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { platformAdmin } = usePlatformAdmin();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sm">Platform Admin</h1>
              <p className="text-xs text-muted-foreground">Administration système</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/platform-admin' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-sm',
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border space-y-2">
          {platformAdmin && (
            <div className="px-2 py-1.5 bg-accent/50 rounded-lg">
              <p className="text-xs font-medium">{platformAdmin.nom}</p>
              <p className="text-xs text-muted-foreground">{platformAdmin.email}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PlatformAdminLayout;
