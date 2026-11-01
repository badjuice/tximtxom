import { useState } from 'preact/hooks';
import type { FormationKind } from '@tximtxom/shared';
import { type Key, t } from '../i18n';
import { useSettings } from '../settings';
import { formatCount, locale, type MyStats, useStats } from '../stats';
import { ACH_PAY, CHIP_SOURCES, type ChipSource, chipsEarned, PAY, useChips } from '../chips';
import { ChipIcon, Modal, Tabs, WaveText, withTximTxom } from './common';
import { Icon } from './sprites';

/** "2h 05m", "12m 30s", "45s". */
function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const two = (n: number) => String(n).padStart(2, '0');
  if (h) return `${h}h ${two(m)}m`;
  if (m) return `${m}m ${two(sec % 60)}s`;
  return `${sec}s`;
}

const pct = (n: number, of: number) => (of ? `${Math.round((100 * n) / of)}%` : '–');
/** "12 (40%)". */
const withPct = (n: number, of: number) => `${formatCount(n)} (${pct(n, of)})`;
const maybe = (n: number | null, unit = '') => (n === null ? '–' : `${formatCount(n)}${unit}`);

/** Formation tags in the colours of the Formations screen: sets blue, straights red. */
const KINDS: { kind: FormationKind; color: string }[] = [
  { kind: 'pair', color: 'blue' },
  { kind: 'trio', color: 'blue' },
  { kind: 'quad', color: 'blue' },
  { kind: 'straight', color: 'red' },
];

