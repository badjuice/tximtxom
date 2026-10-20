import { useEffect, useState } from 'preact/hooks';
import { makeCard, parseCards, type Suit } from '@tximtxom/shared';
import { type Key, t } from '../i18n';
import { leaveRoom, MODE } from '../net';
import { resetSettings, type Settings, updateSettings, useSettings } from '../settings';
import { store, useStore } from '../store';
import { Button, Choice, Credits, Modal, Rich, Slider, Tabs, Toggle, WaveText } from './common';
import { SEAT_COLORS } from './Hud';
import { CHANGELOG, type ChangeKind, KIND_ICON } from '../changelog';
import { RulesForm } from './RulesForm';
import { CardBackIcon, CardIcon, ArtIcon, Wins } from './sprites';

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
    case 'rules':
      return <ActiveRules onClose={close} />;
    case 'changelog':
      return <Changelog onClose={close} />;
    case 'leave':
      return <LeaveConfirm onClose={close} />;
    default:
      return null;
  }
}

/** "Are you sure?" before leaving a game or a room. */
function LeaveConfirm({ onClose }: { onClose: () => void }) {
  const room = useStore((s) => s.room);
  if (!room) return null;
  const hosting = MODE === 'p2p' && room.hostId === room.youId;
  const game = !!room.game;
  const body = game ? (hosting ? t('leave.hostBody') : t('leave.body')) : hosting ? t('leaveRoom.hostBody') : t('leaveRoom.body');
  return (
    <Modal
      title={game ? t('leave.title') : t('leaveRoom.title')}
      onClose={onClose}
      footer={
        <Button
          color="red"
          onClick={() => {
            onClose();
            leaveRoom();
          }}
        >
          {t('leave.confirm')}
        </Button>
      }
    >
      <p>{body}</p>
    </Modal>
  );
}

