/**
 * Utilitaires de test pour le Point de Vente
 * Permet de générer des données de test et simuler des scénarios
 */

import { POSProduct, CartItemWithLot, CustomerInfo } from '@/types/pos';

/**
 * Générer un produit de test
 */
export function generateTestProduct(overrides?: Partial<POSProduct>): POSProduct {
  const id = Math.random().toString(36).substring(7);
  const prixHT = Math.floor(Math.random() * 80) + 8;
  const tauxTVA = 18;
  const tauxCentime = 1;
  const tvaMontant = Math.round(prixHT * tauxTVA / 100);
  const centimeMontant = Math.round(prixHT * tauxCentime / 100);
  const prixTTC = prixHT + tvaMontant + centimeMontant;
  
  return {
    id,
    tenant_id: 'test-tenant',
    name: `Produit Test ${id}`,
    libelle_produit: `Produit Test ${id}`,
    dci: 'DCI Test',
    code_cip: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
    // Prix depuis la table produits (source de vérité)
    prix_vente_ht: prixHT,
    prix_vente_ttc: prixTTC,
    taux_tva: tauxTVA,
    tva_montant: tvaMontant,
    taux_centime_additionnel: tauxCentime,
    centime_additionnel_montant: centimeMontant,
    // Alias compatibilité
    price: prixTTC,
    price_ht: prixHT,
    tva_rate: tauxTVA,
    stock: Math.floor(Math.random() * 100) + 10,
    category: 'Test',
    requiresPrescription: false,
    lots: [],
    ...overrides
  };
}

/**
 * Générer plusieurs produits de test
 */
export function generateTestProducts(count: number): POSProduct[] {
  return Array.from({ length: count }, () => generateTestProduct());
}

/**
 * Générer un client de test
 */
export function generateTestCustomer(type: 'Ordinaire' | 'Conventionné' | 'Entreprise' | 'Personnel' = 'Ordinaire'): CustomerInfo {
  return {
    type,
    name: `Client Test ${Math.random().toString(36).substring(7)}`,
    phone: `06${Math.floor(Math.random() * 90000000) + 10000000}`,
    discount_rate: type !== 'Ordinaire' ? 10 : 0,
    taux_remise_automatique: type !== 'Ordinaire' ? 10 : 0,
    insurance: type === 'Conventionné' ? {
      company: 'Assurance Test',
      number: `ASS${Math.floor(Math.random() * 10000)}`,
      coverage_rate: 70
    } : undefined
  };
}

/**
 * Générer un panier de test
 */
export function generateTestCart(productCount: number = 3): CartItemWithLot[] {
  const products = generateTestProducts(productCount);
  
  return products.map(product => ({
    product,
    quantity: Math.floor(Math.random() * 5) + 1,
    unitPrice: product.price,
    discount: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0,
    total: product.price * (Math.floor(Math.random() * 5) + 1),
    lot: {
      id: Math.random().toString(36).substring(7),
      numero_lot: `LOT${Math.floor(Math.random() * 10000)}`,
      quantite_restante: product.stock,
      date_peremption: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      prix_achat_unitaire: product.price_ht * 0.8
    }
  }));
}

/**
 * Simuler un scan de code-barres
 */
export function simulateBarcodeScan(code: string, callback: (code: string) => void): void {
  // Simuler la saisie rapide caractéristique d'un scanner
  const chars = code.split('');
  let index = 0;
  
  const interval = setInterval(() => {
    if (index < chars.length) {
      const event = new KeyboardEvent('keydown', {
        key: chars[index],
        code: `Digit${chars[index]}`,
        bubbles: true
      });
      document.dispatchEvent(event);
      index++;
    } else {
      // Simuler la touche Entrée
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true
      });
      document.dispatchEvent(enterEvent);
      clearInterval(interval);
      callback(code);
    }
  }, 20); // 20ms entre chaque caractère (très rapide)
}

/**
 * Calculer les totaux d'un panier
 */
export function calculateCartTotals(cart: CartItemWithLot[]) {
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  const total = subtotal - totalDiscount;
  
  return {
    subtotal,
    discount: totalDiscount,
    total,
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
  };
}

/**
 * Valider un panier avant paiement
 */
export function validateCart(cart: CartItemWithLot[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (cart.length === 0) {
    errors.push('Le panier est vide');
  }
  
  cart.forEach((item, index) => {
    if (item.quantity <= 0) {
      errors.push(`Article ${index + 1}: quantité invalide`);
    }
    
    if (item.quantity > item.product.stock) {
      errors.push(`Article ${index + 1}: stock insuffisant (${item.product.stock} disponibles)`);
    }
    
    if (item.product.requiresPrescription) {
      errors.push(`Article ${index + 1}: requiert une ordonnance`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Générer une transaction de test complète
 */
export function generateTestTransaction() {
  const cart = generateTestCart();
  const customer = generateTestCustomer('Conventionné');
  const totals = calculateCartTotals(cart);
  
  return {
    cart,
    customer,
    payment: {
      method: 'Espèces' as const,
      amount_received: totals.total + 10,
      change: 10,
      reference: undefined
    },
    totals,
    timestamp: new Date()
  };
}

/**
 * Simuler un délai (pour tests async)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Logger les performances d'une opération
 */
export async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await operation();
  const duration = performance.now() - start;
  
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

/**
 * Vérifier la disponibilité du scanner caméra
 */
export async function checkBarcodeDetectorSupport(): Promise<boolean> {
  if (!('BarcodeDetector' in window)) {
    console.warn('BarcodeDetector API non disponible');
    return false;
  }
  
  try {
    const formats = await (window as any).BarcodeDetector.getSupportedFormats();
    console.log('Formats de codes-barres supportés:', formats);
    return formats.length > 0;
  } catch (error) {
    console.error('Erreur vérification BarcodeDetector:', error);
    return false;
  }
}

/**
 * Générer des données de test pour les analytiques
 */
export function generateAnalyticsTestData(days: number = 7) {
  const data = [];
  const now = Date.now();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toISOString().split('T')[0],
      ventes: Math.floor(Math.random() * 50) + 10,
      montant: Math.floor(Math.random() * 10000) + 1000,
      articles: Math.floor(Math.random() * 200) + 50,
      clients: Math.floor(Math.random() * 40) + 5
    });
  }
  
  return data.reverse();
}

/**
 * Tester la connexion Supabase
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Erreur connexion Supabase:', error);
    return false;
  }
}
