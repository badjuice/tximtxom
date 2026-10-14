import { MAX_PLAYERS, MIN_PLAYERS } from '@tximtxom/shared';
import { addBot, kick, leaveRoom, setRules, startGame } from '../net';
import { toast, useStore } from '../store';
import { Button } from './common';
import { RulesForm } from './RulesForm';
import { JokerIcon } from './sprites';

export function Lobby() {
  const room = useStore((s) => s.room)!;
  const isHost = room.hostId === room.youId;
  const link = `${location.origin}${location.pathname}?room=${room.code}`;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'TximTxom', text: `Join my TximTxom room: ${room.code}`, url: link });
      else {
        await navigator.clipboard.writeText(link);
        toast('Invite link copied');
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <main class="lobby">
      <section class="panel lobby-room">
        <h2>Room</h2>
        <button class="room-code" onClick={share} title="Share invite link" aria-label={`Room code ${room.code.split('').join(' ')}. Tap to share.`}>
          {room.code}
        </button>
        <p class="muted">Share this code (tap it to send a link)</p>

        <h3>
          Players {room.players.length}/{MAX_PLAYERS}
        </h3>
        <ul class="player-list">
          {room.players.map((p) => (
            <li class={p.connected ? '' : 'offline'}>
              {p.isBot ? <JokerIcon name="joker" scale={0.3} /> : <span class="dot" aria-hidden="true" />}
              <span class="pname">
                {p.name}
                {p.id === room.youId && ' (you)'}
              </span>
              {p.id === room.hostId && <span class="tag">host</span>}
              {p.isBot && <span class="tag">bot</span>}
              {isHost && p.id !== room.youId && (
                <button class="x" aria-label={`Remove ${p.name}`} onClick={() => void kick(p.id)}>
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
        {isHost && room.players.length < MAX_PLAYERS && (
          <Button color="grey" onClick={() => void addBot()}>
            + Add bot
          </Button>
        )}
        <div class="lobby-actions">
          <Button color="orange" onClick={leaveRoom}>
            Leave
          </Button>
          {isHost ? (
            <Button color="blue" big disabled={room.players.length < MIN_PLAYERS} onClick={() => void startGame()}>
              Start game
            </Button>
          ) : (
            <p class="muted" role="status">
              Waiting for the host to start…
            </p>
          )}
        </div>
        {isHost && room.players.length < MIN_PLAYERS && <p class="muted">Need at least {MIN_PLAYERS} players: invite a friend or add a bot.</p>}
      </section>

      <section class="panel lobby-rules">
        <h2>Rules {isHost ? '' : '(set by the host)'}</h2>
        <RulesForm rules={room.rules} readOnly={!isHost} onChange={(r) => void setRules(r)} />
      </section>
    </main>
  );
}
