// The game's history as compact text for the clipboard: one short line per
// move, meant to be pasted into a chat with an AI (or a bug report), not read
// on screen. A legend line at the top says what the codes mean.
import { type Card, cardCode, type GameEvent, type GameView, type Rules } from '@tximtxom/shared';
import { VERSION } from './version';

const LEGEND =
  'Legend: line=seat+code. R<n>:<dealer>=round start. d=drew (card if mine) t=took x=discarded (*=the card just drawn) ' +
  'e=ended (m=Txi jog, p=pile out, n=no cards; !=full hand -10) l<kind>=showed formation (p/t/q/s) r=rode f=finished showing ' +
  'X<n>=discard pile reshuffled W=TximTxom S=round points/total per seat G=game over, winners';

const cards = (cs: readonly Card[]) => cs.map(cardCode).join(' ');

function rulesLine(r: Rules): string {
  const on = (Object.keys(r) as (keyof Rules)[]).filter((k) => r[k] === true);
  return `Rules: bust>${r.threshold} ride=${r.rideOrder}${r.turnTimer ? ` timer=${r.turnTimer}s` : ''}${on.length ? ` on=${on.join(',')}` : ''}`;
}

function line(e: GameEvent, g: GameView, mine: Card | undefined): string | null {
  switch (e.t) {
    case 'cut':
      return `${e.dealer}cut`;
    case 'deal':
      return `R${e.round}:${e.dealer}`;
    case 'draw':
      return `${e.seat}d${mine !== undefined ? cardCode(mine) : ''}`;
    case 'take':
      return `${e.seat}t${cardCode(e.card)}`;
    case 'discard':
      return `${e.seat}x${cardCode(e.card)}${e.fromDraw ? '*' : ''}`;
    case 'reshuffle':
      return `X${e.count}`;
    case 'end':
      return `${e.seat ?? ''}e${e.kind === 'manual' ? 'm' : e.kind === 'pileOut' ? 'p' : 'n'}${e.bonus ? '!' : ''}`;
    case 'lay':
      return `${e.seat}l${e.kind[0]} ${cards(e.cards)}`;
    case 'ride':
      return `${e.seat}r${cardCode(e.card)}`;
    case 'doneLaying':
      return `${e.seat}f`;
    case 'score': {
      const r = g.results.find((x) => x.round === e.round);
      return r ? `S ${r.points.map((p, i) => `${p}/${r.totals[i]}`).join(' ')}` : null;
    }
    case 'tximtxom':
      return `${e.seat}W`;
    case 'gameOver':
      return `G ${e.winners.join(',')}`;
    case 'pass':
      return null;
  }
}

/** The log of the whole game, or of round `round` only (from its deal to its scores). */
export function historyText(events: { id: number; e: GameEvent }[], g: GameView, myDraws: Record<number, Card>, round?: number): string {
  let picked = events;
  if (round !== undefined) {
    const start = events.findIndex((x) => x.e.t === 'deal' && x.e.round === round);
    const next = events.findIndex((x) => x.e.t === 'deal' && x.e.round === round + 1);
    picked = start < 0 ? [] : events.slice(start, next < 0 ? undefined : next);
  }
  const seats = g.players.map((p, i) => `${i}=${p.name}${p.isBot ? '(bot)' : ''}${i === g.you ? '(me)' : ''}`).join(' ');
  const body = picked.map(({ id, e }) => line(e, g, myDraws[id])).filter((l) => l !== null);
  return [`TximTxom v${VERSION} ${round !== undefined ? `round ${round}` : 'game'} log. Seats: ${seats}`, rulesLine(g.rules), LEGEND, ...body].join('\n');
}
