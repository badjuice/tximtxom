import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { type Card, type GameEvent, type GameView, suitOf } from '@tximtxom/shared';
import { cardShort, cardSpoken, type Key, kindName, lang, t } from '../i18n';
import { updateSettings, useSettings } from '../settings';
import { historyText } from '../historyLog';
import { copyText } from '../report';
import { type PastGame, store, toast, useStore } from '../store';
import { ChatBox, useUnreadChat } from './Chat';
import { Label } from './common';
import { SEAT_COLORS } from './Hud';
import { ArtIcon } from './sprites';

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

const CopyIcon = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" shape-rendering="crispEdges" aria-hidden="true">
    <path d="M5 1h9v9h-2V3H5z" fill="currentColor" />
    <path d="M2 5h9v10H2zm2 2v6h5V7z" fill="currentColor" fill-rule="evenodd" />
  </svg>
);

function copied(ok: boolean): void {
  toast(ok ? t('h.copied') : t('h.copyFailed'), ok ? 'info' : 'error');
}

const LineItem = ({ l, you }: { l: Line; you: number | null }) => (
  <li class={`hline ${l.kind}${l.seat !== null && l.seat === you ? ' mine' : ''}${l.auto ? ' auto' : ''}`} key={l.id}>
    {l.body}
    {l.auto && (
      <span class="hauto" title={t('h.autoTitle')} aria-label={t('h.autoTitle')} role="img">
        <ArtIcon name="timer" scale={0.26} />
      </span>
    )}
  </li>
);

/**
 * A game's lines, a fold per round: the rounds before the last one are closed
 * (open them to read or copy), and the last round is laid out in full.
 */
function Lines({ lines, you, foldAll }: { lines: Line[]; you: number | null; foldAll?: boolean }) {
  const rounds: Line[][] = [[]];
  for (const l of lines) {
    if (l.kind === 'round' && rounds.at(-1)!.some((x) => x.kind === 'round')) rounds.push([]);
    rounds.at(-1)!.push(l);
  }
  return (
    <>
      {rounds.map((r, i) => {
        const head = r.find((x) => x.kind === 'round');
        if ((i === rounds.length - 1 && !foldAll) || !head) return r.map((l) => <LineItem l={l} you={you} />);
        const before = r.slice(0, r.indexOf(head));
        return (
          <>
            {before.map((l) => (
              <LineItem l={l} you={you} />
            ))}
            <li class="hfold" key={`f${head.id}`}>
              <details>
                <summary class="hline round">{head.body}</summary>
                <ol class="hfold-list">
                  {r.slice(r.indexOf(head) + 1).map((l) => (
                    <LineItem l={l} you={you} />
                  ))}
                </ol>
              </details>
            </li>
          </>
        );
      })}
    </>
  );
}

/** An earlier game in this room: one closed line, with its rounds folded inside. */
function PastGameFold({ game, n }: { game: PastGame; n: number }) {
  const copy = (round?: number) => void copyText(historyText(game.events, game.g, game.myDraws, round)).then(copied);
  const lines = describe(game.events, game.g, game.myDraws, copy);
  return (
    <li class="hfold past">
      <details>
        <summary class="hline big">
          {t('h.pastGame', { n })}
          <button
            class="hcopy small"
            title={t('h.copyGame')}
            aria-label={t('h.copyGame')}
            onClick={(e) => {
              e.preventDefault();
              copy();
            }}
          >
            <CopyIcon />
          </button>
        </summary>
        <ol class="hfold-list">
          <Lines lines={lines} you={game.g.you} foldAll />
        </ol>
      </details>
    </li>
  );
}

interface Line {
  id: number;
  kind: 'round' | 'move' | 'big' | 'score';
  seat: number | null;
  body: ComponentChildren;
  /** The game made this move for the player (they didn't act in time). */
  auto?: boolean;
}

