// test/server-roles.test — the dev API signs only roles it can verify.
import { describe, it, expect } from 'vitest';
import { parseRoleTable, issueRole } from '../server/roles.js';

describe('dev API role table', () => {
  const table = parseRoleTable(' director : s3cret , ops:x, broken, guest:nope, :empty');
  it('parses role:passphrase pairs and refuses to table guest', () => {
    expect([...table]).toEqual([['director', 's3cret'], ['ops', 'x']]);
  });
  it('always issues guest', () => {
    expect(issueRole(table, undefined, undefined)).toBe('guest');
    expect(issueRole(new Map(), 'guest', '')).toBe('guest');
  });
  it('issues a tabled role only with its passphrase', () => {
    expect(issueRole(table, 'director', 's3cret')).toBe('director');
    expect(issueRole(table, 'director', 'wrong')).toBeNull();
    expect(issueRole(table, 'director', undefined)).toBeNull();
  });
  it('never issues a role that is not in the table (the old self-asserted login)', () => {
    expect(issueRole(table, 'ep', 'anything')).toBeNull();
    expect(issueRole(new Map(), 'admin', '')).toBeNull();
  });
});
