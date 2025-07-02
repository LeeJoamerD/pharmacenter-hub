import { Employee, LeaveRequest, Training, Schedule } from '../types';

export const employees: Employee[] = [
  {
    id: 1,
    noms: "Dupont",
    prenoms: "Marie",
    fonction: "Pharmacien titulaire",
    adresse: "123 Rue de la Pharmacie, Paris",
    telephone_appel: "01.23.45.67.89",
    telephone_whatsapp: "01.23.45.67.89",
    email: "marie.dupont@pharma.com",
    niu_cni: "1234567890123",
    profession: "Pharmacien",
    date_naissance: "1985-05-15",
    date_recrutement: "2020-03-15",
    photo_identite: "marie_dupont.jpg",
    salaire_base: 4500.00,
    situation_familiale: "Marié(e)",
    nombre_enfants: 2,
    numero_cnss: "123456789",
    statut_contractuel: "CDI"
  },
  {
    id: 2,
    noms: "Martin",
    prenoms: "Pierre",
    fonction: "Préparateur",
    adresse: "456 Avenue des Médicaments, Lyon",
    telephone_appel: "01.23.45.67.90",
    telephone_whatsapp: "01.23.45.67.90",
    email: "pierre.martin@pharma.com",
    niu_cni: "1234567890124",
    profession: "Préparateur en pharmacie",
    date_naissance: "1990-08-22",
    date_recrutement: "2021-09-01",
    salaire_base: 2800.00,
    situation_familiale: "Célibataire",
    nombre_enfants: 0,
    numero_cnss: "123456790",
    statut_contractuel: "CDI"
  },
  {
    id: 3,
    noms: "Bernard",
    prenoms: "Sophie",
    fonction: "Pharmacien adjoint",
    adresse: "789 Boulevard de la Santé, Marseille",
    telephone_appel: "01.23.45.67.91",
    telephone_whatsapp: "01.23.45.67.91",
    email: "sophie.bernard@pharma.com",
    niu_cni: "1234567890125",
    profession: "Pharmacien",
    date_naissance: "1988-12-10",
    date_recrutement: "2019-01-10",
    salaire_base: 3800.00,
    situation_familiale: "Divorcé(e)",
    nombre_enfants: 1,
    numero_cnss: "123456791",
    statut_contractuel: "CDD"
  }
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: 1,
    employe: "Marie Dupont",
    type: "Congés payés",
    dateDebut: "2024-07-15",
    dateFin: "2024-07-29",
    statut: "Approuvé",
    motif: "Vacances d'été"
  },
  {
    id: 2,
    employe: "Pierre Martin",
    type: "Congé maladie",
    dateDebut: "2024-07-02",
    dateFin: "2024-07-05",
    statut: "En attente",
    motif: "Arrêt médical"
  }
];

export const trainings: Training[] = [
  {
    id: 1,
    nom: "Formation Vaccinations",
    employes: ["Marie Dupont", "Sophie Bernard"],
    dateDebut: "2024-08-01",
    dateFin: "2024-08-02",
    statut: "Planifié",
    organisme: "Ordre des Pharmaciens",
    description: "Formation sur les protocoles de vaccination en pharmacie",
    duree: 16,
    lieu: "Centre de formation, Paris",
    cout: 350.00,
    certificat_requis: true
  },
  {
    id: 2,
    nom: "Mise à jour réglementation",
    employes: ["Pierre Martin"],
    dateDebut: "2024-07-20",
    dateFin: "2024-07-20",
    statut: "Terminé",
    organisme: "Formation Continue Pharma",
    description: "Mise à jour sur les nouvelles réglementations pharmaceutiques",
    duree: 8,
    lieu: "En ligne",
    certificat_requis: false
  }
];

export const schedules: Schedule[] = [
  {
    id: 1,
    employe: "Marie Dupont",
    date: "2024-07-02",
    heureDebut: "08:00",
    heureFin: "16:00",
    typeShift: "Journée complète",
    poste: "Comptoir principal",
    statut: "Confirmé",
    notes: "Responsable de l'ouverture"
  },
  {
    id: 2,
    employe: "Pierre Martin",
    date: "2024-07-02",
    heureDebut: "14:00",
    heureFin: "20:00",
    typeShift: "Après-midi",
    poste: "Préparation",
    statut: "Planifié"
  },
  {
    id: 3,
    employe: "Sophie Bernard",
    date: "2024-07-02",
    heureDebut: "09:00",
    heureFin: "17:00",
    typeShift: "Journée complète",
    poste: "Conseil/OTC",
    statut: "Confirmé"
  },
  {
    id: 4,
    employe: "Marie Dupont",
    date: "2024-07-03",
    heureDebut: "08:00",
    heureFin: "12:00",
    typeShift: "Matinée",
    poste: "Comptoir principal",
    statut: "Planifié"
  }
];