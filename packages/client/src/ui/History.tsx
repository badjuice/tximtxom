import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { type Card, type GameEvent, type GameView, suitOf } from '@tximtxom/shared';
import { cardShort, cardSpoken, type Key, kindName, lang, t } from '../i18n';
import { updateSettings, useSettings } from '../settings';
import { useStore } from '../store';
import { SEAT_COLORS } from './Hud';
import { JokerIcon } from './sprites';

const SUIT_CLASS = ['suit-h', 'suit-c', 'suit-d', 'suit-s'];

function C({ card }: { card: Card }) {
  return (
    <span class={`hcard ${SUIT_CLASS[suitOf(card)]}`} aria-label={cardSpoken(card)}>
      {cardShort(card)}
    </span>
  );
}

/** t() for JSX: placeholders can be elements (coloured names, cards). */
function tj(key: Key, vars: Record<string, ComponentChildren>): ComponentChildren {
  const raw = t(key, Object.fromEntries(Object.keys(vars).map((k) => [k, `\u0000${k}\u0000`])));
  return raw.split('\u0000').map((part, i) => (i % 2 ? vars[part] : part));
}

interface Line {
  id: number;
  kind: 'round' | 'move' | 'big' | 'score';
  seat: number | null;
  body: ComponentChildren;
}

function describe(events: { id: number; e: GameEvent }[], g: GameView, myDraws: Record<number, Card>): Line[] {
  const N = (s: number | null) =>
    s === null ? (
      '—'
    ) : (
      <b class="hname" style={{ color: SEAT_COLORS[s] }}>
        {s === g.you ? t('you') : g.players[s]?.name ?? `#${s + 1}`}
      </b>
    );
  const lines: Line[] = [];
  for (const { id, e } of events) {
    switch (e.t) {
      case 'cut':
        lines.push({ id, kind: 'move', seat: e.dealer, body: tj('h.cut', { name: N(e.dealer) }) });
        break;
      case 'deal':
        lines.push({ id, kind: 'round', seat: null, body: tj('h.round', { n: e.round, name: N(e.dealer) }) });
        break;
      case 'draw': {
        const c = myDraws[id];
        lines.push({ id, kind: 'move', seat: e.seat, body: c !== undefined ? tj('h.youDrew', { card: <C card={c} /> }) : tj('h.drew', { name: N(e.seat) }) });
        break;
      }
      case 'take':
        lines.push({ id, kind: 'move', seat: e.seat, body: tj('h.took', { name: N(e.seat), card: <C card={e.card} /> }) });
        break;
      case 'discard':
        lines.push({
          id,
          kind: 'move',
          seat: e.seat,
          body: (
            <>
              {tj('h.discarded', { name: N(e.seat), card: <C card={e.card} /> })}
              {e.fromDraw && <span class="muted"> {t('h.justDrawn')}</span>}
            </>
          ),
        });
        break;
      case 'reshuffle':
        lines.push({ id, kind: 'big', seat: null, body: t('h.reshuffled', { n: e.count }) });
        break;
      case 'end':
        lines.push({
          id,
          kind: 'big',
          seat: e.seat,
          body:
            e.kind === 'exhausted' || e.card === null ? (
              t('h.noCards')
            ) : (
              <>
                {tj(e.kind === 'pileOut' ? 'h.pileOut' : 'h.txiJog', { name: N(e.seat), card: <C card={e.card} /> })}
                {e.bonus && <b class="good"> · {t('h.fullHand')}</b>}
                {!e.bonus && e.kind !== 'manual' && <span> · {t('h.noRides')}</span>}
              </>
            ),
        });
        break;
      case 'lay':
        lines.push({
          id,
          kind: 'move',
          seat: e.seat,
          body: (
            <>
              {tj('h.showed', { name: N(e.seat), kind: kindName(e.kind).toLowerCase() })}{' '}
              {e.cards.map((c) => (
                <C card={c} />
              ))}
            </>
          ),
        });
        break;
      case 'ride':
        lines.push({
          id,
          kind: 'move',
          seat: e.seat,
          body: (
            <>
              <JokerIcon name="ride_the_bus" scale={0.16} /> {tj('h.rode', { name: N(e.seat), card: <C card={e.card} /> })}
            </>
          ),
        });
        break;
      case 'doneLaying':
        lines.push({ id, kind: 'move', seat: e.seat, body: tj('h.finished', { name: N(e.seat) }) });
        break;
      case 'score': {
        const r = g.results.find((x) => x.round === e.round);
        if (!r) break;
        lines.push({
          id,
          kind: 'score',
          seat: null,
          body: (
            <>
              <div class="hscore-title">{t('h.scores', { n: e.round })}</div>
              <ul class="hscores">
                {r.points.map((p, i) => (
                  <li>
                    {N(i)}
                    <span class={p < 0 ? 'good' : p > 0 ? 'bad' : 'muted'}>{p > 0 ? `+${p}` : p}</span>
                    <span class="muted">→ {r.totals[i]}</span>
                  </li>
                ))}
              </ul>
            </>
          ),
        });
        break;
      }
      case 'tximtxom':
        lines.push({
          id,
          kind: 'big',
          seat: e.seat,
          body: (
            <>
              <JokerIcon name="superposition" scale={0.16} /> {tj('h.tximtxom', { name: N(e.seat) })}
            </>
          ),
        });
        break;
      case 'gameOver':
        lines.push({ id, kind: 'big', seat: null, body: tj('h.gameOver', { names: <>{e.winners.map((w, i) => [i > 0 && ' & ', N(w)])}</> }) });
        break;
      case 'pass':
        break;
    }
  }
  return lines;
}

export function HistoryPanel() {
  const s = useSettings();
  const history = useStore((st) => st.history);
  const myDraws = useStore((st) => st.myDraws);
  const g = useStore((st) => st.room?.game);
  const list = useRef<HTMLOListElement>(null);
  const lines = g ? describe(history, g, myDraws) : [];
  void lang();

  // Stick to the bottom as new moves arrive.
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length, s.historyOpen]);

  if (!g || !s.historyOpen) return null;
  return (
    <aside class="history panel" aria-label={t('h.title')}>
      <div class="history-head">
        <h2>{t('h.title')}</h2>
        <button class="x" aria-label={t('close')} onClick={() => updateSettings({ historyOpen: false })}>
          ×
        </button>
      </div>
      <ol class="history-list" ref={list}>
        {lines.map((l) => (
          <li class={`hline ${l.kind}${l.seat !== null && l.seat === g.you ? ' mine' : ''}`} key={l.id}>
            {l.body}
          </li>
        ))}
        {lines.length === 0 && <li class="hline muted">{t('h.empty')}</li>}
      </ol>
    </aside>
  );
}
