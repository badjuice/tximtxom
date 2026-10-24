import { useEffect, useRef, useState } from 'preact/hooks';
import { makeCard, NAME_MAX, ROOM_CODE_LENGTH, type Suit } from '@tximtxom/shared';
import { play, unlockAudio } from '../audio';
import { t } from '../i18n';
import { createRoom, joinRoom, linkedRoom, saveName, savedName } from '../net';
import { store, useStore } from '../store';
import { Button, Credits, TopMenu, WaveText } from './common';
import { EditionCard } from './EditionCard';
import { EDITIONS, type Edition } from './editions';

// Four Aces fanned like a hand, red and black alternating: spades, hearts, clubs, diamonds.
const FAN: Suit[] = [3, 0, 1, 2];
const FAN_ANGLE = [-12, -4, 4, 12];
const FAN_DROP = [9, 1, 1, 9];
const FAN_STEP = 48; // px between card centres
const DRAG_THRESHOLD = 10;
const slotX = (i: number) => (i - (FAN.length - 1) / 2) * FAN_STEP;

/** `order` with `suit` moved to the slot nearest to x, as reordering the hand does. */
function reordered(order: Suit[], suit: Suit, x: number): Suit[] {
  const without = order.filter((s) => s !== suit);
  let idx = FAN.findIndex((_, i) => x < slotX(i));
  if (idx < 0) idx = FAN.length - 1;
  without.splice(Math.min(idx, without.length), 0, suit);
  return without;
}

// The fan's order, rearranged by dragging like a hand. Kept through overlays and
// language changes, back to the start on leaving the title screen.
let fanOrder = [...FAN];

// Each time the Aces are dealt onto the title screen, each one may get an edition.
const EDITION_SOUND = { foil: 'editionFoil', holo: 'editionHolo', poly: 'editionPoly', negative: 'editionNegative' } as const;
const EDITION_ODDS: [Edition, number][] = [
  ['foil', 0.1],
  ['holo', 0.07],
  ['poly', 0.05],
  ['negative', 0.03],
];
function rollEdition(): Edition | null {
  let r = Math.random();
  for (const [ed, p] of EDITION_ODDS) {
    if (r < p) return ed;
    r -= p;
  }
  return null;
}
let fanEditions: Partial<Record<Suit, Edition>> = {};
/** The Aces were dealt (and rolled) this visit; overlays and language changes don't deal again. */
let fanDealt = false;
/** Editions rolled but not landed yet. */
let fanPending: Partial<Record<Suit, Edition>> = {};
// Typing "radicalism" on the title screen gives every Ace an edition, if none has one.
// Once per page load, or again after a visit to a room.
const SECRET = 'radicalism';
let secretArmed = true;
const shuffled = <T,>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map(([, v]) => v);

/** A title-screen Ace that drags like a hand card: it follows the pointer
 *  upright, and while it is over the fan the others open a gap where it
 *  would land. Let go there, it takes that slot; anywhere else it snaps
 *  back. A tap makes it hop. `x` is the card's centre on the fan, or null
 *  when it is away from it. */
function FanCard(props: {
  suit: Suit;
  slot: number;
  edition: Edition | null;
  onDrag: (suit: Suit, x: number | null) => void;
  onDrop: (suit: Suit, x: number | null) => void;
}) {
  const { suit, slot } = props;
  // When an edition lands the card juices up, as in Balatro: a quick swell and wobble.
  const juice = useRef<HTMLSpanElement>(null);
  const firstEdition = useRef(props.edition);
  useEffect(() => {
    const el = juice.current;
    if (!el || !props.edition || props.edition === firstEdition.current) return;
    el.classList.remove('edition-land');
    void el.offsetWidth; // restart the animation
    el.classList.add('edition-land');
  }, [props.edition]);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [hops, setHops] = useState(0);
  const start = useRef<{ x: number; y: number; slot: number; moved: boolean } | null>(null);
  const onFan = (s: { x: number; slot: number }, e: PointerEvent, y: number) => (Math.abs(y) < 95 ? slotX(s.slot) + e.clientX - s.x : null);

  const style: Record<string, string> = { '--x': `${slotX(slot)}px`, '--a': `${FAN_ANGLE[slot]}deg`, '--y': `${FAN_DROP[slot]}px`, zIndex: `${slot + 1}` };
  if (drag && start.current) {
    const from = start.current.slot;
    Object.assign(style, { '--x': `${slotX(from) + drag.x}px`, '--a': '0deg', '--y': `${FAN_DROP[from] + drag.y}px`, zIndex: '10' });
  }
  return (
    <span
      class={`fan-card${drag ? ' held' : ''}`}
      style={style}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, y: e.clientY, slot, moved: false };
        unlockAudio();
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (!s) return;
        const x = e.clientX - s.x;
        const y = e.clientY - s.y;
        if (!s.moved && Math.hypot(x, y) <= DRAG_THRESHOLD) return;
        if (!s.moved) play('cardSlide1', { volume: 0.5 });
        s.moved = true;
        setDrag({ x, y });
        props.onDrag(suit, onFan(s, e, y));
      }}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        setDrag(null);
        if (!s) return;
        if (s.moved) {
          play('cardSlide2', { volume: 0.4 });
          props.onDrop(suit, onFan(s, e, e.clientY - s.y));
        } else {
          play('card1', { volume: 0.5, rate: 0.9 + slot * 0.08 });
          setHops((n) => n + 1);
        }
      }}
      onPointerCancel={() => {
        start.current = null;
        setDrag(null);
        props.onDrop(suit, null);
      }}
    >
      {/* Keyed so each tap restarts the hop. */}
      <span class={hops ? 'fan-hop' : ''} key={hops}>
        <span class="edition-juice" ref={juice}>
          <EditionCard card={makeCard(1, suit)} edition={props.edition} />
        </span>
      </span>
    </span>
  );
}

