/**
 * Gestionnaire de scanner de code-barres
 * Détecte l'entrée rapide d'un scanner vs saisie manuelle au clavier
 */

export interface ScannerConfig {
  prefix?: string; // Caractère(s) de début
  suffix?: string; // Caractère(s) de fin (généralement Enter)
  timeout?: number; // Timeout entre caractères en ms (défaut: 100ms)
  minLength?: number; // Longueur minimale d'un code-barres
  maxLength?: number; // Longueur maximale d'un code-barres
}

export type ScanCallback = (barcode: string) => void;

class BarcodeScanner {
  private buffer: string = '';
  private lastKeyTime: number = 0;
  private config: Required<ScannerConfig>;
  private callbacks: Set<ScanCallback> = new Set();
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(config?: ScannerConfig) {
    this.config = {
      prefix: '',
      suffix: 'Enter',
      timeout: 100,
      minLength: 7, // EAN-8 can have 7-8 characters
      maxLength: 20,
      ...config,
    };
  }

  /**
   * Initialiser le scanner
   */
  initialize(): void {
    if (this.keydownHandler) {
      this.cleanup();
    }

    this.keydownHandler = (e: KeyboardEvent) => this.handleKeyPress(e);
    document.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Nettoyer les écouteurs
   */
  cleanup(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    this.buffer = '';
    this.callbacks.clear();
  }

  /**
   * Ajouter un callback quand code-barres scanné
   */
  onScan(callback: ScanCallback): () => void {
    this.callbacks.add(callback);
    
    // Retourner une fonction pour retirer le callback
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Gérer les touches pressées
   */
  private handleKeyPress(e: KeyboardEvent): void {
    // Ignorer si focus dans un input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastKeyTime;

    // Si timeout dépassé, réinitialiser le buffer
    if (timeDiff > this.config.timeout) {
      this.buffer = '';
    }

    this.lastKeyTime = currentTime;

    // Vérifier le suffixe (généralement Enter)
    if (e.key === this.config.suffix) {
      this.processScan();
      return;
    }

    // Ignorer les touches spéciales
    if (e.key.length > 1 && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Control') {
      return;
    }

    // Ajouter au buffer (sauf touches modificatrices)
    if (e.key.length === 1) {
      this.buffer += e.key;
    }
  }

  /**
   * Traiter le scan
   */
  private processScan(): void {
    const barcode = this.buffer.trim();

    // Retirer le préfixe si présent
    let cleanedBarcode = barcode;
    if (this.config.prefix && barcode.startsWith(this.config.prefix)) {
      cleanedBarcode = barcode.substring(this.config.prefix.length);
    }

    // Valider la longueur
    if (cleanedBarcode.length < this.config.minLength || 
        cleanedBarcode.length > this.config.maxLength) {
      this.buffer = '';
      return;
    }

    // Valider le format (que des caractères alphanumériques et tirets)
    if (!this.validateBarcode(cleanedBarcode)) {
      this.buffer = '';
      return;
    }

    // Notifier tous les callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(cleanedBarcode);
      } catch (error) {
        console.error('Error in barcode scan callback:', error);
      }
    });

    this.buffer = '';
  }

  /**
   * Valider le format du code-barres
   */
  validateBarcode(code: string): boolean {
    // Autoriser lettres, chiffres, tirets et underscores
    return /^[A-Za-z0-9\-_]+$/.test(code);
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(config: Partial<ScannerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Obtenir la configuration actuelle
   */
  getConfig(): Required<ScannerConfig> {
    return { ...this.config };
  }

  /**
   * Simuler un scan (pour tests)
   */
  simulateScan(barcode: string): void {
    this.callbacks.forEach(callback => callback(barcode));
  }
}

// Instance globale du scanner
let scannerInstance: BarcodeScanner | null = null;

/**
 * Initialiser le scanner avec configuration
 */
export const initializeScanner = (config?: ScannerConfig): BarcodeScanner => {
  if (!scannerInstance) {
    scannerInstance = new BarcodeScanner(config);
  } else {
    if (config) {
      scannerInstance.updateConfig(config);
    }
  }
  
  scannerInstance.initialize();
  return scannerInstance;
};

/**
 * Obtenir l'instance du scanner
 */
export const getScanner = (): BarcodeScanner | null => {
  return scannerInstance;
};

/**
 * Nettoyer le scanner
 */
export const cleanupScanner = (): void => {
  if (scannerInstance) {
    scannerInstance.cleanup();
    scannerInstance = null;
  }
};

/**
 * Hook React pour utiliser le scanner
 */
export const setupBarcodeScanner = (
  onScan: ScanCallback,
  config?: ScannerConfig
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const scanner = initializeScanner(config);
  return scanner.onScan(onScan);
};

export default BarcodeScanner;
