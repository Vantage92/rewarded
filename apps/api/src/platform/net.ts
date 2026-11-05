// NetClassifier (architecture §4.5, §12.2): maps an IP address, held only in memory, to a net class
// (campus, mobile_cgnat, other). The source is the CIDR list in params (net_classes), one source per rule.
import type { NetClass } from '@rewarded/contracts';

export interface NetClassRule {
  cidr: string;
  class: Exclude<NetClass, 'other'>;
  source: string;
  checked_at: string;
}

export interface NetClassifier {
  classify(ip: string): NetClass;
}

/** Parses IPv4, IPv6 (incl. `::` and IPv4-mapped) into a bigint and its bit width. */
export function parseIp(ip: string): { value: bigint; bits: 32 | 128 } | undefined {
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (v4) {
    const parts = v4.slice(1).map(Number);
    if (parts.some((p) => p > 255)) return undefined;
    return { value: parts.reduce((acc, p) => (acc << 8n) | BigInt(p), 0n), bits: 32 };
  }
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapped?.[1]) return parseIp(mapped[1]);
  if (!/^[0-9a-f:]+$/i.test(ip) || ip.split('::').length > 2) return undefined;
  const [head = '', tail] = ip.split('::');
  const h = head ? head.split(':') : [];
  const t = tail !== undefined && tail !== '' ? tail.split(':') : [];
  const missing = 8 - h.length - t.length;
  if ((tail === undefined && missing !== 0) || missing < 0) return undefined;
  const groups = [...h, ...Array<string>(tail === undefined ? 0 : missing).fill('0'), ...t];
  if (groups.length !== 8 || groups.some((g) => g.length === 0 || g.length > 4)) return undefined;
  return { value: groups.reduce((acc, g) => (acc << 16n) | BigInt(parseInt(g, 16)), 0n), bits: 128 };
}

interface CompiledRule {
  network: bigint;
  mask: bigint;
  bits: 32 | 128;
  prefix: number;
  cls: NetClassRule['class'];
}

function compile(rule: NetClassRule): CompiledRule {
  const [addr, len] = rule.cidr.split('/');
  const ip = addr ? parseIp(addr) : undefined;
  const prefix = Number(len);
  if (!ip || !Number.isInteger(prefix) || prefix < 0 || prefix > ip.bits) throw new Error(`Invalid CIDR ${rule.cidr}`);
  const all = (1n << BigInt(ip.bits)) - 1n;
  const mask = prefix === 0 ? 0n : (all << BigInt(ip.bits - prefix)) & all;
  return { network: ip.value & mask, mask, bits: ip.bits, prefix, cls: rule.class };
}

/** CIDR-list classifier; the longest matching prefix wins. Usable in dev and production. */
export class CidrNetClassifier implements NetClassifier {
  private readonly rules: CompiledRule[];
  constructor(rules: readonly NetClassRule[]) {
    this.rules = rules.map(compile).sort((a, b) => b.prefix - a.prefix);
  }
  classify(ip: string): NetClass {
    const parsed = parseIp(ip.trim());
    if (!parsed) return 'other';
    for (const r of this.rules) if (r.bits === parsed.bits && (parsed.value & r.mask) === r.network) return r.cls;
    return 'other';
  }
}

/** Dev rules: documentation ranges (RFC 5737/3849) stand in for campus and CGNAT until the list is collected. */
export const DEV_NET_CLASS_RULES: readonly NetClassRule[] = [
  { cidr: '192.0.2.0/24', class: 'campus', source: 'dev: RFC 5737 TEST-NET-1 as campus', checked_at: '2026-11-05' },
  { cidr: '198.51.100.0/24', class: 'mobile_cgnat', source: 'dev: RFC 5737 TEST-NET-2 as CGNAT', checked_at: '2026-11-05' },
  { cidr: '100.64.0.0/10', class: 'mobile_cgnat', source: 'RFC 6598 shared address space', checked_at: '2026-11-05' },
  { cidr: '2001:db8:ca::/48', class: 'campus', source: 'dev: RFC 3849 documentation prefix', checked_at: '2026-11-05' },
];

export class DevNetClassifier extends CidrNetClassifier {
  constructor(rules: readonly NetClassRule[] = DEV_NET_CLASS_RULES) {
    super(rules);
  }
}
