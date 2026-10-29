import { useState } from 'preact/hooks';
import type { FormationKind } from '@tximtxom/shared';
import { type Key, t } from '../i18n';
import { useSettings } from '../settings';
import { formatCount, locale, type MyStats, useStats } from '../stats';
import { Modal, Tabs, WaveText, withTximTxom } from './common';

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

type StatsTab = 'overview' | 'play' | 'cards';

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
