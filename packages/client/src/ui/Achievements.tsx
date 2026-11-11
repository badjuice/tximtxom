import { RULE_REQUIRES, type Rules } from '@tximtxom/shared';
import { ACH_PAY, chipsEarned, chipsNow } from '../chips';
import { memo } from 'preact/compat';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { type Achievement, type AchievementId, ACHIEVEMENTS, ADDICTED_MINUTES, carrierId, isNew, markSeen, onUnlock, unlock, type Rarity, REWARDS, RULE_ACH_IDS, type RuleAch, STAT_METERS, TOAST_MS, TRACKS, type Unlocked, useAchievementToast, useUnlocked } from '../achievements';
import { play } from '../audio';
import { type Key, t } from '../i18n';
import { formatCount, type MyStats, refreshInfected, refreshSpread, useStats } from '../stats';
import { type AchName, ChipAmount, Cycler, Rainbow, RarityMark, RarityName, HintBalloon, Modal, UiIcon, type UiIconName, WaveText, withHighlights } from './common';
import { type AchSort, type AchView, updateSettings, useSettings } from '../settings';
import { ArtIcon, CardBackIcon } from './sprites';
import { syncShines } from '../offscreen';
import { SHOP } from '../shop';
import { itemName } from './Shop';

/** Each rarity's colour, as the shine on unlocked achievements (lighter than the frame, to read as light). */
/** Each rarity's light colour (theme tokens, styles.css). */
export const RARITY_SHINE: Record<Rarity, string> = {
  common: 'var(--blue-l)',
  uncommon: 'var(--green-l)',
  epic: 'var(--epic-n)',
  legendary: 'var(--gold)',
  unique: 'var(--hi)',
  secret: 'var(--red-l)',
};
const RARITIES: Rarity[] = ['common', 'uncommon', 'epic', 'legendary', 'unique', 'secret'];

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
  // The current run of days, or the full week once it's done.
  if (a.meter === 'streak' && a.goal) return { count: unlocked[a.id] ? a.goal : chipsNow().dailyStreak, goal: a.goal, unit: t('ach.days') };
  if (a.meter && a.meter in STAT_METERS && a.goal) return { count: STAT_METERS[a.meter as keyof typeof STAT_METERS](mine), goal: a.goal };
  if (a.meter === 'minutes') return { count: Math.min(ADDICTED_MINUTES, Math.floor(mine.timePlayed / 60000)), goal: ADDICTED_MINUTES, unit: t('ach.minutes') };
  return null;
}

/** Every achievement's name in the current language, with its rarity (for the changelog). */
export function achievementNames(): Map<string, AchName> {
  return new Map(ACHIEVEMENTS.map((a) => [text(a, 'name'), { rarity: a.rarity, rainbow: a.rainbow }]));
}

const text = (a: Achievement, part: 'name' | 'desc' | 'flavor') => {
  // A track's tier: "Hitchhiker II", "Take 100 rides".
  if (a.track && a.tier) {
    if (part === 'name') return `${t(`ach.track.${a.track}.name` as Key)} ${ROMAN[a.tier]}`;
    // A goal of one has its own wording ("Show a quad"); each tier has its own flavour.
    return part === 'desc' ? t(`ach.track.${a.track}.desc${a.goal === 1 ? '1' : ''}` as Key, { n: a.goal! }) : t(`ach.track.${a.track}.flavor${a.tier}` as Key);
  }
  if (!a.rule) return t(`ach.${a.id}.${part}` as Key);
  const name = ruleName(a.rule);
  const need = RULE_REQUIRES[a.rule as keyof Rules] as RuleAch | undefined;
  const what = need ? t('ach.rule.needs', { rule: name, need: ruleName(need) }) : name;
  return part === 'name' ? name : part === 'desc' ? t('ach.rule.desc', { rule: what }) : t(`ach.rule.${a.rule}.flavor` as Key);
};

