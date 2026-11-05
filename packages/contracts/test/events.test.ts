import { describe, expect, it } from 'vitest';
import { ACTIVE_EVENT_NAMES, CLIENT_EVENT_NAMES, ClientEventRequest, EVENT_NAMES, EVENT_TAXONOMY, SERVER_EVENT_NAMES, isClientEventName, parseEventProps } from '../src/index.ts';
import { SPEC_7_1_EVENTS, UX_EVENTS } from './endpoints.ts';

describe('event taxonomy (spec §7.1)', () => {
  it('spec §7.1: contains every event of the table plus the UX additions, and nothing else', () => {
    expect([...EVENT_NAMES].sort()).toEqual([...SPEC_7_1_EVENTS, ...UX_EVENTS].sort());
  });

  it('spec §7.1: every event is either a server or a client event', () => {
    expect(CLIENT_EVENT_NAMES.length + SERVER_EVENT_NAMES.length).toBe(ACTIVE_EVENT_NAMES.length);
    expect(SERVER_EVENT_NAMES).toContain('session_completed');
    expect(SERVER_EVENT_NAMES).toContain('redemption_completed');
    expect(SERVER_EVENT_NAMES).toContain('flag_reviewed');
    expect(SERVER_EVENT_NAMES).toContain('invite_link_opened');
    expect(CLIENT_EVENT_NAMES).toContain('signal_played');
    expect(CLIENT_EVENT_NAMES).toContain('belofte_witness_viewed');
  });

  it('product plan §0.3: draw_opt_out is retired and never accepted', () => {
    expect('retired' in EVENT_TAXONOMY.draw_opt_out).toBe(true);
    expect(ACTIVE_EVENT_NAMES).not.toContain('draw_opt_out');
    expect(ClientEventRequest.safeParse({ name: 'draw_opt_out', props: { aan: false } }).success).toBe(false);
  });

  it('arch §8.2 POST /events: accepts client events only, with strict properties', () => {
    expect(ClientEventRequest.safeParse({ name: 'catalog_viewed', props: { items_zichtbaar: 3, saldo: 10, inverdiend: true } }).success).toBe(true);
    expect(ClientEventRequest.safeParse({ name: 'session_completed', props: {} }).success).toBe(false);
    expect(ClientEventRequest.safeParse({ name: 'no_such_event', props: {} }).success).toBe(false);
    expect(ClientEventRequest.safeParse({ name: 'catalog_viewed', props: { items_zichtbaar: 3, saldo: 10, inverdiend: true, email: 'x@y.nl' } }).success).toBe(false);
    expect(isClientEventName('wakelock_state')).toBe(true);
    expect(isClientEventName('session_started')).toBe(false);
  });

  it('spec §7.1: server event properties are validated', () => {
    const props = parseEventProps('session_aborted', { session_id: '01JC0000000000000000000030', reden: 'hidden', verstreken_s: 600, device_class: 'ios_safari', wakelock_state: 'released' });
    expect(props.reden).toBe('hidden');
    expect(() => parseEventProps('session_aborted', { session_id: '01JC0000000000000000000030', reden: 'bored', verstreken_s: 1 })).toThrow();
    expect(() => parseEventProps('plus_interest', { extra: 1 })).toThrow();
  });
});
