
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Footer } from '@/components/Footer';
import { AnimatedGradient } from '@/components/AnimatedGradient';
import { Button } from '@/components/ui/button';
import { Settings, Palette } from 'lucide-react';

const Index = () => {
  console.log('Index component is rendering...');
  const [gradientSettings, setGradientSettings] = useState({
    colors: 'blue' as 'blue' | 'purple' | 'mixed' | 'green' | 'amber' | 'primary',
    intensity: 'medium' as 'subtle' | 'medium' | 'strong',
    speed: 'medium' as 'slow' | 'medium' | 'fast',
    pattern: 'linear' as 'linear' | 'radial' | 'conic',
  });
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    // Update document title
    document.title = "PharmaSoft - Solution complète de gestion pharmaceutique";
    
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
    <AnimatedGradient 
      className="min-h-screen"
      colors={gradientSettings.colors}
      intensity={gradientSettings.intensity}
      speed={gradientSettings.speed}
      pattern={gradientSettings.pattern}
    >
      <Header />
      <main>
        <Hero />
        <Features />
        {/* Additional sections would go here */}
      </main>
      <Footer />
      
      {/* Theme Customizer */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          size="icon" 
          className="rounded-full shadow-lg"
          onClick={() => setShowCustomizer(!showCustomizer)}
        >
          <Palette size={18} />
        </Button>
        
        {showCustomizer && (
          <div className="absolute bottom-12 right-0 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-border/50 w-64">
            <h4 className="text-sm font-medium mb-3 flex items-center">
              <Settings size={14} className="mr-2" />
              Personnalisation du thème
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Couleurs</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['blue', 'purple', 'mixed', 'green', 'amber', 'primary'].map(color => (
                    <button
                      key={color}
                      className={`h-6 rounded-md text-xs ${gradientSettings.colors === color ? 'ring-2 ring-primary' : ''}`}
                      style={{ 
                        background: `var(--${color === 'primary' ? 'primary' : color}-100, #f0f9ff)`,
                        color: `var(--${color === 'primary' ? 'primary' : color}-800, #075985)`
                      }}
                      onClick={() => setGradientSettings({
                        ...gradientSettings,
                        colors: color as any
                      })}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground">Intensité</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['subtle', 'medium', 'strong'].map(intensity => (
                    <button
                      key={intensity}
                      className={`h-6 rounded-md bg-secondary text-xs ${gradientSettings.intensity === intensity ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setGradientSettings({
                        ...gradientSettings,
                        intensity: intensity as any
                      })}
                    >
                      {intensity}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground">Vitesse</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['slow', 'medium', 'fast'].map(speed => (
                    <button
                      key={speed}
                      className={`h-6 rounded-md bg-secondary text-xs ${gradientSettings.speed === speed ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setGradientSettings({
                        ...gradientSettings,
                        speed: speed as any
                      })}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground">Motif</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['linear', 'radial', 'conic'].map(pattern => (
                    <button
                      key={pattern}
                      className={`h-6 rounded-md bg-secondary text-xs ${gradientSettings.pattern === pattern ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setGradientSettings({
                        ...gradientSettings,
                        pattern: pattern as any
                      })}
                    >
                      {pattern}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedGradient>
  );
};

export default Index;
