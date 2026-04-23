import { BookOpen, Compass, Settings2, Users, ShieldCheck, Package, Boxes, ClipboardList, ShoppingCart, Receipt, RotateCcw, Calculator, FileText, Landmark, BarChart3, Bot, MessageSquare, Bell, Printer, Lock, SlidersHorizontal } from 'lucide-react';
import type { GuideModule } from '../types';

export const chatModule: GuideModule = {
  "id": "chat",
  "title": "Chat-PharmaSoft",
  "tagline": "Collaborer avec les officines, diffuser des alertes et gérer le réseau.",
  "description": "Chat-PharmaSoft facilite les échanges réseau : messages directs, canaux, alertes et annuaire d’officines.",
  "icon": MessageSquare,
  "accent": "primary",
  "sections": [
    {
      "id": "chat-reseau",
      "title": "Communication réseau",
      "icon": "Bell",
      "articles": [
        {
          "id": "chat-alertes-reseau",
          "title": "Alertes réseau",
          "objective": "Diffuser une information importante aux officines destinataires.",
          "location": "Chat-PharmaSoft → Alertes Réseau",
          "audience": [
            "Administrateurs réseau",
            "Pharmaciens",
            "Responsables"
          ],
          "intro": "Les alertes réseau sont conçues pour les informations urgentes ou structurantes : rupture, rappel, consigne, sécurité ou communication interne.",
          "steps": [
            {
              "title": "Ouvrir la diffusion d’alerte",
              "detail": "Accédez au module Chat puis au flux d’alertes."
            },
            {
              "title": "Rédiger un message clair",
              "detail": "Indiquez objet, priorité, contexte et action attendue."
            },
            {
              "title": "Choisir les destinataires",
              "detail": "Sélectionnez les officines concernées ou le canal système."
            },
            {
              "title": "Envoyer et vérifier",
              "detail": "Contrôlez le nombre d’officines alertées dans le toast de confirmation."
            }
          ],
          "callouts": [
            {
              "type": "warning",
              "text": "Réservez les alertes aux messages nécessitant une attention rapide."
            }
          ],
          "bestPractices": [
            "Utiliser un objet explicite.",
            "Éviter les messages ambigus.",
            "Suivre les retours des officines destinataires."
          ],
          "faq": [
            {
              "q": "Une alerte est-elle différente d’un message direct ?",
              "a": "Oui, l’alerte vise une diffusion structurée sur un canal système ou un groupe ciblé."
            }
          ],
          "related": [],
          "keywords": [
            "chat",
            "alerte",
            "réseau",
            "officines"
          ]
        }
      ]
    }
  ]
};
