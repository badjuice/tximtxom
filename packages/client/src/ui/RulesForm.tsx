import type { Rules } from '@tximtxom/shared';
import { t } from '../i18n';
import { Choice, Toggle } from './common';

/** The room settings, each next to its Joker. */
export function RulesForm({ rules, onChange, readOnly }: { rules: Rules; onChange: (r: Partial<Rules>) => void; readOnly?: boolean }) {
  return (
    <div class="rules-form">
      <Choice
        label={t('rule.bust')}
        desc={t('rule.bust.desc')}
        joker="mr_bones"
        value={rules.threshold}
        options={[
          { value: 40, label: '40' },
          { value: 100, label: '100' },
        ]}
        onChange={(threshold) => onChange({ threshold })}
        disabled={readOnly}
      />
      <Toggle label={t('rule.hardcore')} desc={t('rule.hardcore.desc')} joker="trio" checked={rules.hardcore} onChange={(hardcore) => onChange({ hardcore })} disabled={readOnly} />
      <Toggle
        label={t('rule.superposition')}
        desc={t('rule.superposition.desc')}
        joker="superposition"
        checked={rules.superposition}
        onChange={(superposition) => onChange({ superposition })}
        disabled={readOnly}
      />
      <Choice
        label={t('rule.rideOrder')}
        desc={t('rule.rideOrder.desc')}
        joker="ride_the_bus"
        value={rules.rideOrder}
        options={[
          { value: 'simultaneous', label: t('rule.together') },
          { value: 'roundRobin', label: t('rule.inTurns') },
        ]}
        onChange={(rideOrder) => onChange({ rideOrder })}
        disabled={readOnly}
      />
      <Toggle label={t('rule.autoRide')} desc={t('rule.autoRide.desc')} joker="chaos" checked={rules.autoRide} onChange={(autoRide) => onChange({ autoRide })} disabled={readOnly} />
      <Toggle
        label={t('rule.sixthSense')}
        desc={t('rule.sixthSense.desc')}
        joker="sixth_sense"
        checked={rules.sixthSense}
        onChange={(sixthSense) => onChange({ sixthSense })}
        disabled={readOnly}
      />
      <Toggle
        label={t('rule.notice')}
        desc={t('rule.notice.desc')}
        joker="blueprint"
        checked={rules.noMoreFormationsNotice}
        onChange={(noMoreFormationsNotice) => onChange({ noMoreFormationsNotice })}
        disabled={readOnly}
      />
      <Toggle label={t('rule.doubleDown')} desc={t('rule.doubleDown.desc')} joker="duo" checked={rules.doubleDown} onChange={(doubleDown) => onChange({ doubleDown })} disabled={readOnly} />
      <Toggle label={t('rule.penalty10')} desc={t('rule.penalty10.desc')} joker="credit_card" checked={rules.penalty10} onChange={(penalty10) => onChange({ penalty10 })} disabled={readOnly} />
      <Choice
        label={t('rule.timer')}
        desc={t('rule.timer.desc')}
        joker="hourglass"
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
