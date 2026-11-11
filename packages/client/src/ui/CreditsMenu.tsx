import { type Key, t } from '../i18n';
import { AUTHOR_URL } from '../version';
import { unlock } from '../achievements';
import { Modal, Seen, UiIcon, type UiIconName, withTximTxom } from './common';

/** One credited name: what they made, and where to find them (if anywhere). */
interface Credit {
  name: string;
  url?: string;
  /** What they did or made, as an i18n key, or plain text (asset and product names). */
  what: Key | { text: string };
  /** A link inside `what`, standing in for its {game}. */
  link?: { text: string; url: string };
}

/** `icon` is a UI icon, shown on a little card; Fonts has none in the pack, so its card shows "Aa". */
const SECTIONS: { title: Key; icon?: UiIconName; credits: Credit[] }[] = [
  {
    title: 'cr.game',
    icon: 'crGame',
    credits: [
      { name: 'BadJuice', url: AUTHOR_URL, what: 'cr.made' },
      { name: 'BadJuice', url: AUTHOR_URL, what: 'cr.music' },
    ],
  },
  {
    title: 'cr.art',
    icon: 'crArt',
    credits: [{ name: 'Kenney', url: 'https://kenney.nl', what: 'cr.kenney' }],
  },
  {
    title: 'cr.fonts',
    credits: [
      { name: 'Daniel Linssen', url: 'https://managore.itch.io/m6x11', what: { text: 'm6x11plus' } },
      { name: 'jeti', url: 'https://fontenddev.com/fonts/grape-soda/', what: { text: 'Grape Soda, Digital Disco (CC BY 4.0)' } },
      { name: 'zK4rim', url: 'https://www.dafont.com/cutepixel.font', what: { text: 'CutePixel' } },
      { name: 'memesbruh03', url: 'https://memesbruh03.neocities.org/', what: { text: 'Superstar' } },
    ],
  },
  {
    title: 'cr.inspiration',
    icon: 'crInspiration',
    credits: [
      { name: 'nevesfred', url: 'https://github.com/nevesfred', what: 'cr.odjcu', link: { text: 'Odj c*', url: 'https://www.odjcu.com/' } },
      { name: 'LocalThunk', url: 'https://www.playbalatro.com', what: 'cr.balatro' },
    ],
  },
  {
    title: 'cr.testers',
    icon: 'crTesters',
    credits: [
      { name: 'SFGrey', what: 'cr.tester' },
      { name: 'the.red_angel', what: 'cr.tester' },
    ],
  },
  {
    title: 'cr.libraries',
    icon: 'crLibraries',
    credits: [
      { name: 'Preact', url: 'https://preactjs.com', what: 'cr.lib.ui' },
      { name: 'PixiJS', url: 'https://pixijs.com', what: 'cr.lib.table' },
      { name: 'PeerJS', url: 'https://peerjs.com', what: 'cr.lib.net' },
      { name: 'Howler.js', url: 'https://howlerjs.com', what: 'cr.lib.audio' },
      { name: 'Vite', url: 'https://vite.dev', what: 'cr.lib.build' },
    ],
  },
  {
    title: 'cr.services',
    icon: 'crServices',
    credits: [
      { name: 'Suno', url: 'https://suno.com', what: 'cr.svc.suno' },
      { name: 'Metered', url: 'https://www.metered.ca', what: 'cr.svc.metered' },
      { name: 'GitHub Pages', url: 'https://pages.github.com', what: 'cr.svc.pages' },
    ],
  },
];

/** `what` with its link put in for {game}. */
function What({ c }: { c: Credit }) {
  const [before, after] = t(c.what as Key, { game: '\u0000' }).split('\u0000');
  return (
    <>
      {before}
      <a href={c.link!.url} target="_blank" rel="noopener">
        {c.link!.text}
      </a>
      {after}
    </>
  );
}

/** Everyone who made the game possible, from the main menu's Credits button. Names with a page link to it. */
export function CreditsMenu({ onClose }: { onClose: () => void }) {
  return (
    <Modal title={t('cr.title')} onClose={onClose} class="credits-modal">
      <p class="cr-intro">{withTximTxom(t('cr.intro'))}</p>
      {SECTIONS.map((s) => (
        <section class="cr-section">
          <h3>
            <span class="cr-card" aria-hidden="true">
              {s.icon ? <UiIcon name={s.icon} /> : <span class="cr-glyph">Aa</span>}
            </span>
            {t(s.title)}
          </h3>
          <ul>
            {s.credits.map((c) => (
              <li>
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noopener">
                    {c.name}
                  </a>
                ) : (
                  <b>{c.name}</b>
                )}
                <span class="cr-what">{c.link ? <What c={c} /> : typeof c.what === 'string' ? t(c.what) : c.what.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {/* The end of the list (on a tall screen, there as it opens): Roll Credits. */}
      <Seen onSeen={() => unlock('rollCredits')} />
    </Modal>
  );
}