/** Every change to the game, newest first, marked new / changed / fixed / removed. */
function Changelog({ onClose }: { onClose: () => void }) {
  const { lang } = useSettings();
  const kinds: ChangeKind[] = ['new', 'change', 'fix', 'removed'];
  return (
    <Modal title={t('cl.title')} onClose={onClose} wide class="changelog-modal">
      <p class="cl-legend">
        {kinds.map((k) => (
          <span class={`cl-kind k-${k}`}>
            {KIND_ICON[k]} {t(`cl.${k}` as Key)}
          </span>
        ))}
      </p>
      {CHANGELOG.map((rel, i) => (
        <section class="cl-release">
          <h3>
            v{rel.version} <span class="muted">· {rel.date}</span>
            {i === 0 && <span class="tag">{t('cl.current')}</span>}
          </h3>
          <ul>
            {rel.items.map((it) => (
              <li class={`k-${it.kind}`}>
                <span class="cl-icon" title={t(`cl.${it.kind}` as Key)} aria-label={t(`cl.${it.kind}` as Key)}>
                  {KIND_ICON[it.kind]}
                </span>
                <span>{lang === 'pt' ? it.pt : it.en}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Modal>
  );
}

/** The rules of the game being played, read-only. */
function ActiveRules({ onClose }: { onClose: () => void }) {
  const rules = useStore((s) => s.room?.game?.rules ?? s.room?.rules);
  if (!rules) return null;
  return (
    <Modal title={t('top.rules')} onClose={onClose} wide class="rules-view">
      <RulesForm rules={rules} readOnly onChange={() => {}} />
    </Modal>
  );
}

// ------------------------------------------------------------------ scoreboard

function Scoreboard({ onClose }: { onClose: () => void }) {
  const g = useStore((s) => s.room?.game);
  const lobby = useStore((s) => s.room?.players ?? []);
  if (!g) return null;
  const max = g.rules.threshold;
  const order = g.players.map((_, i) => i).sort((a, b) => g.players[a].total - g.players[b].total);
  const rounds = g.results.slice(-10);
  const last = g.results.at(-1);
  const who = (i: number) => (i === g.you ? t('you') : g.players[i].name);
  return (
    <Modal title={t('sb.title')} onClose={onClose} wide>
      <p class="center muted">{t('sb.lead', { n: max })}</p>
      <div class="sb-rows">
        {order.map((i, rank) => {
          const p = g.players[i];
          const pct = Math.min(100, (100 * Math.max(0, p.total)) / max);
          const left = max - p.total;
          return (
            <div class={`sb-row${rank === 0 ? ' lead' : ''}`} style={{ '--seat': SEAT_COLORS[i] }}>
              <span class="sb-rank">{rank + 1}</span>
              <span class="sb-name">
                {p.avatar ? <ArtIcon name={p.avatar} scale={0.3} /> : <span class="seat-dot" />}
                {who(i)}
                <Wins n={lobby.find((x) => x.id === p.id)?.wins ?? 0} scale={0.5} />
                {g.dealer === i && <span class="dealer-chip">D</span>}
              </span>
              <span class="sb-total">{p.total}</span>
              <span class="sb-meter">
                <span class="sb-bar">
                  <span class={`sb-fill${pct > 75 ? ' danger' : ''}`} style={{ width: `${pct}%` }} />
                </span>
                <span class="sb-left">{left < 0 ? t('sb.busted') : t('sb.toBust', { n: left })}</span>
              </span>
              {last && (
                <span class={`sb-delta ${last.points[i] < 0 ? 'good' : last.points[i] === 0 ? 'zero' : ''}`} title={t('sb.lastRound')}>
                  {last.points[i] > 0 ? `+${last.points[i]}` : last.points[i]}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {rounds.length > 0 ? (
        <table class="sb-grid">
          <thead>
            <tr>
              <th>{t('sb.rounds')}</th>
              {rounds.map((r) => (
                <th class="num">{r.round}</th>
              ))}
              <th class="num">{t('sum.total')}</th>
            </tr>
          </thead>
          <tbody>
            {order.map((i) => (
              <tr style={{ '--seat': SEAT_COLORS[i] }}>
                <td class="pname">
                  <span class="seat-dot" />
                  {who(i)}
                </td>
                {rounds.map((r) => (
                  <td class={`num ${r.points[i] < 0 ? 'good' : r.points[i] === 0 ? 'zero' : 'bad'}${r.ender === i ? ' ender' : ''}`}>{r.points[i]}</td>
                ))}
                <td class="num total">{g.players[i].total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p class="center muted">{t('sb.noRounds')}</p>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------------ formations

const EX = {
  pair: parseCards('7H 7S'),
  trio: parseCards('9C 9D 9S'),
  quad: parseCards('KH KC KD KS'),
  straight: parseCards('4D 5D 6D 7D'),
  mixed: parseCards('8H 9S 10D JC'),
  aceLow: parseCards('AS 2S 3S'),
  aceHigh: parseCards('QS KS AS'),
  bad: parseCards('KS AS 2S'),
};

/** The TximTxom example walks through A-7, 2-8 … and changes suit each step. */
function useTximTxomExample(superposition: boolean) {
  const [step, setStep] = useState(0);
  const { reducedMotion } = useSettings();
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => setStep((s) => s + 1), 1100);
    return () => clearInterval(id);
  }, [reducedMotion]);
  const starts = superposition ? 8 : 7; // with Superposition, 8-9-10-J-Q-K-A too
  const start = (step % starts) + 1;
  const suit = (step % 4) as Suit;
  return Array.from({ length: 7 }, (_, i) => makeCard(((start - 1 + i) % 13) + 1, suit));
}

function Formations({ onClose }: { onClose: () => void }) {
  const rules = useStore((s) => s.room?.game?.rules ?? s.room?.rules);
  const hardcore = !!rules?.hardcore;
  const superposition = !!rules?.superposition;
  const smeared = !!rules?.smeared;
  const tximtxom = useTximTxomExample(superposition);
  // Smaller example cards on phones so the list fits without scrolling.
  const narrow = innerWidth <= 700 || innerHeight <= 500;
  const row = (name: string, color: string, cards: number[], desc: string, opts: { off?: boolean; joker?: string } = {}) => (
    <div class={`f-row${opts.off ? ' off' : ''}`}>
      <span class={`level-tag tag-${color}`}>
        <WaveText text={name} />
      </span>
      <span class="f-cards">
        {cards.map((c) => (
          <CardIcon card={c} scale={narrow ? 0.3 : 0.44} dim={opts.off} />
        ))}
      </span>
      <span class="f-desc">
        {opts.joker && <ArtIcon name={opts.joker} scale={0.3} />}
        {desc}
      </span>
    </div>
  );
  return (
    <Modal title={t('f.title')} onClose={onClose} wide>
      <p class="center muted f-lead">{t('f.lead')}</p>
      <div class="f-grid">
        {row(t('pair'), 'blue', EX.pair, hardcore ? t('f.pairOff') : t('f.pair'), { off: hardcore, joker: hardcore ? 'hardcore' : undefined })}
        {row(t('trio'), 'blue', EX.trio, t('f.trio'))}
        {row(t('quad'), 'blue', EX.quad, t('f.quad'))}
        {row(t('straight'), 'red', EX.straight, t('f.straight'))}
        {row(t('f.mixed'), 'red', EX.mixed, smeared ? t('f.mixedOn') : t('f.mixedOff'), { off: !smeared, joker: 'mixed' })}
        {row(t('f.aceLow'), 'red', EX.aceLow, t('f.aceLowDesc'))}
        {row(t('f.aceHigh'), 'red', EX.aceHigh, superposition ? t('f.aceHighOn') : t('f.aceHighOff'), { off: !superposition, joker: 'ace' })}
        {row(t('f.noWrap'), 'grey', EX.bad, t('f.noWrapDesc'), { off: true })}
      </div>
      <div class="f-row f-tximtxom">
        <span class="level-tag tag-orange">
          <WaveText text="TximTxom" />
        </span>
        <span class="f-cards">
          {tximtxom.map((c) => (
            <CardIcon card={c} scale={narrow ? 0.34 : 0.5} />
          ))}
        </span>
        <span class="f-desc">{smeared ? t('f.tximtxomSmeared') : t('f.tximtxomDesc')}</span>
      </div>
      <p class="f-ride">
        <ArtIcon name="ride" scale={0.34} />
        <span>
          <b class="hl hl-g">{t('f.ride')}</b> {smeared ? t('f.rideDescSmeared') : t('f.rideDesc')}
        </span>
      </p>
    </Modal>
  );
}

// ------------------------------------------------------------------ settings

type SetTab = 'general' | 'controls' | 'cards' | 'motion' | 'sound';

/** Keyboard shortcuts shown in the Controls tab. `hold` keys need a press and hold. */
const KEYS: { keys: string; label: Key; hold?: boolean }[] = [
  { keys: '1–8', label: 'key.select' },
  { keys: 'D', label: 'key.draw' },
  { keys: 'P', label: 'key.take' },
  { keys: 'Enter', label: 'key.main' },
  { keys: 'E', label: 'key.end' },
  { keys: 'Backspace', label: 'key.undo' },
  { keys: 'R', label: 'key.endRound', hold: true },
  { keys: 'T', label: 'key.tximtxom', hold: true },
  { keys: 'S', label: 'key.scores' },
  { keys: 'F', label: 'key.formations' },
  { keys: 'H', label: 'key.history' },
  { keys: 'Esc', label: 'key.settings' },
];

function SettingsMenu({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  const room = useStore((st) => st.room);
  const [tab, setTab] = useState<SetTab>('general');
  const set = (p: Partial<Settings>) => updateSettings(p);
  const backs: Settings['cardBack'][] = ['back_red', 'back_blue', 'back_yellow', 'back_green', 'back_black', 'back_purple'];
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <Modal
      title={t('set.title')}
      onClose={onClose}
      wide
      class="settings-modal"
      footer={
        // Next to Back, so they can be reached from every tab.
        <>
          <Button color="grey" onClick={resetSettings}>
            {t('set.reset')}
          </Button>
          {room && (
            <Button color="red" onClick={() => store.set({ overlay: 'leave' })}>
              {room.game ? t('top.leave') : t('lobby.leave')}
            </Button>
          )}
        </>
      }
    >
      <Tabs
        tabs={[
          { id: 'general', label: t('set.tab.general') },
          { id: 'controls', label: t('set.tab.controls') },
          { id: 'cards', label: t('set.tab.cards') },
          { id: 'motion', label: t('set.tab.motion') },
          { id: 'sound', label: t('set.tab.sound') },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div class="tab-body stacked">
        <div class={`tab-panel${tab === 'general' ? '' : ' hidden'}`} inert={tab !== 'general'}>
            <Choice
              label={t('language')}
              value={s.lang}
              options={[
                { value: 'pt', label: 'Português' },
                { value: 'en', label: 'English' },
              ]}
              onChange={(lang) => set({ lang })}
            />
            <Choice
              label={t('set.seats')}
              desc={t('set.seats.desc')}
              value={s.clockwise ? 'cw' : 'ccw'}
              options={[
                { value: 'ccw', label: t('set.ccw') },
                { value: 'cw', label: t('set.cw') },
              ]}
              onChange={(v) => set({ clockwise: v === 'cw' })}
            />
            <Toggle label={t('set.announce')} desc={t('set.announce.desc')} checked={s.announce} onChange={(v) => set({ announce: v })} />
        </div>
        <div class={`tab-panel${tab === 'controls' ? '' : ' hidden'}`} inert={tab !== 'controls'}>
            <Choice
              label={t('set.sortBy')}
              desc={t('set.sortBy.desc')}
              value={s.sortBy}
              options={[
                { value: 'rank', label: t('sort.rank') },
                { value: 'suit', label: t('sort.suit') },
              ]}
              onChange={(sortBy) => set({ sortBy })}
            />
            <Toggle label={t('set.autoSort')} desc={t('sort.autoTitle')} checked={s.autoSort} onChange={(v) => set({ autoSort: v })} />
            <Toggle label={t('set.confirm')} desc={t('set.confirm.desc')} checked={s.confirmMoves} onChange={(v) => set({ confirmMoves: v })} />
            <Toggle label={t('set.lefty')} desc={t('set.lefty.desc')} checked={s.leftHanded} onChange={(v) => set({ leftHanded: v })} />
            <h3 class="keys-title">{t('set.keyboard')}</h3>
            <dl class="keys-list">
              {KEYS.map((k) => (
                <>
                  <dt>
                    {k.hold && <span class="muted small">{t('set.hold')} </span>}
                    <kbd class="kbd">{k.keys}</kbd>
                  </dt>
                  <dd>{t(k.label)}</dd>
                </>
              ))}
            </dl>
        </div>
        <div class={`tab-panel${tab === 'cards' ? '' : ' hidden'}`} inert={tab !== 'cards'}>
            <Toggle label={t('set.highContrast')} desc={t('set.highContrast.desc')} checked={s.highContrast} onChange={(v) => set({ highContrast: v })} />
            <div class="toggle">
              <span class="toggle-text">
                <span class="toggle-label">{t('set.cardBack')}</span>
              </span>
              <span class="backs">
                {backs.map((b) => (
                  <button class={`back-pick${s.cardBack === b ? ' on' : ''}`} aria-pressed={s.cardBack === b} aria-label={b.replace('back_', '')} onClick={() => set({ cardBack: b })}>
                    <CardBackIcon back={b} scale={0.42} />
                  </button>
                ))}
              </span>
            </div>
            <Choice
              label={t('set.smoothing')}
              desc={t('set.smoothing.desc')}
              value={s.smoothing}
              options={[
                { value: 'off', label: t('set.smooth.off') },
                { value: 'edges', label: t('set.smooth.edges') },
                { value: 'all', label: t('set.smooth.all') },
              ]}
              onChange={(smoothing) => set({ smoothing })}
            />
            <Slider label={t('set.size')} value={s.uiScale} min={0.8} max={1.2} step={0.05} onChange={(v) => set({ uiScale: v })} format={pct} />
            <Slider label={t('set.text')} value={s.textScale} min={0.85} max={1.6} step={0.05} onChange={(v) => set({ textScale: v })} format={pct} />
        </div>
        <div class={`tab-panel${tab === 'motion' ? '' : ' hidden'}`} inert={tab !== 'motion'}>
            <Toggle label={t('set.reduced')} desc={t('set.reduced.desc')} checked={s.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
            <Toggle label={t('set.shake')} checked={s.screenShake} onChange={(v) => set({ screenShake: v })} disabled={s.reducedMotion} />
            <Toggle label={t('set.bg')} checked={s.backgroundAnim} onChange={(v) => set({ backgroundAnim: v })} disabled={s.reducedMotion} />
            <Toggle label={t('set.crt')} desc={t('set.crt.desc')} checked={s.crt} onChange={(v) => set({ crt: v })} />
            <Slider label={t('set.crtStrength')} value={s.crtIntensity} min={0.1} max={1} step={0.05} onChange={(v) => set({ crtIntensity: v })} format={pct} disabled={!s.crt} />
            <Toggle label={t('set.flash')} desc={t('set.flash.desc')} checked={s.safeFlash} onChange={(v) => set({ safeFlash: v })} />
            <Slider label={t('set.speed')} value={s.gameSpeed} min={0.5} max={4} step={0.5} onChange={(v) => set({ gameSpeed: v })} format={(v) => `${v}x`} />
        </div>
        <div class={`tab-panel${tab === 'sound' ? '' : ' hidden'}`} inert={tab !== 'sound'}>
            <Toggle label={t('set.mute')} checked={s.muted} onChange={(v) => set({ muted: v })} />
            <Slider label={t('set.master')} value={s.masterVolume} min={0} max={1} step={0.05} onChange={(v) => set({ masterVolume: v })} format={pct} disabled={s.muted} />
            <Slider label={t('set.sfx')} value={s.sfxVolume} min={0} max={1} step={0.05} onChange={(v) => set({ sfxVolume: v })} format={pct} disabled={s.muted} />
            <Slider label={t('set.music')} value={s.musicVolume} min={0} max={1} step={0.05} onChange={(v) => set({ musicVolume: v })} format={pct} disabled={s.muted} />
            <Toggle label={t('set.vibration')} desc={t('set.vibration.desc')} checked={s.haptics} onChange={(v) => set({ haptics: v })} />
        </div>
      </div>
      <Credits />
    </Modal>
  );
}

// ------------------------------------------------------------------ help

type HelpTab = 'goal' | 'turn' | 'end' | 'ride' | 'more';
const HELP_ART: Record<HelpTab, string> = { goal: 'help', turn: 'turn', end: 'bust', ride: 'ride', more: 'tximtxom' };

function Help({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<HelpTab>('goal');
  const tabs: HelpTab[] = ['goal', 'turn', 'end', 'ride', 'more'];
  return (
    <Modal title={t('help.title')} onClose={onClose} wide>
      <Tabs tabs={tabs.map((id) => ({ id, label: t(`help.tab.${id}` as Key) }))} active={tab} onChange={setTab} />
      <div class="help-page">
        <ArtIcon name={HELP_ART[tab]} scale={1} />
        <p class="help-text">
          <Rich text={t(`help.${tab}` as Key)} />
        </p>
      </div>
    </Modal>
  );
}
