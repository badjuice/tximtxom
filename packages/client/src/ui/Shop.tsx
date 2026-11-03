import { useEffect, useState } from 'preact/hooks';
import { play } from '../audio';
import { previewTable, STRIPES, TABLES } from '../background';
import { ACHIEVEMENTS, hasAchievement } from '../achievements';
import { buyItem, useChips } from '../chips';
import { type Key, t } from '../i18n';
import { saveAvatar, savedAvatar } from '../net';
import { CARD_STYLES, type CardStyle, getSettings, updateSettings, useSettings } from '../settings';
import { owns, randomOpen, SHOP, type ShopItem, type ShopKind } from '../shop';
import { formatCount } from '../stats';
import { ChipCount, ChipIcon, Modal, UiIcon } from './common';
import { ArtIcon, StyleBackIcon } from './sprites';

const KINDS: ShopKind[] = ['back', 'table', 'avatar'];
/** How long a Buy button waits for its second tap. */
const CONFIRM_MS = 3000;

/** "Red" for `back_red` and `back_red1`, "Red Frame" for `back_red3`, "Red Suits" and "Red Emblem" for 2 and 5. */
export function backName(b: string): string {
  const [, colour, n] = /^back_([a-z]+)(\d*)$/.exec(b) ?? [];
  if (!colour) return b;
  const c = t(`colour.${colour}` as Key);
  const variant: Record<string, Key> = { '3': 'set.cardBack.framed', '2': 'set.cardBack.suits', '5': 'set.cardBack.emblem' };
  return variant[n] ? t(variant[n], { c }) : c;
}

export const itemName = (i: ShopItem): string =>
  i.random ? t('set.cardBack.random') : i.pack ? t('shop.pack', { name: t(`shop.${i.id}` as Key), n: i.pack.length }) : i.kind === 'back' ? backName(i.id) : t(`${i.kind}.${i.id}` as Key);

const css = (rgb: number[]) => `rgb(${rgb.map((v) => Math.round(v * 255)).join(' ')})`;

/** A table's three colours, swirled roughly as the background draws them. */
function TableSwatch({ id }: { id: string }) {
  const [a, b, c] = TABLES[id] ?? TABLES.felt;
  // A flag shows its stripes.
  const flag = STRIPES[id];
  const bg = flag
    ? `linear-gradient(${flag.map((rgb, i) => `${css(rgb)} ${(i * 100) / flag.length}% ${((i + 1) * 100) / flag.length}%`).join(', ')})`
    : `radial-gradient(circle at 35% 40%, ${css(a)}, ${css(b)} 45%, ${css(c)})`;
  return <span class={`shop-table${id === 'negative' ? ' shop-sheen' : ''}`} style={{ background: bg }} aria-hidden="true" />;
}

/** How often Random's tile turns to another of its group. */
const RANDOM_STEP_MS = 420;

/** Random: its tile keeps turning to a different item of its group, under a "?". */
function RandomPreview({ item }: { item: ShopItem }) {
  const group = SHOP.filter((i) => i.kind === item.kind && i.style === item.style && !i.random).flatMap((i): ShopItem[] =>
    i.pack ? i.pack.map((id) => ({ id, kind: i.kind, price: 0, style: i.style })) : [i],
  );
  const [k, setK] = useState(() => Math.floor(Math.random() * group.length));
  useEffect(() => {
    if (getSettings().reducedMotion) return;
    const id = setInterval(() => setK((n) => (n + 1 + Math.floor(Math.random() * (group.length - 1))) % group.length), RANDOM_STEP_MS);
    return () => clearInterval(id);
  }, []);
  return (
    <span class="shop-random-box">
      <span class="shop-random-roll" key={k}>
        <Preview item={group[k]} />
      </span>
      <span class="shop-random">?</span>
    </span>
  );
}

function Preview({ item }: { item: ShopItem }) {
  if (item.random) return <RandomPreview item={item} />;
  if (item.pack)
    return (
      <span class="shop-fan">
        {item.pack.map((b) => (
          <StyleBackIcon style={item.style!} back={b} scale={0.5} />
        ))}
      </span>
    );
  if (item.kind === 'back') return <StyleBackIcon style={item.style!} back={item.id} scale={0.62} />;
  if (item.kind === 'table') return <TableSwatch id={item.id} />;
  return <ArtIcon name={item.id} scale={0.62} />;
}

