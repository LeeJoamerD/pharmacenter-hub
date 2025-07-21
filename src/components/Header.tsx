import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Menu, X, User, LogOut, Building2, Plus, LogIn, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

  const handleCreatePharmacy = async () => {
    console.log('HEADER: Lancement de l\'authentification Google pour création pharmacie...');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/pharmacy-creation`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account' // Force la sélection du compte Google
          }
        }
      });

      if (error) {
        console.error('HEADER: Erreur authentification Google:', error);
        alert('Erreur lors de l\'authentification: ' + error.message);
      } else {
        console.log('HEADER: Authentification Google lancée pour création pharmacie');
      }
    } catch (error) {
      console.error('HEADER: Exception authentification Google:', error);
      alert('Erreur inattendue lors de l\'authentification');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold text-gradient">
              PharmaSoft
            </span>
          </a>
          {(pharmacy || connectedPharmacy) && (
            <span className="hidden sm:inline ml-3 text-sm text-muted-foreground">
              - {pharmacy?.name || connectedPharmacy?.name}
            </span>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <a href="#features" className="navbar-item">{t('features')}</a>
          <a href="#contact" className="navbar-item">{t('contact')}</a>
          <div className="ml-4">
            <LanguageSelector />
          </div>
          <div className="ml-2 flex items-center gap-2">
            {/* Bouton 1: Gestion des pharmacies */}
            {connectedPharmacy ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground hover:bg-muted/50"
                  >
                    <Building2 size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {connectedPharmacy.name}
                  </DropdownMenuLabel>
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    {connectedPharmacy.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePharmacyDisconnect}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnecter pharmacie
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground hover:bg-muted/50"
                  >
                    <Building2 size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCreatePharmacy}>
                    Créer une pharmacie
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/pharmacy-connection')}>
                    Se connecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Bouton 2: Gestion des utilisateurs */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground hover:bg-muted/50"
                  >
                    <User size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {personnel ? `${personnel.prenoms} ${personnel.noms}` : user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/tableau-de-bord')}>
                    Tableau de bord
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:bg-muted/50 opacity-60"
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
              size="icon"
              className="text-foreground hover:bg-muted/50 mr-2"
              aria-label="Accéder au tableau de bord"
              onClick={handleProfileClick}
            >
              <User size={20} />
            </Button>
          ) : connectedPharmacy ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-muted/50 mr-2"
              aria-label="Menu pharmacie"
              onClick={() => {}} // Menu mobile géré dans la navigation mobile
            >
              <Building2 size={20} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/pharmacy-connection')}
              className="text-foreground hover:bg-muted/50 mr-2"
            >
              Pharmacie
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
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate('/tableau-de-bord');
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start py-3 text-lg font-medium border-b border-border/20"
              >
                Tableau de bord
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
                Se déconnecter
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
                  handlePharmacyDisconnect();
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start py-3 text-lg font-medium border-b border-border/20 text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnecter pharmacie
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              onClick={() => {
                navigate('/pharmacy-connection');
                setIsMobileMenuOpen(false);
              }}
              className="justify-start py-3 text-lg font-medium border-b border-border/20"
            >
              Connecter pharmacie
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}