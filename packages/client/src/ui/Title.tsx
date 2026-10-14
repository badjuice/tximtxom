import { useState } from 'preact/hooks';
import { NAME_MAX, ROOM_CODE_LENGTH } from '@tximtxom/shared';
import { unlockAudio } from '../audio';
import { createRoom, joinRoom, linkedRoom, savedName } from '../net';
import { store, useStore } from '../store';
import { Button } from './common';
import { JokerIcon } from './sprites';

export function Title() {
  const connected = useStore((s) => s.connected);
  const [name, setName] = useState(savedName());
  const [code, setCode] = useState(linkedRoom());
  const [busy, setBusy] = useState(false);
  const cleanName = name.trim() || 'Player';

  const go = async (fn: () => Promise<unknown>) => {
    unlockAudio();
    setBusy(true);
    await fn();
    setBusy(false);
  };

  return (
    <main class="title-screen">
      <h1 class="logo" aria-label="TximTxom">
        {'TximTxom'.split('').map((ch, i) => (
          <span style={{ animationDelay: `${i * 0.12}s` }}>{ch}</span>
        ))}
      </h1>
      <div class="logo-jokers" aria-hidden="true">
        <JokerIcon name="superposition" scale={0.9} />
        <JokerIcon name="joker" scale={1.1} />
        <JokerIcon name="ride_the_bus" scale={0.9} />
      </div>

      <form
        class="panel title-panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === ROOM_CODE_LENGTH) void go(() => joinRoom(code, cleanName));
        }}
      >
        <label class="field">
          <span>Your name</span>
          <input
            value={name}
            maxLength={NAME_MAX}
            autoComplete="nickname"
            placeholder="Player"
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
          />
        </label>

        <Button color="blue" big disabled={!connected || busy} onClick={() => void go(() => createRoom(cleanName))}>
          Create room
        </Button>

        <div class="or">or join a friend</div>

        <div class="join-row">
          <label class="field code-field">
            <span>Room code</span>
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
            Join
          </Button>
        </div>
        {!connected && <p class="muted" role="status">Connecting to the server…</p>}
      </form>

      <div class="title-links">
        <Button color="grey" onClick={() => store.set({ overlay: 'help' })}>
          How to play
        </Button>
        <Button color="grey" onClick={() => store.set({ overlay: 'settings' })}>
          Settings
        </Button>
      </div>
    </main>
  );
}
