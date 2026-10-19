import type { Rules } from '@tximtxom/shared';
import { t } from '../i18n';
import { Choice, Toggle } from './common';

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
      <Toggle label={t('rule.hardcore')} desc={t('rule.hardcore.desc')} joker="hardcore" tone="punish" checked={rules.hardcore} onChange={(hardcore) => onChange({ hardcore })} disabled={readOnly} />
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
      <Toggle label={t('rule.doubleDown')} desc={t('rule.doubleDown.desc')} joker="double" tone="punish" checked={rules.doubleDown} onChange={(doubleDown) => onChange({ doubleDown })} disabled={readOnly} />
      <Toggle label={t('rule.penalty10')} desc={t('rule.penalty10.desc')} joker="penalty" tone="punish" checked={rules.penalty10} onChange={(penalty10) => onChange({ penalty10 })} disabled={readOnly} />
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