/** Balatro's hand stats: one bar per formation, longest for the most shown, with its count and share. */
function FormationChart({ s }: { s: MyStats }) {
  const max = Math.max(1, ...KINDS.map(({ kind }) => s.kinds[kind]));
  const total = KINDS.reduce((n, { kind }) => n + s.kinds[kind], 0);
  return (
    <div class="f-chart" role="table" aria-label={t('stats.formationsTitle')}>
      {KINDS.map(({ kind, color }) => {
        const n = s.kinds[kind];
        return (
          <div class="f-chart-row" role="row">
            <span class={`level-tag tag-${color}`} role="rowheader">
              <WaveText text={t(kind as Key)} />
            </span>
            <span class="f-chart-track" aria-hidden="true">
              <span class="f-chart-bar" style={{ width: `${(100 * n) / max}%` }} />
            </span>
            <span class="f-chart-n" role="cell">
              {formatCount(n)} <span class="muted">({pct(n, total)})</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Where your cards came from: the Draw Pile in blue, the Discard Pile in red. */
function PileBar({ s }: { s: MyStats }) {
  const total = s.cardsDrawn + s.cardsTaken;
  const drawn = total ? (100 * s.cardsDrawn) / total : 50;
  return (
    <section class="stat-box">
      <h4>{t('stats.pilesTitle')}</h4>
      <div class="pile-bar" role="img" aria-label={`${t('stats.drawn')}: ${formatCount(s.cardsDrawn)}, ${t('stats.taken')}: ${formatCount(s.cardsTaken)}`}>
        <span class={`pile-draw${total ? '' : ' empty'}`} style={{ width: `${drawn}%` }} />
        <span class={`pile-take${total ? '' : ' empty'}`} style={{ width: `${100 - drawn}%` }} />
      </div>
      <div class="pile-legend">
        <span class="pile-key draw">
          {t('stats.drawn')}: <b>{formatCount(s.cardsDrawn)}</b> <span class="muted">({pct(s.cardsDrawn, total)})</span>
        </span>
        <span class="pile-key take">
          {t('stats.taken')}: <b>{formatCount(s.cardsTaken)}</b> <span class="muted">({pct(s.cardsTaken, total)})</span>
        </span>
      </div>
    </section>
  );
}

/** Your chips: the balance, where they came from, and where they went. */
function ChipsPanel() {
  const c = useChips();
  return (
    <>
      <div class="chip-tiles">
        <div class="stat-tile big">
          <span class="stat-value">
            <ChipIcon size={28} /> {formatCount(c.balance)}
          </span>
          <span class="stat-label">{t('chips.now')}</span>
        </div>
        <div class="stat-tile">
          <span class="stat-value">{formatCount(c.most)}</span>
          <span class="stat-label">{t('chips.most')}</span>
        </div>
        <div class="stat-tile">
          <span class="stat-value">{formatCount(chipsEarned(c))}</span>
          <span class="stat-label">{t('chips.earned')}</span>
        </div>
      </div>
      <div class="stat-cols">
        <StatList title="chips.earnedTitle" rows={CHIP_SOURCES.map((s): [Key, string] => [`chips.src.${s}`, formatCount(c.earned[s])])} colors={CHIP_SOURCES.map((s) => SRC_COLORS[s])} />
        <StatList
          title="chips.spentTitle"
          rows={[
            ['chips.spentShop', formatCount(c.spentShop)],
            ['chips.wagerWon', formatCount(c.wagerWon)],
            ['chips.wagerLost', formatCount(c.wagerLost)],
            ['chips.streak', formatCount(c.dailyStreak)],
            ['chips.bestStreak', formatCount(c.bestDailyStreak)],
          ]}
        />
      </div>
      {/* How each source pays, in the colour of its dot above. */}
      <p class="center small chips-how">
        {CHIP_SOURCES.map((s, i) => (
          <>
            {i > 0 && <span class="muted"> · </span>}
            <span style={{ color: SRC_COLORS[s] }}>{t(`chips.how.${s}`, HOW)}</span>
          </>
        ))}
      </p>
    </>
  );
}

/** A titled list of label / number rows. */
/** `colors`, if given, puts a dot of each row's colour before its label. */
function StatList({ title, rows, colors }: { title: Key; rows: [Key, string][]; colors?: string[] }) {
  return (
    <section class="stat-box">
      <h4>{t(title)}</h4>
      <dl class="stat-list">
        {rows.map(([label, value], i) => (
          <>
            <dt>
              {colors && <span class="src-dot" style={{ '--c': colors[i] }} />}
              {t(label)}
            </dt>
            <dd>{value}</dd>
          </>
        ))}
      </dl>
    </section>
  );
}

/** One colour per chip source: its dot in "Earned from" and its part of the explanation. */
const SRC_COLORS: Record<ChipSource, string> = {
  formed: '#38b6ff',
  rides: '#b58cf5',
  survived: '#4bc292',
  roundWins: '#ff9a52',
  gameWins: '#f7c948',
  achievements: '#ff7eb6',
  daily: '#5fd8d0',
  firstWin: '#ff6b61',
};
const HOW = { survived: PAY.survived, round: PAY.roundWin, game: PAY.gameWin, per: PAY.perOpponent, daily: PAY.daily, firstWin: PAY.firstWin, low: ACH_PAY.common, high: ACH_PAY.legendary };

type StatsTab = 'overview' | 'play' | 'cards' | 'badges' | 'chips';

/** Your stats in three tabs, stacked so switching never resizes the modal. */
function StatsPanel() {
  useSettings(); // redraw on a language change
  const { mine: s } = useStats();
  const [tab, setTab] = useState<StatsTab>('overview');
  const favourite = KINDS.reduce((a, b) => (s.kinds[b.kind] > s.kinds[a.kind] ? b : a)).kind;
  const pts = (n: number | null) => maybe(n, ` ${t('pts')}`);
  const since = new Date(s.since).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <div class="stats">
      <Tabs
        tabs={[
          { id: 'overview', label: t('stats.tab.overview') },
          { id: 'play', label: t('stats.tab.play') },
          { id: 'cards', label: t('stats.tab.cards') },
          { id: 'badges', label: t('stats.tab.badges') },
          { id: 'chips', label: t('stats.tab.chips') },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div class="tab-body stacked">
        <div class={`tab-panel stats-overview${tab === 'overview' ? '' : ' hidden'}`} inert={tab !== 'overview'}>
          <div class="stat-hero">
            <div class="stat-tile big">
              <span class="stat-value">{formatDuration(s.timePlayed)}</span>
              <span class="stat-label">{t('stats.time')}</span>
            </div>
            <div class="stat-tile">
              <span class="stat-value">{formatCount(s.roundsPlayed)}</span>
              <span class="stat-label">{t('stats.rounds')}</span>
            </div>
            <div class="stat-tile">
              <span class="stat-value">{formatCount(s.gamesPlayed)}</span>
              <span class="stat-label">{t('stats.games')}</span>
            </div>
          </div>
          <section class="stat-box">
            <h4>{t('stats.formationsTitle')}</h4>
            <FormationChart s={s} />
            <dl class="stat-list two">
              <dt>{t('stats.favourite')}</dt>
              <dd>{s.formations ? t(favourite as Key) : '–'}</dd>
              <dt>{t('stats.longestStraight')}</dt>
              <dd>{s.longestStraight ? t('stats.nCards', { n: s.longestStraight }) : '–'}</dd>
              <dt>{withTximTxom(t('stats.tximtxoms'))}</dt>
              <dd>{formatCount(s.tximtxoms)}</dd>
              <dt>{t('stats.rides')}</dt>
              <dd>{formatCount(s.rides)}</dd>
              <dt>{t('stats.ridesGiven')}</dt>
              <dd>{formatCount(s.ridesGiven)}</dd>
            </dl>
          </section>
          <p class="center muted small stats-foot">
            {t('stats.visits')}: {formatCount(s.visits)} · {t('stats.since')}: {since}
          </p>
        </div>
        <div class={`tab-panel${tab === 'play' ? '' : ' hidden'}`} inert={tab !== 'play'}>
          <div class="stat-cols">
            <StatList
              title="stats.roundsTitle"
              rows={[
                ['stats.rounds', formatCount(s.roundsPlayed)],
                ['stats.roundsWon', withPct(s.roundsWon, s.roundsWon + s.roundsLost)],
                ['stats.roundsLost', withPct(s.roundsLost, s.roundsWon + s.roundsLost)],
                ['stats.gamesLeft', withPct(s.gamesLeft, s.gamesPlayed + s.gamesLeft)],
                ['stats.ended', formatCount(s.roundsEnded)],
                ['stats.best', pts(s.bestRound)],
                ['stats.worst', pts(s.worstRound)],
                ['stats.totalPoints', formatCount(s.totalPoints)],
              ]}
            />
            <StatList
              title="stats.gamesTitle"
              rows={[
                ['stats.games', formatCount(s.gamesPlayed)],
                ['stats.gamesWon', withPct(s.gamesWon, s.gamesPlayed)],
                ['stats.gamesLost', withPct(s.gamesLost, s.gamesPlayed)],
                ['stats.streak', formatCount(s.winStreak)],
                ['stats.bestStreak', formatCount(s.bestStreak)],
                ['stats.longestGame', s.longestGame ? t('stats.nRounds', { n: s.longestGame }) : '–'],
                ['stats.lowestTotal', pts(s.lowestTotal)],
                ['stats.recordBust', pts(s.recordBust)],
              ]}
            />
          </div>
        </div>
        <div class={`tab-panel${tab === 'cards' ? '' : ' hidden'}`} inert={tab !== 'cards'}>
          <PileBar s={s} />
          <p class="center muted small">{t('stats.note')}</p>
        </div>
        <div class={`tab-panel${tab === 'badges' ? '' : ' hidden'}`} inert={tab !== 'badges'}>
          {/* Every game you finish ends with one badge: gold, silver or bust. */}
          <div class="stat-tile big badge-total">
            <span class="stat-value">{formatCount(s.gamesWon + s.silvers + s.busts)}</span>
            <span class="stat-label">{t('stats.badges')}</span>
          </div>
          <div class="badge-tiles">
            {(['win', 'silver', 'bust'] as const).map((kind) => (
              <div class={`stat-tile badge-tile badge-${kind}`}>
                <Icon name={kind} scale={1.6} />
                <span class="stat-value">{formatCount(kind === 'win' ? s.gamesWon : kind === 'silver' ? s.silvers : s.busts)}</span>
                <span class="stat-label">{t(`badge.${kind}` as Key)}</span>
              </div>
            ))}
          </div>
          <p class="center muted small">{t('stats.badgesNote')}</p>
        </div>
        <div class={`tab-panel${tab === 'chips' ? '' : ' hidden'}`} inert={tab !== 'chips'}>
          <ChipsPanel />
        </div>
      </div>
    </div>
  );
}

/** The Stats screen, from the main menu. */
export function StatsMenu({ onClose }: { onClose: () => void }) {
  return (
    <Modal title={t('stats.title')} onClose={onClose} wide class="stats-modal">
      <StatsPanel />
    </Modal>
  );
}