function describe(events: { id: number; e: GameEvent }[], g: GameView, myDraws: Record<number, Card>, onCopy: (round: number) => void): Line[] {
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
    const count = lines.length;
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
                {/* The ending card went under the pile face down: the log doesn't name it either. */}
                {tj(e.kind === 'pileOut' ? 'h.pileOut' : 'h.txiJog', { name: N(e.seat) })}
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
              {tj('h.showed', { name: N(e.seat), kind: kindName(e.kind, e.cards.length).toLowerCase() })}{' '}
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
              <ArtIcon name="ride" scale={0.16} /> {tj('h.rode', { name: N(e.seat), card: <C card={e.card} /> })}
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
              <div class="hscore-title">
                {t('h.scores', { n: e.round })}
                <button class="hcopy" onClick={() => onCopy(e.round)}>
                  {t('h.copyRound')}
                </button>
              </div>
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
              <ArtIcon name="tximtxom" scale={0.16} /> {tj('h.tximtxom', { name: N(e.seat) })}
            </>
          ),
        });
        break;
      case 'gameOver':
        lines.push({ id, kind: 'big', seat: null, body: tj('h.gameOver', { names: <>{e.winners.map((w, i) => [i > 0 && ' & ', N(w)])}</> }) });
        break;
      case 'pass':
        // Passing is silent, unless the game had to do it for someone.
        if (e.auto) lines.push({ id, kind: 'move', seat: e.seat, body: tj(`h.autoPass.${e.why ?? 'noFit'}`, { name: N(e.seat) }) });
        break;
    }
    if (e.auto && lines.length > count) lines[lines.length - 1].auto = true;
  }
  return lines;
}

export function HistoryPanel() {
  const s = useSettings();
  const history = useStore((st) => st.history);
  const pastGames = useStore((st) => st.pastGames);
  const myDraws = useStore((st) => st.myDraws);
  const g = useStore((st) => st.room?.game);
  const room = useStore((st) => st.room);
  const sideTab = useStore((st) => st.sideTab);
  const unread = useUnreadChat();
  const list = useRef<HTMLOListElement>(null);
  /** Following the newest moves: off while you scroll up to read older ones. */
  const atBottom = useRef(true);
  const copy = (round?: number) => {
    if (!g) return;
    void copyText(historyText(history, g, myDraws, round)).then((ok) => toast(ok ? t('h.copied') : t('h.copyFailed'), ok ? 'info' : 'error'));
  };
  const lines = g ? describe(history, g, myDraws, copy) : [];
  void lang();

  // Opening the panel always starts at the newest move.
  useEffect(() => {
    atBottom.current = true;
  }, [s.historyOpen]);
  // New moves keep it at the bottom, unless you scrolled up.
  useEffect(() => {
    const el = list.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [lines.length, s.historyOpen]);

  if (!g || !s.historyOpen || !room) return null;
  const tab = sideTab;
  return (
    <aside class="history panel" aria-label={tab === 'chat' ? t('chat.title') : t('h.title')}>
      <div class="history-head">
        <div class="side-tabs" role="tablist">
          {(['history', 'chat'] as const).map((id) => (
            <button role="tab" aria-selected={tab === id} class={`side-tab${tab === id ? ' on' : ''}`} onClick={() => store.set({ sideTab: id })}>
              <Label k={id === 'chat' ? 'chat.title' : 'h.title'} />
              {/* Always there, so the tab never changes width. */}
              {id === 'chat' && <span class={`unread${unread && tab !== 'chat' ? '' : ' none'}`}>{unread || 0}</span>}
            </button>
          ))}
        </div>
        {tab === 'history' && (
          <button class="hcopy" onClick={() => copy()} title={t('h.copyGame')} aria-label={t('h.copyGame')}>
            <svg viewBox="0 0 16 16" width="14" height="14" shape-rendering="crispEdges" aria-hidden="true">
              <path d="M5 1h9v9h-2V3H5z" fill="currentColor" />
              <path d="M2 5h9v10H2zm2 2v6h5V7z" fill="currentColor" fill-rule="evenodd" />
            </svg>
          </button>
        )}
        <button class="x" aria-label={t('close')} onClick={() => updateSettings({ historyOpen: false })}>
          ×
        </button>
      </div>
      {tab === 'chat' ? <ChatBox room={room} /> : <ol
        class="history-list"
        ref={list}
        onScroll={(ev) => {
          const el = ev.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
        }}
      >
        {pastGames.map((p, i) => (
          <PastGameFold game={p} n={i + 1} key={`g${i}`} />
        ))}
        <Lines lines={lines} you={g.you} />
        {lines.length === 0 && <li class="hline muted">{t('h.empty')}</li>}
      </ol>}
    </aside>
  );
}