/** "dd/mm/yyyy, HH:MM:SS". */
function stamp(ms: number): string {
  const d = new Date(ms);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()}, ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
}

const VIEWS: AchView[] = ['all', 'locked', 'unlocked'];
/** What an achievement unlocks, as the shop names it: "Unlocks Negative (table)". */
const rewardText = (id: string) => {
  const item = SHOP.find((i) => i.id === id);
  return item ? t('ach.unlocks', { item: itemName(item), kind: t(`shop.kind.${item.kind}`) }) : id;
};
const VIEW_ICON: Record<AchView, UiIconName> = { all: 'grid', locked: 'lock', unlocked: 'unlocked' };

const SORTS: AchSort[] = ['default', 'complete', 'rarity', 'similar', 'date', 'name'];
const RARITY_ORDER: Record<Rarity, number> = { common: 0, uncommon: 1, epic: 2, legendary: 3, unique: 5, secret: 4 };

/** What an achievement is "like", for sorting similar ones together: its track
 *  (win x rounds, make x formations…), chips, rules, or everything else. */
function family(a: Achievement): string {
  if (a.track) return a.track;
  if (a.meter === 'chips') return 'chips';
  if (a.rule || a.meter === 'rules') return 'rules';
  return 'other';
}
const FAMILY_ORDER = [...new Set(ACHIEVEMENTS.map(family))];

/** The list in the chosen order. Ties keep the list's own order; locked cards
 *  stay last when sorting by date, and unnamed secrets when sorting by name. */
function sorted(by: AchSort, desc: boolean, unlocked: Unlocked, mine: MyStats): Achievement[] {
  const base = new Map(ACHIEVEMENTS.map((a, i) => [a.id, i]));
  const done = (a: Achievement) => {
    if (unlocked[a.id]) return 1;
    const m = meter(a, mine, unlocked);
    return m ? Math.min(0.999, m.count / m.goal) : 0;
  };
  const key = (a: Achievement): number | string => {
    switch (by) {
      case 'complete':
        return done(a);
      case 'rarity':
        return RARITY_ORDER[a.rarity];
      case 'similar':
        return FAMILY_ORDER.indexOf(family(a)) * 1e7 + (a.goal ?? 0);
      case 'date':
        return unlocked[a.id] ?? 0;
      case 'name':
        return text(a, 'name').toLocaleLowerCase();
      default:
        return base.get(a.id)!;
    }
  };
  const sign = desc ? -1 : 1;
  return [...ACHIEVEMENTS].sort((a, b) => {
    if (by === 'date' && !!unlocked[a.id] !== !!unlocked[b.id]) return unlocked[a.id] ? -1 : 1;
    // Secrets have no name to sort by until they're unlocked: after every named one.
    const hidden = (x: Achievement) => !!x.secret && !unlocked[x.id];
    if (by === 'name' && hidden(a) !== hidden(b)) return hidden(a) ? 1 : -1;
    const ka = key(a);
    const kb = key(b);
    const c = typeof ka === 'string' ? ka.localeCompare(kb as string) : ka - (kb as number);
    return c ? c * sign : base.get(a.id)! - base.get(b.id)!;
  });
}

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

interface CardHandlers {
  see: (id: AchievementId) => void;
  lift: (id: AchievementId) => void;
  pick: (a: Achievement, got: boolean, at: DOMRect) => void;
}

