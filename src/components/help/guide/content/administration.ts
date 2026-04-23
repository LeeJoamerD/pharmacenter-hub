import { BookOpen, Compass, Settings2, Users, ShieldCheck, Package, Boxes, ClipboardList, ShoppingCart, Receipt, RotateCcw, Calculator, FileText, Landmark, BarChart3, Bot, MessageSquare, Bell, Printer, Lock, SlidersHorizontal } from 'lucide-react';
import type { GuideModule } from '../types';

export const administrationModule: GuideModule = {
  "id": "administration",
  "title": "Administration",
  "tagline": "Structurer le personnel, les partenaires, les clients et les référentiels.",
  "description": "Administration regroupe les fonctions de gouvernance opérationnelle : personnel, partenaires, référentiel produits, clients, documents, analytics et workflows.",
  "icon": ShieldCheck,
  "accent": "info",
  "sections": [
    {
      "id": "administration-structure",
      "title": "Organisation et référentiels",
      "icon": Users,
      "articles": [
        {
          "id": "administration-personnel-roles",
          "title": "Personnel et rôles",
          "objective": "Créer une organisation claire en associant chaque collaborateur à un rôle adapté.",
          "location": "Administration → Gestion du Personnel",
          "audience": [
            "Administrateurs",
            "Pharmacien Titulaire"
          ],
          "intro": "Les fiches personnel constituent la base des accès et responsabilités. PharmaSoft sépare l’identité métier, les comptes utilisateurs et les permissions pour limiter les erreurs de privilèges.",
          "steps": [
            {
              "title": "Créer ou vérifier la fiche personnel",
              "detail": "Renseignez les informations professionnelles avant d’activer les accès."
            },
            {
              "title": "Associer le bon rôle",
              "detail": "Attribuez le rôle correspondant à la fonction réelle : pharmacien, caissier, gestionnaire stock, comptable ou administrateur."
            },
            {
              "title": "Contrôler les accès",
              "detail": "Vérifiez les modules visibles après création afin de confirmer le périmètre autorisé."
            }
          ],
          "callouts": [
            {
              "type": "warning",
              "title": "Sécurité",
              "text": "Ne partagez jamais un compte utilisateur entre plusieurs personnes ; chaque action doit rester traçable."
            }
          ],
          "bestPractices": [
            "Réviser les rôles après tout changement de poste.",
            "Désactiver les accès des utilisateurs sortants sans supprimer l’historique métier."
          ],
          "faq": [
            {
              "q": "Un utilisateur peut-il avoir plusieurs responsabilités ?",
              "a": "Oui, mais les rôles doivent rester cohérents avec la politique de sécurité de l’officine."
            }
          ],
          "related": [],
          "keywords": [
            "personnel",
            "rôles",
            "permissions",
            "administration"
          ]
        },
        {
          "id": "administration-referentiel-produits",
          "title": "Référentiel produits",
          "objective": "Maintenir une base produit cohérente pour fiabiliser les ventes, stocks et rapports.",
          "location": "Administration → Référentiel Produits",
          "audience": [
            "Administrateurs",
            "Gestionnaires stock",
            "Pharmaciens"
          ],
          "intro": "Le référentiel produit centralise les informations commerciales et pharmaceutiques utilisées par les modules Stock et Ventes.",
          "steps": [
            {
              "title": "Rechercher avant de créer",
              "detail": "Vérifiez l’existence du produit pour éviter les doublons."
            },
            {
              "title": "Contrôler les identifiants",
              "detail": "Renseignez code CIP, famille, catégorie et informations de prix selon les règles internes."
            },
            {
              "title": "Valider les dépendances",
              "detail": "Avant toute modification importante, vérifiez l’usage du produit dans le stock et les transactions."
            }
          ],
          "callouts": [
            {
              "type": "info",
              "text": "Un référentiel propre améliore la qualité des rapports et des recommandations IA."
            }
          ],
          "bestPractices": [
            "Uniformiser les libellés produits.",
            "Éviter les créations manuelles redondantes lorsque le catalogue global suffit."
          ],
          "faq": [
            {
              "q": "Pourquoi certains champs sont obligatoires ?",
              "a": "Ils alimentent les contrôles de stock, la facturation et les états réglementaires."
            }
          ],
          "related": [],
          "keywords": [
            "référentiel",
            "produits",
            "catalogue"
          ]
        }
      ]
    }
  ]
};
