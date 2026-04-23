import { BookOpen, Compass, Settings2, Users, ShieldCheck, Package, Boxes, ClipboardList, ShoppingCart, Receipt, RotateCcw, Calculator, FileText, Landmark, BarChart3, Bot, MessageSquare, Bell, Printer, Lock, SlidersHorizontal } from 'lucide-react';
import type { GuideModule } from '../types';

export const presentationModule: GuideModule = {
  "id": "presentation",
  "title": "Présentation de PharmaSoft",
  "tagline": "Comprendre l’espace de travail, les concepts clés et les réflexes de départ.",
  "description": "Le module de présentation accompagne les nouveaux utilisateurs dans la prise en main de PharmaSoft, de la navigation globale aux premières actions sécurisées.",
  "icon": Compass,
  "accent": "primary",
  "sections": [
    {
      "id": "presentation-demarrage",
      "title": "Démarrer avec PharmaSoft",
      "icon": BookOpen,
      "articles": [
        {
          "id": "presentation-vue-ensemble",
          "title": "Vue d’ensemble de PharmaSoft",
          "objective": "Identifier rapidement les zones clés de l’application et comprendre la logique de navigation.",
          "location": "Dashboard → Header, sidebar et espace central",
          "audience": [
            "Tous les utilisateurs",
            "Administrateurs",
            "Pharmaciens"
          ],
          "intro": "PharmaSoft centralise les opérations de l’officine autour de modules métier : Stock, Ventes, Comptabilité, Rapports, Assistant IA, Chat réseau et Paramètres. Chaque écran suit la même logique : navigation à gauche, actions dans le header, contenu métier au centre.",
          "steps": [
            {
              "title": "Repérez le module actif",
              "detail": "Le titre dans le header indique le module ou sous-module en cours."
            },
            {
              "title": "Utilisez la sidebar",
              "detail": "Sélectionnez un module principal, puis un sous-module lorsque la section en propose."
            },
            {
              "title": "Ouvrez le Guide Utilisateur",
              "detail": "Le bouton du header ou Ctrl + H ouvre cette documentation sans quitter votre travail."
            }
          ],
          "callouts": [
            {
              "type": "tip",
              "title": "Raccourci utile",
              "text": "Ctrl + H ouvre ou ferme le Guide Utilisateur depuis le Dashboard."
            }
          ],
          "bestPractices": [
            "Commencer par le Tableau de bord avant de traiter les opérations métier.",
            "Garder les droits utilisateurs alignés avec les responsabilités réelles."
          ],
          "faq": [
            {
              "q": "Puis-je travailler sans quitter le guide ?",
              "a": "Oui. Le mode panneau latéral permet de consulter un article tout en conservant l’application accessible."
            }
          ],
          "related": [
            "presentation-navigation"
          ],
          "keywords": [
            "accueil",
            "dashboard",
            "prise en main"
          ]
        }
      ]
    }
  ]
};
