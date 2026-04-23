import { BookOpen, Compass, Settings2, Users, ShieldCheck, Package, Boxes, ClipboardList, ShoppingCart, Receipt, RotateCcw, Calculator, FileText, Landmark, BarChart3, Bot, MessageSquare, Bell, Printer, Lock, SlidersHorizontal } from 'lucide-react';
import type { GuideModule } from '../types';

export const ventesModule: GuideModule = {
  "id": "ventes",
  "title": "Ventes",
  "tagline": "Maîtriser le point de vente, les clients, assurances, factures et retours.",
  "description": "Le module Ventes couvre l’encaissement, la facturation, les proformas, les assurances et le cycle de vie des retours.",
  "icon": ShoppingCart,
  "accent": "primary",
  "sections": [
    {
      "id": "ventes-pos",
      "title": "Point de vente et facturation",
      "icon": "Receipt",
      "articles": [
        {
          "id": "ventes-point-de-vente",
          "title": "Point de Vente",
          "objective": "Réaliser une vente rapide, fiable et compatible avec les lecteurs de codes-barres.",
          "location": "Ventes → Point de Vente",
          "audience": [
            "Caissiers",
            "Pharmaciens",
            "Administrateurs"
          ],
          "intro": "Le POS est conçu pour une saisie rapide : recherche produit, scan code-barres, sélection client, assurance, paiement et impression.",
          "steps": [
            {
              "title": "Rechercher ou scanner un produit",
              "detail": "Utilisez la douchette ou la barre de recherche."
            },
            {
              "title": "Vérifier quantité et prix",
              "detail": "Contrôlez les unités, remises et disponibilités avant paiement."
            },
            {
              "title": "Associer client ou assurance",
              "detail": "Ajoutez les informations de prise en charge lorsque nécessaire."
            },
            {
              "title": "Encaisser et imprimer",
              "detail": "Validez le mode de paiement et imprimez ticket ou facture."
            }
          ],
          "callouts": [
            {
              "type": "info",
              "text": "Le POS privilégie la rapidité, mais conserve les contrôles de stock et de paiement."
            }
          ],
          "bestPractices": [
            "Scanner les produits plutôt que les saisir manuellement.",
            "Vérifier la couverture assurance avant validation.",
            "Clôturer la caisse selon la procédure interne."
          ],
          "faq": [
            {
              "q": "Puis-je fractionner une unité ?",
              "a": "Oui, lorsque le produit et la configuration autorisent la mise en détail."
            }
          ],
          "related": [
            "ventes-retours"
          ],
          "keywords": [
            "pos",
            "vente",
            "ticket",
            "assurance"
          ]
        },
        {
          "id": "ventes-retours",
          "title": "Retours et avoirs",
          "objective": "Traiter un retour client tout en conservant une piste d’audit fiable.",
          "location": "Ventes → Retours / Historique ventes",
          "audience": [
            "Caissiers",
            "Pharmaciens",
            "Comptables"
          ],
          "intro": "Les retours doivent préserver la cohérence entre stock, caisse, facturation et comptabilité.",
          "steps": [
            {
              "title": "Retrouver la vente",
              "detail": "Recherchez la transaction d’origine."
            },
            {
              "title": "Sélectionner les lignes retournées",
              "detail": "Indiquez les quantités exactes et le motif."
            },
            {
              "title": "Valider le retour",
              "detail": "Le système applique les impacts stock et financiers selon le contexte."
            }
          ],
          "callouts": [
            {
              "type": "warning",
              "text": "Un retour validé influence les rapports de ventes, le stock et la caisse."
            }
          ],
          "bestPractices": [
            "Documenter le motif du retour.",
            "Éviter les retours sans transaction d’origine."
          ],
          "faq": [
            {
              "q": "Un retour remet-il automatiquement le stock à jour ?",
              "a": "Oui lorsque le flux est validé dans le module prévu à cet effet."
            }
          ],
          "related": [
            "ventes-point-de-vente"
          ],
          "keywords": [
            "retour",
            "avoir",
            "transaction"
          ]
        }
      ]
    }
  ]
};
