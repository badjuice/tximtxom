import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import type { Rules } from '@tximtxom/shared';
import { chipMultiplier, RULE_PAY, RULE_PAY_ON } from '../chips';
import { t } from '../i18n';
import { toast } from '../store';

const RULE_KEY = { magicSort: 'rule.magicSort', scramble: 'rule.scramble' } as const;
import { ChipIcon, Choice, RuleName, Toggle } from './common';
import { ArtIcon } from './sprites';

/** The room settings, each next to its Joker. */
export function RulesForm({ rules, onChange, readOnly }: { rules: Rules; onChange: (r: Partial<Rules>) => void; readOnly?: boolean }) {
  // Magic Sort and Scramble can't both be on: turning one on turns the other off, and says so.
  const exclusive = (rule: 'magicSort' | 'scramble', other: 'magicSort' | 'scramble', on: boolean): Partial<Rules> => {
    if (!on || !rules[other]) return { [rule]: on };
    toast(t('rule.excludes', { rule: t(RULE_KEY[rule]), other: t(RULE_KEY[other]) }));
    return { [rule]: true, [other]: false };
  };
  const [showPay, setShowPay] = useState(false);
  // A toggle's tag shows what it pays when on; a choice's, its current setting.
  const on = (rule: keyof Rules) => RULE_PAY_ON[rule];
  const now = (rule: keyof Rules) => RULE_PAY[rule]?.(rules) ?? 1;
  const total = chipMultiplier(rules);
  return (
    <div class={`rules-form${showPay ? ' show-pay' : ''}`}>
      {/* Stays put while the rules below scroll. */}
      <div class="rules-head">
        <p class="rules-legend">
          <span class="lg tone-punish">{t('rule.tone.punish')}</span>
          <span class="lg tone-info">{t('rule.tone.info')}</span>
          <span class="lg tone-support">{t('rule.tone.support')}</span>
          <span class="lg tone-funny">{t('rule.tone.funny')}</span>
          <span class="lg">{t('rule.tone.neutral')}</span>
        </p>
        <div class="rules-pay-row">
          <button type="button" class={`rules-pay-btn${showPay ? ' on' : ''}`} aria-pressed={showPay} onClick={() => setShowPay((v) => !v)}>
            <ChipIcon size={16} />
            {t('rule.payShow')}
          </button>
          {/* Always there, so the row never changes height. */}
          <span class={`rules-pay-total${total > 1 ? ' up' : total < 1 ? ' down' : ''}`}>{t('rule.payTotal', { k: `×${total}` })}</span>
        </div>
      </div>
      <div class="rules-list">
      <div class="rules-grid">
      <Choice
        label={t('rule.rounds')}
        desc={t('rule.rounds.desc')}
        joker="timer"
        value={rules.rounds}
        options={[
          { value: 0, label: t('rule.off') },
          { value: 5, label: '5' },
          { value: 10, label: '10' },
        ]}
        onChange={(rounds) => onChange({ rounds })}
        disabled={readOnly}
        pay={1}
      />
      <Choice
        label={t('rule.bust')}
        desc={t('rule.bust.desc')}
        off={rules.rounds ? t('rule.bust.off') : undefined}
        pay={1}
        joker="bust"
        value={rules.threshold}
        options={[
          { value: 40, label: '40' },
          { value: 50, label: '50' },
          { value: 100, label: '100' },
        ]}
        onChange={(threshold) => onChange({ threshold })}
        disabled={readOnly}
      />
      <Toggle pay={on('softcore')} label={t('rule.softcore')} desc={t('rule.softcore.desc')} joker="softcore" tone="support" checked={rules.softcore} onChange={(softcore) => onChange({ softcore })} disabled={readOnly} />
      <Toggle pay={on('superposition')}
        label={t('rule.superposition')}
        desc={t('rule.superposition.desc')}
        joker="ace" tone="support"
        checked={rules.superposition}
        rule="superposition"
        // Mobius Strip only works on top of it, so it goes off too.
        onChange={(superposition) => onChange(superposition ? { superposition } : { superposition, mobius: false })}
        disabled={readOnly}
      />
      <Toggle pay={on('mobius')}
        label={t('rule.mobius')}
        desc={t('rule.mobius.desc')}
        joker="ace" tone="support"
        checked={rules.mobius}
        onChange={(mobius) => onChange({ mobius })}
        disabled={readOnly}
        locked={rules.superposition ? undefined : t('rule.superposition')}
        lockedTone="support"
        lockedBy="superposition"
      />
      <Toggle pay={on('smeared')} label={t('rule.smeared')} desc={t('rule.smeared.desc')} joker="mixed" tone="support" checked={rules.smeared} onChange={(smeared) => onChange({ smeared })} disabled={readOnly} />
      <Toggle pay={on('magicSort')} label={t('rule.magicSort')} desc={t('rule.magicSort.desc')} joker="magicsort" tone="support" checked={rules.magicSort} onChange={(magicSort) => onChange(exclusive('magicSort', 'scramble', magicSort))} disabled={readOnly} />
      <Choice
        label={t('rule.rideOrder')}
        desc={t('rule.rideOrder.desc')}
        joker="ride"
        pay={1}
        value={rules.rideOrder}
        options={[
          { value: 'simultaneous', label: t('rule.together') },
          { value: 'roundRobin', label: t('rule.inTurns') },
        ]}
        onChange={(rideOrder) => onChange({ rideOrder })}
        disabled={readOnly}
      />
      <Choice
        label={t('rule.rides')}
        desc={t('rule.rides.desc')}
        joker="ride"
        pay={now('rides')}
        value={rules.rides}
        options={[
          { value: 'any', label: t('rule.rides.any') },
          { value: 'one', label: t('rule.rides.one') },
          { value: 'none', label: t('rule.rides.none') },
        ]}
        onChange={(rides) => onChange({ rides })}
        disabled={readOnly}
      />
      <Toggle pay={1} label={t('rule.autoRide')} desc={t('rule.autoRide.desc')} joker="autoride" tone="support" checked={rules.autoRide} onChange={(autoRide) => onChange({ autoRide })} disabled={readOnly} />
      <Toggle pay={on('sixthSense')}
        label={t('rule.sixthSense')}
        desc={t('rule.sixthSense.desc')}
        joker="peek" tone="info"
        checked={rules.sixthSense}
        onChange={(sixthSense) => onChange({ sixthSense })}
        disabled={readOnly}
      />
      <Toggle pay={1}
        label={t('rule.notice')}
        desc={t('rule.notice.desc')}
        joker="notice" tone="info"
        checked={rules.noMoreFormationsNotice}
        onChange={(noMoreFormationsNotice) => onChange({ noMoreFormationsNotice })}
        disabled={readOnly}
      />
      <Toggle pay={on('penalty10')} label={t('rule.penalty10')} desc={t('rule.penalty10.desc')} joker="penalty" tone="punish" checked={rules.penalty10} onChange={(penalty10) => onChange({ penalty10 })} disabled={readOnly} />
      <Toggle pay={on('doubleDown')} label={t('rule.doubleDown')} desc={t('rule.doubleDown.desc')} joker="double" tone="punish" checked={rules.doubleDown} onChange={(doubleDown) => onChange({ doubleDown })} disabled={readOnly} />
      <Choice
        label={t('rule.timer')}
        desc={t('rule.timer.desc')}
        joker="timer"
        pay={now('turnTimer')}
        value={rules.turnTimer}
        options={[
          { value: 0, label: t('rule.off') },
          { value: 30, label: '30s' },
          { value: 60, label: '60s' },
        ]}
        onChange={(turnTimer) => onChange({ turnTimer })}
        disabled={readOnly}
      />
      <Toggle pay={on('scramble')} label={t('rule.scramble')} desc={t('rule.scramble.desc')} joker="scramble" tone="funny" checked={rules.scramble} onChange={(scramble) => onChange(exclusive('scramble', 'magicSort', scramble))} disabled={readOnly} />
      <Toggle pay={on('polydactyly')}
        label={t('rule.polydactyly')}
        desc={t('rule.polydactyly.desc')}
        joker="polydactyly"
        tone="funny"
        checked={rules.polydactyly}
        // Bigger hands hold more points: the limit moves from 40 to 50 with it (and back).
        onChange={(polydactyly) =>
          onChange({ polydactyly, ...(polydactyly && rules.threshold === 40 ? { threshold: 50 } : !polydactyly && rules.threshold === 50 ? { threshold: 40 } : {}) })
        }
        disabled={readOnly}
      />
      <Toggle pay={on('twoDecks')} label={t('rule.twoDecks')} desc={t('rule.twoDecks.desc')} joker="twodecks" tone="support" checked={rules.twoDecks} onChange={(twoDecks) => onChange({ twoDecks })} disabled={readOnly} />
      </div>
      </div>
    </div>
  );
}

