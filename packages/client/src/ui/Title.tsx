import { useState } from 'preact/hooks';
import { makeCard, NAME_MAX, ROOM_CODE_LENGTH, type Suit } from '@tximtxom/shared';
import { unlockAudio } from '../audio';
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
          <span style={{ '--a': `${FAN_ANGLE[i]}deg`, '--y': `${FAN_DROP[i]}px` }}>
            <CardIcon card={makeCard(1, suit)} scale={1} />
          </span>
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
