import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Menu, X, User, LogOut, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Fonction pour extraire les initiales
const getUserInitials = (personnel: any, user: any) => {
  if (personnel?.prenoms && personnel?.noms) {
    const firstNameInitial = personnel.prenoms.charAt(0).toUpperCase();
    const lastNameInitial = personnel.noms.charAt(0).toUpperCase();
    return `${firstNameInitial}${lastNameInitial}`;
  }
  
  if (user?.user_metadata?.name) {
    const nameParts = user.user_metadata.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
    }
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  if (user?.email) {
    return user.email.charAt(0).toUpperCase();
  }
  
  return 'U';
};

// Fonction pour obtenir le nom complet
const getFullUserName = (personnel: any, user: any) => {
  if (personnel?.prenoms && personnel?.noms) {
    return `${personnel.prenoms} ${personnel.noms}`;
  }
  
  if (user?.user_metadata?.name) {
    return user.user_metadata.name;
  }
  
  return user?.email || 'Utilisateur';
};

// Composant Avatar avec initiales
const UserAvatar = ({ initials }: { initials: string }) => (
  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
    {initials}
  </div>
);

export function Header() {
  const { t } = useLanguage();
  const { user, personnel, pharmacy, connectedPharmacy, signOut, disconnectPharmacy } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleProfileClick = () => {
    if (user) {
      navigate('/tableau-de-bord');
    } else {
      navigate('/auth');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handlePharmacyDisconnect = () => {
    disconnectPharmacy();
    navigate('/');
  };

  const handleCreatePharmacy = () => {
    console.log('HEADER: Redirection vers création de pharmacie...');
    navigate('/pharmacy-creation');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculer les initiales et le nom complet
  const userInitials = getUserInitials(personnel, user);
  const fullUserName = getFullUserName(personnel, user);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-lg',
        isScrolled
          ? 'bg-white/80 shadow-sm py-3'
          : 'bg-transparent py-5'
      )}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center">
          <a href="/" className="flex items-center gap-3">
            <img src="/images/logo-pharmasoft.png" alt="PharmaSoft" className="h-10 w-10 object-contain" />
            <span className="text-2xl font-display font-bold text-gradient">
              PharmaSoft
            </span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <a href="#features" className="navbar-item">{t('features')}</a>
          <a href="#contact" className="navbar-item">{t('contact')}</a>
          <div className="ml-4">
            <LanguageSelector />
          </div>
          <div className="ml-2 flex items-center gap-2">
            {/* Bouton 2: Gestion des utilisateurs */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:bg-muted/50 h-8 gap-2"
                  >
                    <UserAvatar initials={userInitials} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {fullUserName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/tableau-de-bord')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('dashboard')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('signOut')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:bg-muted/50 opacity-60"
                aria-label="Se connecter"
                onClick={() => navigate('/user-login')}
              >
                <User size={20} />
              </Button>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <LanguageSelector className="mr-2" />
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-muted/50 mr-2 h-8 gap-2"
              aria-label="Accéder au tableau de bord"
              onClick={handleProfileClick}
            >
              <UserAvatar initials={userInitials} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/user-login')}
              className="text-foreground hover:bg-muted/50 mr-2"
              aria-label="Se connecter"
            >
              <User size={20} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X size={24} className="text-foreground" />
            ) : (
              <Menu size={24} className="text-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'fixed inset-0 top-[60px] bg-white/95 backdrop-blur-xl z-40 border-t transform transition-all duration-300 ease-in-out md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <nav className="container flex flex-col space-y-4 p-6">
          <a
            href="#features"
            className="py-3 text-lg font-medium border-b border-border/20"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('features')}
          </a>
          <a
            href="#contact"
            className="py-3 text-lg font-medium border-b border-border/20"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('contact')}
          </a>
          {user ? (
            <>
              <div className="py-3 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <UserAvatar initials={userInitials} />
                  <div className="flex flex-col">
                    <span className="text-lg font-medium">{fullUserName}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate('/tableau-de-bord');
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start py-3 text-lg font-medium border-b border-border/20"
              >
                {t('dashboard')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  handleSignOut();
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start py-3 text-lg font-medium border-b border-border/20 text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('signOut')}
              </Button>
            </>
          ) : connectedPharmacy ? (
            <>
              <div className="py-3 border-b border-border/20">
                <div className="text-lg font-medium">{connectedPharmacy.name}</div>
                <div className="text-sm text-muted-foreground">{connectedPharmacy.email}</div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate('/user-login');
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start py-3 text-lg font-medium border-b border-border/20"
              >
                <User className="mr-2 h-4 w-4" />
                {t('signIn')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate('/pharmacy-connection');
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start py-3 text-lg font-medium border-b border-border/20"
              >
                <Building2 className="mr-2 h-4 w-4" />
                {t('connectPharmacy')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  handlePharmacyDisconnect();
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start py-3 text-lg font-medium border-b border-border/20 text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('disconnectPharmacy')}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate('/user-login');
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start py-3 text-lg font-medium border-b border-border/20"
              >
                <User className="mr-2 h-4 w-4" />
                {t('signIn')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate('/pharmacy-connection');
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start py-3 text-lg font-medium border-b border-border/20"
              >
                <Building2 className="mr-2 h-4 w-4" />
                {t('connectPharmacy')}
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
