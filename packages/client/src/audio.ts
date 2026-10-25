import { Howl, Howler } from 'howler';
import { getSettings, onSettings } from './settings';

const A = `${import.meta.env.BASE_URL}assets/`;

export type Sfx =
  | 'button' | 'cancel' | 'highlight1' | 'highlight2' | 'card1' | 'card3' | 'cardSlide1' | 'cardSlide2'
  | 'cardFan2' | 'chips1' | 'coin1' | 'coin2' | 'multhit1' | 'multhit2' | 'whoosh1' | 'win' | 'tarot1'
  | 'foil1' | 'negative' | 'explosion1'
  | 'editionFoil' | 'editionHolo' | 'editionPoly' | 'editionNegative';

let sfx: Howl | null = null;
let music: Howl | null = null;
let musicId: number | undefined;

/**
 * Starts streaming the music at once and tries to play it. Resolves true once
 * it plays (or there's no music to play), false if the browser wants a click
 * first or it isn't ready within `maxMs`.
 */
export function initAudio(maxMs = 4000): Promise<boolean> {
  music = new Howl({ src: [`${A}theme.webm`, `${A}theme.mp3`], loop: true, html5: true, preload: true });
  applyVolumes();
  onSettings(applyVolumes);
  // Howler's own unlock on the first click reloads the audio, cutting off a play
  // started on pointerdown, so start again once it's done.
  music.once('unlock', applyVolumes);
  // Browsers that allow sound before any click (sites played often) start it now;
  // elsewhere this play is refused and unlockAudio resumes it on the first click.
  const s = getSettings();
  const playing = new Promise<boolean>((done) => {
    if (!(s.musicVolume > 0 && !s.muted)) return done(true);
    music!.once('play', () => done(true));
    music!.once('playerror', () => done(false));
    music!.once('loaderror', () => done(true));
    setTimeout(() => done(false), maxMs);
    musicId = music!.play();
  });
  void fetch(`${A}sfx.json`)
    .then((r) => r.json())
    .then((sprite: Record<string, [number, number]>) => {
      sfx = new Howl({ src: [`${A}sfx.webm`, `${A}sfx.mp3`], sprite, preload: true });
    });
  return playing;
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
