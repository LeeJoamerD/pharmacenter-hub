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

/**
 * Table de correspondance AZERTY (sans Shift) → caractères attendus.
 * Les scanners physiques envoient souvent les keycodes bruts ; sur un
 * clavier AZERTY français sans Caps Lock, les chiffres et certains
 * caractères sont remplacés par des symboles accentués.
 */
const AZERTY_NO_SHIFT_MAP: Record<string, string> = {
  // Rangée des chiffres (sans Shift sur AZERTY)
  '&': '1', 'é': '2', '"': '3', "'": '4', '(': '5',
  // Note : '-' sur AZERTY sans Shift = '6', mais '-' est aussi un séparateur valide
  // On ne mappe pas '-' → '6' car '-' est attendu dans les codes-barres
  'è': '7', '_': '8', 'ç': '9', 'à': '0',
  // La touche ° sans Shift produit ')'
  ')': '°',
  // Swap AZERTY ↔ QWERTY pour les lettres (minuscules ET majuscules)
  'q': 'A', 'Q': 'A', 'a': 'Q', 'A': 'Q',
  'z': 'W', 'Z': 'W', 'w': 'Z', 'W': 'Z',
  'm': 'M',
  // '»' et '«' peuvent apparaître sur certains scanners
  '»': '',  '«': '',
};

/**
 * Normalise un caractère reçu du clavier pour compenser le layout AZERTY.
 * Applique aussi toUpperCase pour garantir la casse.
 */
function normalizeAzertyChar(char: string): string {
  // D'abord, vérifier la table de correspondance
  const mapped = AZERTY_NO_SHIFT_MAP[char];
  if (mapped !== undefined) return mapped;
  // Sinon, forcer en majuscule
  return char.toUpperCase();
}

class BarcodeScanner {
  private buffer: string = '';
  private lastKeyTime: number = 0;
  private config: Required<ScannerConfig>;
  private callbacks: Set<ScanCallback> = new Set();
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private inputCharsToUndo: number = 0;

  constructor(config?: ScannerConfig) {
    this.config = {
      prefix: '',
      suffix: 'Enter',
      timeout: 100,
      minLength: 7, // EAN-8 can have 7-8 characters
      maxLength: 50,
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
   * Fonctionne aussi quand un INPUT est focusé : le scanner physique
   * envoie les caractères très rapidement (< timeout ms entre chaque).
   * Si un scan complet est détecté, on empêche le comportement par défaut
   * pour ne pas polluer le champ de saisie.
   */
  private handleKeyPress(e: KeyboardEvent): void {
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastKeyTime;
    const target = e.target as HTMLElement;
    const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

    // Si timeout dépassé, réinitialiser le buffer
    if (timeDiff > this.config.timeout) {
      this.buffer = '';
      this.inputCharsToUndo = 0;
    }

    this.lastKeyTime = currentTime;

    // Vérifier le suffixe (généralement Enter)
    if (e.key === this.config.suffix) {
      if (this.buffer.length >= this.config.minLength) {
        // C'est un scan ! Empêcher l'Enter d'être traité par le formulaire
        e.preventDefault();
        e.stopPropagation();
        // Si on était dans un input, retirer les caractères tapés par le scanner
        if (isInInput && target instanceof HTMLInputElement) {
          const currentVal = target.value;
          const scannedText = this.buffer;
          // Retirer le texte scanné du champ input
          if (currentVal.endsWith(scannedText)) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, 'value'
            )?.set;
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(target, currentVal.slice(0, -scannedText.length));
              target.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        }
        this.processScan();
      } else {
        this.buffer = '';
      }
      return;
    }

    // Ignorer les touches spéciales
    if (e.key.length > 1 && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Control') {
      return;
    }

    // Ajouter au buffer (sauf touches modificatrices)
    if (e.key.length === 1) {
      const normalized = normalizeAzertyChar(e.key);
      if (normalized) {
        this.buffer += normalized;
      }
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
    // Autoriser lettres, chiffres, tirets, underscores, °, points, slashes
    return /^[A-Za-z0-9\-_°.\/]+$/.test(code);
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
