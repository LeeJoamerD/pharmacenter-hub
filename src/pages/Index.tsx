
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Footer } from '@/components/Footer';
import { AnimatedGradient } from '@/components/AnimatedGradient';

const Index = () => {
  useEffect(() => {
    // Update document title
    document.title = "PharmaCenter - Solution complète de gestion pharmaceutique";
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href') as string);
        if (target) {
          window.scrollTo({
            top: (target as HTMLElement).offsetTop - 80,
            behavior: 'smooth'
          });
        }
      });
    });
    
    return () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', function() {});
      });
    };
  }, []);

  return (
    <AnimatedGradient className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        {/* Additional sections would go here */}
      </main>
      <Footer />
    </AnimatedGradient>
  );
};

export default Index;
