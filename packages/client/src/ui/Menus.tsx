import { CreditsMenu } from './CreditsMenu';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { unlock } from '../achievements';
import { play } from '../audio';
import { DEFAULT_RULES, makeCard, parseCards, type Rules, type Suit } from '@tximtxom/shared';
import { type Key, LANG_NAMES, type Lang, t } from '../i18n';
import { leaveRoom, MODE, setRules } from '../net';
import { CARD_STYLES, cardBacks, currentBack, FONTS, resetSettings, type Settings, updateSettings, useSettings } from '../settings';
import { ownedOf, ownsRandom } from '../shop';
import { store, useStore } from '../store';
import { Button, Choice, Credits, HintBalloon, Modal, Seen, Rich, Slider, Tabs, Toggle, WaveText, withHighlights } from './common';
import { SEAT_COLORS } from './Hud';
import { CHANGELOG, type ChangeKind, KIND_ICON } from '../changelog';
import { CONTACT_EMAIL, ISSUES_URL, VERSION } from '../version';
import { RulesForm, RulesSummary } from './RulesForm';
import { AchievementsMenu } from './Achievements';
import { StatsMenu } from './Stats';
import { backName, ShopMenu } from './Shop';
import { ArtIcon, Badge, BADGE_KINDS, badgeCount, CardBackIcon, CardIcon, RandomBackIcon } from './sprites';

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
    case 'language':
      return <LanguageMenu onClose={close} />;
    case 'stats':
      return <StatsMenu onClose={close} />;
    case 'achievements':
      return <AchievementsMenu onClose={close} />;
    case 'credits':
      return <CreditsMenu onClose={close} />;
    case 'shop':
      return <ShopMenu onClose={close} />;
    default:
      return null;
  }
}

/** Balatro-style language picker: one big button per language, named in itself. */
function LanguageMenu({ onClose }: { onClose: () => void }) {
  const { lang } = useSettings();
  return (
    <Modal title={t('language')} onClose={onClose} class="language-modal">
      <div class="language-list">
        {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
          <Button
            color={l === lang ? 'red' : 'grey'}
            big
            onClick={() => {
              updateSettings({ lang: l });
              onClose();
            }}
          >
            <span lang={l}>{LANG_NAMES[l]}</span>
          </Button>
        ))}
      </div>
    </Modal>
  );
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

/** Every change to the game, one release at a time (newest first), each
 *  change marked new / changed / fixed / removed. Arrows page through them. */
