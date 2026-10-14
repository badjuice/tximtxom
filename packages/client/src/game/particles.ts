import { Container, Sprite, Texture } from 'pixi.js';
import { getSettings } from '../settings';

interface Particle {
  s: Sprite;
  vx: number;
  vy: number;
  life: number;
  max: number;
  spin: number;
  gravity: number;
  grow: number;
}

/** Square pixel particles, like Balatro's chip/mult bursts. */
export class Particles extends Container {
  private list: Particle[] = [];

  burst(x: number, y: number, opts: { count?: number; colors?: number[]; speed?: number; size?: number; gravity?: number; life?: number; spread?: number } = {}): void {
    const s = getSettings();
    if (s.reducedMotion) return;
    const count = Math.round((opts.count ?? 18) * (s.safeFlash ? 0.5 : 1));
    const colors = opts.colors ?? [0xffffff, 0xfda200, 0xfe5f55];
    for (let i = 0; i < count; i++) {
      const sprite = new Sprite(Texture.WHITE);
      sprite.anchor.set(0.5);
      const size = (opts.size ?? 6) * (0.6 + Math.random() * 0.8);
      sprite.width = sprite.height = size;
      sprite.tint = colors[i % colors.length];
      sprite.position.set(x, y);
      const a = (opts.spread ?? Math.PI * 2) * (Math.random() - 0.5) - (opts.spread ? Math.PI / 2 : 0);
      const v = (opts.speed ?? 260) * (0.4 + Math.random() * 0.8);
      const life = (opts.life ?? 0.8) * (0.6 + Math.random() * 0.6);
      this.list.push({ s: sprite, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, spin: (Math.random() - 0.5) * 10, gravity: opts.gravity ?? 500, grow: -0.6 });
      this.addChild(sprite);
    }
  }

  /** Soft rising sparkles (used for -10 and wins). */
  sparkle(x: number, y: number, w: number, h: number, count = 30, colors = [0xfff6a8, 0xfda200, 0xffffff]): void {
    if (getSettings().reducedMotion) return;
    for (let i = 0; i < count; i++) {
      this.burst(x + (Math.random() - 0.5) * w, y + (Math.random() - 0.5) * h, { count: 1, colors, speed: 60, gravity: -80, life: 1.4, size: 5 });
    }
  }

  update(dt: number): void {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.s.destroy();
        this.list.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.vx *= 1 - dt * 1.5;
      p.s.x += p.vx * dt;
      p.s.y += p.vy * dt;
      p.s.rotation += p.spin * dt;
      const k = p.life / p.max;
      p.s.alpha = Math.min(1, k * 2);
      p.s.scale.set(p.s.scale.x * (1 + p.grow * dt));
    }
  }
}

/** Screen shake that decays over time. */
export class Shake {
  private amount = 0;
  x = 0;
  y = 0;

  add(amount: number): void {
    const s = getSettings();
    if (s.reducedMotion || !s.screenShake) return;
    this.amount = Math.min(18, this.amount + amount);
  }

  update(dt: number): void {
    this.amount = Math.max(0, this.amount - dt * 30);
    this.x = (Math.random() - 0.5) * this.amount;
    this.y = (Math.random() - 0.5) * this.amount;
  }
}
