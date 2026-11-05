// Platform interfaces added by WP-2 (architecture §12.2): Logger, NetClassifier and Beacon, with their
// dev and test implementations. Kept apart from index.ts (WP-0/WP-3) so no shared file is edited.
export type * from './log.ts';
export type * from './net.ts';
export type * from './beacon.ts';
export { JsonLineLogger, MemoryLogger, buildLogLine, sanitizeLogFields, stripStack } from './log.ts';
export { CidrNetClassifier, DEV_NET_CLASS_RULES, DevNetClassifier, parseIp } from './net.ts';
export { DevBeacon, UnconfiguredBeacon } from './beacon.ts';
