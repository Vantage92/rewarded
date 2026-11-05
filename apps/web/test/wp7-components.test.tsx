// Component tests for the base components of UX §5.5 and the accessibility rules of UX §5.8.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Banner,
  BottomSheet,
  Button,
  ButtonLink,
  Card,
  Chip,
  List,
  ListItem,
  Modal,
  ProgressBar,
  ProgressRing,
  Segment,
  Switch,
  TextField,
  TimerDisplay,
  TOAST_MS,
  ToastProvider,
  timerParts,
  useToast,
  initials,
} from '../src/design/index.ts';
import { I18nProvider } from '../src/i18n/index.tsx';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const wrap = (ui: React.ReactNode, locale: 'nl' | 'en' = 'nl') => render(<I18nProvider locale={locale}>{ui}</I18nProvider>);

describe('Button (UX §5.5 Knop)', () => {
  it('is a <button type="button"> with the variant class', () => {
    wrap(<Button>Start focussessie</Button>); // i18n-ignore
    const b = screen.getByRole('button', { name: 'Start focussessie' });
    expect(b.getAttribute('type')).toBe('button');
    expect(b.className).toContain('btn-primary');
  });

  it('shows the reason next to a disabled button and links it', () => {
    wrap(
      <Button disabled disabledReason="Staat uit zonder verbinding.">
        Verzilver
      </Button>,
    );
    const b = screen.getByRole('button', { name: 'Verzilver' }) as HTMLButtonElement;
    expect(b.disabled).toBe(true);
    const reason = document.getElementById(b.getAttribute('aria-describedby')!);
    expect(reason?.textContent).toBe('Staat uit zonder verbinding.');
  });

  it('is a link when it navigates (ButtonLink)', () => {
    wrap(
      <MemoryRouter>
        <ButtonLink to="/squad" variant="secondary">
          Naar je squad
        </ButtonLink>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Naar je squad' }).getAttribute('href')).toBe('/squad');
  });
});

describe('Card (UX §5.5 Kaart)', () => {
  it('is a section named by its title with one action', () => {
    wrap(<Card title="Joker" variant="status" action={<Button>Bekijk</Button>}>Nog over</Card>);
    const region = screen.getByRole('region', { name: 'Joker' });
    expect(region.className).toContain('card-status');
    expect(screen.getByRole('heading', { level: 2, name: 'Joker' })).toBeTruthy();
    expect(region.querySelectorAll('button')).toHaveLength(1);
  });
});

describe('List (UX §5.5 Lijst)', () => {
  it('renders rows with initials and status as a word', () => {
    wrap(
      <List label="Squadleden">
        <ListItem avatarName="Mila de Vries" title="Mila" status={{ label: 'Focust nu', tone: 'live', icon: '●' }} />
      </List>,
    );
    const list = screen.getByRole('list', { name: 'Squadleden' });
    expect(list.querySelector('.avatar')?.textContent).toBe('MV');
    expect(list.querySelector('.avatar')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('Focust nu')).toBeTruthy();
    expect(initials('  ')).toBe('?');
  });
});

describe('ProgressRing (UX §5.5 Voortgangsring)', () => {
  it('is a named progressbar with values and the number in text', () => {
    wrap(<ProgressRing value={25} max={50} label="Dagdoel vandaag" valueText="25 van 50 minuten" />);
    const ring = screen.getByRole('progressbar', { name: 'Dagdoel vandaag' });
    expect(ring.getAttribute('aria-valuemin')).toBe('0');
    expect(ring.getAttribute('aria-valuemax')).toBe('50');
    expect(ring.getAttribute('aria-valuenow')).toBe('25');
    expect(ring.getAttribute('aria-valuetext')).toBe('25 van 50 minuten');
    expect(ring.textContent).toContain('25 van 50 minuten');
    expect(ring.querySelector('circle.ring-value')?.getAttribute('stroke-width')).toBe('6');
  });

  it('clamps values and has a bar variant', () => {
    wrap(<ProgressBar value={500} max={300} label="Inverdiend" valueText="300 van 300 punten" />);
    expect(screen.getByRole('progressbar', { name: 'Inverdiend' }).getAttribute('aria-valuenow')).toBe('300');
  });
});

describe('TimerDisplay (UX §5.5 Timer)', () => {
  it('shows minutes, and seconds only in the last minute', () => {
    expect(timerParts(24 * 60_000 + 1)).toMatchObject({ minutes: 25, lastMinute: false });
    expect(timerParts(42_000)).toMatchObject({ seconds: 42, lastMinute: true });
    expect(timerParts(0)).toMatchObject({ done: true });
    const { rerender } = wrap(<TimerDisplay remainingMs={20 * 60_000} />);
    expect(screen.getByRole('timer').getAttribute('aria-label')).toBe('Nog 20 minuten');
    rerender(
      <I18nProvider locale="nl">
        <TimerDisplay remainingMs={42_000} />
      </I18nProvider>,
    );
    expect(screen.getByRole('timer').textContent).toBe('0:42');
  });

  it('announces only the end by default (aria-live polite)', () => {
    const { rerender, container } = wrap(<TimerDisplay remainingMs={20 * 60_000} />);
    const live = container.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe('');
    rerender(
      <I18nProvider locale="nl">
        <TimerDisplay remainingMs={0} />
      </I18nProvider>,
    );
    expect(live.textContent).toBe('Sessie klaar.');
  });

  it('announces every 5 minutes when the user turned it on', () => {
    const { container } = wrap(<TimerDisplay remainingMs={15 * 60_000} announce="every5" />);
    expect(container.querySelector('[aria-live="polite"]')!.textContent).toBe('Nog 15 minuten');
  });
});

function ToastButton({ message }: { message: string }) {
  const toast = useToast();
  return <button onClick={() => toast.show(message)}>Toon</button>;
}

describe('Toast (UX §5.5 Toast)', () => {
  it('shows in a role="status" region for 4 seconds', () => {
    vi.useFakeTimers();
    wrap(
      <ToastProvider>
        <ToastButton message="Je melding is binnen." />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toon' }));
    expect(screen.getByRole('status').textContent).toBe('Je melding is binnen.');
    act(() => vi.advanceTimersByTime(TOAST_MS - 1));
    expect(screen.getByRole('status').textContent).toBe('Je melding is binnen.');
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('never shows during a session (suppressed)', () => {
    wrap(
      <ToastProvider suppressed>
        <ToastButton message="Hallo" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toon' }));
    expect(screen.getByRole('status').textContent).toBe('');
  });
});

function ModalHarness({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Stoppen</button>
      <Modal
        open={open}
        title="Sessie stoppen?"
        onClose={() => setOpen(false)}
        safe={{ label: 'Doorgaan', onClick: () => setOpen(false) }}
        confirm={{ label: 'Stoppen', onClick: onConfirm, danger: true }}
      >
        De tijd tot nu telt niet.
      </Modal>
    </>
  );
}

describe('Modal (UX §5.5 Modaal)', () => {
  it('is a modal dialog named by its question, focuses the safe choice and traps focus', () => {
    wrap(<ModalHarness onConfirm={() => {}} />);
    const opener = screen.getByRole('button', { name: 'Stoppen' });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Sessie stoppen?' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent).toBe('De tijd tot nu telt niet.');
    const [safe, confirm] = [...dialog.querySelectorAll('button')];
    expect(document.activeElement).toBe(safe);
    expect(safe!.className).toContain('btn-primary');
    expect(confirm!.className).toContain('btn-danger');
    // Tab from the last button wraps to the first.
    confirm!.focus();
    fireEvent.keyDown(confirm!, { key: 'Tab' });
    expect(document.activeElement).toBe(safe);
    fireEvent.keyDown(safe!, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirm);
  });

  it('closes with Esc and restores focus to the opener', () => {
    wrap(<ModalHarness onConfirm={() => {}} />);
    const opener = screen.getByRole('button', { name: 'Stoppen' });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('closes on a tap outside and runs the confirm action', () => {
    const onConfirm = vi.fn<() => void>();
    wrap(<ModalHarness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Stoppen' }));
    fireEvent.mouseDown(document.querySelector('.overlay')!);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Stoppen' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Stoppen' }).at(-1)!);
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

describe('BottomSheet (UX §5.5 Bottom sheet)', () => {
  it('has a title, a close button, Esc and a drag handle', () => {
    const onClose = vi.fn<() => void>();
    wrap(
      <BottomSheet open title="Klopt dit niet?" onClose={onClose}>
        <p>Inhoud</p>
      </BottomSheet>,
    );
    const sheet = screen.getByRole('dialog', { name: 'Klopt dit niet?' });
    expect(sheet.querySelector('.sheet-handle')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sluiten' }));
    fireEvent.keyDown(sheet, { key: 'Escape' });
    const handle = sheet.querySelector('.sheet-handle')!;
    fireEvent.pointerDown(handle, { clientY: 100 });
    fireEvent.pointerUp(handle, { clientY: 300 });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('renders nothing when closed', () => {
    wrap(
      <BottomSheet open={false} title="X" onClose={() => {}}>
        <p>Inhoud</p>
      </BottomSheet>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('FormField (UX §5.8, architecture §9.6)', () => {
  it('links label, hint and error to the input', () => {
    wrap(<TextField label="Code uit de mail" hint="6 cijfers" error="Deze code klopt niet." inputMode="numeric" autoComplete="one-time-code" maxLength={6} />);
    const input = screen.getByLabelText('Code uit de mail') as HTMLInputElement;
    expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const described = input.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent);
    expect(described).toEqual(['6 cijfers', 'Deze code klopt niet.']);
  });

  it('marks optional fields in text', () => {
    wrap(<TextField label="Achternaam" optional />, 'en');
    expect(screen.getByLabelText(/Achternaam/).getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByText('(optional)')).toBeTruthy();
  });
});

describe('Segment, Switch, Chip, Banner (UX §5.5)', () => {
  it('Segment is a radiogroup; arrow keys move the choice', () => {
    function Harness() {
      const [v, setV] = useState<25 | 50 | 90>(50);
      return <Segment label="Duur van de sessie" value={v} onChange={setV} options={[25, 50, 90].map((n) => ({ value: n as 25 | 50 | 90, label: `${n} min` }))} />;
    }
    wrap(<Harness />);
    const group = screen.getByRole('radiogroup', { name: 'Duur van de sessie' });
    expect(screen.getByRole('radio', { name: '50 min' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: '90 min' }).getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: '90 min' }));
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: '25 min' }).getAttribute('aria-checked')).toBe('true');
  });

  it('Switch is role="switch" labelled from the left and starts off', () => {
    function Harness() {
      const [on, setOn] = useState(false);
      return <Switch label="Stille modus" checked={on} onChange={setOn} />;
    }
    wrap(<Harness />);
    const sw = screen.getByRole('switch', { name: 'Stille modus' });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
  });

  it('Chip is text; Banner offline is not closable', () => {
    wrap(
      <>
        <Chip tone="pause">Wordt nagekeken</Chip>
        <Banner tone="offline" onClose={() => {}}>
          Geen verbinding.
        </Banner>
      </>,
    );
    expect(screen.getByText('Wordt nagekeken').className).toBe('chip chip-pause');
    expect(screen.getByRole('status').textContent).toBe('Geen verbinding.');
    expect(screen.queryByRole('button', { name: 'Sluiten' })).toBeNull();
  });
});
