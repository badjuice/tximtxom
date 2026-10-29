import { useState } from 'preact/hooks';
import { type Achievement, ACHIEVEMENTS, carrierId, type Rarity, type RuleAch, TOAST_MS, TRACKS, useAchievementToast, useUnlocked } from '../achievements';
import { play } from '../audio';
import { type Key, t } from '../i18n';
import { formatCount, refreshInfected, refreshSpread, useStats } from '../stats';
import { Modal, WaveText, withHighlights } from './common';
import { ArtIcon, CardBackIcon } from './sprites';

/** Each rarity's colour, as the shine on unlocked achievements (lighter than the frame, to read as light). */
const RARITY_SHINE: Record<Rarity, string> = { common: '#6fcfff', uncommon: '#6ee7a8', epic: '#c9a3ff', legendary: '#eac058', secret: '#ff8a82' };
const RARITIES: Rarity[] = ['common', 'uncommon', 'epic', 'legendary', 'secret'];

/** The achievement's art: a rule or character card, or a card from the deck. `shine`: the rarity's glint across it. */
const Art = ({ a, scale, shine }: { a: Achievement; scale: number; shine?: boolean }) =>
  a.art.startsWith('cards:') ? (
    <CardBackIcon back={a.art.slice(6)} scale={scale} />
  ) : (
    <ArtIcon name={a.art} scale={scale} shine={shine ? RARITY_SHINE[a.rarity] : undefined} />
  );

/** A rule's name as its achievement's name ("Bust at 100", "Ride order: In turns"). */
function ruleName(rule: RuleAch): string {
  if (rule === 'bust100') return `${t('rule.bust')} 100`;
  if (rule === 'inTurns') return `${t('rule.rideOrder')}: ${t('rule.inTurns')}`;
  const key: Record<string, Key> = { notice: 'rule.notice', timer: 'rule.timer' };
  return t(key[rule] ?? (`rule.${rule}` as Key));
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

/** How far along a running count is: a bar, and "37 / 50" (past the goal it keeps counting: "137 / 100"). */
function Progress({ count, goal }: { count: number; goal: number }) {
  return (
    <span class="ach-track" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(count, goal)}>
      <span class="ach-track-fill" style={{ width: `${Math.min(100, (100 * count) / goal)}%` }} />
      <span class="ach-track-text">
        {formatCount(count)} / {formatCount(goal)}
      </span>
    </span>
  );
}

const text = (a: Achievement, part: 'name' | 'desc' | 'flavor') => {
  // A track's tier: "Hitchhiker II", "Take 100 rides", and no flavour line.
  if (a.track && a.tier) {
    if (part === 'name') return `${t(`ach.track.${a.track}.name` as Key)} ${ROMAN[a.tier]}`;
    return part === 'desc' ? t(`ach.track.${a.track}.desc` as Key, { n: a.goal! }) : '';
  }
  if (!a.rule) return t(`ach.${a.id}.${part}` as Key);
  const name = ruleName(a.rule);
  return part === 'name' ? name : part === 'desc' ? t('ach.rule.desc', { rule: name }) : t('ach.rule.flavor');
};

/** An unlocked achievement's name, shining in its rarity's colour (rainbow for the rainbow ones). */
const Name = ({ a }: { a: Achievement }) => (
  <span class={`rule-ref${a.rainbow ? ' rainbow-text' : ''}`} style={{ '--rc': RARITY_SHINE[a.rarity] }}>
    {text(a, 'name')}
  </span>
);

/** Its art once unlocked; until then a grey card with a lock, or a question mark if it's a secret. */
function AchievementIcon({ a, got }: { a: Achievement; got: boolean }) {
  if (got) return <Art a={a} scale={0.5} shine />;
  return (
    <span class="sprite ach-blank tilt" aria-hidden="true">
      {a.secret ? <span class="ach-q">?</span> : <span class="lock" />}
    </span>
  );
}

/** Taps on your Infected card that show the Infected counts. */
const INFECTED_TAPS = 10;

export function AchievementsMenu({ onClose }: { onClose: () => void }) {
  const unlocked = useUnlocked();
  const { global, mine } = useStats();
  // The Infected counts are a secret too: tap your Infected card ten times to see
  // them, until the window closes.
  const [taps, setTaps] = useState(0);
  const counts = taps >= INFECTED_TAPS;
  const tapInfected = () => {
    if (counts) return;
    if (taps + 1 === INFECTED_TAPS) {
      play('highlight1', { volume: 0.6 });
      refreshInfected();
      refreshSpread(carrierId());
    }
    setTaps(taps + 1);
  };
  const n = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  return (
    <Modal title={t('ach.title')} onClose={onClose} class="ach-modal">
      <p class="ach-count">
        {t('ach.count', { n, total: ACHIEVEMENTS.length })}
        {counts && global.infected !== null && (
          <span class="ach-infected">
            {'\u00a0· '}
            {t('ach.infectedCount', { n: formatCount(global.infected) })}
            {' · '}
            {t('ach.spreadCount', { n: formatCount(global.spread ?? 0) })}
          </span>
        )}
      </p>
      <div class="ach-progress" role="progressbar" aria-valuemin={0} aria-valuemax={ACHIEVEMENTS.length} aria-valuenow={n} aria-label={t('ach.title')}>
        <span class="ach-progress-fill" style={{ width: `${(100 * n) / ACHIEVEMENTS.length}%` }} />
        <span class="ach-progress-text">{Math.round((100 * n) / ACHIEVEMENTS.length)}%</span>
      </div>
      {/* What the colours round the cards mean, as the rules' legend does. */}
      <p class="rules-legend ach-legend">
        {RARITIES.map((r) => (
          <span class={`lg rarity-${r}`}>{t(`ach.rarity.${r}`)}</span>
        ))}
        <span class="lg rarity-locked">{t('ach.locked')}</span>
      </p>
      <ul class="ach-list">
        {ACHIEVEMENTS.map((a) => {
          const got = !!unlocked[a.id];
          const hidden = a.secret && !got;
          return (
            <li
              class={`${got ? 'got' : 'locked'} rarity-${a.rarity}${a.rainbow ? ' rainbow' : ''}`}
              title={got ? undefined : t('ach.locked')}
              onClick={got && a.id === 'infected' ? tapInfected : undefined}
            >
              <AchievementIcon a={a} got={got} />
              <span class="ach-text">
                <span class="ach-name">{hidden ? t('ach.secret') : got ? <Name a={a} /> : text(a, 'name')}</span>
                <span class="ach-desc">{hidden ? t('ach.secretDesc') : withHighlights(text(a, 'desc'))}</span>
                {!hidden && text(a, 'flavor') && <span class="ach-flavor">{withHighlights(text(a, 'flavor'))}</span>}
                {a.track && a.goal && <Progress count={TRACKS[a.track].count(mine)} goal={a.goal} />}
              </span>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

/** "Achievement unlocked", top middle: the art and what you did. One at a time. */
export function AchievementToast() {
  const id = useAchievementToast();
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return null;
  return (
    <div class="ach-toast" key={a.id} role="status" style={{ animationDuration: `${TOAST_MS}ms` }}>
      <Art a={a} scale={0.42} />
      <span class="ach-toast-text">
        <span class="ach-toast-head">
          <WaveText text={t('ach.unlocked')} />
        </span>
        <span>{withHighlights(text(a, 'desc'))}</span>
      </span>
    </div>
  );
}
