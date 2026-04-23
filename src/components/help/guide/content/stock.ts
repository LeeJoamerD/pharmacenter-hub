import { BookOpen, Compass, Settings2, Users, ShieldCheck, Package, Boxes, ClipboardList, ShoppingCart, Receipt, RotateCcw, Calculator, FileText, Landmark, BarChart3, Bot, MessageSquare, Bell, Printer, Lock, SlidersHorizontal } from 'lucide-react';
import type { GuideModule } from '../types';

export const stockModule: GuideModule = {
  "id": "stock",
  "title": "Stock",
  "tagline": "Piloter les quantités, lots, réceptions, inventaires et étiquettes.",
  "description": "Le module Stock sécurise la disponibilité des produits, la traçabilité des lots et les opérations d’approvisionnement.",
  "icon": Package,
  "accent": "success",
  "sections": [
    {
      "id": "stock-operations",
      "title": "Opérations de stock",
      "icon": "Boxes",
      "articles": [
        {
          "id": "stock-actuel-lots",
          "title": "Stock actuel et lots",
          "objective": "Consulter les disponibilités réelles et contrôler la traçabilité par lot.",
          "location": "Stock → Stock actuel",
          "audience": [
            "Gestionnaires stock",
            "Pharmaciens",
            "Administrateurs"
          ],
          "intro": "Le stock actuel présente les produits disponibles, leurs seuils, leurs lots et les informations nécessaires à la décision opérationnelle.",
          "steps": [
            {
              "title": "Filtrer la liste",
              "detail": "Utilisez la recherche ou les filtres pour isoler un produit, une famille ou une alerte."
            },
            {
              "title": "Ouvrir le détail",
              "detail": "Consultez les lots, dates d’expiration, quantités et mouvements associés."
            },
            {
              "title": "Agir selon l’alerte",
              "detail": "Préparez une commande, corrigez un écart ou planifiez un inventaire ciblé."
            }
          ],
          "callouts": [
            {
              "type": "warning",
              "text": "Les produits proches de péremption doivent être analysés avant toute nouvelle commande."
            }
          ],
          "bestPractices": [
            "Contrôler les seuils régulièrement.",
            "Traiter les ruptures et surstocks chaque jour.",
            "Vérifier les lots avant les ventes sensibles."
          ],
          "faq": [
            {
              "q": "Le stock affiché est-il en temps réel ?",
              "a": "Il reflète les mouvements enregistrés : ventes, réceptions, retours, inventaires et ajustements."
            }
          ],
          "related": [
            "stock-reception-fournisseur"
          ],
          "keywords": [
            "stock",
            "lots",
            "péremption",
            "seuils"
          ]
        },
        {
          "id": "stock-reception-fournisseur",
          "title": "Réception fournisseur",
          "objective": "Enregistrer une livraison et intégrer les produits au stock avec leurs lots.",
          "location": "Stock → Approvisionnement → Réceptions",
          "audience": [
            "Gestionnaires stock",
            "Pharmaciens"
          ],
          "intro": "La réception fournisseur transforme une livraison en mouvements de stock traçables, avec contrôle des quantités, prix, lots et dates.",
          "steps": [
            {
              "title": "Sélectionner la commande ou créer la réception",
              "detail": "Démarrez depuis une commande existante lorsque possible."
            },
            {
              "title": "Contrôler chaque ligne",
              "detail": "Comparez les quantités livrées, gratuites, prix d’achat et prix de vente."
            },
            {
              "title": "Renseigner les lots",
              "detail": "Saisissez numéro de lot, date de péremption et quantité par lot."
            },
            {
              "title": "Valider la réception",
              "detail": "La validation met à jour le stock et conserve l’historique."
            }
          ],
          "callouts": [
            {
              "type": "tip",
              "text": "Utilisez les unités gratuites pour refléter fidèlement les bonus fournisseurs sans fausser le coût d’achat."
            }
          ],
          "bestPractices": [
            "Ne valider qu’après rapprochement avec le bon de livraison.",
            "Corriger les écarts avant validation finale."
          ],
          "faq": [
            {
              "q": "Puis-je annuler une réception ?",
              "a": "Selon vos droits, l’historique permet une suppression contrôlée avec impact stock."
            }
          ],
          "related": [
            "stock-actuel-lots"
          ],
          "keywords": [
            "réception",
            "fournisseur",
            "lots",
            "UG"
          ]
        }
      ]
    }
  ]
};
