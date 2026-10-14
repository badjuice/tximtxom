import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { type Card, cardLabel, cardName, type GameEvent, type GameView, suitOf } from '@tximtxom/shared';
import { updateSettings, useSettings } from '../settings';
import { useStore } from '../store';
import { JokerIcon } from './sprites';

const SUIT_CLASS = ['suit-h', 'suit-c', 'suit-d', 'suit-s'];
const KIND: Record<string, string> = { pair: 'pair', trio: 'trio', quad: 'quad', straight: 'straight' };

function C({ card }: { card: Card }) {
  return (
    <span class={`hcard ${SUIT_CLASS[suitOf(card)]}`} aria-label={cardName(card)}>
      {cardLabel(card)}
    </span>
  );
}

interface Line {
  id: number;
  kind: 'round' | 'move' | 'big' | 'score';
  seat: number | null;
  body: ComponentChildren;
}

/** Turns the event log into readable lines. */
function describe(events: { id: number; e: GameEvent }[], g: GameView, myDraws: Record<number, Card>): Line[] {
  const who = (s: number | null) => (s === null ? 'Nobody' : s === g.you ? 'You' : g.players[s]?.name ?? `Seat ${s + 1}`);
  const lines: Line[] = [];
  for (const { id, e } of events) {
    switch (e.t) {
      case 'cut':
        lines.push({ id, kind: 'move', seat: e.dealer, body: <>{who(e.dealer)} cut the lowest card and deal{e.dealer === g.you ? '' : 's'} first</> });
        break;
      case 'deal':
        lines.push({ id, kind: 'round', seat: null, body: <>Round {e.round} · {who(e.dealer)} dealt</> });
        break;
      case 'draw': {
        const c = myDraws[id];
        lines.push({ id, kind: 'move', seat: e.seat, body: c !== undefined ? <>You drew <C card={c} /></> : <>{who(e.seat)} drew from the pile</> });
        break;
      }
      case 'take':
        lines.push({ id, kind: 'move', seat: e.seat, body: <>{who(e.seat)} took <C card={e.card} /> from the discard</> });
        break;
      case 'discard':
        lines.push({ id, kind: 'move', seat: e.seat, body: <>{who(e.seat)} discarded <C card={e.card} />{e.fromDraw ? ' (just drawn)' : ''}</> });
        break;
      case 'reshuffle':
        lines.push({ id, kind: 'big', seat: null, body: <>Discards reshuffled into a new draw pile ({e.count} cards). Last pile!</> });
        break;
      case 'end':
        lines.push({
          id,
          kind: 'big',
          seat: e.seat,
          body:
            e.kind === 'exhausted' ? (
              <>No cards left: the round ends</>
            ) : (
              <>
                {e.kind === 'pileOut' ? `${who(e.seat)} drew the last card and ended the round with ` : `${who(e.seat)} ended the round with `}
                {e.card !== null && <C card={e.card} />}
                {e.bonus && <b class="good"> · full hand, -10!</b>}
                {!e.bonus && e.kind !== 'manual' && ' · no rides'}
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
              {who(e.seat)} showed a {KIND[e.kind] ?? e.kind}{' '}
              {e.cards.map((c) => (
                <C card={c} />
              ))}
            </>
          ),
        });
        break;
      case 'ride':
        lines.push({ id, kind: 'move', seat: e.seat, body: <><JokerIcon name="ride_the_bus" scale={0.16} /> {who(e.seat)} took a ride with <C card={e.card} /></> });
        break;
      case 'pass':
        break;
      case 'doneLaying':
        lines.push({ id, kind: 'move', seat: e.seat, body: <>{who(e.seat)} finished showing formations</> });
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
              Round {e.round} scores:{' '}
              {r.points.map((p, i) => (
                <span class="hscore">
                  {who(i)} <b class={p < 0 ? 'good' : ''}>{p >= 0 ? `+${p}` : p}</b> ({r.totals[i]})
                </span>
              ))}
            </>
          ),
        });
        break;
      }
      case 'tximtxom':
        lines.push({ id, kind: 'big', seat: e.seat, body: <><JokerIcon name="superposition" scale={0.16} /> {who(e.seat)} called TximTxom!</> });
        break;
      case 'gameOver':
        lines.push({ id, kind: 'big', seat: null, body: <>Game over · {e.winners.map(who).join(' & ')} win{e.winners.length === 1 && e.winners[0] !== g.you ? 's' : ''}</> });
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

  // Stick to the bottom as new moves arrive.
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length, s.historyOpen]);

  if (!g || !s.historyOpen) return null;
  return (
    <aside class="history panel" aria-label="Move history">
      <div class="history-head">
        <h2>History</h2>
        <button class="x" aria-label="Close history" onClick={() => updateSettings({ historyOpen: false })}>
          ×
        </button>
      </div>
      <ol class="history-list" ref={list}>
        {lines.map((l) => (
          <li class={`hline ${l.kind}${l.seat !== null && l.seat === g.you ? ' mine' : ''}`} key={l.id}>
            {l.body}
          </li>
        ))}
        {lines.length === 0 && <li class="hline muted">No moves yet.</li>}
      </ol>
    </aside>
  );
}
