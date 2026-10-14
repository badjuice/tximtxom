import type { Rules } from '@tximtxom/shared';
import { Choice, Toggle } from './common';

/** The room settings, each next to its Joker. */
export function RulesForm({ rules, onChange, readOnly }: { rules: Rules; onChange: (r: Partial<Rules>) => void; readOnly?: boolean }) {
  return (
    <div class="rules-form">
      <Choice
        label="Bust at"
        desc="A player who goes OVER this total loses; lowest total wins"
        joker="mr_bones"
        value={rules.threshold}
        options={[
          { value: 40, label: '40' },
          { value: 100, label: '100' },
        ]}
        onChange={(threshold) => onChange({ threshold })}
        disabled={readOnly}
      />
      <Toggle
        label="Hardcore"
        desc="No pairs: only trios, quads and straights count"
        joker="trio"
        checked={rules.hardcore}
        onChange={(hardcore) => onChange({ hardcore })}
        disabled={readOnly}
      />
      <Toggle
        label="Superposition"
        desc="Ace can be high (Q-K-A) or low (A-2-3), never in the middle. Still worth 1"
        joker="superposition"
        checked={rules.superposition}
        onChange={(superposition) => onChange({ superposition })}
        disabled={readOnly}
      />
      <Choice
        label="Take a Ride order"
        desc="Everyone at once, or one player at a time"
        joker="ride_the_bus"
        value={rules.rideOrder}
        options={[
          { value: 'simultaneous', label: 'Together' },
          { value: 'roundRobin', label: 'In turns' },
        ]}
        onChange={(rideOrder) => onChange({ rideOrder })}
        disabled={readOnly}
      />
      <Toggle
        label="Auto Ride"
        desc="The game places ride cards for everyone"
        joker="chaos"
        checked={rules.autoRide}
        onChange={(autoRide) => onChange({ autoRide })}
        disabled={readOnly}
      />
      <Toggle
        label="Formation notice"
        desc='Say "no more formations possible" while revealing (no other hints)'
        joker="blueprint"
        checked={rules.noMoreFormationsNotice}
        onChange={(noMoreFormationsNotice) => onChange({ noMoreFormationsNotice })}
        disabled={readOnly}
      />
      <Toggle
        label="Double Down"
        desc="Ender without the strictly lowest round score: points x2"
        joker="duo"
        checked={rules.doubleDown}
        onChange={(doubleDown) => onChange({ doubleDown })}
        disabled={readOnly}
      />
      <Toggle
        label="Penalty +10"
        desc="Ender without the strictly lowest round score: +10 (after any doubling)"
        joker="credit_card"
        checked={rules.penalty10}
        onChange={(penalty10) => onChange({ penalty10 })}
        disabled={readOnly}
      />
      <Choice
        label="Turn timer"
        desc="When time runs out, a bot finishes the move"
        joker="hourglass"
        value={rules.turnTimer}
        options={[
          { value: 0, label: 'Off' },
          { value: 30, label: '30s' },
          { value: 60, label: '60s' },
        ]}
        onChange={(turnTimer) => onChange({ turnTimer })}
        disabled={readOnly}
      />
    </div>
  );
}
