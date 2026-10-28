import { useEffect, useState } from 'preact/hooks';
import type { FormationKind } from '@tximtxom/shared';
import { type Key, t } from '../i18n';
import { useSettings } from '../settings';
import { formatCount, locale, type MyStats, refreshGlobalRounds, useStats } from '../stats';
import { Modal, Tabs, WaveText } from './common';

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
const maybe = (n: number | null, unit = '') => (n === null ? '–' : `${formatCount(n)}${unit}`);

/** Formation tags in the colours of the Formations screen: sets blue, straights red. */
const KINDS: { kind: FormationKind; color: string }[] = [
  { kind: 'pair', color: 'blue' },
  { kind: 'trio', color: 'blue' },
  { kind: 'quad', color: 'blue' },
  { kind: 'straight', color: 'red' },
];

/** Balatro's hand stats: one bar per formation, longest for the most shown. */
function FormationChart({ s }: { s: MyStats }) {
  const max = Math.max(1, ...KINDS.map(({ kind }) => s.kinds[kind]));
  const total = KINDS.reduce((n, { kind }) => n + s.kinds[kind], 0);
  return (
    <div class="f-chart" role="table" aria-label={t('stats.formationsTitle')}>
      {KINDS.map(({ kind, color }) => {
        const n = s.kinds[kind];
        return (
          <div class="f-chart-row" role="row" title={`${t(kind as Key)}: ${formatCount(n)} (${pct(n, total)})`}>
            <span class={`level-tag tag-${color}`} role="rowheader">
              <WaveText text={t(kind as Key)} />
            </span>
            <span class="f-chart-track" aria-hidden="true">
              <span class="f-chart-bar" style={{ width: `${(100 * n) / max}%` }} />
            </span>
            <span class="f-chart-n" role="cell">
              {formatCount(n)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** A titled list of label / number rows. */
function StatList({ title, rows }: { title: Key; rows: [Key, string][] }) {
  return (
    <section class="stat-box">
      <h4>{t(title)}</h4>
      <dl class="stat-list">
        {rows.map(([label, value]) => (
          <>
            <dt>{t(label)}</dt>
            <dd>{value}</dd>
          </>
        ))}
      </dl>
    </section>
  );
}

type StatsTab = 'overview' | 'play' | 'more';

/** Your stats in three tabs, so none of them needs scrolling. */
export function StatsPanel() {
  useSettings(); // redraw on a language change
  const { mine: s, global } = useStats();
  const [tab, setTab] = useState<StatsTab>('overview');
  useEffect(refreshGlobalRounds, []);
  const favourite = KINDS.reduce((a, b) => (s.kinds[b.kind] > s.kinds[a.kind] ? b : a)).kind;
  const pts = (n: number | null) => maybe(n, ` ${t('pts')}`);
  return (
    <div class="stats">
      <Tabs
        tabs={[
          { id: 'overview', label: t('stats.tab.overview') },
          { id: 'play', label: t('stats.tab.play') },
          { id: 'more', label: t('stats.tab.more') },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'overview' && (
        <>
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
              <dt>{t('stats.tximtxoms')}</dt>
              <dd>{formatCount(s.tximtxoms)}</dd>
              <dt>{t('stats.rides')}</dt>
              <dd>{formatCount(s.rides)}</dd>
            </dl>
          </section>
        </>
      )}
      {tab === 'play' && (
        <div class="stat-cols">
          <StatList
            title="stats.roundsTitle"
            rows={[
              ['stats.rounds', formatCount(s.roundsPlayed)],
              ['stats.roundsWon', `${formatCount(s.roundsWon)} · ${pct(s.roundsWon, s.roundsWon + s.roundsLost)}`],
              ['stats.roundsLost', formatCount(s.roundsLost)],
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
              ['stats.gamesWon', `${formatCount(s.gamesWon)} · ${pct(s.gamesWon, s.gamesPlayed)}`],
              ['stats.gamesLost', formatCount(s.gamesLost)],
              ['stats.streak', formatCount(s.winStreak)],
              ['stats.bestStreak', formatCount(s.bestStreak)],
              ['stats.lowestTotal', pts(s.lowestTotal)],
              ['stats.recordBust', pts(s.recordBust)],
            ]}
          />
        </div>
      )}
      {tab === 'more' && (
        <>
          <div class="stat-cols">
            <StatList
              title="stats.cardsTitle"
              rows={[
                ['stats.drawn', formatCount(s.cardsDrawn)],
                ['stats.taken', formatCount(s.cardsTaken)],
                ['stats.discarded', formatCount(s.cardsDiscarded)],
                ['stats.visits', formatCount(s.visits)],
              ]}
            />
            <StatList
              title="stats.everyone"
              rows={[
                ['stats.players', maybe(global.players)],
                ['stats.visits', maybe(global.visits)],
                ['stats.allRounds', maybe(global.rounds)],
              ]}
            />
          </div>
          <p class="center muted small">
            {t('stats.since', { date: new Date(s.since).toLocaleDateString(locale()) })} · {t('stats.note')}
            {global.offline && ` ${t('stats.offline')}`}
          </p>
        </>
      )}
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
