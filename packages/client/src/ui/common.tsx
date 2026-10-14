import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { play } from '../audio';
import { JokerIcon } from './sprites';

type Color = 'red' | 'blue' | 'orange' | 'green' | 'grey' | 'purple';

export function Button(props: {
  color?: Color;
  onClick?: () => void;
  disabled?: boolean;
  children: ComponentChildren;
  class?: string;
  title?: string;
  kbd?: string;
  big?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={props.type ?? 'button'}
      class={`btn btn-${props.color ?? 'blue'}${props.big ? ' btn-big' : ''} ${props.class ?? ''}`}
      disabled={props.disabled}
      title={props.title}
      onClick={() => {
        if (props.type !== 'submit') play('button', { volume: 0.7 });
        props.onClick?.();
      }}
    >
      <span class="btn-label">{props.children}</span>
      {props.kbd && <kbd class="kbd" aria-hidden="true">{props.kbd}</kbd>}
    </button>
  );
}

export function Toggle(props: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  joker?: string;
  disabled?: boolean;
}) {
  return (
    <label class={`toggle${props.disabled ? ' disabled' : ''}`}>
      {props.joker && <JokerIcon name={props.joker} scale={0.55} />}
      <span class="toggle-text">
        <span class="toggle-label">{props.label}</span>
        {props.desc && <span class="toggle-desc">{props.desc}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(e) => {
          play('button', { volume: 0.5, rate: (e.target as HTMLInputElement).checked ? 1.2 : 0.9 });
          props.onChange((e.target as HTMLInputElement).checked);
        }}
      />
      <span class="switch" aria-hidden="true" />
    </label>
  );
}

export function Choice<T extends string | number>(props: {
  label: string;
  desc?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  joker?: string;
  disabled?: boolean;
}) {
  return (
    <div class={`toggle choice${props.disabled ? ' disabled' : ''}`} role="group" aria-label={props.label}>
      {props.joker && <JokerIcon name={props.joker} scale={0.55} />}
      <span class="toggle-text">
        <span class="toggle-label">{props.label}</span>
        {props.desc && <span class="toggle-desc">{props.desc}</span>}
      </span>
      <span class="seg">
        {props.options.map((o) => (
          <button
            type="button"
            class={o.value === props.value ? 'on' : ''}
            aria-pressed={o.value === props.value}
            disabled={props.disabled}
            onClick={() => {
              play('button', { volume: 0.5 });
              props.onChange(o.value);
            }}
          >
            {o.label}
          </button>
        ))}
      </span>
    </div>
  );
}

export function Slider(props: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <label class="toggle slider">
      <span class="toggle-text">
        <span class="toggle-label">{props.label}</span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onInput={(e) => props.onChange(Number((e.target as HTMLInputElement).value))}
      />
      <span class="slider-val">{props.format ? props.format(props.value) : props.value}</span>
    </label>
  );
}

/** Balatro-style panel in a dimmed overlay. Esc / backdrop closes it. */
export function Modal(props: { title: string; onClose: () => void; children: ComponentChildren; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        props.onClose();
      }
    };
    addEventListener('keydown', onKey, true);
    return () => {
      removeEventListener('keydown', onKey, true);
      prev?.focus?.();
    };
  }, []);
  return (
    <div class="modal-backdrop" onClick={(e) => e.target === e.currentTarget && props.onClose()}>
      <div class={`panel modal${props.wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={props.title} tabIndex={-1} ref={ref}>
        <div class="modal-head">
          <h2>{props.title}</h2>
        </div>
        <div class="modal-body">{props.children}</div>
        <div class="modal-foot">
          <Button color="orange" onClick={props.onClose} kbd="Esc">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
