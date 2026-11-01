import { RULE_REQUIRES, type Rules } from '@tximtxom/shared';
import { chipsEarned } from '../chips';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { type Achievement, type AchievementId, ACHIEVEMENTS, ADDICTED_MINUTES, carrierId, isNew, markSeen, onUnlock, unlock, type Rarity, RULE_ACH_IDS, type RuleAch, TOAST_MS, TRACKS, type Unlocked, useAchievementToast, useUnlocked } from '../achievements';
import { play } from '../audio';
import { type Key, t } from '../i18n';
import { formatCount, type MyStats, refreshInfected, refreshSpread, useStats } from '../stats';
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
  if (rule === 'oneRide') return t('rule.rides.oneName');
  if (rule === 'noRides') return t('rule.rides.noneName');
  const key: Record<string, Key> = { notice: 'rule.notice', timer: 'rule.timer' };
  return t(key[rule] ?? (`rule.${rule}` as Key));
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

/** How far along a running count is: a bar, and "37 / 50" (past the goal it keeps counting: "137 / 100"). */
function Progress({ count, goal, unit }: { count: number; goal: number; unit?: string }) {
  return (
    <span class="ach-track" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(count, goal)}>
      <span class="ach-track-fill" style={{ width: `${Math.min(100, (100 * count) / goal)}%` }} />
      <span class="ach-track-text">
        {formatCount(count)} / {formatCount(goal)}
        {unit && ` ${unit}`}
      </span>
    </span>
  );
}

/** The bar under an achievement, if it has one: its count and goal. */
function meter(a: Achievement, mine: MyStats, unlocked: Unlocked): { count: number; goal: number; unit?: string } | null {
  if (a.track && a.goal) return { count: TRACKS[a.track].count(mine), goal: a.goal };
  if (a.meter === 'rules') return { count: RULE_ACH_IDS.filter((r) => unlocked[`rule_${r}`]).length, goal: RULE_ACH_IDS.length };
  if (a.meter === 'chips' && a.goal) return { count: chipsEarned(), goal: a.goal };
  if (a.meter === 'minutes') return { count: Math.min(ADDICTED_MINUTES, Math.floor(mine.timePlayed / 60000)), goal: ADDICTED_MINUTES, unit: t('ach.minutes') };
  return null;
}

const text = (a: Achievement, part: 'name' | 'desc' | 'flavor') => {
  // A track's tier: "Hitchhiker II", "Take 100 rides", and no flavour line.
  if (a.track && a.tier) {
    if (part === 'name') return `${t(`ach.track.${a.track}.name` as Key)} ${ROMAN[a.tier]}`;
    // A goal of one has its own wording ("Show a quad").
    return part === 'desc' ? t(`ach.track.${a.track}.desc${a.goal === 1 ? '1' : ''}` as Key, { n: a.goal! }) : '';
  }
  if (!a.rule) return t(`ach.${a.id}.${part}` as Key);
  const name = ruleName(a.rule);
  const need = RULE_REQUIRES[a.rule as keyof Rules] as RuleAch | undefined;
  const what = need ? t('ach.rule.needs', { rule: name, need: ruleName(need) }) : name;
  return part === 'name' ? name : part === 'desc' ? t('ach.rule.desc', { rule: what }) : t(`ach.rule.${a.rule}.flavor` as Key);
};

/** The looping shines on unlocked cards: the art's, the name's and the whole card's. */
const SHINES = new Set(['rule-card-shine', 'rule-shine', 'ach-card-shine', 'rainbow-slide']);

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
  // New when the window opened. Hovering or tapping a card marks it seen, and its sign
  // fades away (it stays in the page, so nothing moves).
  const [fresh, setFresh] = useState(() => new Set(ACHIEVEMENTS.filter((a) => isNew(a.id)).map((a) => a.id)));
  // Unlocked while the window is open (Window Shopper): New! right away, like the others.
  useEffect(() => onUnlock((id) => setFresh((f) => new Set(f).add(id))), []);
  const [gone, setGone] = useState<Set<AchievementId>>(() => new Set());
  // On touch screens a tap brings a card forward and a second tap puts it back (a mouse uses hover).
  const [lifted, setLifted] = useState<AchievementId | null>(null);
  // Window Shopper: the list scrolled to its end, or short enough to show it all at once.
  const list = useRef<HTMLUListElement>(null);
  // Every shine on the page clock's beat, so a card unlocked while this is open
  // (its shines start late) glints together with the rest.
  useLayoutEffect(() => {
    for (const a of list.current?.getAnimations({ subtree: true }) ?? [])
      if (a instanceof CSSAnimation && SHINES.has(a.animationName) && a.startTime !== 0) a.startTime = 0;
  });
  const atEnd = () => {
    const el = list.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 4) unlock('windowShopper');
  };
  useEffect(atEnd, []);
  const see = (id: AchievementId) => {
    if (!fresh.has(id) || gone.has(id)) return;
    markSeen(id);
    setGone(new Set(gone).add(id));
  };
  return (
    <Modal title={t('ach.title')} onClose={onClose} class="ach-modal">
      {/* Count, bar and legend stay at the top while the list scrolls. */}
      <div class="sticky-top">
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
      </div>
      <ul class="ach-list" ref={list} onScroll={atEnd}>
        {ACHIEVEMENTS.map((a) => {
          const got = !!unlocked[a.id];
          const hidden = a.secret && !got;
          return (
            <li
              class={`${got ? 'got' : 'locked'} rarity-${a.rarity}${a.rainbow ? ' rainbow' : ''}${fresh.has(a.id) ? (gone.has(a.id) ? ' new seen' : ' new') : ''}${lifted === a.id ? ' lifted' : ''}`}
              style={got ? { '--rc': a.rainbow ? '#fff' : RARITY_SHINE[a.rarity] } : undefined}
              onPointerEnter={() => see(a.id)}
              onPointerUp={(e) => e.pointerType !== 'mouse' && setLifted((l) => (l === a.id ? null : a.id))}
              title={got ? undefined : t('ach.locked')}
              onClick={() => {
                see(a.id);
                if (got && a.id === 'infected') tapInfected();
              }}
            >
              <AchievementIcon a={a} got={got} />
              {fresh.has(a.id) && <NewSign />}
              <span class="ach-text">
                <span class="ach-name">{hidden ? t('ach.secret') : got ? <Name a={a} /> : text(a, 'name')}</span>
                <span class="ach-desc">{hidden ? t('ach.secretDesc') : withHighlights(text(a, 'desc'))}</span>
                {!hidden && text(a, 'flavor') && <span class="ach-flavor">{withHighlights(text(a, 'flavor'))}</span>}
                {!hidden && (() => {
                  const m = meter(a, mine, unlocked);
                  return m && <Progress {...m} />;
                })()}
              </span>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

/** "New!" on a just-unlocked achievement (and on the Achievements button). */
export const NewSign = () => (
  <span class="new-sign" aria-label={t('ach.new')}>
    <WaveText text={t('ach.new')} />
  </span>
);

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
