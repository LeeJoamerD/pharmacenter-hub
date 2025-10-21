import { supabase } from '@/integrations/supabase/client';

export interface TestProduct {
  nom_produit: string;
  libelle_produit: string;
  code_produit: string;
  prix_achat: number;
  prix_vente: number;
  stock_minimum: number;
  stock_maximum: number;
  is_active: boolean;
  tenant_id: string;
  famille_id?: string;
  rayon_id?: string;
}

export interface TestLot {
  produit_id: string;
  numero_lot: string;
  quantite_initiale: number;
  quantite_restante: number;
  date_peremption: string;
  tenant_id: string;
}

// Générateur de noms de produits pharmaceutiques réalistes
const generateProductNames = (): string[] => [
  'Paracétamol 500mg', 'Amoxicilline 250mg', 'Ibuprofène 400mg', 'Aspirine 100mg',
  'Oméprazole 20mg', 'Métformine 850mg', 'Atorvastatine 20mg', 'Losartan 50mg',
  'Amlodipine 5mg', 'Simvastatine 40mg', 'Lisinopril 10mg', 'Furosémide 40mg',
  'Prednisolone 5mg', 'Dexaméthasone 4mg', 'Cétirizine 10mg', 'Loratadine 10mg',
  'Salbutamol 100mcg', 'Beclométasone 250mcg', 'Insuline Rapide', 'Insuline Lente',
  'Vitamine D3 1000UI', 'Vitamine B12 1000mcg', 'Acide Folique 5mg', 'Fer 65mg',
  'Calcium 500mg', 'Magnésium 400mg', 'Zinc 15mg', 'Vitamine C 1000mg',
  'Sirop Toux Enfant', 'Sirop Paracétamol', 'Crème Hydrocortisone', 'Gel Diclofénac',
  'Collyre Antibiotique', 'Gouttes Auriculaires', 'Spray Nasal', 'Compresses Stériles',
  'Seringues 5ml', 'Aiguilles 21G', 'Gants Latex', 'Masques Chirurgicaux',
  'Thermomètre Digital', 'Tensiomètre', 'Glucomètre', 'Bandelettes Glucose',
  'Pansements Adhésifs', 'Bandes Élastiques', 'Désinfectant Alcool', 'Bétadine Solution'
];

// Générateur de codes produits
const generateProductCode = (index: number): string => {
  const prefixes = ['MED', 'PHR', 'VIT', 'SIR', 'CRE', 'COL', 'INS', 'MAT'];
  const prefix = prefixes[index % prefixes.length];
  const number = String(index + 1000).padStart(6, '0');
  return `${prefix}${number}`;
};

// Générateur de prix réalistes
const generatePrice = (basePrice: number, variation: number = 0.3): number => {
  const factor = 1 + (Math.random() - 0.5) * variation;
  return Math.round(basePrice * factor);
};

// Générateur de stocks réalistes
const generateStock = (min: number, max: number): { minimum: number; maximum: number; actual: number } => {
  const minimum = Math.floor(Math.random() * 20) + min;
  const maximum = minimum + Math.floor(Math.random() * 100) + 50;
  const actual = Math.floor(Math.random() * (maximum - minimum + 50)) + minimum - 10;
  return { minimum, maximum, actual: Math.max(0, actual) };
};

// Générateur de lots
const generateLots = (productId: string, tenantId: string, stockActual: number): TestLot[] => {
  if (stockActual === 0) return [];
  
  const numLots = Math.min(Math.floor(Math.random() * 3) + 1, Math.ceil(stockActual / 50));
  const lots: TestLot[] = [];
  let remainingStock = stockActual;
  
  for (let i = 0; i < numLots && remainingStock > 0; i++) {
    const lotQuantity = i === numLots - 1 ? remainingStock : Math.floor(Math.random() * Math.min(remainingStock, 100)) + 1;
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + Math.floor(Math.random() * 24) + 6);
    
    lots.push({
      produit_id: productId,
      numero_lot: `LOT${String(Date.now() + i).slice(-8)}`,
      quantite_initiale: lotQuantity,
      quantite_restante: lotQuantity,
      date_peremption: expirationDate.toISOString().split('T')[0],
      tenant_id: tenantId
    });
    
    remainingStock -= lotQuantity;
  }
  
  return lots;
};

