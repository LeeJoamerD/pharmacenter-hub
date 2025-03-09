
import { FadeIn } from '@/components/FadeIn';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="contact" className="bg-slate-900 text-white pt-16 pb-10">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <FadeIn>
            <div>
              <h3 className="text-xl font-display font-bold mb-6">PharmaSoft</h3>
              <p className="text-slate-300 mb-6">
                Une application complète de gestion d'officine pharmaceutique disponible en version web et mobile.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-300 hover:text-white transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="#" className="text-slate-300 hover:text-white transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-slate-300 hover:text-white transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="#" className="text-slate-300 hover:text-white transition-colors">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.1}>
            <div>
              <h3 className="text-lg font-medium mb-6">{t('quickLinks')}</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-slate-300 hover:text-white transition-colors">{t('features')}</a>
                </li>
                <li>
                  <a href="#modules" className="text-slate-300 hover:text-white transition-colors">{t('modules')}</a>
                </li>
                <li>
                  <a href="#ai" className="text-slate-300 hover:text-white transition-colors">{t('ai')}</a>
                </li>
                <li>
                  <a href="#" className="text-slate-300 hover:text-white transition-colors">{t('pricing')}</a>
                </li>
                <li>
                  <a href="#" className="text-slate-300 hover:text-white transition-colors">{t('blog')}</a>
                </li>
              </ul>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <div>
              <h3 className="text-lg font-medium mb-6">{t('contactUs')}</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <MapPin size={18} className="mr-3 mt-0.5 flex-shrink-0 text-primary" />
                  <span className="text-slate-300">59, rue ibaliko CNRTV Nkombo<br/>Brazzaville, République du Congo</span>
                </li>
                <li className="flex items-center">
                  <Phone size={18} className="mr-3 flex-shrink-0 text-primary" />
                  <a href="tel:+242066282307" className="text-slate-300 hover:text-white transition-colors">+242 06 628 23 07</a>
                </li>
                <li className="flex items-center">
                  <Phone size={18} className="mr-3 flex-shrink-0 text-primary" />
                  <a href="tel:+242056282307" className="text-slate-300 hover:text-white transition-colors">+242 05 628 23 07</a>
                </li>
                <li className="flex items-center">
                  <Mail size={18} className="mr-3 flex-shrink-0 text-primary" />
                  <a href="mailto:djl.computersciences@gmail.com" className="text-slate-300 hover:text-white transition-colors">djl.computersciences@gmail.com</a>
                </li>
              </ul>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <div>
              <h3 className="text-lg font-medium mb-6">{t('newsletter')}</h3>
              <p className="text-slate-300 mb-4">{t('newsletterDesc')}</p>
              <div className="flex flex-col space-y-3">
                <input
                  type="email"
                  placeholder={t('email')}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button className="w-full button-hover-effect bg-primary hover:bg-primary/90 text-white">
                  {t('subscribe')}
                </Button>
              </div>
              <div className="mt-6">
                <LanguageSelector className="bg-slate-800 hover:bg-slate-700 text-white" />
              </div>
            </div>
          </FadeIn>
        </div>
        
        <FadeIn>
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              © {currentYear} PharmaSoft. {t('allRightsReserved')}
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">{t('termsOfUse')}</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">{t('privacyPolicy')}</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">{t('legalNotice')}</a>
            </div>
          </div>
        </FadeIn>
      </div>
    </footer>
  );
}
