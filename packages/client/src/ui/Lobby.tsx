import { useEffect, useState } from 'preact/hooks';
import { DEFAULT_RULES, MAX_PLAYERS, MIN_PLAYERS, NAME_MAX, type Rules } from '@tximtxom/shared';
import { play } from '../audio';
import { t } from '../i18n';
import { addBot, cycleAvatar, kick, leaveRoom, renamePlayer, setRules, startGame } from '../net';
import { store, useStore } from '../store';
import { Button, WaveText } from './common';
import { SEAT_COLORS } from './Hud';
import { RulesForm } from './RulesForm';
import { Icon, ArtIcon, Wins } from './sprites';

const PencilIcon = () => (
  <svg viewBox="0 0 16 16" width="18" height="18" shape-rendering="crispEdges" aria-hidden="true">
    <polygon points="3,11 10,4 12,6 5,13" fill="#eac058" />
    <polygon points="10,4 11,3 13,5 12,6" fill="#fe5f55" />
    <polygon points="3,11 5,13 2,14" fill="#e6e6e6" />
  </svg>
);

const RemoveIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" />
  </svg>
);

/** Adds bots one at a time until the room is full. */
async function fillWithBots(missing: number) {
  for (let i = 0; i < missing; i++) await addBot();
}

async function removeBots(ids: string[]) {
  for (const id of ids) await kick(id);
}

/** True when every rule is at its default (the reset button has nothing to do). */
const isDefault = (r: Rules) => (Object.keys(DEFAULT_RULES) as (keyof Rules)[]).every((k) => r[k] === DEFAULT_RULES[k]);

/** Focuses the rename box once, when it appears (not on every re-render). */
const focusOnMount = (el: HTMLInputElement | null) => {
  el?.focus();
  el?.setSelectionRange(el.value.length, el.value.length);
};

