// src/domain/instrument-roles — what an instrument family's thing.json roles mean
// in SPOG (ROAD-3516, ROAD-3543). Pure: the Discovered layer lays a box by them and
// the instrument editor chooses its panes by them, from this one place.
//
//   inputs      its jacks are a destination a patch can land on
//   metering    readings with units on <box>/Reading/#
//   monitoring  a trace to watch (Captures/Rig/<device> Trace/<source>)
//   source      it gives a signal or power OUT

/** True when the family gives the instrument editor something to show — a
 *  scope, a meter, and a source that meters (a supply) or monitors (a generator). */
export const opensInstrument = (roles: readonly string[] | undefined): boolean =>
  !!roles && (roles.includes('metering') || roles.includes('monitoring'));

/** The editor's panes: every instrument's readings; its trace when it monitors. */
export const panesFor = (roles: readonly string[]): { readings: boolean; trace: boolean } =>
  ({ readings: opensInstrument(roles), trace: roles.includes('monitoring') });
