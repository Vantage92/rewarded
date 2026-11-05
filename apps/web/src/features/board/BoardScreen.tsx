// Board dashboard: aggregates only, a figure only from 5 members, no names, lists, times or export
// (spec §4.6). Time is "focus time that counted", with the verification level next to every figure
// (founder J3); the words for "verified" never appear here (test in wp10-board).
import type { BoardDashboardResponse, BoardTab, Metric, PromoKitResponse } from '@rewarded/contracts';
import { CURRENT_PARAMS } from '@rewarded/core/params';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { Banner, ButtonLink, Chip } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { errorText, useApi, useApiQuery } from '../../lib/api/index.ts';
import { ApiClientError } from '@rewarded/contracts/client';
import './board.css';

type TabKey = BoardTab | 'promotiekit';
const TABS: readonly TabKey[] = ['stand', 'werving', 'promotiekit', 'prijs', 'kwaliteit'];
const MIN_LINKED = CURRENT_PARAMS.challenges.min_linked_members;
const MIN_GROUP = CURRENT_PARAMS.board.min_group;
const ROUND_TO = CURRENT_PARAMS.board.round_to;
const THRESHOLD = CURRENT_PARAMS.challenges.threshold_participation_pct / 100;

function useTb() {
  const i18n = useT();
  return { ...i18n, tb: (key: string, vars?: Record<string, string | number>) => i18n.t(`board:${key}`, vars) };
}

/** `/bestuur` without a club: the board opens its own dashboard from the invitation link. */
export function BoardHome() {
  const { tb } = useTb();
  return (
    <div className="brd rw-wide">
      <header className="brd-head">
        <h1>{tb('title')}</h1>
        <p className="brd-privacy">{tb('privacy')}</p>
      </header>
      <p>{tb('home.text')}</p>
    </div>
  );
}

