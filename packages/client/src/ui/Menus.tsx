import { parseCards } from '@tximtxom/shared';
import { leaveRoom } from '../net';
import { resetSettings, type Settings, updateSettings, useSettings } from '../settings';
import { store, useStore } from '../store';
import { Button, Choice, Modal, Slider, Toggle } from './common';
import { CardBackIcon, CardIcon, JokerIcon } from './sprites';

export function Overlays() {
  const overlay = useStore((s) => s.overlay);
  const close = () => store.set({ overlay: null });
  switch (overlay) {
    case 'scoreboard':
      return <Scoreboard onClose={close} />;
    case 'formations':
      return <Formations onClose={close} />;
    case 'settings':
      return <SettingsMenu onClose={close} />;
    case 'help':
      return <Help onClose={close} />;
    default:
      return null;
  }
}

function Scoreboard({ onClose }: { onClose: () => void }) {
  const g = useStore((s) => s.room?.game);
  if (!g) return null;
  const order = g.players.map((_, i) => i).sort((a, b) => g.players[a].total - g.players[b].total);
  const max = g.rules.threshold;
  return (
    <Modal title="Scoreboard" onClose={onClose} wide>
      <p class="muted center">Fewer points is better. Going over {max} busts; the lowest total then wins.</p>
      <div class="levels">
        {order.map((i, rank) => {
          const p = g.players[i];
          const pct = Math.min(100, (100 * Math.max(0, p.total)) / max);
          return (
            <div class="level-row">
              <span class="level-rank">{rank + 1}</span>
              <span class="level-name">
                {i === g.you ? 'You' : p.name}
                {g.dealer === i && <span class="dealer-chip">D</span>}
              </span>
              <span class="level-bar" aria-hidden="true">
                <span class={`level-fill${pct > 75 ? ' danger' : ''}`} style={{ width: `${pct}%` }} />
              </span>
              <span class="level-chips">{p.total}</span>
              <span class="level-history">
                {g.results.map((r) => (
                  <span class={`hist${r.points[i] < 0 ? ' good' : r.points[i] === 0 ? ' zero' : ''}`} title={`Round ${r.round}`}>
                    {r.points[i]}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
      {g.results.length === 0 && <p class="muted center">No rounds scored yet.</p>}
    </Modal>
  );
}

const EXAMPLES = {
  pair: parseCards('7H 7S'),
  trio: parseCards('9C 9D 9S'),
  quad: parseCards('KH KC KD KS'),
  straight: parseCards('4D 5D 6D 7D'),
  aceHigh: parseCards('QS KS AS'),
  aceLow: parseCards('AS 2S 3S'),
  bad: parseCards('KS AS 2S'),
  tximtxom: parseCards('AH 2H 3H 4H 5H 6H 7H'),
};

function Formations({ onClose }: { onClose: () => void }) {
  const rules = useStore((s) => s.room?.game?.rules ?? s.room?.rules);
  const hardcore = !!rules?.hardcore;
  const superposition = !!rules?.superposition;
  const row = (name: string, color: string, cards: number[], desc: string, opts: { off?: boolean; joker?: string } = {}) => (
    <div class={`level-row formation-row${opts.off ? ' off' : ''}`}>
      <span class={`level-tag tag-${color}`}>{name}</span>
      <span class="level-cards">
        {cards.map((c) => (
          <CardIcon card={c} scale={0.5} dim={opts.off} />
        ))}
      </span>
      <span class="level-desc">
        {opts.joker && <JokerIcon name={opts.joker} scale={0.28} />}
        {desc}
      </span>
    </div>
  );
  return (
    <Modal title="Formations" onClose={onClose} wide>
      <p class="muted center">Cards in formations don't count. Everything else adds points against you (A=1 … 10, J=11, Q=12, K=13).</p>
      <div class="levels">
        {row('Pair', 'blue', EXAMPLES.pair, hardcore ? 'Not allowed in Hardcore' : 'Two of a rank', { off: hardcore, joker: hardcore ? 'trio' : undefined })}
        {row('Trio', 'blue', EXAMPLES.trio, 'Three of a rank')}
        {row('Quad', 'blue', EXAMPLES.quad, 'Four of a rank')}
        {row('Straight', 'red', EXAMPLES.straight, '3+ in a row, always the same suit')}
        {row('Ace low', 'red', EXAMPLES.aceLow, 'Aces are low by default')}
        {row('Ace high', 'red', EXAMPLES.aceHigh, superposition ? 'Superposition: Ace can be high too' : 'Only with Superposition', {
          off: !superposition,
          joker: 'superposition',
        })}
        {row('No wrap', 'grey', EXAMPLES.bad, 'An Ace never sits in the middle', { off: true })}
        {row('TximTxom', 'orange', EXAMPLES.tximtxom, 'A 7-card straight flush. Call it on your turn to win the game!')}
      </div>
      <h3>Take a Ride</h3>
      <p class="muted">
        <JokerIcon name="ride_the_bus" scale={0.3} /> When a formation is shown, other players can add to it: one card per player on a pair or trio
        (a pair can't take a pair), or several same-suit cards at either end of a straight. Not allowed when the round ended with a full hand (-10) or when the draw pile ran out.
      </p>
    </Modal>
  );
}

function SettingsMenu({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  const inRoom = useStore((st) => !!st.room);
  const set = (p: Partial<Settings>) => updateSettings(p);
  const backs: Settings['cardBack'][] = ['back_red', 'back_blue', 'back_yellow', 'back_green', 'back_black', 'back_purple'];
  return (
    <Modal title="Settings" onClose={onClose} wide>
      <div class="settings-grid">
        <section>
          <h3>Cards & colour</h3>
          <Toggle label="High contrast cards" desc="Colour-blind friendly suits (4 distinct colours)" checked={s.highContrast} onChange={(v) => set({ highContrast: v })} />
          <div class="toggle">
            <span class="toggle-text">
              <span class="toggle-label">Card back</span>
            </span>
            <span class="backs">
              {backs.map((b) => (
                <button class={`back-pick${s.cardBack === b ? ' on' : ''}`} aria-pressed={s.cardBack === b} aria-label={b.replace('back_', '') + ' back'} onClick={() => set({ cardBack: b })}>
                  <CardBackIcon back={b} scale={0.42} />
                </button>
              ))}
            </span>
          </div>
          <Slider label="Card & table size" value={s.uiScale} min={0.8} max={1.2} step={0.05} onChange={(v) => set({ uiScale: v })} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Text size" value={s.textScale} min={0.85} max={1.6} step={0.05} onChange={(v) => set({ textScale: v })} format={(v) => `${Math.round(v * 100)}%`} />
          <Choice
            label="Seat order"
            desc="Visual only: where the next player sits"
            value={s.clockwise ? 'cw' : 'ccw'}
            options={[
              { value: 'ccw', label: 'Counter-clockwise' },
              { value: 'cw', label: 'Clockwise' },
            ]}
            onChange={(v) => set({ clockwise: v === 'cw' })}
          />
        </section>
        <section>
          <h3>Motion & effects</h3>
          <Toggle label="Reduced motion" desc="No wobble, shake, swirl or particles" checked={s.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
          <Toggle label="Screen shake" checked={s.screenShake} onChange={(v) => set({ screenShake: v })} disabled={s.reducedMotion} />
          <Toggle label="Animated background" checked={s.backgroundAnim} onChange={(v) => set({ backgroundAnim: v })} disabled={s.reducedMotion} />
          <Toggle label="CRT effect" desc="Scanlines and vignette" checked={s.crt} onChange={(v) => set({ crt: v })} />
          {s.crt && <Slider label="CRT strength" value={s.crtIntensity} min={0.1} max={1} step={0.05} onChange={(v) => set({ crtIntensity: v })} format={(v) => `${Math.round(v * 100)}%`} />}
          <Toggle label="Photosensitive-safe" desc="Fewer flashes and particles" checked={s.safeFlash} onChange={(v) => set({ safeFlash: v })} />
          <Slider label="Game speed" value={s.gameSpeed} min={0.5} max={4} step={0.5} onChange={(v) => set({ gameSpeed: v })} format={(v) => `${v}x`} />
        </section>
        <section>
          <h3>Sound</h3>
          <Toggle label="Mute everything" checked={s.muted} onChange={(v) => set({ muted: v })} />
          <Slider label="Master" value={s.masterVolume} min={0} max={1} step={0.05} onChange={(v) => set({ masterVolume: v })} format={(v) => `${Math.round(v * 100)}`} />
          <Slider label="Effects" value={s.sfxVolume} min={0} max={1} step={0.05} onChange={(v) => set({ sfxVolume: v })} format={(v) => `${Math.round(v * 100)}`} />
          <Slider label="Music" value={s.musicVolume} min={0} max={1} step={0.05} onChange={(v) => set({ musicVolume: v })} format={(v) => `${Math.round(v * 100)}`} />
          <Toggle label="Vibration" desc="On phones that support it" checked={s.haptics} onChange={(v) => set({ haptics: v })} />
        </section>
        <section>
          <h3>Play</h3>
          <Toggle label="Confirm moves" desc='Moves wait for "End Turn" so you can undo misclicks' checked={s.confirmMoves} onChange={(v) => set({ confirmMoves: v })} />
          <Toggle label="Screen reader announcements" desc="Read out turns, draws, discards and scores" checked={s.announce} onChange={(v) => set({ announce: v })} />
          <p class="muted small">
            Keyboard: 1–8 select cards · D draw · P take discard · Enter main action · R end round · E end turn / pass · Backspace undo · T TximTxom · S scores · F formations · H history
          </p>
          <div class="settings-actions">
            <Button color="grey" onClick={resetSettings}>
              Reset to defaults
            </Button>
            {inRoom && (
              <Button
                color="red"
                onClick={() => {
                  onClose();
                  leaveRoom();
                }}
              >
                Leave room
              </Button>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}

function Help({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to play" onClose={onClose} wide>
      <div class="help">
        <p>
          <b>Goal:</b> end each round with as few points in hand as possible. Cards in <b>formations</b> (pairs, trios, quads, same-suit straights of 3+)
          don't count. When someone goes over the limit, the lowest total wins.
        </p>
        <p>
          <b>Your turn:</b> take the face-up discard <i>or</i> draw from the pile. A discard you take must stay: let go of another card. A drawn card can be kept
          (swap it in) or thrown straight onto the discard pile.
        </p>
        <p>
          <b>Ending the round:</b> after picking a card, slide a card ranked <b>5 or lower</b> (Ace = 1) under the discard pile instead of discarding. It can be
          the card you drew or one from your hand, but not the discard you just took.
        </p>
        <p>
          <b>Full hand:</b> end the round with all 7 cards formed for <b>-10</b> points, and nobody may ride on your formations.
        </p>
        <p>
          <JokerIcon name="ride_the_bus" scale={0.3} /> <b>Take a Ride:</b> after a round is ended, formations are shown one by one. Other players can add cards to
          them to get rid of points.
        </p>
        <p>
          <b>Running out:</b> the first time the draw pile empties, the discards (except the top one) are reshuffled. The second time, whoever drew the last card
          ends the round with any card, and there are no rides.
        </p>
        <p>
          <JokerIcon name="superposition" scale={0.3} /> <b>TximTxom!</b> Hold a 7-card straight flush and call it on your turn to win the whole game.
        </p>
        <p class="muted">Turns go counter-clockwise. The dealer plays first; the deal rotates every round.</p>
      </div>
    </Modal>
  );
}
