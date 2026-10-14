import { Howl, Howler } from 'howler';
import { getSettings, onSettings } from './settings';

export type Sfx =
  | 'button' | 'cancel' | 'highlight1' | 'highlight2' | 'card1' | 'card3' | 'cardSlide1' | 'cardSlide2'
  | 'cardFan2' | 'paper1' | 'chips1' | 'chips2' | 'coin1' | 'coin2' | 'coin3' | 'multhit1' | 'multhit2'
  | 'whoosh1' | 'whoosh2' | 'gong' | 'win' | 'glass1' | 'crumple1' | 'tarot1' | 'timpani' | 'foil1'
  | 'negative' | 'generic1' | 'explosion1';

let sfx: Howl | null = null;
let music: Howl | null = null;
let musicId: number | undefined;

export async function initAudio(): Promise<void> {
  const sprite = (await (await fetch('/assets/sfx.json')).json()) as Record<string, [number, number]>;
  sfx = new Howl({ src: ['/assets/sfx.webm', '/assets/sfx.mp3'], sprite, preload: true });
  music = new Howl({ src: ['/assets/music1.webm', '/assets/music1.mp3'], loop: true, html5: true, preload: false });
  applyVolumes();
  onSettings(applyVolumes);
}

function applyVolumes(): void {
  const s = getSettings();
  Howler.mute(s.muted);
  Howler.volume(s.masterVolume);
  if (music) {
    music.volume(s.musicVolume * 0.6);
    if (s.musicVolume > 0 && !s.muted) startMusic();
    else if (musicId !== undefined) {
      music.pause(musicId);
    }
  }
}

/** Music may only start after a user gesture (mobile autoplay rules). */
let unlocked = false;
export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;
  applyVolumes();
}

function startMusic(): void {
  if (!unlocked || !music) return;
  if (music.state() === 'unloaded') music.load();
  if (musicId === undefined) musicId = music.play();
  else if (!music.playing(musicId)) music.play(musicId);
}

/** Plays a sound effect with optional pitch (rate) and volume tweaks. */
export function play(name: Sfx, opts: { rate?: number; volume?: number; delay?: number } = {}): void {
  if (!sfx) return;
  const go = () => {
    const id = sfx!.play(name);
    const s = getSettings();
    sfx!.volume((opts.volume ?? 1) * s.sfxVolume, id);
    // Balatro-style slight random pitch so repeats don't sound robotic.
    sfx!.rate((opts.rate ?? 1) * (0.96 + Math.random() * 0.08), id);
  };
  if (opts.delay) setTimeout(go, opts.delay);
  else go();
}

export function vibrate(pattern: number | number[]): void {
  if (getSettings().haptics && 'vibrate' in navigator) navigator.vibrate(pattern);
}