export const generateTestProducts = (count: number, tenantId: string): { products: TestProduct[]; lots: TestLot[] } => {
  const productNames = generateProductNames();
  const products: TestProduct[] = [];
  const lots: TestLot[] = [];
  
  for (let i = 0; i < count; i++) {
    const name = productNames[i % productNames.length];
    const variation = Math.floor(i / productNames.length) + 1;
    const productName = variation > 1 ? `${name} (Var ${variation})` : name;
    
    const basePrice = Math.floor(Math.random() * 5000) + 500; // Prix entre 500 et 5500 FCFA
    const stock = generateStock(5, 20);
    
    const product: TestProduct = {
      nom_produit: productName,
      libelle_produit: productName, // Utiliser le même nom pour le libellé
      code_produit: generateProductCode(i),
      prix_achat: generatePrice(basePrice, 0.2),
      prix_vente: generatePrice(basePrice * 1.3, 0.15),
      stock_minimum: stock.minimum,
      stock_maximum: stock.maximum,
      is_active: Math.random() > 0.05, // 95% des produits actifs
      tenant_id: tenantId
    };
    
    products.push(product);
    
    // Générer les lots pour ce produit
    const productLots = generateLots(`product_${i}`, tenantId, stock.actual);
    lots.push(...productLots);
  }
  
  return { products, lots };
};

export const insertTestData = async (tenantId: string, productCount: number = 1000) => {
  console.log(`Génération de ${productCount} produits de test...`);
  
  const { products, lots } = generateTestProducts(productCount, tenantId);
  
  try {
    // Insérer les produits par batch de 100
    const batchSize = 100;
    const insertedProducts: any[] = [];
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`Insertion du batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}...`);
      
      const { data, error } = await supabase
        .from('produits')
        .insert(batch)
        .select('id, nom_produit');
      
      if (error) {
        console.error('Erreur lors de l\'insertion des produits:', error);
        throw error;
      }
      
      insertedProducts.push(...(data || []));
    }
    
    console.log(`${insertedProducts.length} produits insérés avec succès`);
    
    // Mettre à jour les lots avec les vrais IDs des produits
    const lotsWithRealIds = lots.map((lot, index) => ({
      ...lot,
      produit_id: insertedProducts[Math.floor(index / 3)]?.id || insertedProducts[0]?.id
    })).filter(lot => lot.produit_id);
    
    // Insérer les lots par batch
    if (lotsWithRealIds.length > 0) {
      for (let i = 0; i < lotsWithRealIds.length; i += batchSize) {
        const batch = lotsWithRealIds.slice(i, i + batchSize);
        console.log(`Insertion des lots - batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(lotsWithRealIds.length / batchSize)}...`);
        
        const { error } = await supabase
          .from('lots')
          .insert(batch);
        
        if (error) {
          console.error('Erreur lors de l\'insertion des lots:', error);
          // Ne pas arrêter le processus pour les lots
        }
      }
      
      console.log(`${lotsWithRealIds.length} lots insérés`);
    }
    
    return {
      productsInserted: insertedProducts.length,
      lotsInserted: lotsWithRealIds.length,
      success: true
    };
    
  } catch (error) {
    console.error('Erreur lors de l\'insertion des données de test:', error);
    return {
      productsInserted: 0,
      lotsInserted: 0,
      success: false,
      error: error.message
    };
  }
};

export const cleanupTestData = async (tenantId: string) => {
  try {
    console.log('Suppression des données de test...');
    
    // Supprimer les lots en premier (contrainte de clé étrangère)
    const { error: lotsError } = await supabase
      .from('lots')
      .delete()
      .eq('tenant_id', tenantId)
      .like('numero_lot', 'LOT%');
    
    if (lotsError) {
      console.error('Erreur lors de la suppression des lots:', lotsError);
    }
    
    // Supprimer les produits de test
    const { error: productsError } = await supabase
      .from('produits')
      .delete()
      .eq('tenant_id', tenantId)
      .or('code_produit.like.MED%,code_produit.like.PHR%,code_produit.like.VIT%,code_produit.like.SIR%,code_produit.like.CRE%,code_produit.like.COL%,code_produit.like.INS%,code_produit.like.MAT%');
    
    if (productsError) {
      console.error('Erreur lors de la suppression des produits:', productsError);
      throw productsError;
    }
    
    console.log('Données de test supprimées avec succès');
    return { success: true };
    
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    return { success: false, error: error.message };
  }
};