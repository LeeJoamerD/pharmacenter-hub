import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  Package, 
  LayoutDashboard, 
  LogOut,
  TestTube
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
    title: 'Catalogue Global',
    icon: Package,
    href: '/platform-admin/catalogue',
  },
  {
    title: 'Tests & Développement',
    icon: TestTube,
    href: '/platform-admin/tests',
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
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Platform Admin</h1>
              <p className="text-xs text-muted-foreground">Administration système</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/platform-admin' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {platformAdmin && (
            <div className="px-3 py-2 bg-accent/50 rounded-lg">
              <p className="text-sm font-medium">{platformAdmin.nom}</p>
              <p className="text-xs text-muted-foreground">{platformAdmin.email}</p>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PlatformAdminLayout;
