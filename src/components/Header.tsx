import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Menu, X, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { t } = useLanguage();
  const { user, personnel, pharmacy, signOut } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleProfileClick = () => {
    // TEMPORAIRE : Redirection directe vers le tableau de bord pour le développement
    navigate('/tableau-de-bord');
    /* if (user) {
      navigate('/tableau-de-bord');
    } else {
      navigate('/auth');
    } */
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
          {/* TEMPORAIRE : Masqué pour le développement */}
          {/* {pharmacy && (
            <span className="hidden sm:inline ml-3 text-sm text-muted-foreground">
              - {pharmacy.name}
            </span>
          )} */}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {/* TEMPORAIRE : Navigation simplifiée pour le développement */}
          <a href="#features" className="navbar-item">{t('features')}</a>
          <a href="#contact" className="navbar-item">{t('contact')}</a>
          <Button variant="ghost" onClick={() => navigate('/tableau-de-bord')}>
            Tableau de bord
          </Button>
          <div className="ml-4">
            <LanguageSelector />
          </div>
          <div className="ml-2">
            {/* TEMPORAIRE : Bouton utilisateur simplifié pour le développement */}
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-muted/50"
              aria-label="Accéder au tableau de bord"
              onClick={handleProfileClick}
            >
              <User size={20} />
            </Button>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <LanguageSelector className="mr-2" />
          {/* TEMPORAIRE : Bouton utilisateur mobile simplifié pour le développement */}
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground hover:bg-muted/50 mr-2"
            aria-label="Accéder au tableau de bord"
            onClick={handleProfileClick}
          >
            <User size={20} />
          </Button>
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
          {/* TEMPORAIRE : Navigation mobile simplifiée pour le développement */}
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
        </nav>
      </div>
    </header>
  );
}