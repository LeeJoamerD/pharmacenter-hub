import { BookOpen, Compass, Settings2, Users, ShieldCheck, Package, Boxes, ClipboardList, ShoppingCart, Receipt, RotateCcw, Calculator, FileText, Landmark, BarChart3, Bot, MessageSquare, Bell, Printer, Lock, SlidersHorizontal } from 'lucide-react';
import type { GuideModule } from '../types';

export const comptabiliteModule: GuideModule = {
  "id": "comptabilite",
  "title": "Comptabilité",
  "tagline": "Suivre les journaux, factures, règlements, TVA et écritures SYSCOHADA.",
  "description": "La comptabilité PharmaSoft automatise les écritures métier tout en respectant les exigences SYSCOHADA adaptées au contexte Congo.",
  "icon": Calculator,
  "accent": "warning",
  "sections": [
    {
      "id": "comptabilite-flux",
      "title": "Flux comptables",
      "icon": "Landmark",
      "articles": [
        {
          "id": "comptabilite-journaux-ecritures",
          "title": "Journaux et écritures",
          "objective": "Comprendre comment les opérations métier alimentent la comptabilité.",
          "location": "Comptabilité → Journaux / Écritures",
          "audience": [
            "Comptables",
            "Administrateurs",
            "Pharmacien Titulaire"
          ],
          "intro": "Les ventes, règlements, factures et retours peuvent générer des écritures organisées par journaux. Le contrôle d’équilibre garantit la cohérence débit/crédit.",
          "steps": [
            {
              "title": "Consulter le journal",
              "detail": "Filtrez par période, type d’opération ou statut."
            },
            {
              "title": "Contrôler les pièces",
              "detail": "Vérifiez la source métier et les comptes utilisés."
            },
            {
              "title": "Analyser les anomalies",
              "detail": "Utilisez les alertes ou l’assistant comptable pour corriger les écarts."
            }
          ],
          "callouts": [
            {
              "type": "success",
              "text": "Une écriture équilibrée facilite les clôtures et les déclarations."
            }
          ],
          "bestPractices": [
            "Contrôler les comptes par défaut avant exploitation.",
            "Réviser les journaux avant clôture mensuelle."
          ],
          "faq": [
            {
              "q": "Les écritures sont-elles toujours automatiques ?",
              "a": "Elles dépendent de la configuration comptable et des événements métier activés."
            }
          ],
          "related": [],
          "keywords": [
            "comptabilité",
            "journaux",
            "écritures",
            "SYSCOHADA"
          ]
        },
        {
          "id": "comptabilite-fiscalite-tva",
          "title": "Fiscalité et TVA",
          "objective": "Préparer les informations utiles aux déclarations fiscales mensuelles.",
          "location": "Comptabilité → Fiscalité",
          "audience": [
            "Comptables",
            "Administrateurs"
          ],
          "intro": "Le suivi fiscal consolide les ventes, taxes et écritures nécessaires à la déclaration. Les règles doivent rester alignées avec la configuration locale.",
          "steps": [
            {
              "title": "Choisir la période",
              "detail": "Sélectionnez le mois ou la plage à analyser."
            },
            {
              "title": "Contrôler les bases taxables",
              "detail": "Comparez les montants hors taxe, TVA et centimes additionnels."
            },
            {
              "title": "Exporter ou préparer la déclaration",
              "detail": "Utilisez les états disponibles pour justification."
            }
          ],
          "callouts": [
            {
              "type": "warning",
              "text": "Un mauvais paramétrage fiscal peut produire des écarts déclaratifs."
            }
          ],
          "bestPractices": [
            "Vérifier les taux avant la première vente du mois.",
            "Conserver les justificatifs de correction."
          ],
          "faq": [
            {
              "q": "Le module couvre-t-il le SYSCOHADA ?",
              "a": "Oui, les guides et automatismes sont conçus autour des principes SYSCOHADA révisés."
            }
          ],
          "related": [
            "comptabilite-journaux-ecritures"
          ],
          "keywords": [
            "TVA",
            "fiscalité",
            "déclaration"
          ]
        }
      ]
    }
  ]
};