export function Lobby() {
  const room = useStore((s) => s.room)!;
  const isHost = room.hostId === room.youId;
  const bots = room.players.filter((p) => p.isBot);
  const link = `${location.origin}${location.pathname}?room=${room.code}`;
  const [editing, setEditing] = useState<string | null>(null);
  // "Link copied" shows inside the code box for a moment (a counter restarts the animation).
  const [copied, setCopied] = useState(0);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(0), 1600);
    return () => clearTimeout(id);
  }, [copied]);

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'TximTxom', text: t('lobby.invite', { code: room.code }), url: link });
      else {
        await navigator.clipboard.writeText(link);
        play('highlight1', { volume: 0.6 });
        setCopied((n) => n + 1);
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <main class="lobby">
      <section class="panel lobby-room">
        <h2>
          <WaveText text={t('lobby.room')} />
        </h2>
        <button class={`room-code${copied ? ' copied' : ''}`} onClick={share} aria-label={`${t('title.code')} ${room.code.split('').join(' ')}`}>
          <span class="code-text">{room.code}</span>
          {copied > 0 && (
            <span class="copied-msg" key={copied} role="status">
              {[...t('lobby.linkCopied')].map((ch, i, all) => (
                <span style={{ '--pop': `${(0.17 * i) / all.length}s` }}>{ch === ' ' ? '\u00a0' : ch}</span>
              ))}
            </span>
          )}
        </button>
        <p class="muted">{t('lobby.share')}</p>

        <h3>{t('lobby.players', { n: room.players.length, max: MAX_PLAYERS })}</h3>
        {/* Above the list and always the same size, so nothing below it moves.
            The second button fills the room, or empties it of bots once there are some. */}
        {isHost && (
          <div class="bot-row">
            <Button color="grey" disabled={room.players.length >= MAX_PLAYERS} onClick={() => void addBot()}>
              {t('lobby.addBot')}
            </Button>
            {bots.length ? (
              <Button color="grey" onClick={() => void removeBots(bots.map((b) => b.id))}>
                {t('lobby.removeBots')}
              </Button>
            ) : (
              <Button color="grey" disabled={room.players.length >= MAX_PLAYERS} onClick={() => void fillWithBots(MAX_PLAYERS - room.players.length)}>
                {t('lobby.fillBots')}
              </Button>
            )}
          </div>
        )}
        <ul class="player-list">
          {room.players.map((p, i) => {
            const mine = p.id === room.youId;
            // You can change your own name and Joker; the host also changes the bots'.
            const editable = mine || (isHost && p.isBot);
            return (
            <li class={p.connected ? '' : 'offline'} style={{ '--seat': SEAT_COLORS[i] }}>
              {editable ? (
                <button class="art-btn" title={t('lobby.cycleArt')} aria-label={t('lobby.cycleArtFor', { name: p.name })} onClick={() => void cycleAvatar(p.id)}>
                  <ArtIcon name={p.avatar || 'villager'} scale={0.42} />
                </button>
              ) : (
                <ArtIcon name={p.avatar || 'villager'} scale={0.42} />
              )}
              {editing === p.id ? (
                <input
                  class="rename"
                  maxLength={NAME_MAX}
                  // Uncontrolled: room updates while typing must not reset the text.
                  defaultValue={p.name}
                  aria-label={t('lobby.renameBot', { name: p.name })}
                  ref={focusOnMount}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') setEditing(null);
                  }}
                  onBlur={(e) => {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v && v !== p.name) void renamePlayer(p.id, v);
                    setEditing(null);
                  }}
                />
              ) : (
                <span class="pname">
                  {p.name}
                  {p.id === room.youId && ` (${t('you').toLowerCase()})`}
                  <Wins n={p.wins} />
                </span>
              )}
              {/* Fixed slots (tag, rename, remove) keep every row's icons in the same columns. */}
              <span class="slot">
                {p.id === room.hostId && <Icon name="host" scale={0.7} title={t('lobby.hostTitle')} />}
                {p.isBot && <Icon name="bot" scale={0.7} title={t('lobby.botTitle')} />}
              </span>
              <span class="slot">
                {editable && editing !== p.id && (
                  <button class="icon-btn" aria-label={t('lobby.renameBot', { name: p.name })} title={t('lobby.rename')} onClick={() => setEditing(p.id)}>
                    <PencilIcon />
                  </button>
                )}
              </span>
              <span class="slot">
                {isHost && p.id !== room.youId && (
                  <button class="x" aria-label={t('lobby.remove', { name: p.name })} title={t('lobby.remove', { name: p.name })} onClick={() => void kick(p.id)}>
                    <RemoveIcon />
                  </button>
                )}
              </span>
            </li>
            );
          })}
          {/* Free seats hold their place, so joining or adding bots doesn't push the buttons down. */}
          {Array.from({ length: MAX_PLAYERS - room.players.length }, () => (
            <li class="empty-seat">{t('lobby.emptySeat')}</li>
          ))}
        </ul>
        <div class="lobby-actions">
          <Button color="orange" onClick={leaveRoom}>
            {t('lobby.leave')}
          </Button>
          {isHost ? (
            <Button color="blue" big disabled={room.players.length < MIN_PLAYERS} onClick={() => void startGame()}>
              {t('lobby.start')}
            </Button>
          ) : (
            <p class="muted" role="status">
              {t('lobby.waitHost')}
            </p>
          )}
        </div>
        {isHost && (
          <p class="muted" style={{ visibility: room.players.length < MIN_PLAYERS ? 'visible' : 'hidden' }}>
            {t('lobby.needPlayers', { n: MIN_PLAYERS })}
          </p>
        )}
      </section>

      <div class="lobby-side">
        <section class="panel lobby-rules">
          <h2>
            <WaveText text={isHost ? t('lobby.rules') : t('lobby.rulesByHost')} max={28} />
          </h2>
          <RulesForm rules={room.rules} readOnly={!isHost} onChange={(r) => void setRules(r)} />
          {isHost && (
            <div class="rules-reset">
              <Button color="grey" disabled={isDefault(room.rules)} onClick={() => void setRules(DEFAULT_RULES)}>
                {t('lobby.resetRules')}
              </Button>
            </div>
          )}
        </section>
        {/* The same menus as the title screen, plus the formations reference. */}
        <div class="lobby-links">
          <Button color="grey" onClick={() => store.set({ overlay: 'help' })}>
            {t('title.howToPlay')}
          </Button>
          <Button color="blue" onClick={() => store.set({ overlay: 'formations' })}>
            {t('top.formations')}
          </Button>
          <Button color="grey" onClick={() => store.set({ overlay: 'settings' })}>
            {t('title.settings')}
          </Button>
          <Button color="purple" onClick={() => store.set({ overlay: 'changelog' })}>
            {t('title.changelog')}
          </Button>
        </div>
      </div>
    </main>
  );
}
