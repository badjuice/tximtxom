// Game report for bug hunting: everything this browser knows about the game,
// plus the host's action log and final state, as JSON on the clipboard.
import { fetchDebug, MODE } from './net';
import { getSettings } from './settings';
import { store } from './store';

export async function buildReport(): Promise<string> {
  const s = store.get();
  const host = await fetchDebug();
  return JSON.stringify(
    {
      report: 'TximTxom game report',
      at: new Date().toISOString(),
      page: location.href,
      build: import.meta.env.MODE,
      mode: MODE,
      userAgent: navigator.userAgent,
      lang: getSettings().lang,
      room: s.room,
      history: s.history,
      host,
    },
    null,
    1,
  );
}

/** Copies the report; falls back to a hidden textarea where the clipboard API is blocked. */
export async function copyReport(): Promise<boolean> {
  const text = await buildReport();
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
