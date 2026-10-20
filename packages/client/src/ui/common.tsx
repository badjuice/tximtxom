import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { play } from '../audio';
import { t } from '../i18n';
import { updateSettings, useSettings } from '../settings';
import { store } from '../store';
import { AUTHOR_URL, VERSION } from '../version';
import { ArtIcon } from './sprites';

type Color = 'red' | 'blue' | 'orange' | 'green' | 'grey' | 'purple';

/** Short labels move like Balatro's: every letter wobbles a little, and one
 *  at a time they hop, start to end, then one quiet beat and again. */
const WAVE_MAX = 18;
const HOP_MS = 300;
// A letter lands and rests this long before the next one hops.
const HOP_GAP_MS = 90;
const WAVE_STEP_MS = HOP_MS + HOP_GAP_MS;

// One clock drives every wave on screen; each wave keeps its own position.
const waves = new Map<HTMLElement, { pos: number; amp: number }>();
let waveTimer: ReturnType<typeof setInterval> | null = null;

function waveTick(): void {
  if (document.hidden || document.documentElement.classList.contains('reduced-motion')) return;
  for (const [el, w] of waves) {
    const letters = el.querySelectorAll('.w > span');
    // Positions 0..n-1 hop a letter; position n is the quiet beat before starting over.
    w.pos = (w.pos + 1) % (letters.length + 1);
    const letter = letters[w.pos] as HTMLElement | undefined;
    letter?.animate([{ translate: '0 0', easing: 'ease-out' }, { translate: `0 -${w.amp}px`, easing: 'ease-in' }, { translate: '0 0' }], { duration: HOP_MS });
  }
}

function useWave(amp: number, on: boolean) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    waves.set(el, { pos: -1, amp });
    waveTimer ??= setInterval(waveTick, WAVE_STEP_MS);
    return () => {
      waves.delete(el);
      if (!waves.size && waveTimer) {
        clearInterval(waveTimer);
        waveTimer = null;
      }
    };
  }, [amp, on]);
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

