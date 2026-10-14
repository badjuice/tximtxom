import { useState } from 'preact/hooks';
import { MAX_PLAYERS, MIN_PLAYERS, NAME_MAX } from '@tximtxom/shared';
import { t } from '../i18n';
import { addBot, kick, leaveRoom, renameBot, setRules, startGame } from '../net';
import { toast, useStore } from '../store';
import { Button } from './common';
import { SEAT_COLORS } from './Hud';
import { RulesForm } from './RulesForm';
import { JokerIcon } from './sprites';

export function Lobby() {
  const room = useStore((s) => s.room)!;
  const isHost = room.hostId === room.youId;
  const link = `${location.origin}${location.pathname}?room=${room.code}`;
  const [editing, setEditing] = useState<string | null>(null);

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'TximTxom', text: t('lobby.invite', { code: room.code }), url: link });
      else {
        await navigator.clipboard.writeText(link);
        toast(t('lobby.linkCopied'));
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <main class="lobby">
      <section class="panel lobby-room">
        <h2>{t('lobby.room')}</h2>
        <button class="room-code" onClick={share} aria-label={`${t('title.code')} ${room.code.split('').join(' ')}`}>
          {room.code}
        </button>
        <p class="muted">{t('lobby.share')}</p>

        <h3>{t('lobby.players', { n: room.players.length, max: MAX_PLAYERS })}</h3>
        <ul class="player-list">
          {room.players.map((p, i) => (
            <li class={p.connected ? '' : 'offline'} style={{ '--seat': SEAT_COLORS[i] }}>
              {p.isBot ? <JokerIcon name={p.avatar || 'joker'} scale={0.42} /> : <span class="seat-dot big" aria-hidden="true" />}
              {editing === p.id ? (
                <input
                  class="rename"
                  maxLength={NAME_MAX}
                  value={p.name}
                  aria-label={t('lobby.renameBot', { name: p.name })}
                  ref={(el) => el?.focus()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') setEditing(null);
                  }}
                  onBlur={(e) => {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v && v !== p.name) void renameBot(p.id, v);
                    setEditing(null);
                  }}
                />
              ) : (
                <span class="pname">
                  {p.name}
                  {p.id === room.youId && ` (${t('you').toLowerCase()})`}
                </span>
              )}
              {p.id === room.hostId && <span class="tag">{t('lobby.host')}</span>}
              {p.isBot && <span class="tag">{t('lobby.bot')}</span>}
              {isHost && p.isBot && editing !== p.id && (
                <button class="icon-btn" aria-label={t('lobby.renameBot', { name: p.name })} title={t('lobby.rename')} onClick={() => setEditing(p.id)}>
                  ✎
                </button>
              )}
              {isHost && p.id !== room.youId && (
                <button class="x" aria-label={t('lobby.remove', { name: p.name })} onClick={() => void kick(p.id)}>
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
        {isHost && room.players.length < MAX_PLAYERS && (
          <Button color="grey" onClick={() => void addBot()}>
            {t('lobby.addBot')}
          </Button>
        )}
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
        {isHost && room.players.length < MIN_PLAYERS && <p class="muted">{t('lobby.needPlayers', { n: MIN_PLAYERS })}</p>}
      </section>

      <section class="panel lobby-rules">
        <h2>{isHost ? t('lobby.rules') : t('lobby.rulesByHost')}</h2>
        <RulesForm rules={room.rules} readOnly={!isHost} onChange={(r) => void setRules(r)} />
      </section>
    </main>
  );
}
