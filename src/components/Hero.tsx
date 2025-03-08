
import { FadeIn } from '@/components/FadeIn';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import pillsImage from '../assets/lovable-uploads/d29edb6e-a6bb-44dc-804f-604e50acfb8b.png';

export function Hero() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <FadeIn>
              <div className="inline-block rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 mb-6">
                La solution complète pour votre pharmacie
              </div>
            </FadeIn>
            
            <FadeIn delay={0.1}>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-3">
                Transformez la <br />gestion <br />
                <span className="text-blue-500">de votre officine</span>
              </h1>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
                PharmaSoft est une application complète de gestion d'officine pharmaceutique disponible en version web et mobile, conçue pour simplifier tous vos processus.
              </p>
            </FadeIn>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
              <FadeIn delay={0.3}>
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  Démarrer gratuitement
                </Button>
              </FadeIn>
              <FadeIn delay={0.4}>
                <Link to="/dashboard">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Voir la démo 
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </FadeIn>
            </div>
            
            <FadeIn delay={0.5}>
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className="size-8 rounded-full border-2 border-white" 
                      style={{ 
                        backgroundColor: `rgb(${Math.max(0, 15 - i * 20)}, ${Math.max(100, 150 - i * 20)}, ${Math.max(150, 230 - i * 20)})` 
                      }}
                    />
                  ))}
                </div>
                <div className="ml-3 text-sm">
                  <span className="font-medium">+500</span> pharmacies utilisent déjà PharmaSoft
                </div>
              </div>
            </FadeIn>
          </div>
          
          <FadeIn delay={0.4} className="hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/20 to-purple-500/20 blur-xl opacity-70"></div>
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={pillsImage}
                  alt="Pot de médicaments renversant des comprimés" 
                  className="w-full h-auto rounded-xl"
                />
                
                {/* Stats cards overlayed on the image */}
                <div className="absolute top-8 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-[180px]">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium">Ventes</div>
                    <div className="text-xs font-medium text-green-600 bg-green-100 rounded-full px-2 py-0.5">+24%</div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div className="absolute bottom-12 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-[180px]">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium">Stocks</div>
                    <div className="text-xs font-medium text-green-600">Optimal</div>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <div>1,234 produits</div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs mr-2">98% disponibilité</span>
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full" style={{ width: '98%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
