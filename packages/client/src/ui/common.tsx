import type { ComponentChildren } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { play } from '../audio';
import { type Key, lang, otherTexts, t, tEvery } from '../i18n';
import type { Rarity } from '../achievements';
import { useSettings } from '../settings';
import { store } from '../store';
import { assetUrl, AUTHOR_URL, VERSION } from '../version';
import { useChips } from '../chips';
import { formatCount } from '../stats';
import { ArtIcon } from './sprites';

type Color = 'red' | 'blue' | 'orange' | 'green' | 'grey' | 'purple';

/** Short labels move like Balatro's: every letter wobbles a little, and one
 *  at a time they hop, start to end, then one quiet beat and again. */
const WAVE_MAX = 18;
const HOP_MS = 300;
// A letter lands and rests this long before the next one hops.
const HOP_GAP_MS = 90;
const WAVE_STEP_MS = HOP_MS + HOP_GAP_MS;

/** A hop of `amp` px as keyframes on whole pixels only: the arc is sampled per
 *  frame, rounded, and held until the next pixel. Easing through fractions
 *  redrew the pixel font at sub-pixel offsets every frame, so it shimmered. */
const hopFrames = new Map<number, Keyframe[]>();
function hop(amp: number): Keyframe[] {
  let frames = hopFrames.get(amp);
  if (frames) return frames;
  frames = [];
  const samples = Math.round(HOP_MS / 16);
  let last = NaN;
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    const y = Math.round(amp * Math.sin(Math.PI * f));
    if (y === last && i < samples) continue;
    frames.push({ offset: f, translate: `0 ${-y}px`, easing: 'step-end' });
    last = y;
  }
  hopFrames.set(amp, frames);
  return frames;
}

// One clock drives every wave on screen; each wave keeps its own position, and its letters
// (found once, again only when the text changes). Waves out of sight (scrolled away, hidden, or
// far down a list: data-offscreen) keep still.
const waves = new Map<HTMLElement, { pos: number; amp: number; letters: HTMLElement[] | null; seen: boolean }>();
let waveTimer: ReturnType<typeof setInterval> | null = null;
const waveSight =
  typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver((entries) => {
        for (const e of entries) {
          const w = waves.get(e.target as HTMLElement);
          if (w) w.seen = e.isIntersecting;
        }
      });

function waveTick(): void {
  if (document.hidden || document.documentElement.classList.contains('reduced-motion')) return;
  for (const [el, w] of waves) {
    if (!w.seen || el.closest('[data-offscreen]')) continue;
    // The currency's name keeps still (its colours still flow).
    if (!w.letters?.[0]?.isConnected) w.letters = Array.from(el.querySelectorAll<HTMLElement>('.w > span:not(.ttx-still)'));
    // Positions 0..n-1 hop a letter; position n is the quiet beat before starting over.
    w.pos = (w.pos + 1) % (w.letters.length + 1);
    w.letters[w.pos]?.animate(hop(Math.round(w.amp)), { duration: HOP_MS });
  }
}

function useWave(amp: number, on: boolean, text: string) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    waves.set(el, { pos: -1, amp, letters: null, seen: !waveSight });
    waveSight?.observe(el);
    waveTimer ??= setInterval(waveTick, WAVE_STEP_MS);
    return () => {
      waves.delete(el);
      waveSight?.unobserve(el);
      if (!waves.size && waveTimer) {
        clearInterval(waveTimer);
        waveTimer = null;
      }
    };
  }, [amp, on, text]);
  return ref;
}

/** Splits text into words, keeping each word's starting letter index. */
function words(text: string): { text: string; start: number }[] {
  const out: { text: string; start: number }[] = [];
  let i = 0;
  for (const w of text.split(' ')) {
    if (w) out.push({ text: w, start: i });
    i += [...w].length + 1;
  }
  return out;
}

// "TximTxom" in any text: its letters glow in a shifting rainbow and wave.
const TXIMTXOM = /TximTxom/g;

/** Index ranges of every "TximTxom" in `text`. */
function tximtxomRanges(text: string): [number, number][] {
  return [...text.matchAll(TXIMTXOM)].map((m) => [m.index!, m.index! + m[0].length]);
}

/** One letter of "TximTxom": `ti` is its place in the word (the pattern and wave follow it). */
const TxLetter = ({ ch, ti }: { ch: string; ti: number }) => (
  <span class="ttx-l" style={{ '--ti': ti }} data-ch={ch}>
    {ch}
  </span>
);