/** The shop, and where you pick what you use: card backs, table colours and characters. */
export function ShopMenu({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  const chips = useChips();
  const [tab, setTab] = useState<ShopKind>('back');
  const [asking, setAsking] = useState<string | null>(null);
  const [avatar, setAvatar] = useState(savedAvatar() ?? 'villager');
  // A second tap buys; after a while the button goes back to its price.
  useEffect(() => {
    if (!asking) return;
    const id = setTimeout(() => setAsking(null), CONFIRM_MS);
    return () => clearTimeout(id);
  }, [asking]);
  // Tables show behind the shop while their tab is open.
  useEffect(() => {
    previewTable(tab === 'table' && s.table !== 'random' ? s.table : null);
  }, [tab, s.table]);
  useEffect(() => () => previewTable(null), []);

  const equipped = (i: ShopItem) => {
    const id = i.random ? 'random' : i.id;
    return i.kind === 'back' ? s.cardBack === id && s.cardStyle === i.style : i.kind === 'table' ? s.table === id : avatar === id;
  };
  const equip = (i: ShopItem) => {
    play('button', { volume: 0.5 });
    // A pack is put on with its first back.
    const id = i.random ? 'random' : (i.pack?.[0] ?? i.id);
    if (i.kind === 'back') updateSettings({ cardStyle: i.style, cardBack: id });
    else if (i.kind === 'table') updateSettings({ table: id });
    else {
      saveAvatar(i.id);
      setAvatar(i.id);
    }
  };
  const buy = (i: ShopItem) => {
    if (asking !== i.id) {
      play('button', { volume: 0.4 });
      setAsking(i.id);
      return;
    }
    setAsking(null);
    if (!buyItem(i.id, i.price)) return;
    play('coin1');
    equip(i);
  };

  const tile = (i: ShopItem) => {
    const mine = owns(i.id);
    const on = equipped(i);
    const short = i.price - chips.balance;
    // Random waits until the rest of its group is yours.
    const shut = i.random && !mine && !randomOpen(i.kind, i.style);
    // A reward isn't sold: it says which achievement gives it (a hidden one stays hidden).
    const from = i.reward ? ACHIEVEMENTS.find((a) => a.id === i.reward) : undefined;
    return (
      <li class={`shop-item${on ? ' on' : ''}${mine ? '' : ' for-sale'}`} key={i.id} onPointerEnter={i.kind === 'table' && !i.random ? () => previewTable(i.id) : undefined}>
        <span class="shop-preview">
          <Preview item={i} />
        </span>
        <span class="shop-name">{itemName(i)}</span>
        {on ? (
          <span class="shop-state">{t('shop.equipped')}</span>
        ) : from && !mine ? (
          <span class="shop-btn reward" title={t('shop.reward', { name: from.secret && !hasAchievement(from.id) ? t('ach.secret') : t(`ach.${from.id}.name` as Key) })}>
            <UiIcon name="lock" />
          </span>
        ) : mine ? (
          <button type="button" class="shop-btn equip" onClick={() => equip(i)}>
            {t('shop.equip')}
          </button>
        ) : (
          <button
            type="button"
            class={`shop-btn buy${asking === i.id ? ' asking' : ''}`}
            disabled={short > 0 || shut}
            title={shut ? t(`shop.randomShut.${i.kind}` as Key) : short > 0 ? t('shop.need', { n: formatCount(short) }) : undefined}
            onClick={() => buy(i)}
          >
            {asking === i.id ? (
              t('shop.confirm')
            ) : (
              <>
                <ChipIcon size={16} />
                {formatCount(i.price)}
              </>
            )}
          </button>
        )}
      </li>
    );
  };
  /** The group's items in shop order; a pack you own opens into its backs. Random comes last. */
  const items = (kind: ShopKind, style?: CardStyle) =>
    SHOP.filter((i) => i.kind === kind && (!style || i.style === style)).flatMap((i): ShopItem[] =>
      i.pack && owns(i.id) ? i.pack.map((id) => ({ id, kind, price: 0, style })) : [i],
    );

  return (
    <Modal title={t('shop.title')} onClose={onClose} class="shop-modal">
      <div class="sticky-top shop-top">
        <ChipCount />
        <div class="tabs" role="tablist">
          {KINDS.map((k) => (
            <button type="button" role="tab" aria-selected={tab === k} class={`tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>
              {t(`shop.tab.${k}`)}
            </button>
          ))}
        </div>
      </div>
      {tab === 'back' &&
        CARD_STYLES.map((style) => (
          <section class="shop-section">
            <h4>{t(`set.cardStyle.${style}`)}</h4>
            <ul class="shop-grid">
              {items('back', style).map(tile)}
            </ul>
          </section>
        ))}
      {tab === 'table' && (
        <section class="shop-section">
          <p class="muted small center">{t('shop.tableHint')}</p>
          <ul class="shop-grid" onPointerLeave={() => previewTable(s.table !== 'random' ? s.table : null)}>
            {items('table').map(tile)}
          </ul>
        </section>
      )}
      {tab === 'avatar' && (
        <section class="shop-section">
          <p class="muted small center">{t('shop.avatarHint')}</p>
          <ul class="shop-grid">{items('avatar').map(tile)}</ul>
        </section>
      )}
    </Modal>
  );
}
