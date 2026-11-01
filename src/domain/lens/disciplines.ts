// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/domain/lens/disciplines — WHAT a connection is, for the Discipline Lens (ROAD-3473).
 *
 *  Two kinds of lens cross on one connection:
 *    • a SIGNAL lens is a type slice — what one wire is: Audio, Video, Network cabling,
 *      Control, Power, Panels;
 *    • a BUNDLE lens is a carrier — what rides the network: Dante, AES67, ST 2110-20/-30/-40,
 *      Q-LAN, RAVENNA, PTP, NMOS. A bundle implies its essence's signal (a Dante flow is
 *      audio, ST 2110-20 is video, -40 ancillary is control, NMOS is control, PTP is network),
 *      so ONLY Audio still lights the Dante flows and no extra signal is invented.
 *  A connection that nothing classifies lands in an explicit OTHER, so a lens never makes a
 *  connection vanish because the vocabulary below has not been taught it.
 *
 *  Classification reads DATA FIELDS only (kind / wire / format / type / tags) through the wire
 *  vocabulary below — protocol names, never device names. Pure: no DOM, no imports. */

export type SignalId = 'audio' | 'video' | 'network' | 'control' | 'power' | 'panels' | 'other';
export type BundleId = 'dante' | 'aes67' | 'st2110-20' | 'st2110-30' | 'st2110-40' | 'qlan' | 'ravenna' | 'ptp' | 'nmos';
export type DisciplineId = SignalId | BundleId;
export type LensKind = 'signal' | 'bundle';

export interface Discipline { id: DisciplineId; label: string; kind: LensKind }

/** Every lens, in toolbar order: SIGNALS · by type, then BUNDLES · what rides the network. */
export const DISCIPLINES: readonly Discipline[] = [
  { id: 'audio', label: 'Audio', kind: 'signal' },
  { id: 'video', label: 'Video', kind: 'signal' },
  { id: 'network', label: 'Network', kind: 'signal' },
  { id: 'control', label: 'Control', kind: 'signal' },
  { id: 'power', label: 'Power', kind: 'signal' },
  { id: 'panels', label: 'Panels', kind: 'signal' },
  { id: 'other', label: 'Other', kind: 'signal' },
  { id: 'dante', label: 'Dante', kind: 'bundle' },
  { id: 'aes67', label: 'AES67', kind: 'bundle' },
  { id: 'st2110-20', label: '2110-20', kind: 'bundle' },
  { id: 'st2110-30', label: '2110-30', kind: 'bundle' },
  { id: 'st2110-40', label: '2110-40', kind: 'bundle' },
  { id: 'qlan', label: 'Q-LAN', kind: 'bundle' },
  { id: 'ravenna', label: 'RAVENNA', kind: 'bundle' },
  { id: 'ptp', label: 'PTP', kind: 'bundle' },
  { id: 'nmos', label: 'NMOS', kind: 'bundle' },
];

export const DISCIPLINE_IDS: ReadonlySet<string> = new Set(DISCIPLINES.map((d) => d.id));
export const isDiscipline = (v: unknown): v is DisciplineId => typeof v === 'string' && DISCIPLINE_IDS.has(v);
export const lensKind = (id: DisciplineId): LensKind => DISCIPLINES.find((d) => d.id === id)?.kind ?? 'signal';

/** The facts one connection carries, as the data spells them. Every field optional:
 *  `kind` ('audio' | 'video' | 'data' …), `wire` ('dante' | 'aes67' …), `format`
 *  ('ST 2110-30' | 'L24' …), `type` (a leaf's authored type), `tags` (class-like words). */
export interface ConnectionFacts {
  kind?: string | null;
  wire?: string | null;
  format?: string | null;
  type?: string | null;
  tags?: readonly string[];
}

// ---- the wire vocabulary: protocol / signal words → disciplines ------------------------
// Bundle patterns run over each field with whitespace removed ("ST 2110-30" → "st2110-30").
const BUNDLE_RULES: ReadonlyArray<readonly [BundleId, RegExp]> = [
  ['dante', /dante/],
  ['aes67', /aes-?67/],
  ['st2110-20', /2110-?20/],
  ['st2110-30', /2110-?3[01]/],
  ['st2110-40', /2110-?4[01]/],
  ['qlan', /q-?lan/],
  ['ravenna', /ravenna/],
  ['ptp', /(^|[^a-z])ptp|1588/],
  ['nmos', /nmos|(^|[^a-z])is-?0[4-9]/],
];

/** The essence a bundle carries — so a bundle also lights its signal lens. */
export const BUNDLE_ESSENCE: Readonly<Record<BundleId, SignalId>> = {
  dante: 'audio', aes67: 'audio', 'st2110-30': 'audio', qlan: 'audio', ravenna: 'audio',
  'st2110-20': 'video', 'st2110-40': 'control', nmos: 'control', ptp: 'network',
};

// Whole words (a tag, or a tag's first '-' part) → signal. Exact match wins first, so
// "camera-control" is control while "camera" and "video-main" are video.
const SIGNAL_WORDS: Readonly<Record<string, SignalId>> = {
  audio: 'audio', mic: 'audio', analog: 'audio', analogue: 'audio', aes3: 'audio', aes: 'audio',
  madi: 'audio', xlr: 'audio', ifb: 'audio', intercom: 'audio',
  video: 'video', camera: 'video', sdi: 'video', hdmi: 'video', '12g-sdi': 'video',
  control: 'control', 'camera-control': 'control', data: 'control', serial: 'control', rs232: 'control',
  rs422: 'control', rs485: 'control', gpio: 'control', gpi: 'control', tally: 'control', midi: 'control',
  network: 'network', ethernet: 'network', rj45: 'network', fibre: 'network', fiber: 'network', sfp: 'network', lan: 'network',
  power: 'power', mains: 'power', powercon: 'power', poe: 'power',
  panel: 'panels', panels: 'panels',
};

const squash = (s: string): string => s.toLowerCase().replace(/\s+/g, '');

function signalOfWord(word: string): SignalId | null {
  const w = word.trim().toLowerCase();
  if (!w) return null;
  return SIGNAL_WORDS[w] ?? SIGNAL_WORDS[w.split(/[-_]/)[0] ?? ''] ?? null;
}

/** connection → the set of disciplines it belongs to, in DISCIPLINES order. Never empty:
 *  what nothing claims is OTHER. */
export function classifyConnection(facts: ConnectionFacts): DisciplineId[] {
  const out = new Set<DisciplineId>();
  const carriers = [facts.wire, facts.format, facts.type, facts.kind, ...(facts.tags ?? [])];
  for (const raw of carriers) {
    if (!raw) continue;
    const s = squash(raw);
    for (const [id, re] of BUNDLE_RULES) if (re.test(s)) { out.add(id); out.add(BUNDLE_ESSENCE[id]); }
  }
  for (const raw of [facts.kind, facts.type, facts.wire, ...(facts.tags ?? [])]) {
    if (!raw) continue;
    const sig = signalOfWord(raw);
    if (sig) out.add(sig);
  }
  if (!out.size) out.add('other');
  return DISCIPLINES.map((d) => d.id).filter((id) => out.has(id));
}
