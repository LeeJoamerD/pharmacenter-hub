import { BookOpen, Compass, Settings2, Users, ShieldCheck, Package, Boxes, ClipboardList, ShoppingCart, Receipt, RotateCcw, Calculator, FileText, Landmark, BarChart3, Bot, MessageSquare, Bell, Printer, Lock, SlidersHorizontal } from 'lucide-react';
import type { GuideModule } from '../types';

export const assistantModule: GuideModule = {
  "id": "assistant",
  "title": "Assistant IA",
  "tagline": "Exploiter l’IA pour l’aide décisionnelle, les anomalies et l’analyse métier.",
  "description": "L’Assistant IA accompagne l’analyse opérationnelle sans remplacer les contrôles professionnels du pharmacien.",
  "icon": Bot,
  "accent": "secondary",
  "sections": [
    {
      "id": "assistant-usages",
      "title": "Usages assistés",
      "icon": Bot,
      "articles": [
        {
          "id": "assistant-bi-pharma",
          "title": "Assistant BI et Pharma",
          "objective": "Interroger les données et obtenir des pistes d’analyse actionnables.",
          "location": "Assistant IA → Assistant BI / Pharma",
          "audience": [
            "Administrateurs",
            "Pharmaciens",
            "Gestionnaires"
          ],
          "intro": "L’assistant aide à formuler des constats sur ventes, stock, marges, clients et anomalies. Ses réponses doivent être relues dans leur contexte métier.",
          "steps": [
            {
              "title": "Choisir le type de consultation",
              "detail": "Sélectionnez BI, stock, ventes, comptabilité ou question pharma selon le besoin."
            },
            {
              "title": "Formuler une question précise",
              "detail": "Incluez période, produit, client ou indicateur si nécessaire."
            },
            {
              "title": "Valider les recommandations",
              "detail": "Comparez la réponse aux données sources avant action."
            }
          ],
          "callouts": [
            {
              "type": "info",
              "text": "L’IA complète l’analyse humaine ; elle ne remplace pas les obligations réglementaires."
            }
          ],
          "bestPractices": [
            "Poser des questions courtes et contextualisées.",
            "Vérifier les données sources avant décision."
          ],
          "faq": [
            {
              "q": "Puis-je demander une analyse de rupture ?",
              "a": "Oui, indiquez le produit, la période ou la famille concernée."
            }
          ],
          "related": [],
          "keywords": [
            "assistant",
            "IA",
            "BI",
            "analyse"
          ]
        }
      ]
    }
  ]
};