/** `text` with every "TximTxom" in it glowing and waving. */
export function withTximTxom(text: string): ComponentChildren {
  if (!text.includes('TximTxom')) return text;
  const parts: ComponentChildren[] = [];
  let last = 0;
  for (const [a, b] of tximtxomRanges(text)) {
    if (a > last) parts.push(text.slice(last, a));
    parts.push(
      <span class="ttx">
        {[...text.slice(a, b)].map((ch, i) => (
          <TxLetter ch={ch} ti={i} />
        ))}
      </span>,
    );
    last = b;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/** Rules worth pointing out when prose names them, with the tone of their card
 *  (Peek and Bust at are left out: those words also turn up as plain words). */
/** Every rule's tone, as the Rules window colours it: its name has that colour wherever it's written. */
export const RULE_TONES: [Key, Tone | 'neutral'][] = [
  ['rule.rounds', 'neutral'],
  ['rule.bust', 'neutral'],
  ['rule.softcore', 'support'],
  ['rule.superposition', 'support'],
  ['rule.mobius', 'support'],
  ['rule.smeared', 'support'],
  ['rule.magicSort', 'support'],
  ['rule.rideOrder', 'neutral'],
  ['rule.rides', 'neutral'],
  ['rule.autoRide', 'support'],
  ['rule.sixthSense', 'info'],
  ['rule.notice', 'info'],
  ['rule.penalty10', 'punish'],
  ['rule.doubleDown', 'punish'],
  ['rule.timer', 'neutral'],
  ['rule.scramble', 'funny'],
  ['rule.polydactyly', 'funny'],
  ['rule.twoDecks', 'support'],
];

/** The rarities as words in each language (singular and plural, capitalised or not), for colouring
 *  them in text. Portuguese "única" only capitalised: in lower case it's mostly the plain word. */
const RARITY_WORDS: Record<'en' | 'pt', Partial<Record<Rarity, string[]>>> = {
  en: {
    common: ['common', 'commons'],
    uncommon: ['uncommon', 'uncommons'],
    epic: ['epic', 'epics'],
    legendary: ['legendary', 'legendaries'],
    unique: ['unique'],
    // Lower case only before "achievement": "your secrets are safe" stays plain.
    secret: ['Secret', 'Secrets'],
  },
  pt: {
    common: ['comum', 'comuns'],
    uncommon: ['invulgar', 'invulgares'],
    epic: ['épica', 'épicas'],
    legendary: ['lendária', 'lendárias'],
    unique: ['Única', 'Únicas'],
    secret: ['secreta', 'secretas'],
  },
};
const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
function rarityWords(): Map<string, Rarity> {
  const out = new Map<string, Rarity>();
  for (const [r, ws] of Object.entries(RARITY_WORDS[lang() === 'pt' ? 'pt' : 'en']) as [Rarity, string[]][]) for (const w of ws) for (const v of new Set([w, cap(w)])) out.set(v, r);
  return out;
}
const SECRET_BEFORE = String.raw`secret(?= achievements?)`;

/** A rarity's shape in its colour, so rarities differ by more than colour: common a circle,
 *  uncommon a triangle, epic a square, legendary a rhombus, unique a star, secret a cross,
 *  locked a ring. */
export const RarityMark = ({ rarity, pump }: { rarity: Rarity | 'locked'; pump?: boolean }) => (
  <span class={`rarity-mark rarity-${rarity}${pump ? ' pump' : ''}`} aria-hidden="true" />
);

/** A rarity's name in its colour, with a shine across it and a slow pulse (unique: the rainbow).
 *  `mark`: its shape in front, pulsing with the name. */
export const RarityName = ({ rarity, text, mark }: { rarity: Rarity | 'locked'; text: string; mark?: boolean }) => (
  <span class="nowrap">
    {mark && <RarityMark rarity={rarity} pump />}
    <span class={`rarity-text rarity-${rarity}`}>{text}</span>
  </span>
);

/** An achievement's name with its rarity, for finding achievements named in text. */
export interface AchName {
  rarity: Rarity;
  rainbow?: boolean;
}
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A rule's name in its tone's colour with a shine sweeping across, wherever rules are named. */
export const RuleName = ({ name, tone }: { name: string; tone?: Tone | string }) => <span class={`rule-ref tone-${tone ?? 'neutral'}`}>{name}</span>;

/** A word in TximTxom's glowing rainbow. `still`: the colours flow but the letters don't wave
 *  (the currency's name). */
export const Rainbow = ({ text, still }: { text: string; still?: boolean }) => (
  <span class={still ? 'ttx ttx-still' : 'ttx'}>
    {/* Spaces stay plain text: a letter's box would swallow them. */}
    {[...text].map((ch, i) => (ch === ' ' ? ' ' : <TxLetter ch={ch} ti={i} />))}
  </span>
);

/** An amount of chips in prose ("+30 chips", "10 000 fichas"): the number, its sign and the word. */
const CHIP_AMOUNT = String.raw`[+−-]?\d(?:[\d,. \u00a0\u202f]*\d)?\s(?:chips?|fichas?)(?![\wçã])`;
/** The currency named on its own (not a graphics chip). */
const CHIP_WORD = String.raw`(?<![\wç]|graphics )(?:[Cc]hips?|[Ff]ichas?)(?![\wçã]| gráfico)`;

/** `text` with "TximTxom" glowing and waving, rule names in their colour with a shine across them,
 *  amounts of chips as the chip and the number, and the currency's name in a rainbow. */
/** `achs`, when given (the changelog), also finds achievement names and puts their rarity in front:
 *  "COMMON Curious". */
export function withHighlights(text: string, achs?: Map<string, AchName>): ComponentChildren {
  const tones = new Map(RULE_TONES.map(([k, tone]) => [t(k), tone]));
  const rarities = rarityWords();
  // Rule names and rarities only as whole words; the longest first ("Uncommon" before "Common").
  const names = [...tones.keys(), ...rarities.keys(), ...(achs?.keys() ?? [])].sort((a, b) => b.length - a.length).map(escape).join('|');
  const re = new RegExp(`(${CHIP_AMOUNT})|(${CHIP_WORD})|(?<![\\p{L}\\d])(?:${names}${lang() === 'pt' ? '' : `|${SECRET_BEFORE}`})(?![\\p{L}\\d])|TximTxom`, 'gu');
  const parts: ComponentChildren[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) parts.push(text.slice(last, m.index));
    parts.push(
      m[1] ? (
        <ChipAmount n={m[1].replace(/\s\S+$/, '')} />
      ) : m[2] ? (
        <Rainbow text={m[2]} still />
      ) : achs?.has(m[0]) ? (
        <AchRef name={m[0]} a={achs.get(m[0])!} />
      ) : m[0] === 'TximTxom' ? (
        withTximTxom(m[0])
      ) : rarities.has(m[0]) || m[0] === 'secret' ? (
        <RarityName rarity={rarities.get(m[0]) ?? 'secret'} text={m[0]} mark />
      ) : (
        <span class={`rule-ref tone-${tones.get(m[0])}`}>{m[0]}</span>
      ),
    );
    last = m.index! + m[0].length;
  }
  if (!parts.length) return text;
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/** An achievement named in text: "COMMON Curious", the rarity pulsing before the name. */
const AchRef = ({ name, a }: { name: string; a: AchName }) => (
  <span>
    <RarityName rarity={a.rarity} text={t(`ach.rarity.${a.rarity}`).toUpperCase()} mark />{' '}
    <span class={`rule-ref ach-name-ref rarity-${a.rarity}${a.rainbow ? ' rainbow-text' : ''}`}>{name}</span>
  </span>
);

/** t() for JSX: placeholders can be elements (coloured names, cards, amounts of chips). */
export function tj(key: Key, vars: Record<string, ComponentChildren>): ComponentChildren {
  const raw = t(key, Object.fromEntries(Object.keys(vars).map((k) => [k, `\u0000${k}\u0000`])));
  return raw.split('\u0000').map((part, i) => (i % 2 ? vars[part] : part));
}

/** Text whose letters wobble and hop in turn. Longer text than `max` stays still.
 *  `plain` keeps "TximTxom" in its own colours (the title screen logo). */
export function WaveText({ text, max = WAVE_MAX, amp = 3, plain }: { text: string; max?: number; amp?: number; plain?: boolean }) {
  const on = text.length <= max;
  const ref = useWave(amp, on, text);
  if (!on) return <>{plain ? text : withHighlights(text)}</>;
  // TximTxom and the currency's name in the rainbow.
  const chipWords = plain ? [] : [...text.matchAll(new RegExp(CHIP_WORD, 'g'))].map((m): [number, number] => [m.index!, m.index! + m[0].length]);
  const ranges = plain ? [] : [...tximtxomRanges(text), ...chipWords];
  const inWord = (i: number) => ranges.find(([a, b]) => i >= a && i < b);
  return (
    <span class="wave">
      <span class="sr-only">{text}</span>
      <span aria-hidden="true" ref={ref}>
        {/* Each word's letters stay together, so lines only break between words. */}
        {words(text).map((w, wi) => (
          <>
            {wi > 0 && ' '}
            <span class="w">
              {[...w.text].map((ch, j) => {
                const word = inWord(w.start + j);
                const still = word && chipWords.includes(word);
                return (
                  <span class={still ? 'ttx-still' : undefined} style={{ '--i': w.start + j }}>
                    {word ? <TxLetter ch={ch} ti={w.start + j - word[0]} /> : ch}
                  </span>
                );
              })}
            </span>
          </>
        ))}
      </span>
    </span>
  );
}

export function Button(props: {
  color?: Color;
  onClick?: () => void;
  disabled?: boolean;
  children: ComponentChildren;
  class?: string;
  title?: string;
  kbd?: string;
  big?: boolean;
  type?: 'button' | 'submit';
  label?: string;
}) {
  return (
    <button
      type={props.type ?? 'button'}
      class={`btn btn-${props.color ?? 'blue'}${props.big ? ' btn-big' : ''} ${props.class ?? ''}`}
      disabled={props.disabled}
      title={props.title}
      aria-label={props.label}
      onClick={() => {
        if (props.type !== 'submit') play('button', { volume: 0.7 });
        props.onClick?.();
      }}
    >
      <span class="btn-label">
        {typeof props.children === 'string' ? (
          <Fit text={props.children}>
            <WaveText text={props.children} />
          </Fit>
        ) : (
          props.children
        )}
      </span>
      {props.kbd && (
        <kbd class="kbd" aria-hidden="true">
          {props.kbd}
        </kbd>
      )}
    </button>
  );
}

const SUIT_OF_SYMBOL: Record<string, string> = { '♥': 'h', '♦': 'd', '♣': 'c', '♠': 's' };
const CARD_IN_TEXT = /(10|[2-9AJQK]|Ás)([♥♦♣♠])/g;

/** Text with any card names in it (like "Swap 6♦") shown as suit-coloured chips. */
export function CardText({ text }: { text: string }) {
  const parts: ComponentChildren[] = [];
  let last = 0;
  for (const m of text.matchAll(CARD_IN_TEXT)) {
    if (m.index! > last) parts.push(withHighlights(text.slice(last, m.index)));
    parts.push(<span class={`hcard suit-${SUIT_OF_SYMBOL[m[2]]}`}>{m[0]}</span>);
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push(withHighlights(text.slice(last)));
  return <>{parts}</>;
}

/** A button's label that, when it doesn't fit, says `short` instead ("Show" for
 *  "Show formation") rather than being cut off with an ellipsis. */
export function ShortLabel({ text, short }: { text: string; short?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shortOn, setShortOn] = useState(false);
  const [resized, setResized] = useState(0);
  useEffect(() => {
    const r = () => setResized((n) => n + 1);
    addEventListener('resize', r);
    return () => removeEventListener('resize', r);
  }, []);
  // A new label (or window size) gets another try at the full text.
  useLayoutEffect(() => setShortOn(false), [text, short, resized]);
  useLayoutEffect(() => {
    const box = ref.current?.parentElement;
    if (!shortOn && short && box && box.scrollWidth > box.clientWidth + 1) setShortOn(true);
  });
  return (
    <span ref={ref}>
      <CardText text={shortOn && short ? short : text} />
    </span>
  );
}

const HOLD_MS = 850;

/**
 * A button that only fires after being held down (mouse, touch, or its
 * keyboard key). Used for moves that end a round or the game.
 */
export function HoldButton(props: { color: Color; label: string; short?: string; sub?: string; enabled: boolean; onConfirm: () => void; hotkey?: string; title?: string; class?: string; drop?: string }) {
  const [progress, setProgress] = useState(0);
  const start = useRef<number | null>(null);
  const raf = useRef(0);
  // The callback changes on every redraw; a redraw must not interrupt a hold.
  const confirm = useRef(props.onConfirm);
  confirm.current = props.onConfirm;

  const begin = () => {
    if (!props.enabled || start.current !== null) return;
    start.current = performance.now();
    play('highlight1', { volume: 0.5 });
    const step = () => {
      if (start.current === null) return;
      const p = Math.min(1, (performance.now() - start.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        start.current = null;
        setProgress(0);
        confirm.current();
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  const cancel = () => {
    if (start.current === null) return;
    start.current = null;
    cancelAnimationFrame(raf.current);
    setProgress(0);
  };

  useEffect(() => {
    if (!props.hotkey) return;
    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.key.toUpperCase() !== props.hotkey || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      begin();
    };
    const up = (e: KeyboardEvent) => e.key.toUpperCase() === props.hotkey && cancel();
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    return () => {
      removeEventListener('keydown', down);
      removeEventListener('keyup', up);
    };
  }, [props.hotkey, props.enabled]);

  // Stop a hold if the button gets disabled or goes away.
  useEffect(() => {
    if (!props.enabled) cancel();
  }, [props.enabled]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <button
      type="button"
      class={`btn btn-${props.color} hold ${props.class ?? ''}`}
      data-drop={props.drop}
      disabled={!props.enabled}
      title={props.title}
      aria-label={`${props.label}. ${t('act.hold')}`}
      style={{ '--hold': progress } as Record<string, number>}
      onPointerDown={(e) => {
        e.preventDefault(); // no text selection or long-press menu while holding
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        begin();
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !e.repeat && begin()}
      onKeyUp={(e) => (e.key === 'Enter' || e.key === ' ') && cancel()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span class="hold-fill" aria-hidden="true" />
      <span class="btn-label">
        <span>
          <ShortLabel text={props.label} short={props.short} />
        </span>
        <small class="hold-sub">{props.sub ?? t('act.hold')}</small>
      </span>
      {props.hotkey && (
        <kbd class="kbd" aria-hidden="true">
          {props.hotkey}
        </kbd>
      )}
    </button>
  );
}

/** Rule colour groups: punishing (red), information (blue), support (green); none = neutral grey. */
export type Tone = 'punish' | 'info' | 'support' | 'funny';

export function Toggle(props: {
  label: string;
  desc?: DescText;
  checked: boolean;
  onChange: (v: boolean) => void;
  joker?: string;
  disabled?: boolean;
  tone?: Tone;
  /** Needs another rule that's off (its name here): greyed out and striped under a "Requires …" sign. */
  locked?: string;
  /** The needed rule's tone, for its name on that sign. */
  lockedTone?: Tone;
  /** The `rule` of the toggle it needs: tapping this one while locked makes that one flash. */
  lockedBy?: string;
  /** Names this toggle for a locked one's `lockedBy`. */
  rule?: string;
  /** What it does to the chips a game pays (the rules list shows it on request). */
  pay?: number;
}) {
  const disabled = props.disabled || !!props.locked;
  const nudge = (e: MouseEvent) => {
    if (!props.locked) return;
    const me = e.currentTarget as HTMLElement;
    const need = props.lockedBy ? document.querySelector<HTMLElement>(`[data-rule="${props.lockedBy}"]`) : null;
    for (const [el, cls, ms] of [[me, 'nudge', 400], [need, 'beckon', 1500]] as const) {
      if (!el) continue;
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), ms);
    }
    need?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    play('cancel', { volume: 0.4 });
  };
  return (
    <label class={`toggle${disabled ? ' disabled' : ''}${props.locked ? ' locked' : ''}${props.tone ? ` tone-${props.tone}` : ''}`} data-rule={props.rule} onClick={nudge}>
      {props.locked && (
        <span class="lock-sign">
          <span>
            <UiIcon name="lock" />
            {/* "Requires Superposition": the rule's name shines in its colour, as rule names do. */}
            {t('rule.requires', { rule: '\u0000' })
              .split('\u0000')
              .map((part, i) => (
                <>
                  {i > 0 && <RuleName name={props.locked!} tone={props.lockedTone} />}
                  {part.trim() && <WaveText text={part.trim()} plain />}
                </>
              ))}
          </span>
        </span>
      )}
      {props.joker && <ArtIcon name={props.joker} scale={0.55} rule />}
      {props.pay !== undefined && <PayTag k={props.pay} />}
      <span class="toggle-text">
        <span class="toggle-label">
          <Fit text={props.label}>{props.joker ? <RuleName name={props.label} tone={props.tone} /> : props.label}</Fit>
        </span>
        {props.desc && (
          <span class="toggle-desc">
            <Desc text={props.desc} />
          </span>
        )}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={props.checked}
        disabled={disabled}
        onChange={(e) => {
          play('button', { volume: 0.5, rate: (e.target as HTMLInputElement).checked ? 1.2 : 0.9 });
          props.onChange((e.target as HTMLInputElement).checked);
        }}
      />
      <span class="switch" aria-hidden="true" />
    </label>
  );
}

/** A rule's chip multiplier in the corner of its card: green above ×1, red below, grey at ×1. */
export const PayTag = ({ k }: { k: number }) => (
  <span class={`pay-tag${k > 1 ? ' up' : k < 1 ? ' down' : ''}`}>
    ×{k}
    <ChipIcon size={14} />
  </span>
);

export function Choice<T extends string | number>(props: {
  label: string;
  desc?: DescText;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  joker?: string;
  disabled?: boolean;
  tone?: Tone;
  /** What its current setting does to the chips a game pays. */
  pay?: number;
  /** Greyed out, with this reason as its description (Rounds mode has no bust limit). */
  off?: string;
}) {
  return (
    <div class={`toggle choice${props.off ? ' off' : ''}${props.disabled ? ' disabled' : ''}${props.tone ? ` tone-${props.tone}` : ''}`} role="group" aria-label={props.label}>
      {props.joker && <ArtIcon name={props.joker} scale={0.55} rule />}
      {props.pay !== undefined && <PayTag k={props.pay} />}
      <span class="toggle-text">
        <span class="toggle-label">
          <Fit text={props.label}>{props.joker ? <RuleName name={props.label} tone={props.tone} /> : props.label}</Fit>
        </span>
        {(props.off || props.desc) && (
          <span class="toggle-desc">
            <Desc text={props.off ?? props.desc!} />
          </span>
        )}
      </span>
      <Cycler label={props.label} value={props.value} options={props.options} onChange={props.onChange} disabled={props.disabled || !!props.off} />
    </div>
  );
}

/** Balatro's option cycler: arrows either side of the current option, one dot
 *  per option underneath (tap a dot to jump). Wraps around at both ends. */
export function Cycler<T extends string | number>(props: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  const n = props.options.length;
  const i = Math.max(0, props.options.findIndex((o) => o.value === props.value));
  const go = (to: number, dir = 0) => {
    const next = props.options[(to + n) % n];
    if (props.disabled || next.value === props.value) return;
    play('button', { volume: 0.4, rate: dir < 0 ? 0.9 : dir > 0 ? 1.15 : 1 });
    props.onChange(next.value);
  };
  return (
    <span
      class="cycler"
      role="spinbutton"
      tabIndex={props.disabled ? -1 : 0}
      aria-label={props.label}
      aria-valuetext={props.options[i].label}
      aria-valuenow={i + 1}
      aria-valuemin={1}
      aria-valuemax={n}
      aria-disabled={props.disabled}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          go(i - 1, -1);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          go(i + 1, 1);
        }
      }}
    >
      <button type="button" class="cyc-arrow" tabIndex={-1} aria-hidden="true" disabled={props.disabled} onClick={() => go(i - 1, -1)}>
        <span class="cyc-tri left" />
      </button>
      <span class="cyc-mid">
        {/* Every option sits in the same spot, so the box is as wide as the longest. */}
        <span class="cyc-val">
          {props.options.map((o, k) => (
            <span class={k === i ? 'on' : ''} aria-hidden="true">
              {o.label}
            </span>
          ))}
        </span>
        <span class="cyc-dots">
          {props.options.map((o, k) => (
            <button type="button" class={`cyc-dot${k === i ? ' on' : ''}`} tabIndex={-1} aria-hidden="true" title={o.label} disabled={props.disabled} onClick={() => go(k)} />
          ))}
        </span>
      </span>
      <button type="button" class="cyc-arrow" tabIndex={-1} aria-hidden="true" disabled={props.disabled} onClick={() => go(i + 1, 1)}>
        <span class="cyc-tri right" />
      </button>
    </span>
  );
}

/** Balatro-style slider: a red bar on a dark track with the value written inside. */
export function Slider(props: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string; disabled?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const frac = (props.value - props.min) / (props.max - props.min);
  const text = props.format ? props.format(props.value) : String(props.value);
  const setFrom = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const raw = props.min + f * (props.max - props.min);
    const v = Math.round(raw / props.step) * props.step;
    const clean = Number(v.toFixed(4));
    if (clean !== props.value) props.onChange(clean);
  };
  const nudge = (dir: number) => {
    const v = Math.min(props.max, Math.max(props.min, Number((props.value + dir * props.step).toFixed(4))));
    if (v !== props.value) {
      play('button', { volume: 0.35, rate: 0.9 + 0.4 * frac });
      props.onChange(v);
    }
  };
  return (
    <div class={`toggle bslider${props.disabled ? ' disabled' : ''}`}>
      <span class="toggle-text">
        <span class="toggle-label">
          <Fit text={props.label} />
        </span>
      </span>
      <div
        class="bslider-track"
        ref={track}
        role="slider"
        tabIndex={props.disabled ? -1 : 0}
        aria-disabled={props.disabled}
        aria-label={props.label}
        aria-valuemin={props.min}
        aria-valuemax={props.max}
        aria-valuenow={props.value}
        aria-valuetext={text}
        onPointerDown={(e) => {
          e.preventDefault(); // dragging must not select the text around it
          if (props.disabled) return;
          (e.currentTarget as HTMLElement).focus();
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          setFrom(e.clientX);
        }}
        onPointerMove={(e) => !props.disabled && e.buttons && setFrom(e.clientX)}
        onKeyDown={(e) => {
          if (props.disabled) return;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            nudge(-1);
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            nudge(1);
          }
        }}
      >
        <div class="bslider-fill" style={{ width: `${Math.max(frac, 0.06) * 100}%` }} />
        {/* In the middle of the track, so it never runs past the fill's edge. */}
        <span class="bslider-val">{text}</span>
      </div>
    </div>
  );
}

/** What scrolls under a tab bar: its window's `.tab-scroll`, or else its nearest ancestor
 *  that scrolls vertically. */
function scrollerOf(el: Element | null): HTMLElement | null {
  const own = el?.closest('.modal')?.querySelector<HTMLElement>('.tab-scroll');
  if (own) return own;
  for (let e = el?.parentElement ?? null; e; e = e.parentElement) {
    const y = getComputedStyle(e).overflowY;
    if (y === 'auto' || y === 'scroll') return e;
  }
  return null;
}

/** For a tab bar over one scrolling window: each tab keeps where it was scrolled to, and a tab
 *  opened for the first time starts at the top. `bar` goes on the tab bar; call `leave()` just
 *  before switching tabs. */
export function useTabScroll<T>(active: T) {
  const bar = useRef<HTMLDivElement>(null);
  const scrolls = useRef(new Map<T, number>());
  const shown = useRef(active);
  useLayoutEffect(() => {
    if (shown.current === active) return;
    shown.current = active;
    const sc = scrollerOf(bar.current);
    if (sc) sc.scrollTop = scrolls.current.get(active) ?? 0;
  }, [active]);
  // Taken as the press starts: focusing a tab scrolled partly out of view scrolls the window
  // back to it before the click.
  const atPress = useRef<number | null>(null);
  const press = () => {
    atPress.current = scrollerOf(bar.current)?.scrollTop ?? null;
  };
  const leave = () => {
    const sc = scrollerOf(bar.current);
    const y = atPress.current ?? sc?.scrollTop;
    atPress.current = null;
    if (y !== undefined) scrolls.current.set(shown.current, y);
  };
  return { bar, leave, press };
}

export function Tabs<T extends string>(props: { tabs: { id: T; label: string }[]; active: T; onChange: (id: T) => void }) {
  const { bar, leave, press } = useTabScroll(props.active);
  return (
    <div class="tabs" role="tablist" ref={bar} onPointerDownCapture={press}>
      {props.tabs.map((tb) => (
        <button
          type="button"
          role="tab"
          aria-selected={tb.id === props.active}
          class={`tab${tb.id === props.active ? ' on' : ''}`}
          onClick={() => {
            play('button', { volume: 0.5 });
            if (tb.id !== props.active) leave();
            props.onChange(tb.id);
          }}
        >
          <Fit text={tb.label}>
            <WaveText text={tb.label} />
          </Fit>
        </button>
      ))}
    </div>
  );
}

/** A speech balloon over everything, its arrow pointing at `at` (the box of what was
 *  tapped): above it when there's room, else below. Any tap, scroll or resize closes it,
 *  except taps on `keep` (a selector: the things that open it handle their own taps). */
export function HintBalloon({ at, onClose, keep, children }: { at: DOMRect; onClose: () => void; keep?: string; children: ComponentChildren }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; arrow: number; below: boolean } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width: w, height: h } = el.getBoundingClientRect();
    const gap = 12;
    const cx = at.left + at.width / 2;
    const left = Math.max(8, Math.min(innerWidth - w - 8, cx - w / 2));
    const below = at.top - h - gap < 8;
    setPos({ left, top: below ? at.bottom + gap : at.top - h - gap, arrow: cx - left, below });
  }, [at]);
  useEffect(() => {
    // Next tick: the tap that opened it mustn't close it.
    const onDown = (e: PointerEvent) => {
      if (!keep || !(e.target as Element | null)?.closest?.(keep)) onClose();
    };
    const id = setTimeout(() => {
      addEventListener('pointerdown', onDown);
      addEventListener('resize', onClose, { once: true });
      addEventListener('scroll', onClose, { once: true, capture: true });
    });
    return () => {
      clearTimeout(id);
      removeEventListener('pointerdown', onDown);
      removeEventListener('resize', onClose);
      removeEventListener('scroll', onClose, { capture: true });
    };
  }, [onClose, keep]);
  return createPortal(
    <div
      ref={ref}
      class={`hint-balloon${pos?.below ? ' below' : ''}`}
      role="status"
      style={pos ? { left: `${pos.left}px`, top: `${pos.top}px`, '--arrow': `${pos.arrow}px` } : { visibility: 'hidden' }}
    >
      {children}
    </div>,
    document.getElementById('app') ?? document.body,
  );
}

