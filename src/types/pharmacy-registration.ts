export interface PharmacyRegistrationData {
  name: string;
  licence_number: string; // Remplace code
  address: string;
  quartier: string;
  arrondissement: string;
  city: string;
  pays: string;
  website: string;
  email: string;
  telephone_appel: string;
  telephone_whatsapp: string;
  departement: string;
  type: string;
  
  // Administrateur principal
  admin_noms: string;
  admin_prenoms: string;
  admin_email: string;
  admin_telephone_principal: string;
  admin_whatsapp: string;
  admin_reference: string;
  admin_role: string;
  admin_password: string;
}