export interface PharmacyRegistrationData {
  name: string;
  code: string;
  address: string;
  quartier: string;
  arrondissement: string;
  city: string;
  region: string;
  pays: string;
  email: string;
  telephone_appel: string;
  telephone_whatsapp: string;
  departement: string;
  type: string;
  
  // Administrateur principal
  admin_noms: string;
  admin_prenoms: string;
  admin_email: string;
  admin_telephone: string;
  admin_reference: string;
  admin_password: string;
}