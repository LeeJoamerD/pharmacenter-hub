
import { FadeIn } from '@/components/FadeIn';
import { 
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  BarChart,
  Shield,
  Smartphone,
  Globe,
  Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

function Feature({ icon, title, description, delay = 0 }: FeatureProps) {
  return (
    <FadeIn delay={delay} className="relative">
      <div className="group h-full glass-card p-6 rounded-xl transition-all duration-300 hover:shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="p-3 bg-primary/10 rounded-lg inline-flex items-center justify-center text-primary mb-4">
            {icon}
          </div>
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </FadeIn>
  );
}

export function Features() {
  const features = [
    {
      icon: <ShoppingCart size={20} />,
      title: "Gestion des ventes",
      description: "Point de vente tactile, gestion des ordonnances, remises et promotions automatisées."
    },
    {
      icon: <Package size={20} />,
      title: "Gestion des stocks",
      description: "Inventaire en temps réel, alertes de seuil, commandes automatisées, suivi des péremptions."
    },
    {
      icon: <Users size={20} />,
      title: "Gestion des clients",
      description: "Base de données clients, historique d'achats, programme de fidélité, segmentation."
    },
    {
      icon: <CreditCard size={20} />,
      title: "Gestion de caisse",
      description: "Multi-caisses, suivi des encaissements, clôtures journalières, rapports détaillés."
    },
    {
      icon: <BarChart size={20} />,
      title: "Analyses & Rapports",
      description: "Tableaux de bord analytiques, rapports personnalisés, prévisions et tendances."
    },
    {
      icon: <Shield size={20} />,
      title: "Sécurité avancée",
      description: "Authentification multi-facteurs, gestion fine des droits d'accès, chiffrement des données."
    },
    {
      icon: <Smartphone size={20} />,
      title: "Web & Mobile",
      description: "Application web responsive et applications mobiles natives (iOS et Android)."
    },
    {
      icon: <Globe size={20} />,
      title: "Multilingue",
      description: "Application disponible en 4 langues : Français, Anglais, Espagnol et Lingala."
    },
    {
      icon: <Headphones size={20} />,
      title: "Commandes vocales",
      description: "Contrôlez l'application par la voix, dictée vocale et reconnaissance des médicaments."
    }
  ];

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-blue-50/80 to-white/30 -z-10"></div>
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">Toutes les fonctionnalités dans une seule solution</h2>
          <p className="text-lg text-muted-foreground">Pharmasoft révolutionne la gestion de votre pharmacie avec un ensemble complet d'outils intégrés et innovants.</p>
        </FadeIn>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={0.1 * index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
