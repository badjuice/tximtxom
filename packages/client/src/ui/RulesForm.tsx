import type { ComponentChildren } from 'preact';
import type { Rules } from '@tximtxom/shared';
import { t } from '../i18n';
import { Choice, Toggle } from './common';
import { ArtIcon } from './sprites';

/** The room settings, each next to its Joker. */
export function RulesForm({ rules, onChange, readOnly }: { rules: Rules; onChange: (r: Partial<Rules>) => void; readOnly?: boolean }) {
  return (
    <div class="rules-form">
      <p class="rules-legend">
        <span class="lg tone-punish">{t('rule.tone.punish')}</span>
        <span class="lg tone-info">{t('rule.tone.info')}</span>
        <span class="lg tone-support">{t('rule.tone.support')}</span>
        <span class="lg">{t('rule.tone.neutral')}</span>
      </p>
      <Choice
        label={t('rule.bust')}
        desc={t('rule.bust.desc')}
        joker="bust"
        value={rules.threshold}
        options={[
          { value: 40, label: '40' },
          { value: 100, label: '100' },
        ]}
        onChange={(threshold) => onChange({ threshold })}
        disabled={readOnly}
      />
      <Toggle label={t('rule.softcore')} desc={t('rule.softcore.desc')} joker="softcore" tone="support" checked={rules.softcore} onChange={(softcore) => onChange({ softcore })} disabled={readOnly} />
      <Toggle
        label={t('rule.superposition')}
        desc={t('rule.superposition.desc')}
        joker="ace" tone="support"
        checked={rules.superposition}
        onChange={(superposition) => onChange({ superposition })}
        disabled={readOnly}
      />
      <Toggle label={t('rule.smeared')} desc={t('rule.smeared.desc')} joker="mixed" tone="support" checked={rules.smeared} onChange={(smeared) => onChange({ smeared })} disabled={readOnly} />
      <Choice
        label={t('rule.rideOrder')}
        desc={t('rule.rideOrder.desc')}
        joker="ride"
        value={rules.rideOrder}
        options={[
          { value: 'simultaneous', label: t('rule.together') },
          { value: 'roundRobin', label: t('rule.inTurns') },
        ]}
        onChange={(rideOrder) => onChange({ rideOrder })}
        disabled={readOnly}
      />
      <Toggle label={t('rule.autoRide')} desc={t('rule.autoRide.desc')} joker="autoride" tone="support" checked={rules.autoRide} onChange={(autoRide) => onChange({ autoRide })} disabled={readOnly} />
      <Toggle
        label={t('rule.sixthSense')}
        desc={t('rule.sixthSense.desc')}
        joker="peek" tone="info"
        checked={rules.sixthSense}
        onChange={(sixthSense) => onChange({ sixthSense })}
        disabled={readOnly}
      />
      <Toggle
        label={t('rule.notice')}
        desc={t('rule.notice.desc')}
        joker="notice" tone="info"
        checked={rules.noMoreFormationsNotice}
        onChange={(noMoreFormationsNotice) => onChange({ noMoreFormationsNotice })}
        disabled={readOnly}
      />
      <Toggle label={t('rule.penalty10')} desc={t('rule.penalty10.desc')} joker="penalty" tone="punish" checked={rules.penalty10} onChange={(penalty10) => onChange({ penalty10 })} disabled={readOnly} />
      <Toggle label={t('rule.doubleDown')} desc={t('rule.doubleDown.desc')} joker="double" tone="punish" checked={rules.doubleDown} onChange={(doubleDown) => onChange({ doubleDown })} disabled={readOnly} />
      <Choice
        label={t('rule.timer')}
        desc={t('rule.timer.desc')}
        joker="timer"
        value={rules.turnTimer}
        options={[
          { value: 0, label: t('rule.off') },
          { value: 30, label: '30s' },
          { value: 60, label: '60s' },
        ]}
        onChange={(turnTimer) => onChange({ turnTimer })}
        disabled={readOnly}
      />
    </div>
  );
}

/** The rules of a game in progress at a glance: two columns, each rule with its
 *  Joker and its state (On in green, Off in red, or the value it is set to). */
export function RulesSummary({ rules }: { rules: Rules }) {
  const onOff = (on: boolean) => <b class={on ? 'rs-on' : 'rs-off'}>{on ? t('rule.on') : t('rule.off')}</b>;
  const rows: [string, string, ComponentChildren][] = [
    ['bust', t('rule.bust'), <b class="rs-val">{rules.threshold}</b>],
    ['softcore', t('rule.softcore'), onOff(rules.softcore)],
    ['ace', t('rule.superposition'), onOff(rules.superposition)],
    ['mixed', t('rule.smeared'), onOff(rules.smeared)],
    ['ride', t('rule.rideOrder'), <b class="rs-val">{rules.rideOrder === 'roundRobin' ? t('rule.inTurns') : t('rule.together')}</b>],
    ['autoride', t('rule.autoRide'), onOff(rules.autoRide)],
    ['peek', t('rule.sixthSense'), onOff(rules.sixthSense)],
    ['notice', t('rule.notice'), onOff(rules.noMoreFormationsNotice)],
    ['penalty', t('rule.penalty10'), onOff(rules.penalty10)],
    ['double', t('rule.doubleDown'), onOff(rules.doubleDown)],
    ['timer', t('rule.timer'), rules.turnTimer ? <b class="rs-val">{rules.turnTimer}s</b> : onOff(false)],
  ];
  return (
    <ul class="rules-summary">
      {rows.map(([art, name, state]) => (
        <li>
          <ArtIcon name={art} scale={0.3} />
          <span class="rs-name">{name}</span>
          {state}
        </li>
      ))}
    </ul>
  );
}