export function Title() {
  const connected = useStore((s) => s.connected);
  const [name, setName] = useState(savedName());
  const [code, setCode] = useState(linkedRoom());
  const [busy, setBusy] = useState(false);
  const cleanName = name.trim() || t('title.namePlaceholder');
  const [order, setOrder] = useState(fanOrder);
  const [editions, setEditions] = useState(fanEditions);
  // Editions land left to right, each with its sound.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const land = (picks: Partial<Record<Suit, Edition>>, delay: number) => {
    let i = 0;
    for (const suit of fanOrder) {
      const ed = picks[suit];
      if (!ed) continue;
      fanPending[suit] = ed;
      timers.current.push(
        setTimeout(() => {
          delete fanPending[suit];
          fanEditions = { ...fanEditions, [suit]: ed };
          setEditions(fanEditions);
          play(EDITION_SOUND[ed], { volume: 0.8 });
        }, delay + i++ * 450),
      );
    }
  };
  useEffect(() => {
    if (!fanDealt) {
      fanDealt = true;
      const picks: Partial<Record<Suit, Edition>> = {};
      for (const suit of FAN) {
        const ed = rollEdition();
        if (ed) picks[suit] = ed;
      }
      land(picks, 700);
    }
    let typed = '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-SECRET.length);
      if (typed !== SECRET || !secretArmed || Object.keys(fanEditions).length || Object.keys(fanPending).length) return;
      secretArmed = false;
      const picks = shuffled(EDITIONS);
      land(Object.fromEntries(fanOrder.map((suit, i) => [suit, picks[i]])), 200);
    };
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('keydown', onKey);
      timers.current.forEach(clearTimeout);
      // Redrawn mid-landing (language change): the rest arrive already in place.
      fanEditions = { ...fanEditions, ...fanPending };
      fanPending = {};
    };
  }, []);
  // Entering a room unmounts the title screen: the fan starts over next time.
  useEffect(
    () => () => {
      if (!store.get().room) return;
      fanOrder = [...FAN];
      fanEditions = {};
      fanDealt = false;
      secretArmed = true;
    },
    [],
  );
  // The Ace being dragged over the fan, and where: the others make room for it.
  const [over, setOver] = useState<{ suit: Suit; x: number } | null>(null);
  const shown = over ? reordered(order, over.suit, over.x) : order;
  const drag = (suit: Suit, x: number | null) => setOver(x === null ? null : { suit, x });
  const drop = (suit: Suit, x: number | null) => {
    setOver(null);
    if (x === null) return;
    fanOrder = reordered(order, suit, x);
    setOrder(fanOrder);
  };

  const go = async (fn: () => Promise<unknown>) => {
    unlockAudio();
    setBusy(true);
    await fn();
    setBusy(false);
  };

  return (
    <main class="title-screen">
      <TopMenu />
      <h1 class="logo">
        <WaveText text="TximTxom" amp={12} />
      </h1>
      <div class="logo-fan" aria-hidden="true">
        {/* Fixed DOM order; each Ace slides to its slot, so a reorder animates. */}
        {FAN.map((suit) => (
          <FanCard key={suit} suit={suit} slot={shown.indexOf(suit)} edition={editions[suit] ?? null} onDrag={drag} onDrop={drop} />
        ))}
      </div>

      <form
        class="panel title-panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === ROOM_CODE_LENGTH) void go(() => joinRoom(code, cleanName));
        }}
      >
        <label class="field">
          <span>{t('title.name')}</span>
          <input
            value={name}
            maxLength={NAME_MAX}
            autoComplete="nickname"
            placeholder={t('title.namePlaceholder')}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            onBlur={() => saveName(name.trim())}
          />
        </label>

        <Button color="blue" big disabled={!connected || busy} onClick={() => void go(() => createRoom(cleanName))}>
          {t('title.create')}
        </Button>

        <div class="or">{t('title.orJoin')}</div>

        <div class="join-row">
          <label class="field code-field">
            <span>{t('title.code')}</span>
            <input
              value={code}
              maxLength={ROOM_CODE_LENGTH}
              autoCapitalize="characters"
              autoComplete="off"
              spellcheck={false}
              placeholder="ABCD"
              onInput={(e) => setCode((e.target as HTMLInputElement).value.toUpperCase().replace(/[^A-Z]/g, ''))}
            />
          </label>
          <Button color="red" type="submit" disabled={!connected || busy || code.length !== ROOM_CODE_LENGTH}>
            {t('title.join')}
          </Button>
        </div>
        {!connected && (
          <p class="muted" role="status">
            {t('title.connecting')}
          </p>
        )}
      </form>

      <div class="title-links">
        <Button color="grey" onClick={() => store.set({ overlay: 'help' })}>
          {t('title.howToPlay')}
        </Button>
        <Button color="purple" onClick={() => store.set({ overlay: 'changelog' })}>
          {t('title.changelog')}
        </Button>
      </div>
      <Credits />
    </main>
  );
}
