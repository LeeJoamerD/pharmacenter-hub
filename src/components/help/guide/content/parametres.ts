import { BookOpen, Compass, Settings2, Users, ShieldCheck, Package, Boxes, ClipboardList, ShoppingCart, Receipt, RotateCcw, Calculator, FileText, Landmark, BarChart3, Bot, MessageSquare, Bell, Printer, Lock, SlidersHorizontal } from 'lucide-react';
import type { GuideModule } from '../types';

export const parametresModule: GuideModule = {
  "id": "parametres",
  "title": "Paramètres",
  "tagline": "Configurer système, impression, sécurité, devise et préférences métier.",
  "description": "Les paramètres centralisent les choix qui influencent le comportement de l’application et les documents générés.",
  "icon": Settings2,
  "accent": "secondary",
  "sections": [
    {
      "id": "parametres-systeme",
      "title": "Configuration système",
      "icon": "SlidersHorizontal",
      "articles": [
        {
          "id": "parametres-impressions",
          "title": "Configuration des impressions",
          "objective": "Garantir des tickets, factures et étiquettes cohérents avec l’identité de l’officine.",
          "location": "Paramètres → Impressions",
          "audience": [
            "Administrateurs",
            "Pharmacien Titulaire"
          ],
          "intro": "Les impressions utilisent une configuration unifiée pour harmoniser les documents remis aux clients, partenaires et autorités.",
          "steps": [
            {
              "title": "Ouvrir les paramètres d’impression",
              "detail": "Accédez à la section dédiée depuis Paramètres."
            },
            {
              "title": "Vérifier l’identité affichée",
              "detail": "Contrôlez nom, coordonnées, mentions et formats."
            },
            {
              "title": "Tester un document",
              "detail": "Imprimez ou générez un aperçu avant exploitation."
            }
          ],
          "callouts": [
            {
              "type": "tip",
              "text": "Testez les tickets et factures après toute modification de logo, devise ou mention légale."
            }
          ],
          "bestPractices": [
            "Conserver une présentation homogène.",
            "Vérifier le format des étiquettes avant impression en masse."
          ],
          "faq": [
            {
              "q": "Les changements sont-ils immédiats ?",
              "a": "Oui pour les nouveaux documents générés après enregistrement."
            }
          ],
          "related": [],
          "keywords": [
            "impression",
            "ticket",
            "facture",
            "étiquette"
          ]
        },
        {
          "id": "parametres-securite",
          "title": "Sécurité et accès",
          "objective": "Réduire les risques en configurant correctement les accès et comportements sensibles.",
          "location": "Paramètres → Sécurité / Utilisateurs",
          "audience": [
            "Administrateurs"
          ],
          "intro": "La sécurité repose sur des comptes individuels, des rôles adaptés et des contrôles réguliers.",
          "steps": [
            {
              "title": "Contrôler les utilisateurs actifs",
              "detail": "Identifiez les comptes obsolètes ou inutilisés."
            },
            {
              "title": "Réviser les rôles",
              "detail": "Assurez-vous que chaque utilisateur possède uniquement les droits nécessaires."
            },
            {
              "title": "Auditer les actions sensibles",
              "detail": "Consultez les historiques et journaux disponibles."
            }
          ],
          "callouts": [
            {
              "type": "warning",
              "text": "Un compte partagé empêche toute traçabilité fiable."
            }
          ],
          "bestPractices": [
            "Appliquer le principe du moindre privilège.",
            "Désactiver rapidement les comptes sortants."
          ],
          "faq": [
            {
              "q": "Pourquoi séparer rôles et profils ?",
              "a": "Cela limite les risques d’escalade de privilèges et améliore l’audit."
            }
          ],
          "related": [
            "administration-personnel-roles"
          ],
          "keywords": [
            "sécurité",
            "accès",
            "utilisateurs"
          ]
        }
      ]
    }
  ]
};
