/**
 * Gestionnaire de scanner de code-barres
 * Détecte l'entrée rapide d'un scanner vs saisie manuelle au clavier
 */

export interface ScannerConfig {
  prefix?: string;
  suffix?: string;
  timeout?: number;
  minLength?: number;
  maxLength?: number;
}

export type ScanCallback = (barcode: string) => void;

/**
 * Table de correspondance AZERTY (sans Shift) → caractères attendus.
 */
const AZERTY_NO_SHIFT_MAP: Record<string, string> = {
  '&': '1', 'é': '2', '"': '3', "'": '4', '(': '5',
  '-': '6', 'è': '7', '_': '8', 'ç': '9', 'à': '0',
  ')': '°',
};

/**
 * Table de correspondance AZERTY ↔ QWERTY pour les lettres.
 * Appliquée seulement en contexte de scan rapide, pas en saisie manuelle.
 */
const AZERTY_LETTER_MAP: Record<string, string> = {
  'q': 'A', 'Q': 'A',
  'a': 'Q', 'A': 'Q',
  'z': 'W', 'Z': 'W',
  'w': 'Z', 'W': 'Z',
};

/**
 * Normalise un caractère reçu du clavier pour compenser le layout AZERTY.
 */
function normalizeAzertyChar(char: string): string {
  const mapped = AZERTY_NO_SHIFT_MAP[char];
  if (mapped !== undefined) return mapped;
  const letterMapped = AZERTY_LETTER_MAP[char];
  if (letterMapped !== undefined) return letterMapped;
  return char.toUpperCase();
}

class BarcodeScanner {
  private buffer: string = '';
  private lastKeyTime: number = 0;
  private config: Required<ScannerConfig>;
  private callbacks: Set<ScanCallback> = new Set();
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  /** Track how many keydown events belong to the current scan burst */
  private scanKeyCount: number = 0;

  constructor(config?: ScannerConfig) {
    this.config = {
      prefix: '',
      suffix: 'Enter',
      timeout: 80,
      minLength: 7,
      maxLength: 50,
      ...config,
    };
  }

  initialize(): void {
    if (this.keydownHandler) {
      this.cleanup();
    }

    this.keydownHandler = (e: KeyboardEvent) => this.handleKeyPress(e);
    // Use capture phase so we intercept BEFORE the input field processes the key
    document.addEventListener('keydown', this.keydownHandler, true);
  }

  cleanup(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler, true);
      this.keydownHandler = null;
    }
    this.buffer = '';
    this.scanKeyCount = 0;
    this.callbacks.clear();
  }

  onScan(callback: ScanCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Gérer les touches pressées.
   * Strategy: accumulate fast keystrokes. If we detect a complete scan
   * (suffix received with enough chars), we preventDefault on ALL accumulated
   * keys so they never reach the input field.
   * We preventDefault speculatively on fast keystrokes (< timeout).
   */
  private handleKeyPress(e: KeyboardEvent): void {
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastKeyTime;

    // If timeout exceeded, reset buffer
    if (timeDiff > this.config.timeout) {
      this.buffer = '';
      this.scanKeyCount = 0;
    }

    this.lastKeyTime = currentTime;

    // Check suffix (usually Enter)
    if (e.key === this.config.suffix) {
      if (this.buffer.length >= this.config.minLength) {
        // It's a scan! Block Enter from reaching the form
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.processScan();
      } else {
        this.buffer = '';
        this.scanKeyCount = 0;
      }
      return;
    }

    // Ignore special keys (except modifiers which we just skip)
    if (e.key.length > 1 && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Control' && e.key !== 'CapsLock') {
      return;
    }

    // Add printable character to buffer
    if (e.key.length === 1) {
      const normalized = normalizeAzertyChar(e.key);
      if (normalized) {
        this.buffer += normalized;
        this.scanKeyCount++;

        // If this looks like a fast scan burst (3+ chars accumulated quickly),
        // start preventing default to stop chars from reaching the input
        if (this.scanKeyCount >= 3 && timeDiff <= this.config.timeout) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    }
  }

  private processScan(): void {
    const barcode = this.buffer.trim();

    let cleanedBarcode = barcode;
    if (this.config.prefix && barcode.startsWith(this.config.prefix)) {
      cleanedBarcode = barcode.substring(this.config.prefix.length);
    }

    if (cleanedBarcode.length < this.config.minLength || 
        cleanedBarcode.length > this.config.maxLength) {
      this.buffer = '';
      this.scanKeyCount = 0;
      return;
    }

    if (!this.validateBarcode(cleanedBarcode)) {
      this.buffer = '';
      this.scanKeyCount = 0;
      return;
    }

    console.log('[BarcodeScanner] Scan détecté:', cleanedBarcode);

    this.callbacks.forEach(callback => {
      try {
        callback(cleanedBarcode);
      } catch (error) {
        console.error('Error in barcode scan callback:', error);
      }
    });

    // Clear any residual characters that leaked into the active input
    const activeEl = document.activeElement;
    if (activeEl && activeEl.tagName === 'INPUT') {
      const inputEl = activeEl as HTMLInputElement;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(inputEl, '');
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        inputEl.value = '';
      }
    }

    this.buffer = '';
    this.scanKeyCount = 0;
  }

  validateBarcode(code: string): boolean {
    return /^[A-Za-z0-9\-_°.\/]+$/.test(code);
  }

  updateConfig(config: Partial<ScannerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): Required<ScannerConfig> {
    return { ...this.config };
  }

  simulateScan(barcode: string): void {
    this.callbacks.forEach(callback => callback(barcode));
  }
}

// Instance globale du scanner
let scannerInstance: BarcodeScanner | null = null;

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

export const getScanner = (): BarcodeScanner | null => scannerInstance;

export const cleanupScanner = (): void => {
  if (scannerInstance) {
    scannerInstance.cleanup();
    scannerInstance = null;
  }
};

export const setupBarcodeScanner = (
  onScan: ScanCallback,
  config?: ScannerConfig
): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const scanner = initializeScanner(config);
  return scanner.onScan(onScan);
};

/**
 * Normalise un code-barres pour la recherche RPC.
 * Peut être utilisé par le scanner ET la saisie manuelle.
 */
export const normalizeBarcodeForSearch = (input: string): string => {
  return input
    .trim()
    .toUpperCase()
    .replace(/°/g, '-');
};

export default BarcodeScanner;