/** Text whose letters wobble and hop in turn. Longer text than `max` stays still. */
export function WaveText({ text, max = WAVE_MAX, amp = 3 }: { text: string; max?: number; amp?: number }) {
  const on = text.length <= max;
  const ref = useWave(amp, on);
  if (!on) return <>{text}</>;
  return (
    <span class="wave">
      <span class="sr-only">{text}</span>
      <span aria-hidden="true" ref={ref}>
        {/* Each word's letters stay together, so lines only break between words. */}
        {words(text).map((w, wi) => (
          <>
            {wi > 0 && ' '}
            <span class="w">
              {[...w.text].map((ch, j) => (
                <span style={{ '--i': w.start + j }}>{ch}</span>
              ))}
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
      <span class="btn-label">{typeof props.children === 'string' ? <WaveText text={props.children} /> : props.children}</span>
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
    if (m.index! > last) parts.push(text.slice(last, m.index));
    parts.push(<span class={`hcard suit-${SUIT_OF_SYMBOL[m[2]]}`}>{m[0]}</span>);
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const HOLD_MS = 850;

/**
 * A button that only fires after being held down (mouse, touch, or its
 * keyboard key). Used for moves that end a round or the game.
 */
export function HoldButton(props: { color: Color; label: string; sub?: string; enabled: boolean; onConfirm: () => void; hotkey?: string; title?: string; class?: string }) {
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
          <CardText text={props.label} />
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
export type Tone = 'punish' | 'info' | 'support';

export function Toggle(props: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; joker?: string; disabled?: boolean; tone?: Tone }) {
  return (
    <label class={`toggle${props.disabled ? ' disabled' : ''}${props.tone ? ` tone-${props.tone}` : ''}`}>
      {props.joker && <ArtIcon name={props.joker} scale={0.55} />}
      <span class="toggle-text">
        <span class="toggle-label">{props.joker ? <WaveText text={props.label} max={28} /> : props.label}</span>
        {props.desc && <span class="toggle-desc">{props.desc}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(e) => {
          play('button', { volume: 0.5, rate: (e.target as HTMLInputElement).checked ? 1.2 : 0.9 });
          props.onChange((e.target as HTMLInputElement).checked);
        }}
      />
      <span class="switch" aria-hidden="true" />
    </label>
  );
}

export function Choice<T extends string | number>(props: {
  label: string;
  desc?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  joker?: string;
  disabled?: boolean;
  tone?: Tone;
}) {
  return (
    <div class={`toggle choice${props.disabled ? ' disabled' : ''}${props.tone ? ` tone-${props.tone}` : ''}`} role="group" aria-label={props.label}>
      {props.joker && <ArtIcon name={props.joker} scale={0.55} />}
      <span class="toggle-text">
        <span class="toggle-label">{props.joker ? <WaveText text={props.label} max={28} /> : props.label}</span>
        {props.desc && <span class="toggle-desc">{props.desc}</span>}
      </span>
      <span class="seg">
        {props.options.map((o) => (
          <button
            type="button"
            class={o.value === props.value ? 'on' : ''}
            aria-pressed={o.value === props.value}
            disabled={props.disabled}
            onClick={() => {
              play('button', { volume: 0.5 });
              props.onChange(o.value);
            }}
          >
            {o.label}
          </button>
        ))}
      </span>
    </div>
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
        <span class="toggle-label">{props.label}</span>
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

export function Tabs<T extends string>(props: { tabs: { id: T; label: string }[]; active: T; onChange: (id: T) => void }) {
  return (
    <div class="tabs" role="tablist">
      {props.tabs.map((tb) => (
        <button
          type="button"
          role="tab"
          aria-selected={tb.id === props.active}
          class={`tab${tb.id === props.active ? ' on' : ''}`}
          onClick={() => {
            play('button', { volume: 0.5 });
            props.onChange(tb.id);
          }}
        >
          <WaveText text={tb.label} />
        </button>
      ))}
    </div>
  );
}

/** Balatro-style panel in a dimmed overlay. Esc / backdrop closes it. */
export function Modal(props: { title: string; onClose?: () => void; children: ComponentChildren; wide?: boolean; footer?: ComponentChildren; class?: string; corner?: ComponentChildren }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
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
      prev?.focus?.();
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
export function UiIcon({ name }: { name: 'help' | 'settings' | 'leave' }) {
  return <span class="ui-icon" style={{ '--icon': `url(${import.meta.env.BASE_URL}assets/ui/${name}.png)` }} aria-hidden="true" />;
}

/** A small button the size of the Rules button, for the menus along the top. */
export function MiniButton(props: {
  color?: 'grey' | 'red' | 'blue' | 'purple' | 'orange' | 'leave';
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
      {props.children}
      {props.kbd && (
        <kbd class="kbd" aria-hidden="true">
          {props.kbd}
        </kbd>
      )}
    </button>
  );
}

/** Top-right corner of the title screen and the room: language and Settings. */
export function TopMenu() {
  const { lang } = useSettings();
  return (
    <div class="top-menu">
      <div class="lang-switch" role="group" aria-label={t('language')}>
        {(['pt', 'en'] as const).map((l) => (
          <button class={lang === l ? 'on' : ''} aria-pressed={lang === l} onClick={() => updateSettings({ lang: l })}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <MiniButton color="orange" onClick={() => store.set({ overlay: 'settings' })} label={t('title.settings')}>
        <UiIcon name="settings" />
      </MiniButton>
    </div>
  );
}

/** "TximTxom v0.12.0 · github.com/badjuice" */
export function Credits() {
  return (
    <p class="credits">
      TximTxom v{VERSION} ·{' '}
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
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<b class={`hl hl-${m[1]}`}>{m[2]}</b>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
