// Rows of the architecture §11 table that depend on parts that are not built yet. Each one is a
// fixme with its cause; docs/build/WP-11.md lists them under known issues. Replace a fixme with
// a real test as soon as the part exists.
// Integration wave: the calendar and rest-period rows (two calendars with a different T, switch
// after T − 6, rest exit via the notice, expansion cohort in a rest squad) now run through every
// real route in tooling/test/integratie-ronde3.test.ts; the browser versions wait for the rest-period
// screens (notice, P6/Q9), which are not built yet (docs/build/INTEGRATIE.md).
import { test } from '../support/fixtures.ts';

const NEEDS_CALENDAR = 'API covered in tooling/test/integratie-ronde3.test.ts; the rest-period screens (notice at T − 6, repeat notice, P6/Q9) are not built yet (docs/build/INTEGRATIE.md)';

test.fixme('Solo-registratie in de arm "sterke squadprompt": dag 1–3 squad_prompt in /me/today, dag 4 niet; standaardarm nooit (arch §11, spec §3.5)', () => {
  // `squad_prompt` in /me/today is never filled (docs/build/WP-4.md, WP-5.md "squadprompt niet gebouwd").
});

test.fixme('Rustperiode-arm, twee kalenders met een verschillende T: geen earn_session op T + 1 en in het aprilvenster, wel op T en daarna (arch §11, spec §3.16)', () => {
  void NEEDS_CALENDAR;
});

test.fixme('Lid van de rustarm stapt na T − 6 over naar een doorlopende squad: melding, rest_exit_at squad_switch, earn_session vanaf de volgende dag (arch §11)', () => {
  // NEEDS_CALENDAR; the invite preview has no field for the notice (docs/build/WP-5.md).
});

test.fixme('Eerste dag van het aprilvenster in de rustarm: herhaalbericht één keer, met knop (arch §11)', () => {
  // NEEDS_CALENDAR; `rest_notice` in /me/today is not filled (docs/build/WP-5.md).
});

test.fixme('Schadesignalen in de rustarm boven de grens: weekafsluiting zet rest_period uit, rest_period_flag_off gelogd (arch §11, spec §6.6)', () => {
  // The guard rule exists in the week close (WP-6), but `rest_period_flag_off` is not in the event
  // taxonomy of contracts-v1 (docs/build/WP-6.md) and the rest arm only runs from 19 January.
});

test.fixme('Rustuitstap via het rustperiodebericht: earn_session vanaf de volgende dag, rest_period_exit gelogd (arch §11)', () => {
  // No route for the rest exit in contracts-v1 (docs/build/WP-9.md "geen route voor rest_period_exit").
});

test.fixme('Uitbreidingscohort sluit aan bij een rustsquad: melding vooraf, earn_session, geen experiment_assignment (arch §11, spec §4.13)', () => {
  // NEEDS_CALENDAR; the expansion cohort starts after 17 January and the notice has no field.
});

test.fixme('Beheerder verlaagt het vrijgaveschema van pool research na vastlegging: SCHEDULE_LOCKED (arch §11, §5.3)', () => {
  // SCHEDULE_LOCKED is not in contracts-v1 and the release route only adds stock (docs/build/WP-4.md).
});

test.fixme('Registratie boven de MAU-grens van de uitbreiding: EXPANSION_CAP_REACHED en aanmelding op de wachtlijst (arch §11, §8.3)', () => {
  // EXPANSION_CAP_REACHED is not in contracts-v1 (round-2 codes, docs/build/WP-4.md).
});
