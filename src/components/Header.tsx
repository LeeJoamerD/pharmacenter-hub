
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <a href="#features" className="navbar-item">Fonctionnalités</a>
          <a href="#modules" className="navbar-item">Modules</a>
          <a href="#ai" className="navbar-item">Intelligence Artificielle</a>
          <a href="#contact" className="navbar-item">Contact</a>
          <div className="ml-4">
            <LanguageSelector />
          </div>
          <Button className="ml-4 button-hover-effect bg-primary hover:bg-primary/90 text-white">
            Essai Gratuit
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <LanguageSelector className="mr-2" />
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
            Fonctionnalités
          </a>
          <a
            href="#modules"
            className="py-3 text-lg font-medium border-b border-border/20"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Modules
          </a>
          <a
            href="#ai"
            className="py-3 text-lg font-medium border-b border-border/20"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Intelligence Artificielle
          </a>
          <a
            href="#contact"
            className="py-3 text-lg font-medium border-b border-border/20"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact
          </a>
          <Button className="mt-4 w-full button-hover-effect bg-primary hover:bg-primary/90 text-white">
            Essai Gratuit
          </Button>
        </nav>
      </div>
    </header>
  );
}