export function BoardScreen() {
  const { tb } = useTb();
  const params = useParams();
  const clubId = params.clubId ?? '';
  const rest = (params['*'] ?? '').split('/')[0] ?? '';
  const tab: TabKey = (TABS as readonly string[]).includes(rest) ? (rest as TabKey) : 'stand';
  // The stand is the headline above every tab (UX §3.8).
  const stand = useApiQuery('board.dashboard', { params: { id: clubId }, query: { tab: 'stand' } }, { retry: false });
  return (
    <div className="brd rw-wide">
      <header className="brd-head">
        <h1>{tb('title')}</h1>
        <p className="brd-privacy">{tb('privacy')}</p>
        {stand.data && stand.data.tab === 'stand' ? <Headline data={stand.data} /> : null}
      </header>
      {stand.isError ? (
        <Gate error={stand.error} />
      ) : (
        <>
          <nav className="brd-tabs" aria-label={tb('tabs_label')}>
            <ul>
              {TABS.map((t) => (
                <li key={t}>
                  <Link to={`/bestuur/${clubId}/${t}`} aria-current={t === tab ? 'page' : undefined} className={t === tab ? 'active' : undefined}>
                    {tb(`tab.${t}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <section className="brd-panel" aria-labelledby="brd-tab-title">
            <h2 id="brd-tab-title">{tb(`tab.${tab}`)}</h2>
            {tab === 'promotiekit' ? <PromoKit clubId={clubId} /> : <TabPanel clubId={clubId} tab={tab} stand={stand.data} />}
          </section>
        </>
      )}
    </div>
  );
}

function Gate({ error }: { error: unknown }) {
  const { tb, locale } = useTb();
  if (error instanceof ApiClientError && error.is('FORBIDDEN')) return <p className="brd-gate">{tb('gate.forbidden')}</p>;
  if (error instanceof ApiClientError && error.is('AUTH_REQUIRED'))
    return (
      <div className="brd-gate">
        <p>{tb('gate.login')}</p>
        <ButtonLink to="/login">{tb('gate.login_action')}</ButtonLink>
      </div>
    );
  return (
    <div role="alert">
      <Banner tone="info">{errorText(locale, error)}</Banner>
    </div>
  );
}

function pct(locale: string, v: number): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(v);
}

function Headline({ data }: { data: Extract<BoardDashboardResponse, { tab: 'stand' }> }) {
  const { tb, locale } = useTb();
  if (data.rank.suppressed || data.rank.value === null) return <p className="brd-headline">{tb('stand.too_few', { n: MIN_LINKED })}</p>;
  return (
    <p className="brd-headline">
      {tb('headline', {
        rank: data.rank.value,
        pool: tb(`pool.${data.pool}`),
        rate: data.participation_rate.value === null ? '—' : pct(locale, data.participation_rate.value),
      })}
    </p>
  );
}

/** One figure with its label, the suppression text and the verification level (spec §4.6, J3). */
function Figure({ label, metric, render, suppressedText, note }: { label: string; metric: Metric; render: (v: number) => string; suppressedText?: string; note?: ReactNode }) {
  const { tb } = useTb();
  return (
    <div className="brd-figure">
      <dt>{label}</dt>
      <dd>
        <span className="brd-value">{metric.suppressed || metric.value === null ? (suppressedText ?? tb('too_small')) : render(metric.value)}</span>
        {note ? <span className="brd-note">{note}</span> : null}
        <span className="brd-level">{tb('level')}</span>
      </dd>
    </div>
  );
}

function TabPanel({ clubId, tab, stand }: { clubId: string; tab: BoardTab; stand: BoardDashboardResponse | undefined }) {
  const { tb } = useTb();
  const query = useApiQuery('board.dashboard', { params: { id: clubId }, query: { tab } }, { enabled: tab !== 'stand', retry: false });
  const data = tab === 'stand' ? stand : query.data;
  if (tab !== 'stand' && query.isError) return <Gate error={query.error} />;
  if (!data)
    return (
      <p role="status" aria-live="polite">
        {tb('loading')}
      </p>
    );
  switch (data.tab) {
    case 'stand':
      return <Stand data={data} />;
    case 'werving':
      return <Recruitment data={data} stand={stand && stand.tab === 'stand' ? stand : undefined} />;
    case 'prijs':
      return <Prize data={data} />;
    case 'kwaliteit':
      return <Quality data={data} />;
  }
}

function Stand({ data }: { data: Extract<BoardDashboardResponse, { tab: 'stand' }> }) {
  const { tb, locale } = useTb();
  const minutes = (v: number) => tb('minutes', { n: Math.round(v) });
  const rate = data.participation_rate;
  const toThreshold = !rate.suppressed && rate.value !== null ? Math.max(0, THRESHOLD - rate.value) : null;
  return (
    <>
      <p>
        <Chip tone="pause">{tb('stand.provisional')}</Chip> {tb('stand.provisional_text')}
      </p>
      {data.rank.suppressed ? <p className="brd-empty">{tb('stand.too_few', { n: MIN_LINKED })}</p> : null}
      <dl className="brd-figures">
        <Figure label={tb('stand.rank')} metric={data.rank} render={(v) => tb('stand.rank_value', { rank: v, pool: tb(`pool.${data.pool}`) })} suppressedText={tb('stand.rank_hidden')} />
        <Figure label={tb('stand.participation')} metric={rate} render={(v) => pct(locale, v)} note={tb('stand.participation_note')} />
        <Figure label={tb('stand.intensity')} metric={data.intensity_min} render={minutes} note={tb('stand.intensity_note')} />
        <div className="brd-figure">
          <dt>{tb('stand.threshold')}</dt>
          <dd>
            <span className="brd-value">{toThreshold === null ? tb('too_small') : toThreshold === 0 ? tb('stand.threshold_met') : tb('stand.threshold_gap', { gap: pct(locale, toThreshold) })}</span>
            <span className="brd-note">{tb('stand.threshold_note', { threshold: pct(locale, THRESHOLD) })}</span>
            <span className="brd-level">{tb('level')}</span>
          </dd>
        </div>
      </dl>
      <WeekTable weeks={data.weeks} />
    </>
  );
}

function WeekTable({ weeks }: { weeks: Extract<BoardDashboardResponse, { tab: 'stand' }>['weeks'] }) {
  const { tb, locale } = useTb();
  const cell = (m: Metric, render: (v: number) => string) => (m.suppressed || m.value === null ? tb('too_small') : render(m.value));
  return (
    <div className="brd-table-wrap">
      <table className="brd-table">
        <caption>{tb('weeks.caption')}</caption>
        <thead>
          <tr>
            <th scope="col">{tb('weeks.week')}</th>
            <th scope="col">{tb('weeks.participation')}</th>
            <th scope="col">{tb('weeks.intensity')}</th>
            <th scope="col">{tb('weeks.linked')}</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.week}>
              <th scope="row">{w.week}</th>
              <td>{cell(w.participation_rate, (v) => pct(locale, v))}</td>
              <td>{cell(w.intensity_min, (v) => tb('minutes', { n: Math.round(v) }))}</td>
              <td>{cell(w.linked_members, (v) => String(v))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="brd-level">{tb('level')}</p>
    </div>
  );
}

function Recruitment({ data, stand }: { data: Extract<BoardDashboardResponse, { tab: 'werving' }>; stand: Extract<BoardDashboardResponse, { tab: 'stand' }> | undefined }) {
  const { tb } = useTb();
  const count = (v: number) => String(v);
  const weeks = stand?.weeks ?? [];
  const max = Math.max(1, ...weeks.map((w) => w.linked_members.value ?? 0));
  return (
    <>
      <p className="brd-note">{tb('werving.rounding', { n: ROUND_TO, min: MIN_GROUP })}</p>
      {data.linked_members.value === 0 ? <p className="brd-empty">{tb('werving.empty')}</p> : null}
      <dl className="brd-figures">
        <Figure label={tb('werving.linked')} metric={data.linked_members} render={count} suppressedText={tb('suppressed_change')} />
        <div className="brd-figure">
          <dt>{tb('werving.code_cap')}</dt>
          <dd>
            <span className="brd-value">{data.code_cap}</span>
            <span className="brd-note">{tb('werving.code_cap_note')}</span>
          </dd>
        </div>
        <Figure label={tb('werving.pending')} metric={data.pending_admin} render={count} suppressedText={tb('suppressed_change')} note={tb('werving.pending_note')} />
      </dl>
      {weeks.length ? (
        <figure className="brd-bars">
          <figcaption>{tb('werving.bars_caption', { n: ROUND_TO })}</figcaption>
          <ul>
            {weeks.map((w) => (
              <li key={w.week}>
                <span className="brd-bar-label">{w.week}</span>
                {w.linked_members.suppressed || w.linked_members.value === null ? (
                  <span className="brd-bar-hidden">{tb('too_small')}</span>
                ) : (
                  <>
                    <span className="brd-bar" style={{ inlineSize: `${(100 * w.linked_members.value) / max}%` }} aria-hidden="true" />
                    <span className="brd-bar-value">{tb('werving.bar_value', { n: w.linked_members.value })}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </figure>
      ) : null}
      <div className="brd-table-wrap">
        <table className="brd-table">
          <caption>{tb('werving.qr_caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{tb('werving.qr_source')}</th>
              <th scope="col">{tb('werving.qr_linked')}</th>
            </tr>
          </thead>
          <tbody>
            {data.by_qr_source.map((q) => (
              <tr key={q.qr_source}>
                <th scope="row">{q.qr_source}</th>
                <td>{q.linked.suppressed || q.linked.value === null ? tb('suppressed_change') : q.linked.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="brd-level">{tb('level')}</p>
      </div>
      <p className="brd-note">{tb('werving.missing')}</p>
    </>
  );
}

function Prize({ data }: { data: Extract<BoardDashboardResponse, { tab: 'prijs' }> }) {
  const { tb, locale } = useTb();
  const noPrize = !data.prize_eligible && data.threshold_rate === null;
  return (
    <>
      <p>
        <Chip tone={data.is_final ? 'earned' : 'pause'}>{data.is_final ? tb('prijs.final') : tb('stand.provisional')}</Chip> {data.is_final ? tb('prijs.final_text') : tb('prijs.provisional_text')}
      </p>
      {noPrize ? <p className="brd-empty">{tb('prijs.none')}</p> : null}
      <dl className="brd-figures">
        <div className="brd-figure">
          <dt>{tb('prijs.main')}</dt>
          <dd>
            <span className="brd-value">{data.prize_eligible ? tb('prijs.main_yes') : tb('prijs.main_no')}</span>
          </dd>
        </div>
        <div className="brd-figure">
          <dt>{tb('prijs.threshold')}</dt>
          <dd>
            <span className="brd-value">{data.threshold_rate === null ? tb('prijs.threshold_none') : tb('prijs.threshold_value', { rate: pct(locale, data.threshold_rate) })}</span>
          </dd>
        </div>
        <Figure label={tb('prijs.anchored')} metric={data.anchored_members} render={(v) => String(v)} note={tb('prijs.anchored_note')} />
      </dl>
      <p className="brd-note">{tb('prijs.earned_note')}</p>
      <p className="brd-note">{tb('prijs.missing')}</p>
    </>
  );
}

function Quality({ data }: { data: Extract<BoardDashboardResponse, { tab: 'kwaliteit' }> }) {
  const { tb, locale } = useTb();
  return (
    <>
      <dl className="brd-figures">
        <Figure label={tb('kwaliteit.flagged')} metric={data.flagged_share} render={(v) => pct(locale, v)} suppressedText={tb('suppressed_change')} note={tb('kwaliteit.flagged_note')} />
        <Figure label={tb('kwaliteit.anchored')} metric={data.anchored_share} render={(v) => pct(locale, v)} suppressedText={tb('suppressed_change')} />
        <div className="brd-figure">
          <dt>{tb('kwaliteit.sample')}</dt>
          <dd>
            <span className="brd-value">{tb(`kwaliteit.sample_${data.sample_status}`)}</span>
          </dd>
        </div>
      </dl>
      <p className="brd-note">{tb('kwaliteit.explain')}</p>
      <p className="brd-note">
        <Link to="/hoe-we-tellen">{tb('how_we_count')}</Link>
      </p>
    </>
  );
}

function PromoKit({ clubId }: { clubId: string }) {
  const { tb } = useTb();
  const api = useApi();
  const kit = useApiQuery('board.promoKit', { params: { id: clubId } }, { retry: false });
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const track = (asset: PromoKitResponse['assets'][number]['kind']) => {
    void api.call('events.track', { body: { name: 'promo_kit_downloaded', props: { vereniging_id: clubId, asset } } }).catch(() => undefined);
  };
  if (kit.isError) return <Gate error={kit.error} />;
  return (
    <>
      <p>{tb('promo.intro')}</p>
      {!kit.data ? (
        <p role="status" aria-live="polite">
          {tb('loading')}
        </p>
      ) : (
        <ul className="brd-assets">
          {kit.data.assets.map((a) => (
            <li key={`${a.kind}-${a.qr_source}`}>
              <span>{tb('promo.asset', { kind: tb(`promo.kind_${a.kind}`), source: a.qr_source })}</span>
              <a
                className="btn btn-secondary"
                href={a.url}
                download
                onClick={() => {
                  track(a.kind);
                  setDownloaded(a.url);
                }}
                aria-label={tb('promo.download_label', { kind: tb(`promo.kind_${a.kind}`), source: a.qr_source })}
              >
                {tb('promo.download')}
              </a>
            </li>
          ))}
        </ul>
      )}
      {downloaded ? <p role="status">{tb('promo.downloaded')}</p> : null}
      <section className="brd-promise" aria-labelledby="brd-promise-title">
        <h3 id="brd-promise-title">{tb('promo.promise_title')}</h3>
        <div className="brd-promise-cols">
          <div>
            <h4>{tb('promo.do_title')}</h4>
            <ul>
              <li>{tb('promo.do_1')}</li>
              <li>{tb('promo.do_2')}</li>
              <li>{tb('promo.do_3')}</li>
            </ul>
          </div>
          <div>
            <h4>{tb('promo.dont_title')}</h4>
            <ul>
              <li>{tb('promo.dont_1')}</li>
              <li>{tb('promo.dont_2')}</li>
              <li>{tb('promo.dont_3')}</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
