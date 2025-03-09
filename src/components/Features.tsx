
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
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
  linkTo?: string;
}

function Feature({ icon, title, description, delay = 0, linkTo }: FeatureProps) {
  const content = (
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
  );

  return (
    <FadeIn delay={delay} className="relative">
      {linkTo ? (
        <Link to={linkTo} className="block h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </FadeIn>
  );
}

export function Features() {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: <ShoppingCart size={20} />,
      title: t('salesManagement'),
      description: t('salesDesc'),
      linkTo: "/dashboard"
    },
    {
      icon: <Package size={20} />,
      title: t('stockManagement'),
      description: t('stockDesc'),
      linkTo: "/dashboard"
    },
    {
      icon: <Users size={20} />,
      title: t('clientManagement'),
      description: t('clientDesc'),
      linkTo: "/dashboard"
    },
    {
      icon: <CreditCard size={20} />,
      title: t('cashManagement'),
      description: t('cashDesc'),
      linkTo: "/dashboard"
    },
    {
      icon: <BarChart size={20} />,
      title: t('analytics'),
      description: t('analyticsDesc'),
      linkTo: "/dashboard"
    },
    {
      icon: <Shield size={20} />,
      title: t('security'),
      description: t('securityDesc')
    },
    {
      icon: <Smartphone size={20} />,
      title: t('webMobile'),
      description: t('webMobileDesc'),
      linkTo: "/dashboard"
    },
    {
      icon: <Globe size={20} />,
      title: t('multilingual'),
      description: t('multilingualDesc'),
      linkTo: "/dashboard"
    },
    {
      icon: <Headphones size={20} />,
      title: t('voiceCommands'),
      description: t('voiceDesc'),
      linkTo: "/dashboard"
    }
  ];

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-blue-50/80 to-white/30 -z-10"></div>
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">{t('featuresTitle')}</h2>
          <p className="text-lg text-muted-foreground">{t('featuresSubtitle')}</p>
        </FadeIn>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={0.1 * index}
              linkTo={feature.linkTo}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
