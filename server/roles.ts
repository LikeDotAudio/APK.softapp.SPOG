// server/roles — who the DEV API will sign a token for (2026-10-30 audit).
//
// The login used to sign whatever `role` the request body named, so role scoping
// was cosmetic. Now a role is issued only against a fixed table read from the
// environment, SPOG_DEV_ROLES="director:passphrase,ops:other-passphrase". A role
// that is not in the table, or a wrong passphrase, gets nothing; with no table
// at all only `guest` is ever issued. Pure: index.ts wires it to express.
import { timingSafeEqual } from 'node:crypto';

export type RoleTable = ReadonlyMap<string, string>;

/** Parse "role:passphrase,role2:passphrase2" (whitespace-tolerant; bad entries dropped). */
export function parseRoleTable(spec: string | undefined): RoleTable {
  const table = new Map<string, string>();
  for (const part of (spec ?? '').split(',')) {
    const i = part.indexOf(':');
    if (i <= 0) continue;
    const role = part.slice(0, i).trim(), pass = part.slice(i + 1).trim();
    if (role && pass && role !== 'guest') table.set(role, pass);
  }
  return table;
}

const same = (a: string, b: string): boolean => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** The role to sign for this login, or null to refuse it. */
export function issueRole(table: RoleTable, role: unknown, passphrase: unknown): string | null {
  if (role === undefined || role === null || role === '' || role === 'guest') return 'guest';
  if (typeof role !== 'string' || typeof passphrase !== 'string') return null;
  const want = table.get(role);
  return want !== undefined && same(want, passphrase) ? role : null;
}