/** An empty marker that calls `onSeen` once it scrolls into view. */
export function Seen({ onSeen }: { onSeen: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && onSeen());
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} class="seen-marker" aria-hidden="true" />;
}

/** Balatro-style panel in a dimmed overlay. Esc / backdrop closes it. */
export function Modal(props: { title: string; onClose?: () => void; children: ComponentChildren; wide?: boolean; footer?: ComponentChildren; class?: string; corner?: ComponentChildren }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    // Focus goes back to what opened it on close, with its ring only if it had one (reached by
    // keyboard): a clicked button mustn't stay outlined.
    const ring = !!prev?.matches?.(':focus-visible');
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && props.onClose) {
        e.stopPropagation();
        e.preventDefault(); // already handled: the in-game Esc must not reopen Settings
        props.onClose();
      }
    };
    addEventListener('keydown', onKey, true);
    return () => {
      removeEventListener('keydown', onKey, true);
      prev?.focus?.({ focusVisible: ring } as FocusOptions);
    };
  }, []);
  return (
    <div class="modal-backdrop" onClick={(e) => props.onClose && e.target === e.currentTarget && props.onClose()}>
      <div class={`panel modal${props.wide ? ' wide' : ''} ${props.class ?? ''}`} role="dialog" aria-modal="true" aria-label={props.title} tabIndex={-1} ref={ref}>
        <div class="modal-head">
          <h2>
            <WaveText text={props.title} max={28} />
          </h2>
          {props.corner && <div class="modal-corner">{props.corner}</div>}
        </div>
        <div class="modal-body">{props.children}</div>
        <div class="modal-foot">
          {props.footer}
          {props.onClose && (
            <Button color="orange" onClick={props.onClose} kbd="Esc">
              {t('back')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** A white Kenney Game Icon, drawn in the text colour of its button. */
export type UiIconName = 'help' | 'settings' | 'leave' | 'history' | 'credits' | 'crGame' | 'crArt' | 'crInspiration' | 'crLibraries' | 'crServices' | 'crTesters' | 'lock' | 'unlocked' | 'grid';

export function UiIcon({ name }: { name: UiIconName }) {
  return <span class="ui-icon" style={{ '--icon': `url(${assetUrl(`ui/${name}.png`)})` }} aria-hidden="true" />;
}

/** A small button the size of the Rules button, for the menus along the top. */
export function MiniButton(props: {
  color?: 'grey' | 'red' | 'blue' | 'purple' | 'orange' | 'green' | 'leave';
  onClick: () => void;
  children: ComponentChildren;
  kbd?: string;
  /** Names an icon-only button, and shows as its hint. */
  label?: string;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      class={`mini-btn mini-${props.color ?? 'grey'}${props.pressed ? ' pressed' : ''}`}
      title={props.label}
      aria-label={props.label}
      aria-pressed={props.pressed}
      onClick={() => {
        play('button', { volume: 0.7 });
        props.onClick();
      }}
    >
      {typeof props.children === 'string' ? <Fit text={props.children} /> : props.children}
      {props.kbd && (
        <kbd class="kbd" aria-hidden="true">
          {props.kbd}
        </kbd>
      )}
    </button>
  );
}

/** Shows `children` (default: `text`) in the space its longest translation needs. */
export function Fit({ text, children, block }: { text: string; children?: ComponentChildren; block?: boolean }) {
  const others = otherTexts(text);
  if (!others.length) return <>{children ?? withHighlights(text)}</>;
  // `block`: a wrapping line of text, kept as tall as its longest translation.
  return (
    <span class={`fixed-label${block ? ' block' : ''}`}>
      <span>{children ?? withHighlights(text)}</span>
      {others.map((s) => (
        <span class="ghost" aria-hidden="true">
          {s}
        </span>
      ))}
    </span>
  );
}

/** A description, or [the one showing, ...the others it can switch to] (all in the same space). */
export type DescText = string | string[];

/**
 * A setting's description. One that changes with the setting ("Cards stay
 * where you put them" / "Your hand sorts itself") keeps the height of its
 * longest version, so switching moves nothing below it.
 */
export function Desc({ text }: { text: DescText }) {
  const [shown, ...others] = Array.isArray(text) ? text : [text];
  if (!others.length) return <Fit text={shown} block />;
  return (
    <span class="fixed-label block">
      <span>
        <Fit text={shown} block />
      </span>
      {others.map((s) => (
        <span class="ghost" aria-hidden="true">
          <Fit text={s} block />
        </span>
      ))}
    </span>
  );
}

/**
 * A label as wide as its longest translation: every language sits in the same
 * spot, only the current one shows. Switching languages then moves nothing.
 */
export function Label({ k, vars }: { k: Key; vars?: Record<string, string | number> }) {
  const [shown, ...others] = tEvery(k, vars);
  return (
    <span class="fixed-label">
      <span>{shown}</span>
      {others.map((s) => (
        <span class="ghost" aria-hidden="true">
          {s}
        </span>
      ))}
    </span>
  );
}

/** Top-right corner of the title screen and the room: Settings. */
/** Settings in the screen's top corner; `children` go before it (the lobby's How to play and Formations). */
/** A casino chip: the icon of the game's currency. */
/** The chip, seen from the side (68 × 42), `size` wide. Not draggable, and clicks go through it. */
/** One turn of the chip; every chip on screen turns in step (styles.css: chip-spin). */
const CHIP_SPIN_MS = 3200;
/** One trip through the rainbow, with three pulses of the glow (styles.css: chip-glow). */
const CHIP_GLOW_MS = 6000;
/** The chip's layers front to back: a face, three of edge, a face. */
const CHIP_LAYERS = [2, 1, 0, -1, -2];

/** The currency: a chip turning in 3D, its colours shifting through the rainbow, in a pulsing gold glow.
 *  `size` in px; without it the chip is as tall as the text around it. */
export const ChipIcon = ({ size }: { size?: number }) => {
  const face = { backgroundImage: `url(${assetUrl('ui/chip-face.png')})` };
  // Set once: started that far into the cycle, it turns in step with the others.
  const [t0] = useState(() => performance.now());
  return (
    <span class="chip-icon" style={{ '--cs': size ? `${size}px` : undefined, animationDelay: `${-(t0 % CHIP_GLOW_MS)}ms` }} aria-hidden="true">
      <span class="chip-spin" style={{ animationDelay: `${-(t0 % CHIP_SPIN_MS)}ms` }}>
        {CHIP_LAYERS.map((z) => (
          <i class={Math.abs(z) === 2 ? 'chip-face' : 'chip-edge'} style={{ '--z': z, ...(Math.abs(z) === 2 ? face : {}) }} />
        ))}
        {/* The rim seen side on: the layers are flat, so edge-on they'd vanish without it. */}
        <i class="chip-side" />
      </span>
    </span>
  );
};

/** An amount of chips: the chip, then the number ("+30"). */
export const ChipAmount = ({ n, sign, size }: { n: number | string; sign?: boolean; size?: number }) => (
  <span class="chip-amt">
    {typeof n === 'number' ? `${sign && n > 0 ? '+' : ''}${formatCount(n)}` : n}
    <ChipIcon size={size} />
  </span>
);

/** Your chips: the balance on a dark pill, with the chip in front. */
export function ChipCount({ class: cls }: { class?: string }) {
  const c = useChips();
  return (
    <span class={`chip-count${cls ? ` ${cls}` : ''}`} role="status" aria-label={t('chips.balance', { n: formatCount(c.balance) })} title={t('chips.title')}>
      <b>{formatCount(c.balance)}</b>
      <ChipIcon />
    </span>
  );
}

export function TopMenu({ children }: { children?: ComponentChildren }) {
  useSettings(); // redraw on a language change
  return (
    <div class="top-menu">
      {children}
      <MiniButton color="orange" onClick={() => store.set({ overlay: 'settings' })} label={t('title.settings')}>
        <UiIcon name="settings" />
        <span class="mini-text">
          <Label k="title.settings" />
        </span>
      </MiniButton>
    </div>
  );
}

/** "TximTxom v0.12.0 · github.com/badjuice" */
/** `onNameTap`: taps on the name and version (the title screen counts them). */
export function Credits({ onNameTap }: { onNameTap?: () => void }) {
  return (
    <p class="credits">
      <span class="credits-name" onClick={onNameTap}>
        {withTximTxom('TximTxom')} v{VERSION}
      </span>{' '}
      ·{' '}
      <a href={AUTHOR_URL} target="_blank" rel="noopener">
        github.com/badjuice
      </a>
    </p>
  );
}

/** Text with colour tags: {r}red{/r} {g}green{/g} {b}blue{/b} {o}orange{/o}. */
export function Rich({ text }: { text: string }) {
  const parts: ComponentChildren[] = [];
  const re = /\{(r|g|b|o)\}(.*?)\{\/\1\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(withHighlights(text.slice(last, m.index)));
    // The coloured keywords wave, like Balatro's highlighted words.
    parts.push(
      <b class={`hl hl-${m[1]}`}>
        <WaveText text={m[2]} max={80} />
      </b>,
    );
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(withHighlights(text.slice(last)));
  return <>{parts}</>;
}

/** Two sheets, the front one solid: drawn on the same pixel grid as the game's icons. */
export const CopyIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} shape-rendering="crispEdges" aria-hidden="true">
    <path d="M5 1h10v10h-3V9h1V3H7v1H5z" fill="currentColor" opacity="0.7" />
    <path d="M1 5h10v10H1z" fill="currentColor" />
  </svg>
);

/** A number that rolls into place digit by digit, like an odometer; from all zeros, so its width never changes. */
export function Odometer({ n, ms = 1400 }: { n: number; ms?: number }) {
  const s = useSettings();
  const text = formatCount(n);
  const [on, setOn] = useState(s.reducedMotion);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  let digit = 0;
  const digits = [...text].filter((ch) => /\d/.test(ch)).length;
  return (
    <span class="odometer" role="img" aria-label={text}>
      {[...text].map((ch) => {
        if (!/\d/.test(ch)) return <span aria-hidden="true">{ch}</span>;
        // The last digit rolls longest and furthest, as on a real counter.
        const i = digit++;
        const d = Number(ch) + 10 * (digits - 1 - i === 0 ? 2 : 1);
        return (
          <span class="odo-digit" aria-hidden="true">
            <span class="odo-strip" style={{ translate: `0 ${on ? -d : 0}em`, transitionDuration: `${ms * (0.6 + (0.4 * (i + 1)) / digits)}ms` }}>
              {Array.from({ length: 30 }, (_, k) => (
                <span>{k % 10}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
