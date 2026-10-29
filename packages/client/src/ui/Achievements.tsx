import { useState } from 'preact/hooks';
import { type Achievement, ACHIEVEMENTS, carrierId, TOAST_MS, useAchievementToast, useUnlocked } from '../achievements';
import { play } from '../audio';
import { type Key, t } from '../i18n';
import { formatCount, refreshInfected, refreshSpread, useStats } from '../stats';
import { Modal, WaveText, withHighlights } from './common';
import { ArtIcon, CardBackIcon } from './sprites';

/** The achievement's art: a rule or character card, or a card from the deck. */
const Art = ({ a, scale }: { a: Achievement; scale: number }) =>
  a.art.startsWith('cards:') ? <CardBackIcon back={a.art.slice(6)} scale={scale} /> : <ArtIcon name={a.art} scale={scale} />;

const text = (a: Achievement, part: 'name' | 'desc' | 'flavor') => t(`ach.${a.id}.${part}` as Key);

/** Its art once unlocked; until then a grey card with a lock, or a question mark if it's a secret. */
function AchievementIcon({ a, got }: { a: Achievement; got: boolean }) {
  if (got) return <Art a={a} scale={0.5} />;
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
  const { global } = useStats();
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
      <ul class="ach-list">
        {ACHIEVEMENTS.map((a) => {
          const got = !!unlocked[a.id];
          const hidden = a.secret && !got;
          return (
            <li class={got ? 'got' : 'locked'} onClick={got && a.id === 'infected' ? tapInfected : undefined}>
              <AchievementIcon a={a} got={got} />
              <span class="ach-text">
                <span class="ach-name">{hidden ? t('ach.secret') : withHighlights(text(a, 'name'))}</span>
                <span class="ach-desc">{hidden ? t('ach.secretDesc') : withHighlights(text(a, 'desc'))}</span>
                {!hidden && <span class="ach-flavor">{withHighlights(text(a, 'flavor'))}</span>}
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
