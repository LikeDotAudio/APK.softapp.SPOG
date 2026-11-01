// src/domain/ocr/ocr-page — what the OCR engine read off one photo, as SPOG
// keeps it (ROAD-3475). Pure: no DOM, no engine.
//
// A page is its WORDS, each with the box the engine drew around it in the
// photo's own pixels, the confidence the engine reported (0–100, as reported —
// never a stand-in when it is 0), and the line it sits on. An operator's inline
// correction is kept beside the engine's text, never over it, so what was READ
// and what was TYPED stay distinguishable.

export interface OcrWord {
  id: string;
  /** The engine's reading. */
  text: string;
  /** The operator's correction, when one was typed. */
  corrected?: string;
  /** As the engine reported it, 0..100. */
  confidence: number;
  x0: number; y0: number; x1: number; y1: number;
  /** Index of the line the engine grouped this word into. */
  line: number;
}

export interface OcrPage {
  width: number;
  height: number;
  words: OcrWord[];
}

/** The text a word stands for now: the correction when there is one. */
export const wordText = (w: OcrWord): string => w.corrected ?? w.text;

/** The slice of a tesseract.js 5+ result this reads (blocks ▸ paragraphs ▸ lines ▸ words). */
export interface TesseractWordLike { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }
export interface TesseractPageLike {
  blocks?: Array<{ paragraphs: Array<{ lines: Array<{ words: TesseractWordLike[] }> }> }> | null;
}

/** The engine's page as an OcrPage. Words with no text after trimming are
 *  dropped (the engine boxes stray specks); nothing is added. */
export function pageFromTesseract(data: TesseractPageLike, width: number, height: number): OcrPage {
  const words: OcrWord[] = [];
  let line = 0;
  for (const b of data.blocks ?? []) for (const p of b.paragraphs) for (const l of p.lines) {
    let any = false;
    for (const w of l.words) {
      const text = w.text.trim();
      if (!text) continue;
      any = true;
      words.push({ id: `w${words.length + 1}`, text, confidence: w.confidence, line,
        x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 });
    }
    if (any) line++;
  }
  return { width, height, words };
}

/** One line of the page as text, and where each word sits in it — so a pattern
 *  matched on the line maps back to the boxes it came from. */
export interface PageLine { line: number; text: string; spans: Array<{ id: string; start: number; end: number }> }

export function pageLines(page: OcrPage): PageLine[] {
  const by = new Map<number, OcrWord[]>();
  for (const w of page.words) by.set(w.line, [...(by.get(w.line) ?? []), w]);
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([line, ws]) => {
    let text = '';
    const spans = ws.sort((a, b) => a.x0 - b.x0).map((w) => {
      if (text) text += ' ';
      const start = text.length;
      text += wordText(w);
      return { id: w.id, start, end: text.length };
    });
    return { line, text, spans };
  });
}

/** A copy of the page with one word's correction set ('' or the engine's own
 *  text clears it). */
export function correctWord(page: OcrPage, id: string, typed: string): OcrPage {
  const t = typed.trim();
  return { ...page, words: page.words.map((w) => {
    if (w.id !== id) return w;
    const { corrected: _drop, ...rest } = w;
    return !t || t === w.text ? rest : { ...rest, corrected: t };
  }) };
}
