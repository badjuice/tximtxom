import { useRef, useState } from 'preact/hooks';
import { makeCard, NAME_MAX, ROOM_CODE_LENGTH, type Suit } from '@tximtxom/shared';
import { play, unlockAudio } from '../audio';
import { t } from '../i18n';
import { updateSettings, useSettings } from '../settings';
import { createRoom, joinRoom, linkedRoom, saveName, savedName } from '../net';
import { store, useStore } from '../store';
import { Button, Credits, WaveText } from './common';
import { CardIcon } from './sprites';

// Four Aces fanned like a hand, red and black alternating: spades, hearts, clubs, diamonds.
const FAN: Suit[] = [3, 0, 1, 2];
const FAN_ANGLE = [-12, -4, 4, 12];
const FAN_DROP = [9, 1, 1, 9];

/** A title-screen Ace you can pick up: it stands upright while held and springs
 *  back into the fan when let go. A tap makes it hop. */
function FanCard({ suit, i }: { suit: Suit; i: number }) {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [hops, setHops] = useState(0);
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const style: Record<string, string> = { '--a': `${FAN_ANGLE[i]}deg`, '--y': `${FAN_DROP[i]}px` };
  if (drag) Object.assign(style, { translate: `${drag.x}px ${drag.y + FAN_DROP[i]}px`, rotate: '0deg', scale: '1.1', zIndex: '5' });
  return (
    <span
      class={`fan-card${drag ? ' held' : ''}`}
      style={style}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, y: e.clientY, moved: false };
        unlockAudio();
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (!s) return;
        const x = e.clientX - s.x;
        const y = e.clientY - s.y;
        if (!s.moved && Math.hypot(x, y) < 5) return;
        if (!s.moved) play('cardSlide1', { volume: 0.5 });
        s.moved = true;
        setDrag({ x, y });
      }}
      onPointerUp={() => {
        const s = start.current;
        start.current = null;
        if (s?.moved) {
          play('cardSlide2', { volume: 0.4 });
          setDrag(null);
        } else {
          play('card1', { volume: 0.5, rate: 0.9 + i * 0.08 });
          setHops((n) => n + 1);
        }
      }}
      onPointerCancel={() => {
        start.current = null;
        setDrag(null);
      }}
    >
      {/* Keyed so each tap restarts the hop. */}
      <span class={hops ? 'fan-hop' : ''} key={hops}>
        <CardIcon card={makeCard(1, suit)} scale={1} />
      </span>
    </span>
  );
}

export function Title() {
  const connected = useStore((s) => s.connected);
  const { lang } = useSettings();
  const [name, setName] = useState(savedName());
  const [code, setCode] = useState(linkedRoom());
  const [busy, setBusy] = useState(false);
  const cleanName = name.trim() || t('title.namePlaceholder');

  const go = async (fn: () => Promise<unknown>) => {
    unlockAudio();
    setBusy(true);
    await fn();
    setBusy(false);
  };

  return (
    <main class="title-screen">
      <div class="lang-switch" role="group" aria-label={t('language')}>
        {(['pt', 'en'] as const).map((l) => (
          <button class={lang === l ? 'on' : ''} aria-pressed={lang === l} onClick={() => updateSettings({ lang: l })}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <h1 class="logo">
        <WaveText text="TximTxom" amp={12} />
      </h1>
      <div class="logo-fan" aria-hidden="true">
        {FAN.map((suit, i) => (
          <FanCard suit={suit} i={i} />
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
        <Button color="grey" onClick={() => store.set({ overlay: 'settings' })}>
          {t('title.settings')}
        </Button>
        <Button color="purple" onClick={() => store.set({ overlay: 'changelog' })}>
          {t('title.changelog')}
        </Button>
      </div>
      <Credits />
    </main>
  );
}
