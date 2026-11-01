// ---------------------------------------------------------------------------
// Calendar export: plan events -> an .ics file (Apple Calendar, Google, Outlook)
// ---------------------------------------------------------------------------
//
// Times are written in UTC, so the phone shows each event at the right moment
// in whatever time zone it is set to.

import type { EventKind } from './crewSleepLogic';
import { MIN } from './crewSleepLogic';

export interface CalendarEvent {
  kind: EventKind;
  start: number;
  end: number;
  title: string;
  detail: string;
  place: string;
}

/** What can be exported, as the crew thinks of it. */
export const CALENDAR_GROUPS: { key: string; label: string; kinds: EventKind[]; on: boolean }[] = [
  { key: 'sleep', label: 'Sleep', kinds: ['sleep', 'anchor'], on: true },
  { key: 'nap', label: 'Naps (incl. crew lounge)', kinds: ['nap', 'strategic'], on: true },
  { key: 'inflight', label: 'Bunk rest', kinds: ['inflight'], on: true },
  { key: 'caffeine', label: 'Coffee cut-off', kinds: ['caffeine'], on: true },
  { key: 'light', label: 'Bright light & dim lights', kinds: ['light', 'dim'], on: false },
  { key: 'melatonin', label: 'Melatonin', kinds: ['melatonin'], on: false },
  { key: 'ready', label: 'Getting ready & commute', kinds: ['wakeup', 'inbed'], on: true },
  { key: 'flights', label: 'Flights (departure & arrival)', kinds: ['depart', 'arrive'], on: false },
];

/** The choices last used in the export dialog, kept on this device (not in the profile or backups). */
export interface CalendarPrefs { groups: string[]; alarmMin: number | null }

const LS_CALENDAR = 'crew-sleep:calendar';

export function readCalendarPrefs(): CalendarPrefs {
  const fallback = { groups: CALENDAR_GROUPS.filter(g => g.on).map(g => g.key), alarmMin: 15 };
  try {
    const saved = JSON.parse(localStorage.getItem(LS_CALENDAR) || 'null');
    if (!saved || !Array.isArray(saved.groups)) return fallback;
    return {
      groups: saved.groups.filter((k: unknown) => CALENDAR_GROUPS.some(g => g.key === k)),
      alarmMin: typeof saved.alarmMin === 'number' || saved.alarmMin === null ? saved.alarmMin : fallback.alarmMin,
    };
  } catch { return fallback; }
}

export function writeCalendarPrefs(prefs: CalendarPrefs) {
  try { localStorage.setItem(LS_CALENDAR, JSON.stringify(prefs)); } catch { /* private mode: not remembered */ }
}

// Point events (no duration) still get a short block so they show in the calendar.
const POINT_MIN = 15;

const icsTime = (t: number) => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** Lines longer than 75 octets are folded, as the format requires. */
function fold(line: string) {
  const bytes = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (bytes.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ''; }
    cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function buildIcs(events: CalendarEvent[], alarmMin: number | null, calName = 'Kkuljam'): string {
  const stamp = icsTime(Date.now());
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kkuljam//Sleep plan//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsText(calName)}`,
  ];
  for (const e of events) {
    const end = e.end > e.start ? e.end : e.start + POINT_MIN * MIN;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.kind}-${e.start}@kkuljam`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsTime(e.start)}`,
      `DTEND:${icsTime(end)}`,
      `SUMMARY:${icsText(e.title)}`,
    );
    if (e.detail) lines.push(`DESCRIPTION:${icsText(e.detail)}`);
    if (e.place) lines.push(`LOCATION:${icsText(e.place)}`);
    if (alarmMin !== null) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(e.title)}`,
        `TRIGGER:${alarmMin ? `-PT${alarmMin}M` : 'PT0M'}`, 'END:VALARM');
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/**
 * Hand the file to the device. On iPhone/iPad, opening it (instead of saving to Files)
 * shows Apple Calendar's "Add All" screen; elsewhere it downloads.
 */
export function openIcs(ics: string, filename: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) {
    window.location.href = url;
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
