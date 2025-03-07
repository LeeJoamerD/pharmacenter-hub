
import { FadeIn } from '@/components/FadeIn';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import mockupImage from '../assets/mockup.png';

export function Hero() {
  const features = [
    "Interface intuitive et responsive",
    "Compatible web & mobile",
    "Mise à jour automatique",
    "Support technique prioritaire"
  ];

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <FadeIn>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-tight mb-6">
                Gestion d'officine <span className="text-gradient">simplifiée</span> et performante
              </h1>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
                PharmaSoft est une application complète de gestion d'officine pharmaceutique disponible en version web et mobile, conçue pour simplifier tous vos processus.
              </p>
            </FadeIn>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-12">
              <FadeIn delay={0.3}>
                <Link to="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto button-hover-effect">
                    Démonstration
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </FadeIn>
              <FadeIn delay={0.4}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  En savoir plus
                </Button>
              </FadeIn>
            </div>
            
            <FadeIn delay={0.5}>
              <div>
                <div className="flex flex-wrap gap-3 mb-3">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium"
                    >
                      <Check className="mr-1 size-3 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">+500</span> pharmacies utilisent déjà PharmaSoft
                </div>
              </div>
            </FadeIn>
          </div>
          
          <FadeIn delay={0.4} className="hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/20 to-purple-500/20 blur-xl opacity-70"></div>
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={mockupImage}
                  alt="PharmaSoft dashboard" 
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