/** One achievement in the list. Memo'd: hovering one card draws only that card again, not all of them. */
const AchCard = memo(function AchCard(props: {
  a: Achievement;
  got: boolean;
  fresh: boolean;
  gone: boolean;
  lifted: boolean;
  meter: ReturnType<typeof meter>;
  lang: string;
  on: CardHandlers;
}) {
  const { a, got, fresh, gone, lifted, meter: m, on } = props;
  const hidden = a.secret && !got;
  // Seen before this card was drawn (the list re-sorted or re-filtered): no sign at all. Only a
  // card seen while it's on screen plays the fade, or it would flash back in on every redraw.
  const [seenBefore] = useState(gone);
  return (
    <li
      class={`${got ? 'got' : 'locked'} rarity-${a.rarity}${a.rainbow ? ' rainbow' : ''}${fresh ? (gone ? ' new seen' : ' new') : ''}${lifted ? ' lifted' : ''}`}
      style={got ? { '--rc': a.rainbow ? 'var(--hi)' : RARITY_SHINE[a.rarity] } : undefined}
      onPointerEnter={() => on.see(a.id)}
      onPointerUp={(e) => e.pointerType !== 'mouse' && on.lift(a.id)}
      title={got ? undefined : t('ach.locked')}
      data-ach={a.id}
      onClick={(e) => on.pick(a, got, (e.currentTarget as HTMLElement).getBoundingClientRect())}
    >
      <AchievementIcon a={a} got={got} />
      {fresh && !seenBefore && <NewSign />}
      <span class="ach-text">
        <span class="ach-name">
          {/* Its rarity's shape; until unlocked, the locked ring. */}
          <RarityMark rarity={got ? a.rarity : 'locked'} />
          {hidden ? t('ach.secret') : got ? <Name a={a} /> : text(a, 'name')}
        </span>
        <span class="ach-desc">{hidden ? t('ach.secretDesc') : withHighlights(text(a, 'desc'))}</span>
        {!hidden && text(a, 'flavor') && <span class="ach-flavor">{withHighlights(text(a, 'flavor'))}</span>}
        {/* In rainbow letters with a shine across them: this one gives you something. */}
        {!hidden && REWARDS[a.id] && (
          <span class="ach-reward">
            <Rainbow text={rewardText(REWARDS[a.id]!)} />
          </span>
        )}
        {m && <Progress {...m} />}
      </span>
    </li>
  );
}, (x, y) => x.a === y.a && x.got === y.got && x.fresh === y.fresh && x.gone === y.gone && x.lifted === y.lifted && x.lang === y.lang && x.on === y.on && x.meter?.count === y.meter?.count && x.meter?.goal === y.meter?.goal && x.meter?.unit === y.meter?.unit);

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
  const [when, setWhen] = useState<{ id: AchievementId; at: DOMRect } | null>(null);
  const closeWhen = useCallback(() => setWhen(null), []);
  const { achSort: sort, achSortDesc: desc, achView: view, lang } = useSettings();
  const shown = sorted(sort, desc, unlocked, mine).filter((a) => view === 'all' || !!unlocked[a.id] === (view === 'unlocked'));
  // Window Shopper: the list scrolled to its end, or short enough to show it all at once.
  const list = useRef<HTMLUListElement>(null);
  // Every shine on the page clock's beat, so a card unlocked while this is open
  // (its shines start late) glints together with the rest.
  useLayoutEffect(() => syncShines(list.current?.parentElement), [unlocked, sort, desc, view]);
  // Only the whole list counts: a filtered one is too easy to reach the end of.
  const atEnd = () => {
    const el = list.current;
    if (view === 'all' && el && el.scrollTop + el.clientHeight >= el.scrollHeight - 4) unlock('windowShopper');
  };
  useEffect(atEnd, [view]);
  const see = (id: AchievementId) => {
    if (!fresh.has(id) || gone.has(id)) return;
    markSeen(id);
    setGone((g) => new Set(g).add(id));
  };
  // The cards' handlers, the same functions every render (so a card that didn't change isn't
  // drawn again: AchCard is memo'd), calling the latest of these.
  const latest = useRef({ see, tapInfected });
  latest.current = { see, tapInfected };
  const on = useMemo<CardHandlers>(
    () => ({
      see: (id) => latest.current.see(id),
      lift: (id) => setLifted((l) => (l === id ? null : id)),
      pick: (a, got, at) => {
        latest.current.see(a.id);
        if (got && a.id === 'infected') latest.current.tapInfected();
        // When it was unlocked, in a balloon: a second tap, a scroll or a tap elsewhere hides it.
        setWhen((w) => (w?.id === a.id || !got ? null : { id: a.id, at }));
      },
    }),
    [],
  );
  // Scrolling a card under a still mouse fires no hover, so on scroll the card under the
  // mouse counts as seen too.
  const mouse = useRef<{ x: number; y: number } | null>(null);
  const onScroll = () => {
    atEnd();
    const at = mouse.current;
    const card = at && (document.elementFromPoint(at.x, at.y)?.closest('[data-ach]') as HTMLElement | null);
    if (card) see(card.dataset.ach as AchievementId);
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
            <span class={`lg rarity-${r}`}>
              <RarityName rarity={r} text={t(`ach.rarity.${r}`)} />
            </span>
          ))}
          <span class="lg rarity-locked">{t('ach.locked')}</span>
        </p>
        <div class="ach-sort">
          {/* Which cards show. Every option's word sits in the same spot, so the button keeps one width. */}
          <span class="muted ach-sort-label">{t('ach.show')}</span>
          <button
            type="button"
            class={`ach-view ach-view-${view}`}
            title={`${t('ach.show')} ${t(`ach.view.${view}`)}`}
            aria-label={`${t('ach.show')} ${t(`ach.view.${view}`)}`}
            onClick={() => {
              play('button', { volume: 0.4 });
              updateSettings({ achView: VIEWS[(VIEWS.indexOf(view) + 1) % VIEWS.length] });
            }}
          >
            <UiIcon name={VIEW_ICON[view]} />
            <span class="ach-view-text cyc-val" aria-hidden="true">
              {VIEWS.map((v) => (
                <span class={v === view ? 'on' : ''}>{t(`ach.view.${v}`)}</span>
              ))}
            </span>
          </button>
          <span class="muted ach-sort-label">{t('ach.sortBy')}</span>
          <Cycler label={t('ach.sortBy')} value={sort} options={SORTS.map((s) => ({ value: s, label: t(`ach.sort.${s}`) }))} onChange={(achSort) => updateSettings({ achSort })} />
          <button type="button" class="ach-dir" aria-label={desc ? t('ach.sortDesc') : t('ach.sortAsc')} title={desc ? t('ach.sortDesc') : t('ach.sortAsc')} onClick={() => {
            play('button', { volume: 0.4 });
            updateSettings({ achSortDesc: !desc });
          }}>
            <span aria-hidden="true">{desc ? '▼' : '▲'}</span>
            <span class="ach-dir-text"> {desc ? t('ach.desc') : t('ach.asc')}</span>
          </button>
        </div>
      </div>
      <ul
        class="ach-list"
        ref={list}
        onScroll={onScroll}
        onPointerMove={(e) => (mouse.current = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null)}
        onPointerLeave={() => (mouse.current = null)}
      >
        {!shown.length && <li class="ach-empty muted">{t(view === 'unlocked' ? 'ach.none.unlocked' : 'ach.none.locked')}</li>}
        {shown.map((a) => {
          const got = !!unlocked[a.id];
          return (
            <AchCard
              key={a.id}
              a={a}
              got={got}
              fresh={fresh.has(a.id)}
              gone={gone.has(a.id)}
              lifted={lifted === a.id}
              meter={a.secret && !got ? null : meter(a, mine, unlocked)}
              lang={lang}
              on={on}
            />
          );
        })}
      </ul>
      {when && unlocked[when.id] && (
        <HintBalloon at={when.at} onClose={closeWhen} keep={`[data-ach="${when.id}"]`}>
          {t('ach.unlockedOn', { when: stamp(unlocked[when.id]!) })}
        </HintBalloon>
      )}
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
      <span class="ach-toast-pay">
        <ChipAmount n={ACH_PAY[a.rarity]} sign />
      </span>
    </div>
  );
}