/** The rules of a game in progress at a glance: two columns, each rule with its
 *  Joker and its state (On in green, Off in red, or the value it is set to). */
export function RulesSummary({ rules }: { rules: Rules }) {
  const onOff = (on: boolean) => <b class={on ? 'rs-on' : 'rs-off'}>{on ? t('rule.on') : t('rule.off')}</b>;
  // Art, name, description, state, and the rule's tone (as in the room's rules).
  const rows: [string, string, string, ComponentChildren, string?][] = [
    ['timer', t('rule.rounds'), t('rule.rounds.desc'), rules.rounds ? <b class="rs-val">{rules.rounds}</b> : onOff(false)],
    ['bust', t('rule.bust'), t('rule.bust.desc'), rules.rounds ? onOff(false) : <b class="rs-val">{rules.threshold}</b>],
    ['softcore', t('rule.softcore'), t('rule.softcore.desc'), onOff(rules.softcore), 'support'],
    ['ace', t('rule.superposition'), t('rule.superposition.desc'), onOff(rules.superposition), 'support'],
    ['ace', t('rule.mobius'), t('rule.mobius.desc'), onOff(rules.mobius), 'support'],
    ['mixed', t('rule.smeared'), t('rule.smeared.desc'), onOff(rules.smeared), 'support'],
    ['magicsort', t('rule.magicSort'), t('rule.magicSort.desc'), onOff(rules.magicSort), 'support'],
    ['ride', t('rule.rideOrder'), t('rule.rideOrder.desc'), <b class="rs-val">{rules.rideOrder === 'roundRobin' ? t('rule.inTurns') : t('rule.together')}</b>],
    ['ride', t('rule.rides'), t('rule.rides.desc'), <b class="rs-val">{t(`rule.rides.${rules.rides}`)}</b>],
    ['autoride', t('rule.autoRide'), t('rule.autoRide.desc'), onOff(rules.autoRide), 'support'],
    ['peek', t('rule.sixthSense'), t('rule.sixthSense.desc'), onOff(rules.sixthSense), 'info'],
    ['notice', t('rule.notice'), t('rule.notice.desc'), onOff(rules.noMoreFormationsNotice), 'info'],
    ['penalty', t('rule.penalty10'), t('rule.penalty10.desc'), onOff(rules.penalty10), 'punish'],
    ['double', t('rule.doubleDown'), t('rule.doubleDown.desc'), onOff(rules.doubleDown), 'punish'],
    ['timer', t('rule.timer'), t('rule.timer.desc'), rules.turnTimer ? <b class="rs-val">{rules.turnTimer}s</b> : onOff(false)],
    ['scramble', t('rule.scramble'), t('rule.scramble.desc'), onOff(rules.scramble), 'funny'],
    ['polydactyly', t('rule.polydactyly'), t('rule.polydactyly.desc'), onOff(rules.polydactyly), 'funny'],
    ['twodecks', t('rule.twoDecks'), t('rule.twoDecks.desc'), onOff(rules.twoDecks), 'support'],
  ];
  return (
    <ul class="rules-summary">
      {rows.map(([art, name, desc, state, tone]) => (
        <li>
          <ArtIcon name={art} scale={0.3} rule />
          <span class="rs-name">
            <RuleName name={name} tone={tone} />
            <span class="rs-desc">{desc}</span>
          </span>
          {state}
        </li>
      ))}
    </ul>
  );
}
