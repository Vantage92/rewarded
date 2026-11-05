// Response shapes of the fraud routes (contracts fraud.ts): references to people are audit refs,
// never raw ids (architecture §10.7), and instants are ISO text.
import type { AdminFlag, FlagSessionEvidence } from '@rewarded/contracts';
import { auditRef } from '../../../db/services/audit.ts';
import type { Db } from '../../../db/types.ts';
import type { ModuleDeps } from '../../../module.ts';
import { loadFlag, type FlagRow } from './flags.ts';
import { hasTables, parseJson } from './util.ts';

interface SessionEvidenceRow {
  id: string;
  user_id: string;
  focus_day: string;
  planned_min: 1 | 25 | 50 | 90;
  status: 'active' | 'completed' | 'aborted';
  abort_reason: FlagSessionEvidence['abort_reason'];
  review_status: FlagSessionEvidence['review_status'];
  net_class: FlagSessionEvidence['net_class'] | null;
  server_start_at: number;
}

export function flagDto(deps: ModuleDeps, db: Db, f: FlagRow): AdminFlag {
  const sessions = hasTables(db, 'focus_session')
    ? db.all<SessionEvidenceRow>(
        `SELECT s.id, s.user_id, s.focus_day, s.planned_min, s.status, s.abort_reason, s.review_status, s.net_class, s.server_start_at
           FROM fraud_flag_session l JOIN focus_session s ON s.id = l.session_id WHERE l.flag_id = ? ORDER BY s.server_start_at, s.id`,
        [f.id],
      )
    : [];
  const subjectRef = f.subject_id === null ? null : f.subject_type === 'account' ? auditRef(deps.platform.hasher, f.subject_id) : f.subject_id;
  return {
    id: f.id,
    code: f.code,
    subject_type: f.subject_type,
    subject_ref: subjectRef,
    status: f.status,
    evidence: parseJson<Record<string, unknown>>(f.evidence, {}),
    sessions: sessions.map((s) => ({
      session_id: s.id,
      user_ref: auditRef(deps.platform.hasher, s.user_id),
      focus_day: s.focus_day,
      planned_min: s.planned_min,
      status: s.status,
      abort_reason: s.abort_reason,
      review_status: s.review_status,
      net_class: s.net_class ?? 'other',
      server_start_at: new Date(s.server_start_at).toISOString(),
    })),
    created_at: f.created_at,
    decided_by_ref: f.decided_by ? f.decided_by.slice('admin:'.length) : null,
    decided_at: f.decided_at,
    block_confirmed_by_ref: f.block_confirmed_by ? f.block_confirmed_by.slice('admin:'.length) : null,
    reason_code: f.reason_code,
  };
}

export function flagDtoById(deps: ModuleDeps, db: Db, id: string): AdminFlag {
  return flagDto(deps, db, loadFlag(db, id) as FlagRow);
}