function Changelog({ onClose }: { onClose: () => void }) {
  const { lang } = useSettings();
  const kinds: ChangeKind[] = ['new', 'change', 'fix', 'removed'];
  return (
    <Modal
      title={t('cl.title')}
      onClose={onClose}
      wide
      class="changelog-modal"
      footer={
        <>
          {/* A new GitHub issue, with the version and browser filled in. */}
          <Button
            color="purple"
            onClick={() => open(`${ISSUES_URL}?body=${encodeURIComponent(`\n\n---\nTximTxom v${VERSION} · ${navigator.userAgent}`)}`, '_blank', 'noopener')}
          >
            {t('cl.issue')}
          </Button>
          <Button color="blue" onClick={() => (location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`TximTxom v${VERSION}`)}`)}>
            {t('cl.contact')}
          </Button>
        </>
      }
    >
      <div class="sticky-top">
        <p class="cl-legend">
          {kinds.map((k) => (
            <span class={`cl-kind k-${k}`}>
              {KIND_ICON[k]} {t(`cl.${k}` as Key)}
            </span>
          ))}
        </p>
      </div>
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
                <span>{withHighlights(lang === 'pt' ? it.pt : it.en)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Credits />
      {/* Scrolled all the way down: Nerd. */}
      <Seen onSeen={() => unlock('nerd')} />
    </Modal>
  );
}

/** True when every rule is at its default (the reset button has nothing to do). */
const isDefault = (r: Rules) => (Object.keys(DEFAULT_RULES) as (keyof Rules)[]).every((k) => r[k] === DEFAULT_RULES[k]);

/** The rules. In a game, a compact read-only list; in the room, every rule with its
 *  description, which the host can change. */
function ActiveRules({ onClose }: { onClose: () => void }) {
  const room = useStore((s) => s.room);
  if (!room) return null;
  if (room.game)
    return (
      <Modal title={t('top.rules')} onClose={onClose} wide class="rules-view">
        <RulesSummary rules={room.game.rules} />
      </Modal>
    );
  const isHost = room.hostId === room.youId;
  return (
    <Modal
      title={isHost ? t('lobby.rules') : t('lobby.rulesByHost')}
      onClose={onClose}
      class="lobby-rules-modal"
      footer={
        isHost && (
          <Button color="red" disabled={isDefault(room.rules)} onClick={() => void setRules(DEFAULT_RULES)}>
            {t('lobby.resetRules')}
          </Button>
        )
      }
    >
      <RulesForm rules={room.rules} readOnly={!isHost} onChange={(r) => void setRules(r)} />
    </Modal>
  );
}

// ------------------------------------------------------------------ scoreboard

/** Rounds shown in the game's table: the latest ones, so it never needs scrolling. */
const SB_ROUNDS = 15;

type SbTab = 'round' | 'game' | 'session';

/** The scores in three tabs: where everyone stands now, every round of this game,
 *  and the badges of every game this table has played. */
function Scoreboard({ onClose }: { onClose: () => void }) {
  const g = useStore((s) => s.room?.game);
  const lobby = useStore((s) => s.room?.players ?? []);
  const [tab, setTab] = useState<SbTab>('round');
  if (!g) return null;
  // Rounds mode has no limit: the bars run up to the highest total.
  const max = g.rules.rounds ? Math.max(g.rules.threshold, ...g.players.map((p) => p.total)) : g.rules.threshold;
  const order = g.players.map((_, i) => i).sort((a, b) => g.players[a].total - g.players[b].total);
  const rounds = g.results.slice(-SB_ROUNDS);
  const last = g.results.at(-1);
  const who = (i: number) => <span class={i === g.you ? 'me-name' : undefined}>{g.players[i].name}</span>;
  const member = (i: number) => lobby.find((x) => x.id === g.players[i].id);
  const games = Math.max(0, ...lobby.map((p) => p.wins + p.silvers + p.busts));
  return (
    <Modal title={t('sb.title')} onClose={onClose} wide class="sb-modal">
      <Tabs
        tabs={[
          { id: 'round', label: t('sb.tab.round') },
          { id: 'game', label: t('sb.tab.game') },
          { id: 'session', label: t('sb.tab.session') },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div class="tab-body stacked">
        <div class={`tab-panel${tab === 'round' ? '' : ' hidden'}`} inert={tab !== 'round'}>
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
        </div>
        <div class={`tab-panel${tab === 'game' ? '' : ' hidden'}`} inert={tab !== 'game'}>
          {rounds.length > 0 ? (
            <>
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
                      <td class="num total">
                        {g.players[i].total} {t('pts')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {g.results.length > SB_ROUNDS && <p class="center muted small">{t('sb.latest', { n: SB_ROUNDS })}</p>}
            </>
          ) : (
            <p class="center muted">{t('sb.noRounds')}</p>
          )}
        </div>
        <div class={`tab-panel${tab === 'session' ? '' : ' hidden'}`} inert={tab !== 'session'}>
          <p class="center muted">{games === 1 ? t('sb.games1') : games ? t('sb.games', { n: games }) : t('sb.noGames')}</p>
          <table class="score-table sb-badges">
            <tbody>
              {order.map((i) => (
                <tr style={{ '--seat': SEAT_COLORS[i] }}>
                  <td class="pname">
                    <span class="seat-dot" />
                    {who(i)}
                  </td>
                  {BADGE_KINDS.map((kind) => (
                    <td class="badge-cell">
                      <Badge kind={kind} n={badgeCount(member(i), kind)} scale={0.6} zero />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ formations

const EX = {
  pair: parseCards('7H 7S'),
  trio: parseCards('9C 9D 9S'),
  quad: parseCards('KH KC KD KS'),
  // A second deck's 7 of Hearts is 52 cards on.
  bigSet: [...parseCards('7H 7C 7D 7S'), parseCards('7H')[0] + 52],
  straight: parseCards('4D 5D 6D 7D'),
  mixed: parseCards('8H 9S 10D JC'),
  aceLow: parseCards('AS 2S 3S'),
  aceHigh: parseCards('QS KS AS'),
  bad: parseCards('KS AS 2S'),
};

/** The TximTxom example walks through A-7, 2-8 … and changes suit each step. */
function useTximTxomExample(superposition: boolean, mobius: boolean) {
  const [step, setStep] = useState(0);
  const { reducedMotion } = useSettings();
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => setStep((s) => s + 1), 1100);
    return () => clearInterval(id);
  }, [reducedMotion]);
  // With Superposition, 8-9-10-J-Q-K-A too; with Mobius Strip, any 7 in a row round the loop.
  const starts = mobius ? 13 : superposition ? 8 : 7;
  const start = (step % starts) + 1;
  const suit = (step % 4) as Suit;
  return Array.from({ length: 7 }, (_, i) => makeCard(((start - 1 + i) % 13) + 1, suit));
}

/** The rule behind each rule card on the Formations screen. */
const RULE_OF_CARD: Record<string, Key> = { softcore: 'rule.softcore', mixed: 'rule.smeared', ace: 'rule.superposition', twodecks: 'rule.twoDecks' };

/** What each card is worth: an Ace 1, number cards as printed, J 11, Q 12, K 13. */
function PointValues({ narrow }: { narrow: boolean }) {
  const sc = narrow ? 0.3 : 0.4;
  const values: [number[], string][] = [
    [[makeCard(1, 3)], '1'],
    [[makeCard(2, 0), makeCard(10, 1)], '2–10'],
    [[makeCard(11, 2)], '11'],
    [[makeCard(12, 3)], '12'],
    [[makeCard(13, 0)], '13'],
  ];
  return (
    <div class="f-points">
      {values.map(([cards, pts]) => (
        <span class="fp">
          <span class="fp-cards">
            {cards.map((c) => (
              <CardIcon card={c} scale={sc} />
            ))}
          </span>
          <b class="fp-n">{pts}</b>
          {cards.length > 1 && <small class="fp-note">{t('f.faceValue')}</small>}
        </span>
      ))}
    </div>
  );
}

function Formations({ onClose }: { onClose: () => void }) {
  const rules = useStore((s) => s.room?.game?.rules ?? s.room?.rules);
  const softcore = !!rules?.softcore;
  const superposition = !!rules?.superposition;
  const smeared = !!rules?.smeared;
  const mobius = !!rules?.mobius;
  const twoDecks = !!rules?.twoDecks;
  const polydactyly = !!rules?.polydactyly;
  const tximtxom = useTximTxomExample(superposition, mobius);
  // The rule card last tapped, and where it is: its rule shows in a balloon pointing at it.
  const [rule, setRule] = useState<string | null>(null);
  const [at, setAt] = useState<DOMRect | null>(null);
  const closeRule = useCallback(() => setRule(null), []);
  // Smaller example cards on phones so the list fits without scrolling.
  const narrow = innerWidth <= 700 || innerHeight <= 500;
  const row = (name: string, color: string, cards: number[], desc: string, opts: { off?: boolean; joker?: string; needs?: string } = {}) => (
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
        {opts.joker && (
          <button
            type="button"
            class={`f-rule${rule === opts.joker ? ' on' : ''}`}
            aria-label={t(RULE_OF_CARD[opts.joker])}
            aria-expanded={rule === opts.joker}
            onClick={(e) => {
              play('button', { volume: 0.5 });
              setAt((e.currentTarget as HTMLElement).getBoundingClientRect());
              setRule(rule === opts.joker ? null : opts.joker!);
            }}
          >
            <ArtIcon name={opts.joker} scale={0.3} rule />
          </button>
        )}
        <span>
          <Rich text={desc} />
          {opts.needs && <i class="f-flavor">{opts.needs}</i>}
        </span>
      </span>
    </div>
  );
  const needs = (rule: Key) => t('f.needs', { rule: t(rule) });
  return (
    <Modal title={t('f.title')} onClose={onClose} wide>
      <p class="center f-lead">
        <Rich text={t('f.lead')} />
      </p>
      <PointValues narrow={narrow} />
      <div class="f-grid">
        {row(t('pair'), 'blue', EX.pair, t('f.pair'), { off: !softcore, joker: 'softcore', needs: softcore ? undefined : needs('rule.softcore') })}
        {row(t('trio'), 'blue', EX.trio, t('f.trio'))}
        {row(t('quad'), 'blue', EX.quad, t('f.quad'))}
        {row(t('f.bigSet'), 'blue', EX.bigSet, t('f.bigSetDesc'), { off: !twoDecks, joker: 'twodecks', needs: twoDecks ? undefined : needs('rule.twoDecks') })}
        {row(t('straight'), 'red', EX.straight, t('f.straight'))}
        {row(t('f.mixed'), 'red', EX.mixed, t('f.mixedOn'), { off: !smeared, joker: 'mixed', needs: smeared ? undefined : needs('rule.smeared') })}
        {row(t('f.aceLow'), 'red', EX.aceLow, t('f.aceLowDesc'))}
        {row(t('f.aceHigh'), 'red', EX.aceHigh, t('f.aceHighOn'), { off: !superposition, joker: 'ace', needs: superposition ? undefined : needs('rule.superposition') })}
        {mobius ? row(t('f.loop'), 'red', EX.bad, t('f.loopDesc'), { joker: 'ace' }) : row(t('f.noWrap'), 'grey', EX.bad, t('f.noWrapDesc'), { off: true, needs: t('f.wrapNeeds', { rule: t('rule.mobius'), base: t('rule.superposition') }) })}
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
        <span class="f-desc">
          <span>
            <Rich text={polydactyly ? t('f.tximtxomPoly') : smeared ? t('f.tximtxomSmeared') : t('f.tximtxomDesc')} />
          </span>
        </span>
      </div>
      <p class="f-rule-note muted">{t('f.ruleHint')}</p>
      {rule && at && (
        <HintBalloon at={at} onClose={closeRule} keep=".f-rule">
          <b>{withHighlights(t(RULE_OF_CARD[rule]))}</b> {withHighlights(t(`${RULE_OF_CARD[rule]}.desc` as Key))}
        </HintBalloon>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------------ settings

type SetTab = 'general' | 'controls' | 'access' | 'style' | 'cards' | 'motion' | 'sound';

/** Keyboard shortcuts shown in the Controls tab. `hold` keys need a press and hold. */
/** `keys` is shown as is; `mouse` is a translated mouse action in its place. */
const KEYS: { keys?: string; mouse?: Key; label: Key; hold?: boolean }[] = [
  { keys: '1–9, 0', label: 'key.select' },
  { mouse: 'key.rightClick', label: 'key.deselect' },
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
  { keys: 'C', label: 'key.chat' },
  { keys: 'Esc', label: 'key.settings' },
];

/** Balatro's game speeds, slowest first. */
const SPEEDS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];

const FPS: Settings['fps'][] = ['auto', 15, 30, 60, 120];
const fpsText = (v: Settings['fps']) => (v === 'auto' ? t('set.fps.autoDesc') : t('set.fps.desc', { n: v }));


/** Card art, card back and font, each on a cycler like the game speed, over a preview of the cards. */
function StyleTab() {
  const s = useSettings();
  const backs = cardBacks(s.cardStyle);
  const randomBack = ownsRandom('back', s.cardStyle);
  const back = s.cardBack === 'random' && randomBack ? 'random' : currentBack();
  const tables = ownedOf('table');
  const randomTable = ownsRandom('table');
  const random = { value: 'random', label: t('set.cardBack.random') };
  return (
    <>
      {/* The whole deck, a row per suit, each card on top when pointed at; the back on the right. */}
      <div class="style-preview" aria-hidden="true">
        <div class="deck-view">
          <div class="deck-rows">
            {[0, 1, 2, 3].map((suit) => (
              <div class="deck-row">
                {Array.from({ length: 13 }, (_, i) => (
                  <span class="deck-card" tabIndex={-1}>
                    <CardIcon card={makeCard(i + 1, suit as Suit)} scale={0.56} />
                  </span>
                ))}
              </div>
            ))}
          </div>
          <span class="deck-back">{back === 'random' ? <RandomBackIcon backs={backs} scale={0.8} /> : <CardBackIcon back={back} scale={0.8} />}</span>
        </div>
        <p class="style-sample">{withHighlights(t('set.fontSample'))}</p>
      </div>
      <Choice
        label={t('set.cardStyle')}
        desc={t(`set.cardStyle.${s.cardStyle}.by` as Key)}
        value={s.cardStyle}
        options={CARD_STYLES.map((v) => ({ value: v, label: t(`set.cardStyle.${v}` as Key) }))}
        onChange={(cardStyle) => updateSettings({ cardStyle, cardBack: s.cardBack === 'random' && ownsRandom('back', cardStyle) ? 'random' : cardBacks(cardStyle)[0] })}
      />
      <Choice
        label={t('set.cardBack')}
        desc={t(`set.cardStyle.${s.cardStyle}.by` as Key)}
        value={back}
        options={[...backs.map((b) => ({ value: b, label: backName(b) })), ...(randomBack ? [random] : [])]}
        onChange={(cardBack) => updateSettings({ cardBack })}
      />
      <Choice
        label={t('set.table')}
        desc={t('set.table.desc')}
        value={s.table === 'random' && randomTable ? 'random' : tables.includes(s.table) ? s.table : 'felt'}
        options={[...tables.map((id) => ({ value: id, label: t(`table.${id}` as Key) })), ...(randomTable ? [random] : [])]}
        onChange={(table) => updateSettings({ table })}
      />
      <Choice label={t('set.font')} desc={t('set.font.by', { author: FONTS.find((f) => f.id === s.font)?.author ?? '' })} value={s.font} options={FONTS.map((f) => ({ value: f.id, label: f.name }))} onChange={(font) => updateSettings({ font, fontPicked: true })} />
    </>
  );
}

/** Reset to defaults asks first, in a small prompt over the button. */
function ResetButton() {
  const [asking, setAsking] = useState(false);
  return (
    <span class="reset-wrap">
      <Button color="red" onClick={() => setAsking((a) => !a)}>
        {t('set.reset')}
      </Button>
      {asking && (
        <span class="confirm-pop" role="alertdialog" aria-label={t('set.resetAsk')}>
          <span>{t('set.resetAsk')}</span>
          <span class="confirm-pop-buttons">
            <Button
              color="red"
              onClick={() => {
                setAsking(false);
                resetSettings();
              }}
            >
              {t('set.resetYes')}
            </Button>
            <Button color="grey" onClick={() => setAsking(false)}>
              {t('cancel')}
            </Button>
          </span>
        </span>
      )}
    </span>
  );
}

function SettingsMenu({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  const [tab, setTab] = useState<SetTab>('general');
  const set = (p: Partial<Settings>) => updateSettings(p);
  // Touch-only screens have no keyboard or mouse: no Controls tab.
  const keyboard = !matchMedia('(hover: none)').matches;
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  // A description that says what the setting does as it stands; the other one keeps its space.
  const says = (on: boolean, onKey: Key, offKey: Key) => (on ? [t(onKey), t(offKey)] : [t(offKey), t(onKey)]);
  const speedText = (v: number) => (v === 1 ? t('set.speed.normal') : v < 1 ? t('set.speed.slow') : t('set.speed.fast', { n: v }));
  return (
    <Modal
      title={t('set.title')}
      onClose={onClose}
      wide
      class="settings-modal"
      footer={
        // Next to Back, so they can be reached from every tab.
        <>
          <ResetButton />
        </>
      }
    >
      <Tabs
        tabs={[
          { id: 'general', label: t('set.tab.general') },
          ...(keyboard ? [{ id: 'controls' as const, label: t('set.tab.controls') }] : []),
          { id: 'access', label: t('set.tab.access') },
          { id: 'style', label: t('set.tab.style') },
          { id: 'cards', label: t('set.tab.graphics') },
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
            desc={says(s.clockwise, 'set.seats.cw', 'set.seats.ccw')}
            value={s.clockwise ? 'cw' : 'ccw'}
            options={[
              { value: 'ccw', label: t('set.ccw') },
              { value: 'cw', label: t('set.cw') },
            ]}
            onChange={(v) => set({ clockwise: v === 'cw' })}
          />
          <Toggle label={t('set.announce')} desc={says(s.announce, 'set.announce.on', 'set.announce.off')} checked={s.announce} onChange={(v) => set({ announce: v })} />
          <Choice
            label={t('set.sortBy')}
            // Magic sort is the Magic Sort rule's, in the game only.
            desc={t(`set.sortBy.${s.sortBy === 'suit' ? 'suit' : 'rank'}`)}
            value={s.sortBy === 'suit' ? 'suit' : 'rank'}
            options={[
              { value: 'rank', label: t('sort.rank') },
              { value: 'suit', label: t('sort.suit') },
            ]}
            onChange={(sortBy) => set({ sortBy })}
          />
          <Toggle label={t('set.autoSort')} desc={says(s.autoSort, 'set.autoSort.on', 'set.autoSort.off')} checked={s.autoSort} onChange={(v) => set({ autoSort: v })} />
        </div>
        <div class={`tab-panel${tab === 'access' ? '' : ' hidden'}`} inert={tab !== 'access'}>
          <Toggle label={t('set.instant')} desc={says(s.instantMoves, 'set.instant.on', 'set.instant.off')} checked={s.instantMoves} onChange={(v) => set({ instantMoves: v })} />
          <Toggle label={t('set.tapDeselect')} desc={says(s.tapDeselect, 'set.tapDeselect.desc', 'set.tapDeselect.off')} checked={s.tapDeselect} onChange={(v) => set({ tapDeselect: v })} />
          <Toggle label={t('set.lefty')} desc={says(s.leftHanded, 'set.lefty.desc', 'set.lefty.off')} checked={s.leftHanded} onChange={(v) => set({ leftHanded: v })} />
          <Toggle label={t('set.highContrast')} desc={says(s.highContrast, 'set.highContrast.desc', 'set.highContrast.off')} checked={s.highContrast} onChange={(v) => set({ highContrast: v })} />
          <Slider label={t('set.text')} value={s.textScale} min={0.85} max={1.6} step={0.05} onChange={(v) => set({ textScale: v })} format={pct} />
          <Toggle label={t('set.flash')} desc={says(s.safeFlash, 'set.flash.desc', 'set.flash.off')} checked={s.safeFlash} onChange={(v) => set({ safeFlash: v })} />
        </div>
        {keyboard && (
          <div class={`tab-panel${tab === 'controls' ? '' : ' hidden'}`} inert={tab !== 'controls'}>
            <h3 class="keys-title">{t('set.keyboard')}</h3>
            <div class="keys-cols">
              {[KEYS.slice(0, Math.ceil(KEYS.length / 2)), KEYS.slice(Math.ceil(KEYS.length / 2))].map((col) => (
                <dl class="keys-list">
                  {col.map((k) => (
                    <>
                      <dt>
                        {k.hold && <span class="muted small">{t('set.hold')} </span>}
                        <kbd class="kbd">{k.mouse ? t(k.mouse) : k.keys}</kbd>
                      </dt>
                      <dd>{t(k.label)}</dd>
                    </>
                  ))}
                </dl>
              ))}
            </div>
          </div>
        )}
        <div class={`tab-panel${tab === 'style' ? '' : ' hidden'}`} inert={tab !== 'style'}>
          <StyleTab />
        </div>
        <div class={`tab-panel${tab === 'cards' ? '' : ' hidden'}`} inert={tab !== 'cards'}>
          <Toggle label={t('set.smoothing')} desc={says(s.smooth === 'all', 'set.smoothing.desc', 'set.smoothing.off')} checked={s.smooth === 'all'} onChange={(v) => set({ smooth: v ? 'all' : 'off' })} />
          <Slider label={t('set.size')} value={s.uiScale} min={0.8} max={1.2} step={0.05} onChange={(v) => set({ uiScale: v })} format={pct} />
          <Choice
            label={t('set.fps')}
            desc={[fpsText(s.fps), ...FPS.filter((v) => v !== s.fps).map(fpsText)]}
            value={s.fps}
            options={FPS.map((v) => ({ value: v, label: v === 'auto' ? t('set.fps.auto') : String(v) }))}
            onChange={(fps) => set({ fps })}
          />
          <Toggle
            label={t('set.lowPower')}
            desc={says(s.lowPower, 'set.lowPower.on', 'set.lowPower.off')}
            checked={s.lowPower}
            onChange={(v) => {
              set({ lowPower: v });
              // The graphics mode is picked when the game loads; outside a room, reload now.
              if (!store.get().room) location.reload();
            }}
          />
        </div>
        <div class={`tab-panel${tab === 'motion' ? '' : ' hidden'}`} inert={tab !== 'motion'}>
          {/* Reduced motion turns these two off, so they sit under it. */}
          <div class="setting-group">
            <Toggle label={t('set.reduced')} desc={says(s.reducedMotion, 'set.reduced.desc', 'set.reduced.off')} checked={s.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
            <Toggle label={t('set.shake')} desc={says(s.screenShake, 'set.shake.on', 'set.shake.off')} checked={s.screenShake} onChange={(v) => set({ screenShake: v })} disabled={s.reducedMotion} />
            <Toggle label={t('set.bg')} desc={says(s.backgroundAnim, 'set.bg.on', 'set.bg.off')} checked={s.backgroundAnim} onChange={(v) => set({ backgroundAnim: v })} disabled={s.reducedMotion} />
          </div>
          {/* A switch and the slider it locks, framed together. */}
          <div class="setting-group">
            <Toggle label={t('set.crt')} desc={says(s.crt, 'set.crt.desc', 'set.crt.off')} checked={s.crt} onChange={(v) => set({ crt: v })} />
            <Slider
              label={t('set.crtStrength')}
              value={s.crtIntensity}
              min={0.1}
              max={1}
              step={0.05}
              onChange={(v) => set({ crtIntensity: v })}
              format={pct}
              disabled={!s.crt}
            />
          </div>
          <Choice
            label={t('set.speed')}
            desc={[speedText(s.gameSpeed), ...SPEEDS.filter((v) => v !== s.gameSpeed).map(speedText)]}
            value={s.gameSpeed}
            options={SPEEDS.map((v) => ({ value: v, label: `${v}x` }))}
            onChange={(gameSpeed) => set({ gameSpeed })}
          />
        </div>
        <div class={`tab-panel${tab === 'sound' ? '' : ' hidden'}`} inert={tab !== 'sound'}>
          <div class="setting-group">
            <Toggle label={t('set.mute')} desc={says(s.muted, 'set.mute.on', 'set.mute.off')} checked={s.muted} onChange={(v) => set({ muted: v })} />
            <Slider
              label={t('set.master')}
              value={s.masterVolume}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set({ masterVolume: v })}
              format={pct}
              disabled={s.muted}
            />
            <Slider
              label={t('set.sfx')}
              value={s.sfxVolume}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set({ sfxVolume: v })}
              format={pct}
              disabled={s.muted}
            />
            <Slider
              label={t('set.music')}
              value={s.musicVolume}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set({ musicVolume: v })}
              format={pct}
              disabled={s.muted}
            />
          </div>
          <Toggle label={t('set.vibration')} desc={says(s.haptics, 'set.vibration.desc', 'set.vibration.off')} checked={s.haptics} onChange={(v) => set({ haptics: v })} />
        </div>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ help

type HelpTab = 'goal' | 'turn' | 'end' | 'ride' | 'more';
const HELP_ART: Record<HelpTab, string> = { goal: 'help', turn: 'turn', end: 'bust', ride: 'ride', more: 'tximtxom' };

/** How to Play tabs read so far, kept between visits (RTFM: all of them). */
const HELP_READ = 'tximtxom.helpRead';
function readHelp(tab: HelpTab, all: HelpTab[]): void {
  try {
    const read = new Set<string>(JSON.parse(localStorage.getItem(HELP_READ) ?? '[]'));
    read.add(tab);
    localStorage.setItem(HELP_READ, JSON.stringify([...read]));
    if (all.every((x) => read.has(x))) unlock('rtfm');
  } catch {
    // Storage blocked: no RTFM.
  }
}

function Help({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<HelpTab>('goal');
  const tabs: HelpTab[] = ['goal', 'turn', 'end', 'ride', 'more'];
  useEffect(() => readHelp(tab, tabs), [tab]);
  return (
    <Modal title={t('help.title')} onClose={onClose} wide class="help-modal">
      <Tabs tabs={tabs.map((id) => ({ id, label: t(`help.tab.${id}` as Key) }))} active={tab} onChange={setTab} />
      <div class="help-pages">
        {tabs.map((id) => (
          <div class={`help-page${id === tab ? '' : ' hidden'}`} inert={id !== tab}>
            <ArtIcon name={HELP_ART[id]} scale={1} />
            <p class="help-text">
              <Rich text={t(`help.${id}` as Key)} />
            </p>
          </div>
        ))}
      </div>
    </Modal>
  );
}
