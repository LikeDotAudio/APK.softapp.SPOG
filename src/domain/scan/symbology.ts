// src/domain/scan/symbology — what a decoder hands back, in one spelling
// whichever engine answered (ROAD-3476). Pure: no DOM, no engine.

/** The symbologies the scanner asks for. Labels on broadcast gear carry QR,
 *  DataMatrix (manufacturer serials) and Code 128 (asset tags); anything else
 *  a decoder happens to report is `other`. */
export type Symbology = 'qr' | 'datamatrix' | 'code128' | 'other';

/** One code seen in one frame or still. */
export interface ScanRead {
  text: string;
  symbology: Symbology;
}

/** The platform BarcodeDetector's names for the three formats. */
export const NATIVE_FORMATS: readonly string[] = ['qr_code', 'data_matrix', 'code_128'];

/** zxing-cpp's names for the same three. */
export const ZXING_FORMATS = ['QRCode', 'DataMatrix', 'Code128'] as const;

/** Tolerant in (`qr_code`, `QRCode`, `Data Matrix`, `CODE-128`), strict out:
 *  punctuation and case are stripped rather than mapped case by case. */
export function normaliseSymbology(format: string | null | undefined): Symbology {
  const flat = String(format ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (flat === 'qr' || flat === 'qrcode') return 'qr';
  if (flat === 'datamatrix') return 'datamatrix';
  if (flat === 'code128') return 'code128';
  return 'other';
}

/** Trim, drop empty texts, and normalise symbologies — the one clean-up both
 *  engines' raw output goes through. */
export function cleanReads(raw: ReadonlyArray<{ text?: unknown; format?: unknown }>): ScanRead[] {
  return raw
    .map((r) => ({ text: String(r.text ?? '').trim(), symbology: normaliseSymbology(String(r.format ?? '')) }))
    .filter((r) => r.text !== '');
}
