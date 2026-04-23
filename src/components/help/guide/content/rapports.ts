import { BookOpen, Compass, Settings2, Users, ShieldCheck, Package, Boxes, ClipboardList, ShoppingCart, Receipt, RotateCcw, Calculator, FileText, Landmark, BarChart3, Bot, MessageSquare, Bell, Printer, Lock, SlidersHorizontal } from 'lucide-react';
import type { GuideModule } from '../types';

export const rapportsModule: GuideModule = {
  "id": "rapports",
  "title": "Rapports",
  "tagline": "Analyser ventes, stock, fiscalité, stupéfiants et performance.",
  "description": "Les rapports transforment les données opérationnelles en indicateurs de pilotage et états réglementaires.",
  "icon": BarChart3,
  "accent": "info",
  "sections": [
    {
      "id": "rapports-pilotage",
      "title": "Pilotage et conformité",
      "icon": FileText,
      "articles": [
        {
          "id": "rapports-tableaux-bord",
          "title": "Tableaux de bord",
          "objective": "Lire les indicateurs essentiels pour piloter l’officine.",
          "location": "Rapports → Tableaux de bord",
          "audience": [
            "Administrateurs",
            "Pharmacien Titulaire",
            "Gestionnaires"
          ],
          "intro": "Les tableaux de bord synthétisent les ventes, marges, stock, clients et alertes pour orienter les décisions.",
          "steps": [
            {
              "title": "Choisir la période",
              "detail": "Adaptez l’analyse au jour, à la semaine ou au mois."
            },
            {
              "title": "Comparer les indicateurs",
              "detail": "Analysez chiffre d’affaires, marge, ruptures et mouvements."
            },
            {
              "title": "Ouvrir le détail",
              "detail": "Passez d’un indicateur à la liste source lorsque disponible."
            }
          ],
          "callouts": [
            {
              "type": "tip",
              "text": "Un indicateur isolé est moins utile qu’une tendance comparée dans le temps."
            }
          ],
          "bestPractices": [
            "Analyser les écarts chaque semaine.",
            "Croiser les ventes avec les ruptures de stock."
          ],
          "faq": [
            {
              "q": "Les rapports tiennent-ils compte des retours ?",
              "a": "Oui, les retours validés influencent les indicateurs concernés."
            }
          ],
          "related": [],
          "keywords": [
            "rapports",
            "tableau de bord",
            "indicateurs"
          ]
        },
        {
          "id": "rapports-stupefiants",
          "title": "Registre des stupéfiants",
          "objective": "Suivre les mouvements réglementés avec une traçabilité stricte.",
          "location": "Rapports → Réglementaire → Stupéfiants",
          "audience": [
            "Pharmaciens",
            "Administrateurs"
          ],
          "intro": "Le registre des stupéfiants centralise les entrées, sorties et soldes avec les informations d’audit nécessaires.",
          "steps": [
            {
              "title": "Sélectionner la période",
              "detail": "Filtrez par date et produit réglementé."
            },
            {
              "title": "Contrôler les mouvements",
              "detail": "Vérifiez origine, destination, quantité et solde."
            },
            {
              "title": "Exporter si nécessaire",
              "detail": "Générez un état conforme aux besoins de contrôle."
            }
          ],
          "callouts": [
            {
              "type": "warning",
              "text": "Toute correction sur un produit réglementé doit être documentée."
            }
          ],
          "bestPractices": [
            "Contrôler les soldes après chaque mouvement sensible.",
            "Limiter les droits d’accès à ce rapport."
          ],
          "faq": [
            {
              "q": "Peut-on modifier l’historique ?",
              "a": "Les mouvements réglementaires doivent conserver une piste d’audit fiable."
            }
          ],
          "related": [
            "rapports-tableaux-bord"
          ],
          "keywords": [
            "stupéfiants",
            "registre",
            "réglementaire"
          ]
        }
      ]
    }
  ]
};
