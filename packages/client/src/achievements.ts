// Achievements: unlocked on this device and saved with it, like your stats.
// Each one unlocks once; a toast at the top of the screen announces it, one at
// a time. Infected is the odd one: it passes between players who share a room
// (see `infected` in the room protocol), and the very first player to start a
// game gets it from nobody (see claimPatientZero in stats.ts).
import { bustLimit, type Card, classifyFormation, type GameEvent, type GameView, rankOf, type RoomView, type Rules, suitOf } from '@tximtxom/shared';
import { useEffect, useState } from 'preact/hooks';
import { play } from './audio';
import { getSettings, onSettings } from './settings';
import { store } from './store';
import { ACH_PAY, chipsEarned, chipsNow, earn, grantItem, onChips, payBack } from './chips';
import { ownsEverything, SOLD } from './shop';
import { claimPatientZero, countInfected, creditCarrier, type MyStats, myStats, onStats } from './stats';

const CARRIER_KEY = 'tximtxom.carrier';
const newCarrierId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
/** Used when storage is blocked: a new id each visit. */
let carrierFallback = '';
/** This device's anonymous carrier id: a random token, so the players who catch
 *  Infected from you can be counted without knowing who you are. */
export function carrierId(): string {
  try {
    let id = localStorage.getItem(CARRIER_KEY);
    if (!id || !/^[a-z0-9]{12}$/.test(id)) {
      id = newCarrierId();
      localStorage.setItem(CARRIER_KEY, id);
    }
    return id;
  } catch {
    return (carrierFallback ||= newCarrierId());
  }
}

export type AchievementId =
  | 'tipTap' | 'dealtIn' | 'lowRoller' | 'champion' | 'competitor' | 'tximtxom' | 'bitter' | 'busted' | 'likeIce' | 'nuts'
  | 'ragequit' | 'chips10' | 'chips100' | 'chips1000' | 'roundWins10' | 'gameWins10' | 'fullParty' | 'midas' | 'firstLoser'
  | 'addicted' | 'busPass' | 'rtfm' | 'windowShopper' | 'rollCredits' | 'badTiming' | 'fullHand' | 'newLook' | 'distracted' | 'allRules' | 'vanilla' | `rule_${RuleAch}`
  | 'closeCall' | 'leastWorst' | 'flawless' | 'comeback' | 'generous' | 'selfService' | `${Track}${number}`
  | 'infected' | 'scholar' | 'prettyBasic' | 'nerd'
  | 'regular' | 'sayHi' | 'showDontTell' | 'anarchist' | 'nightOwl' | 'polyglot' | 'recycler' | 'throughAce' | 'royalFlush' | 'quickDraw' | 'sevenUp'
  | 'theBeast' | 'mirrorMatch' | 'luckySeven' | 'royalMess'
  | 'eightStraight' | 'nineStraight' | 'johnTximtxom' | 'highFive' | 'sixPack' | 'seventhHeaven' | 'octopusPrime'
  | 'straight3' | 'straight4' | 'straight6' | 'straight10' | 'straight11' | 'straight12' | 'straight13' | 'firstPair' | 'firstTrio'
  | 'firstBuy' | 'firstBack' | 'firstTable' | 'firstAvatar' | 'earlyBird'
  | 'allCommons' | 'allUncommons' | 'allEpics' | 'legendDary' | 'notSoSecret' | 'formationHunter' | 'completionist' | 'completionistPlus' | 'completionistPlusPlus'
  | 'averageEnjoyer' | 'localLegend' | 'finalBoss' | 'ceo'
  | 'curious' | 'redecorate' | 'tinkerer' | 'historian' | 'fullTable' | 'beepBoop' | 'firstTxiJog' | 'dumpsterDiver' | 'hitchhiker' | 'hatTrick' | 'ak47';

/** One achievement per rule, for playing a round with it on: its card art, and whether it's on. */
export const RULE_ACHIEVEMENTS = {
  bust100: { art: 'bust', on: (r: Rules) => r.threshold === 100 && !r.rounds },
  rounds: { art: 'timer', on: (r: Rules) => r.rounds > 0 },
  softcore: { art: 'softcore', on: (r: Rules) => r.softcore },
  superposition: { art: 'ace', on: (r: Rules) => r.superposition },
  mobius: { art: 'ace', on: (r: Rules) => r.mobius },
  smeared: { art: 'mixed', on: (r: Rules) => r.smeared },
  inTurns: { art: 'ride', on: (r: Rules) => r.rideOrder === 'roundRobin' },
  oneRide: { art: 'ride', on: (r: Rules) => r.rides === 'one' },
  noRides: { art: 'ride', on: (r: Rules) => r.rides === 'none' },
  autoRide: { art: 'autoride', on: (r: Rules) => r.autoRide },
  sixthSense: { art: 'peek', on: (r: Rules) => r.sixthSense },
  notice: { art: 'notice', on: (r: Rules) => r.noMoreFormationsNotice },
  penalty10: { art: 'penalty', on: (r: Rules) => r.penalty10 },
  doubleDown: { art: 'double', on: (r: Rules) => r.doubleDown },
  timer: { art: 'timer', on: (r: Rules) => r.turnTimer > 0 },
  magicSort: { art: 'magicsort', on: (r: Rules) => r.magicSort },
  scramble: { art: 'scramble', on: (r: Rules) => r.scramble },
  polydactyly: { art: 'polydactyly', on: (r: Rules) => r.polydactyly },
  twoDecks: { art: 'twodecks', on: (r: Rules) => r.twoDecks },
} satisfies Record<string, { art: string; on: (r: Rules) => boolean }>;
export type RuleAch = keyof typeof RULE_ACHIEVEMENTS;
export const RULE_ACH_IDS = Object.keys(RULE_ACHIEVEMENTS) as RuleAch[];


/**
 * Running counts with a row of achievements each (common, uncommon, epic), from your stats.
 * Goals follow how often each thing turns up: in simulated games a player shows a trio or a
 * straight in about half their rounds, a quad in one round of twelve, a straight of 5+ in one
 * of twenty-seven, and with Softcore one or two pairs a round. Each row's goals land around
 * 10, 50 and 200 rounds of play.
 */
const STEADY = [5, 25, 100];
export const TRACKS = {
  roundsWon: { art: 'ace', goals: STEADY, count: (s: MyStats) => s.roundsWon },
  // Games won are gold badges: Midas (5) and Card Shark (10) come first.
  gamesWon: { art: 'princess', goals: [5, 10, 25, 50, 100], count: (s: MyStats) => s.gamesWon },
  silvers: { art: 'bearded', goals: [5, 10, 50], count: (s: MyStats) => s.silvers },
  busts: { art: 'bust', goals: [5, 10, 50], count: (s: MyStats) => s.busts },
  badges: { art: 'elder', goals: [10, 50, 150], count: (s: MyStats) => s.gamesWon + s.silvers + s.busts },
  formations: { art: 'magiku', goals: [10, 50, 250], count: (s: MyStats) => s.formations },
  pairs: { art: 'softcore', goals: [10, 50, 200], count: (s: MyStats) => s.kinds.pair },
  trios: { art: 'guard', goals: STEADY, count: (s: MyStats) => s.kinds.trio },
  straights: { art: 'mixed', goals: STEADY, count: (s: MyStats) => s.kinds.straight },
  longStraights: { art: 'snail', goals: [1, 3, 10], count: (s: MyStats) => s.longStraights },
  quads: { art: 'double', goals: [1, 5, 15], count: (s: MyStats) => s.kinds.quad },
  ridesTaken: { art: 'ride', goals: STEADY, count: (s: MyStats) => s.rides },
  ridesGiven: { art: 'autoride', goals: STEADY, count: (s: MyStats) => s.ridesGiven },
  txiJogs: { art: 'txijog', goals: STEADY, count: (s: MyStats) => s.roundsEnded },
  draws: { art: 'turn', goals: [25, 250, 1000], count: (s: MyStats) => s.cardsDrawn },
  taken: { art: 'crab', goals: [25, 100, 400], count: (s: MyStats) => s.cardsTaken },
  rounds: { art: 'timer', goals: [25, 100, 500], count: (s: MyStats) => s.roundsPlayed },
  chat: { art: 'notice', goals: [10, 100, 250], count: (s: MyStats) => s.chatSent },
} satisfies Record<string, { art: string; goals: number[]; count: (s: MyStats) => number }>;
export type Track = keyof typeof TRACKS;
const TIERS: Rarity[] = ['common', 'uncommon', 'epic'];
/** Goals an older achievement already covers (Midas is 5 games won, Card Shark 10, Bus Pass 25 rides): no second card for them. */
const COVERED: Partial<Record<Track, number[]>> = { gamesWon: [5, 10], ridesTaken: [25] };
/** Rarity by goal, for a track that doesn't follow common, uncommon, epic. */
const TRACK_RARITY: Partial<Record<Track, Rarity[]>> = { gamesWon: ['epic', 'epic', 'uncommon', 'epic', 'legendary'] };

/** How hard it is to get, shown as the colour down the card's side. Secret ones are red, unique ones a rainbow. */
export type Rarity = 'common' | 'uncommon' | 'epic' | 'legendary' | 'unique' | 'secret';

export interface Achievement {
  id: AchievementId;
  /** Card art (art atlas) shown once it's unlocked; `cards:<frame>` for one from the cards atlas. */
  art: string;
  rarity: Rarity;
  /** Hidden until unlocked: no name, no description. */
  secret?: boolean;
  /** Framed in moving rainbow colours instead of its rarity's (kept for a future Completionist). */
  rainbow?: boolean;
  /** One of the per-rule achievements: its text is made from the rule's name. */
  rule?: RuleAch;
  /** Unlocked when this running count reaches `goal`; the card shows how far along it is (and keeps counting). */
  track?: Track;
  goal?: number;
  /** Made from its track ("Hitchhiker II"): the tier's number, from 1. */
  tier?: number;
  /** A bar for a one-off that's reached bit by bit: rules played (Rulebook), minutes played (Addicted). */
  meter?: 'rules' | 'minutes' | 'chips' | 'streak' | 'played' | 'won' | 'winStreak';
}

/** Common to legendary, then the secret ones. */
const ALL: Achievement[] = [
  { id: 'tipTap', art: 'notice', rarity: 'common' },
  { id: 'dealtIn', art: 'villager', rarity: 'common' },
  { id: 'lowRoller', art: 'ace', rarity: 'common' },
  { id: 'champion', art: 'princess', rarity: 'common' },
  { id: 'busted', art: 'bust', rarity: 'common' },
  { id: 'firstLoser', art: 'bearded', rarity: 'common' },
  { id: 'ragequit', art: 'bat', rarity: 'common' },
  { id: 'rtfm', art: 'help', rarity: 'common' },
  { id: 'windowShopper', art: 'peek', rarity: 'common' },
  { id: 'rollCredits', art: 'squire', rarity: 'common' },
  { id: 'newLook', art: 'magiku', rarity: 'common' },
  { id: 'distracted', art: 'frei', rarity: 'common' },
  { id: 'sayHi', art: 'notice', rarity: 'common' },
  { id: 'showDontTell', art: 'magiku', rarity: 'common' },
  { id: 'polyglot', art: 'help', rarity: 'common' },
  { id: 'recycler', art: 'crab', rarity: 'common' },
  { id: 'chips10', art: 'guard', rarity: 'common', meter: 'chips', goal: 1000 },
  { id: 'firstPair', art: 'softcore', rarity: 'common' },
  { id: 'firstTrio', art: 'guard', rarity: 'common' },
  { id: 'straight3', art: 'mixed', rarity: 'common' },
  { id: 'straight4', art: 'mixed', rarity: 'common' },
  { id: 'firstBuy', art: 'penalty', rarity: 'common' },
  { id: 'firstBack', art: 'turn', rarity: 'common' },
  { id: 'firstTable', art: 'magiku', rarity: 'common' },
  { id: 'firstAvatar', art: 'king', rarity: 'common' },
  // Small firsts, one each.
  { id: 'curious', art: 'help', rarity: 'common' },
  { id: 'redecorate', art: 'mixed', rarity: 'common' },
  { id: 'tinkerer', art: 'notice', rarity: 'common' },
  { id: 'historian', art: 'elder', rarity: 'common' },
  { id: 'fullTable', art: 'turn', rarity: 'common' },
  { id: 'beepBoop', art: 'bikingu', rarity: 'common' },
  { id: 'firstTxiJog', art: 'txijog', rarity: 'common' },
  { id: 'dumpsterDiver', art: 'crab', rarity: 'common' },
  { id: 'hitchhiker', art: 'ride', rarity: 'common' },
  { id: 'hatTrick', art: 'timer', rarity: 'common' },
  { id: 'competitor', art: 'barbarian', rarity: 'uncommon' },
  { id: 'fullHand', art: 'txijog', rarity: 'uncommon' },
  { id: 'fullParty', art: 'turn', rarity: 'uncommon' },
  { id: 'roundWins10', art: 'squire', rarity: 'uncommon', track: 'roundsWon', goal: 10 },
  { id: 'busPass', art: 'ride', rarity: 'uncommon', track: 'ridesTaken', goal: 25 },
  { id: 'generous', art: 'villager', rarity: 'uncommon' },
  { id: 'anarchist', art: 'boar', rarity: 'uncommon' },
  { id: 'ak47', art: 'bandit', rarity: 'uncommon' },
  { id: 'addicted', art: 'timer', rarity: 'uncommon', meter: 'minutes' },
  { id: 'chips100', art: 'ranger', rarity: 'uncommon', meter: 'chips', goal: 10000 },
  { id: 'regular', art: 'timer', rarity: 'epic', meter: 'streak', goal: 7 },
  { id: 'gameWins10', art: 'boar', rarity: 'epic', track: 'gamesWon', goal: 10 },
  { id: 'midas', art: 'ziku', rarity: 'epic', track: 'gamesWon', goal: 5 },
  { id: 'closeCall', art: 'bust', rarity: 'epic' },
  { id: 'leastWorst', art: 'bust', rarity: 'epic' },
  { id: 'comeback', art: 'boar', rarity: 'epic' },
  { id: 'bitter', art: 'snail', rarity: 'epic' },
  { id: 'likeIce', art: 'fantasma', rarity: 'epic' },
  { id: 'nuts', art: 'crab', rarity: 'epic' },
  { id: 'badTiming', art: 'autoride', rarity: 'epic' },
  { id: 'selfService', art: 'ride', rarity: 'epic' },
  { id: 'throughAce', art: 'ace', rarity: 'epic' },
  { id: 'quickDraw', art: 'txijog', rarity: 'epic' },
  { id: 'straight6', art: 'serpent', rarity: 'epic' },
  { id: 'tximtxom', art: 'tximtxom', rarity: 'legendary' },
  { id: 'flawless', art: 'kabaleru', rarity: 'legendary' },
  { id: 'royalFlush', art: 'princess', rarity: 'legendary' },
  { id: 'sevenUp', art: 'mixed', rarity: 'legendary' },
  // The running counts, each track's goals in a row.
  ...(Object.keys(TRACKS) as Track[]).flatMap((track) =>
    TRACKS[track].goals
      .map((goal, i) => [goal, TRACK_RARITY[track]?.[i] ?? TIERS[i]] as const)
      .filter(([goal]) => !COVERED[track]?.includes(goal))
      .map(([goal, rarity], i): Achievement => ({ id: `${track}${goal}`, art: TRACKS[track].art, rarity, track, goal, tier: i + 1 })),
  ),
  { id: 'allRules', art: 'bikingu', rarity: 'legendary', meter: 'rules' },
  { id: 'chips1000', art: 'kabaleru', rarity: 'legendary', meter: 'chips', goal: 100000 },
  ...RULE_ACH_IDS.map((rule): Achievement => ({ id: `rule_${rule}`, art: RULE_ACHIEVEMENTS[rule].art, rarity: 'common', rule })),
  { id: 'vanilla', art: 'villager', rarity: 'uncommon' },
  // For collecting the others: each rarity's set, one rarity up, then the unique ones.
  { id: 'allCommons', art: 'villager', rarity: 'uncommon' },
  { id: 'allUncommons', art: 'squire', rarity: 'epic' },
  { id: 'allEpics', art: 'kabaleru', rarity: 'legendary' },
  { id: 'legendDary', art: 'tximtxom', rarity: 'unique', rainbow: true },
  { id: 'notSoSecret', art: 'fantasma', rarity: 'unique', rainbow: true },
  { id: 'completionist', art: 'elder', rarity: 'unique', rainbow: true },
  { id: 'completionistPlus', art: 'queen', rarity: 'unique', rainbow: true },
  { id: 'completionistPlusPlus', art: 'king', rarity: 'unique', rainbow: true },
  // The long haul, each with a reward: outside every collection, like John TximTxom.
  { id: 'averageEnjoyer', art: 'villager', rarity: 'unique', rainbow: true, meter: 'played', goal: 100 },
  { id: 'localLegend', art: 'princess', rarity: 'unique', rainbow: true, meter: 'won', goal: 250 },
  { id: 'finalBoss', art: 'bigBoss', rarity: 'unique', rainbow: true, meter: 'winStreak', goal: 10 },
  { id: 'ceo', art: 'ceoSuit', rarity: 'unique', rainbow: true, meter: 'chips', goal: 1_000_000 },
  // A 9-card TximTxom: hidden until it happens, and outside every collection.
  { id: 'johnTximtxom', art: 'kingJohn', rarity: 'unique', rainbow: true, secret: true },
  { id: 'infected', art: 'slime', rarity: 'secret', secret: true },
  { id: 'scholar', art: 'elder', rarity: 'secret', secret: true },
  { id: 'prettyBasic', art: 'cards:base', rarity: 'secret', secret: true },
  { id: 'nerd', art: 'spider', rarity: 'secret', secret: true },
  { id: 'theBeast', art: 'bat', rarity: 'secret', secret: true },
  { id: 'nightOwl', art: 'fantasma', rarity: 'secret', secret: true },
  { id: 'mirrorMatch', art: 'magiku', rarity: 'secret', secret: true },
  { id: 'luckySeven', art: 'ziku', rarity: 'secret', secret: true },
  { id: 'royalMess', art: 'barbarian', rarity: 'secret', secret: true },
  // Polydactyly's long straights, and two decks' big sets.
  { id: 'eightStraight', art: 'serpent', rarity: 'secret', secret: true },
  { id: 'nineStraight', art: 'web', rarity: 'secret', secret: true },
  { id: 'highFive', art: 'brute', rarity: 'secret', secret: true },
  { id: 'sixPack', art: 'beetle', rarity: 'secret', secret: true },
  { id: 'seventhHeaven', art: 'queen', rarity: 'secret', secret: true },
  { id: 'octopusPrime', art: 'octopus', rarity: 'secret', secret: true },
  // Straights only rides can stretch that far.
  { id: 'straight10', art: 'snail', rarity: 'secret', secret: true },
  { id: 'straight11', art: 'cat', rarity: 'secret', secret: true },
  { id: 'straight12', art: 'horse', rarity: 'secret', secret: true },
  { id: 'straight13', art: 'bear', rarity: 'secret', secret: true },
  { id: 'earlyBird', art: 'timer', rarity: 'secret', secret: true },
  { id: 'formationHunter', art: 'web', rarity: 'secret', secret: true },
];

/** Straights of each length with a one-off of their own (5 is Long Haul I). */
const STRAIGHT_ACH: Record<number, AchievementId> = { 3: 'straight3', 4: 'straight4', 6: 'straight6', 7: 'sevenUp', 8: 'eightStraight', 9: 'nineStraight', 10: 'straight10', 11: 'straight11', 12: 'straight12', 13: 'straight13' };
/** The secret formations: Formation Hunter wants every one. */
const SECRET_FORMATIONS: AchievementId[] = ['theBeast', 'eightStraight', 'nineStraight', 'straight10', 'straight11', 'straight12', 'straight13', 'highFive', 'sixPack', 'seventhHeaven', 'octopusPrime'];
/** What an achievement gives: a shop item that's never sold. */
export const REWARDS: Partial<Record<AchievementId, string>> = {
  johnTximtxom: 'kingJohn',
  averageEnjoyer: 'negative',
  localLegend: 'back_poly',
  finalBoss: 'boss',
  ceo: 'back_foil',
  flawless: 'bigBoss',
  royalFlush: 'ceoHat',
  allRules: 'ceoSuit',
};

/** Neither secret nor unique. */
const isPlain = (a: Achievement) => a.rarity !== 'secret' && a.rarity !== 'unique';
/** The collections: each unlocks once every achievement its test picks is in. */
const COLLECTIONS: [AchievementId, (a: Achievement) => boolean][] = [
  ['allCommons', (a) => a.rarity === 'common'],
  ['allUncommons', (a) => a.rarity === 'uncommon'],
  ['allEpics', (a) => a.rarity === 'epic'],
  ['legendDary', (a) => a.rarity === 'legendary'],
  ['formationHunter', (a) => SECRET_FORMATIONS.includes(a.id)],
  ['notSoSecret', (a) => a.rarity === 'secret'],
  ['completionist', (a) => isPlain(a) || a.id === 'legendDary'],
  ['completionistPlus', (a) => isPlain(a) || a.rarity === 'secret' || ['legendDary', 'notSoSecret', 'completionist'].includes(a.id)],
];

/** Sets bigger than a deck allows, by size. */
const BIG_SET_ACH: Record<number, AchievementId> = { 5: 'highFive', 6: 'sixPack', 7: 'seventhHeaven', 8: 'octopusPrime' };
/** The achievements you can get now. */
export const ACHIEVEMENTS = ALL;

const KEY = 'tximtxom.achievements';
/** Time a toast is on screen (about 4 s to read it, plus sliding in and out),
 *  and the pause before the next one. Real time: the game speed doesn't touch it. */
export const TOAST_MS = 4800;
const TOAST_GAP_MS = 500;

/** When each achievement was unlocked (ms timestamp). */
export type Unlocked = Partial<Record<AchievementId, number>>;

function load(): Unlocked {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

let unlocked = load();

/** Unlocked achievements you've seen in the Achievements window. The first time,
 *  everything already unlocked counts as seen: only later ones are "New". */
const SEEN_KEY = 'tximtxom.achSeen';
let seen = loadSeen();

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw) return new Set(JSON.parse(raw));
    const all = new Set(Object.keys(unlocked));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...all]));
    return all;
  } catch {
    return new Set(Object.keys(unlocked));
  }
}

/** The achievement's card has been on screen in the Achievements window: no longer New. */
export function markSeen(id: AchievementId): void {
  if (seen.has(id)) return;
  seen = new Set(seen).add(id);
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // Storage blocked: seen for this visit only.
  }
  notify();
}

export const isNew = (id: AchievementId) => !!unlocked[id] && !seen.has(id);
let toastQueue: AchievementId[] = [];
let showing: AchievementId | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const unlockHooks = new Set<(id: AchievementId) => void>();

/** Calls `hook` with each achievement as it's unlocked. */
/** Calls `hook` on every unlock; returns a function that stops it. */
export function onUnlock(hook: (id: AchievementId) => void): () => void {
  unlockHooks.add(hook);
  return () => unlockHooks.delete(hook);
}

export const hasAchievement = (id: AchievementId) => !!unlocked[id];

/** Unlocks `id` (once) and queues its toast. Infected also adds to the global
 *  count, unless claiming patient zero just did. */
export function unlock(id: AchievementId, counted = false): void {
  if (unlocked[id]) return;
  if (id === 'infected' && !counted) countInfected();
  unlocked = { ...unlocked, [id]: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(unlocked));
  } catch {
    // Storage blocked: unlocked for this visit only.
  }
  toastQueue.push(id);
  notify();
  unlockHooks.forEach((h) => h(id));
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (a) earn('achievements', ACH_PAY[a.rarity]);
  const gift = REWARDS[id];
  if (gift) grantItem(gift);
  if (!showing) nextToast();
  checkCollections();
}

/** Unlocks each collection whose achievements are all in (one collection can complete the next). */
function checkCollections(): void {
  for (const [id, of] of COLLECTIONS) if (!unlocked[id] && ALL.every((a) => a.id === id || !of(a) || unlocked[a.id])) unlock(id);
  if (!unlocked.completionistPlusPlus && unlocked.completionistPlus && ownsEverything()) unlock('completionistPlusPlus');
}

/** The shop ones: something bought (rewards don't count), and the first of each kind. */
function checkShop(): void {
  const bought = SOLD.filter((i) => chipsNow().owned.includes(i.id));
  if (bought.length) unlock('firstBuy');
  if (bought.some((i) => i.kind === 'back')) unlock('firstBack');
  if (bought.some((i) => i.kind === 'table')) unlock('firstTable');
  if (bought.some((i) => i.kind === 'avatar')) unlock('firstAvatar');
  if (!unlocked.completionistPlusPlus && unlocked.completionistPlus && ownsEverything()) unlock('completionistPlusPlus');
}

/** When each of the toast's three shines starts (ms after it shows). */
const SHINE_AT = [420, 1220, 2020];

function nextToast(): void {
  showing = toastQueue.shift() ?? null;
  notify();
  if (!showing) return;
  play('coin1', { volume: 0.7 });
  // Three rising chimes, one for each shine across the toast (styles.css: ach-shine).
  SHINE_AT.forEach((ms, i) => setTimeout(() => play('editionFoil', { volume: 0.9, rate: 1 + i * 0.18 }), ms));
  setTimeout(() => {
    showing = null;
    notify();
    setTimeout(nextToast, TOAST_GAP_MS);
  }, TOAST_MS);
}

function useAchievementState<R>(pick: () => R): R {
  const [, redraw] = useState(0);
  useEffect(() => {
    const l = () => redraw((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return pick();
}

export const useUnlocked = () => useAchievementState(() => unlocked);
/** How many unlocked achievements you haven't seen yet. */
export const useNewCount = () => useAchievementState(() => ACHIEVEMENTS.filter((x) => isNew(x.id)).length);
/** The achievement whose toast is up, or null. */
export const useAchievementToast = () => useAchievementState(() => showing);

// ---------------------------------------------------------------- unlocking

let triedPatientZero = false;

/** Where this round's events start in the game's log. */
function lastDealIndex(g: GameView): number {
  let i = g.events.length - 1;
  while (i > 0 && g.events[i].e.t !== 'deal') i--;
  return Math.max(0, i);
}

const LANGS_KEY = 'tximtxom.roundLangs';
/** Polyglot: the languages you've played a round in. */
function playedRoundIn(lang: string): void {
  try {
    const langs = new Set<string>(JSON.parse(localStorage.getItem(LANGS_KEY) ?? '[]'));
    langs.add(lang);
    localStorage.setItem(LANGS_KEY, JSON.stringify([...langs]));
    if (langs.has('en') && langs.has('pt')) unlock('polyglot');
  } catch {
    // Storage blocked: nothing to remember it by.
  }
}

/** Formation achievements, for cards you show (laid, or a formation of yours after a ride). */
function formationShown(kind: string, cards: Card[]): void {
  const ranks = new Set(cards.map(rankOf));
  if (kind === 'trio' && cards.length === 3 && cards.every((c) => rankOf(c) === 6)) unlock('theBeast');
  if (kind !== 'straight') {
    // Each size is its own achievement: a quad isn't a trio, six of a rank isn't five.
    if (cards.length === 2) unlock('firstPair');
    if (cards.length === 3) unlock('firstTrio');
    if (BIG_SET_ACH[cards.length]) unlock(BIG_SET_ACH[cards.length]);
    return;
  }
  // This length only: a 7-card straight doesn't count as a 3, 4 or 6. A straight that
  // rides stretch one card at a time comes back here at each new length.
  if (STRAIGHT_ACH[cards.length]) unlock(STRAIGHT_ACH[cards.length]);
  // The Ace in the middle: only the Mobius Strip lets a straight run K-A-2.
  if (ranks.has(13) && ranks.has(1) && ranks.has(2)) unlock('throughAce');
  if ([10, 11, 12, 13, 1].every((r) => ranks.has(r)) && new Set(cards.map(suitOf)).size === 1) unlock('royalFlush');
}

/** AK-47: an Ace, a King, a 4 and a 7 side by side in your hand, in that order, left to right. */
const AK47 = [1, 13, 4, 7];
export function handArranged(order: Card[]): void {
  if (unlocked.ak47 || order.length < AK47.length) return;
  for (let i = 0; i + AK47.length <= order.length; i++) if (AK47.every((r, j) => rankOf(order[i + j]) === r)) return unlock('ak47');
}

/** Checks one game event for achievements. Called once per event, as it happens. */
export function achievementEvent(e: GameEvent, g: GameView, room: RoomView): void {
  const me = g.you;
  if (me === null) return;
  // Nobody busts in Rounds mode.
  const threshold = bustLimit(g.rules);
  switch (e.t) {
    case 'deal':
      unlock('dealtIn');
      if (g.players.length === 4) unlock('fullTable');
      if (g.players.some((p) => p.isBot)) unlock('beepBoop');
      playedRoundIn(getSettings().lang);
      // Every round start, Infected passes to anyone at the table who doesn't have it yet.
      const carriers = room.players.filter((p) => p.id !== room.youId && p.infected);
      if (carriers.length) {
        // Caught it just now: it counts for one of the players you caught it from.
        const ids = carriers.flatMap((p) => p.carrier ?? []);
        if (!unlocked.infected && ids.length) creditCarrier(ids[Math.floor(Math.random() * ids.length)]);
        unlock('infected');
      }
      else if (!unlocked.infected && !triedPatientZero) {
        triedPatientZero = true;
        void claimPatientZero().then((first) => first && unlock('infected', true));
      }
      break;
    case 'score': {
      const r = g.results.at(-1);
      if (!r) return;
      if (r.points[me] === Math.min(...r.points)) unlock('lowRoller');
      // Three different players riding on one formation of yours, this round.
      const mine = new Set(g.events.flatMap((x) => (x.e.t === 'lay' && x.e.seat === me ? [x.e.formationId] : [])));
      const riders = new Map<number, Set<number>>();
      for (const { e: x } of g.events.slice(lastDealIndex(g)))
        if (x.t === 'ride' && mine.has(x.formationId) && x.seat !== me) riders.set(x.formationId, (riders.get(x.formationId) ?? new Set()).add(x.seat));
      if ([...riders.values()].some((r) => r.size >= 3)) unlock('generous');
      // All seven formed, but someone else ended the round first.
      if (r.ender !== null && r.ender !== me && r.leftovers[me].length === 0) unlock('badTiming');
      if (r.totals[me] === 69 && r.totals[me] > threshold) unlock('nuts');
      // The whole hand formed this round (rides too, nothing left over), without a Jack, Queen or King.
      const shown = g.events.slice(lastDealIndex(g)).flatMap((x) => (x.e.t === 'lay' && x.e.seat === me ? x.e.cards : x.e.t === 'ride' && x.e.seat === me ? [x.e.card] : []));
      if (shown.length && r.leftovers[me].length === 0 && shown.every((c) => rankOf(c) < 11)) unlock('anarchist');
      const low = Math.min(...r.points);
      if (r.points[me] === low && r.points.filter((p) => p === low).length > 1) unlock('mirrorMatch');
      if (r.points[me] === low && low === 7) unlock('luckySeven');
      // Went over the limit this round, with all four Kings in your hand (laid or not).
      const before = g.results.at(-2)?.totals[me] ?? 0;
      if (r.totals[me] > threshold && before <= threshold) {
        const held = [...r.leftovers[me], ...g.events.slice(lastDealIndex(g)).flatMap((x) => (x.e.t === 'lay' && x.e.seat === me ? x.e.cards : []))];
        if (held.filter((c) => rankOf(c) === 13).length === 4) unlock('royalMess');
      }
      break;
    }
    case 'take':
      if (e.seat === me) unlock('dumpsterDiver');
      break;
    case 'lay': {
      if (e.seat !== me) break;
      formationShown(e.kind, e.cards);
      // A card you took from the discard pile this round, shown.
      const taken = new Set(g.events.slice(lastDealIndex(g)).flatMap((x) => (x.e.t === 'take' && x.e.seat === me ? [x.e.card] : [])));
      if (e.cards.some((c) => taken.has(c))) unlock('recycler');
      break;
    }
    case 'ride':
      if (e.seat === me) unlock('hitchhiker');
      // Your own straight, once someone else stretched it.
      if (e.seat === me && g.events.some((x) => x.e.t === 'lay' && x.e.formationId === e.formationId && x.e.seat === me)) unlock('selfService');
      // A formation of yours that a ride turned into something.
      {
        const f = g.reveal?.formations.find((x) => x.id === e.formationId);
        // Yours, or one your own card just made big.
        if (f && (f.owner === me || e.seat === me)) formationShown(f.kind, f.cards);
      }
      break;
    case 'end':
      if (e.seat === me) unlock('firstTxiJog');
      if (e.bonus && e.seat === me) unlock('fullHand');
      // Txi jog on your first turn of the round: one draw or take of yours so far.
      if (e.kind === 'manual' && e.seat === me) {
        const turns = g.events.slice(lastDealIndex(g)).filter((x) => (x.e.t === 'draw' || x.e.t === 'take') && x.e.seat === me).length;
        if (turns <= 1) unlock('quickDraw');
      }
      break;
    case 'tximtxom':
      if (e.seat === me) {
        unlock('tximtxom');
        // Polydactyly's whole hand in one straight, all nine.
        const hand = g.players[me].hand ?? [];
        if (hand.length === 9 && classifyFormation(hand, { ...g.rules, smeared: false })?.kind === 'straight') unlock('johnTximtxom');
      }
      else if (g.round === 1) unlock('bitter');
      break;
    case 'gameOver': {
      // A whole game played to the end with each rule on (win or lose), and Rulebook once every rule's done.
      for (const rule of RULE_ACH_IDS) if (RULE_ACHIEVEMENTS[rule].on(g.rules)) unlock(`rule_${rule}`);
      if (RULE_ACH_IDS.every((rule) => unlocked[`rule_${rule}`])) unlock('allRules');
      const on = RULE_ACH_IDS.filter((rule) => RULE_ACHIEVEMENTS[rule].on(g.rules));
      if (on.length === 0 && e.winners.includes(me)) unlock('vanilla');
      const total = g.players[me].total;
      if (e.winners.includes(me)) {
        unlock('champion');
        if (g.players.some((p, i) => i !== me && !p.isBot)) unlock('competitor');
        if (total < 0) unlock('likeIce');
        // Every round of the game (three at least) won too.
        if (g.results.length >= 3 && g.results.every((r) => r.points[me] === Math.min(...r.points))) unlock('flawless');
        // Out in front on points (the worst place to be) at some point, and still won.
        if (g.players.length > 1 && g.results.some((r) => r.totals.every((x, i) => i === me || r.totals[me] > x))) unlock('comeback');
      } else if (total > threshold) unlock('busted');
      else unlock('firstLoser');
      if (g.players.length > 1 && g.players.every((p) => !p.isBot)) unlock('fullParty');
      // Right on the limit, and not over it.
      if (total === threshold) unlock('closeCall');
      // Everyone else went over in the last round, and you didn't.
      if (e.winners.includes(me) && total <= threshold && g.players.every((p, i) => i === me || p.total > threshold)) unlock('leastWorst');
      const hour = new Date().getHours();
      if (hour < 5) unlock('nightOwl');
      else if (hour < 9) unlock('earlyBird');
      if (gamesToday() >= 3) unlock('hatTrick');
      break;
    }
  }
}

const DAY_KEY = 'tximtxom.gamesToday';
/** Counts a game finished today (local date) and returns today's count, for Hat Trick. */
function gamesToday(): number {
  const today = new Date().toDateString();
  try {
    const was = JSON.parse(localStorage.getItem(DAY_KEY) ?? '{}');
    const n = was.day === today ? (was.n ?? 0) + 1 : 1;
    localStorage.setItem(DAY_KEY, JSON.stringify({ day: today, n }));
    return n;
  } catch {
    return 0;
  }
}

export const ADDICTED_MINUTES = 60;

/** The running count behind a meter achievement from your stats (games played, won, in a row). */
export const STAT_METERS = {
  played: (s: MyStats) => s.gamesPlayed,
  won: (s: MyStats) => s.gamesWon,
  winStreak: (s: MyStats) => s.bestStreak,
};

/** Achievements that come from your running stats, checked as they change. */
export function initAchievements(): void {
  const check = () => {
    const s = myStats();
    for (const a of ACHIEVEMENTS) if (a.track && a.goal && TRACKS[a.track].count(s) >= a.goal) unlock(a.id);
    if (s.timePlayed >= ADDICTED_MINUTES * 60 * 1000) unlock('addicted');
    for (const a of ACHIEVEMENTS) {
      const count = a.meter && a.meter in STAT_METERS ? STAT_METERS[a.meter as keyof typeof STAT_METERS] : undefined;
      if (count && a.goal && count(s) >= a.goal) unlock(a.id);
    }
  };
  // History opened during a game, and a table other than the green felt picked.
  const settingsCheck = () => {
    const st = getSettings();
    if (st.table !== 'felt') unlock('redecorate');
    if (st.historyOpen && store.get().sideTab === 'history' && store.get().room?.game) unlock('historian');
  };
  settingsCheck();
  onSettings(settingsCheck);
  // Achievements unlocked before chips existed pay once (before any new unlock, which pays itself).
  payBack(ACHIEVEMENTS.filter((a) => unlocked[a.id]).map((a) => a.rarity));
  check();
  onStats(check);
  // The chip ones unlock as chips are earned.
  const chipCheck = () => {
    for (const a of ACHIEVEMENTS) if (a.meter === 'chips' && a.goal && chipsEarned() >= a.goal) unlock(a.id);
    if (chipsNow().bestDailyStreak >= 7) unlock('regular');
    checkShop();
  };
  // Rewards for achievements unlocked before they had one, and collections already complete.
  for (const [id, item] of Object.entries(REWARDS)) if (item && unlocked[id as AchievementId]) grantItem(item);
  checkCollections();
  chipCheck();
  onChips(chipCheck);
  let room: RoomView | null = null;
  store.subscribe(() => {
    settingsCheck();
    const next = store.get().room;
    if (next === room) return;
    room = next;
    achievementRoom(room);
  });
}

/** Moves the turn timer made for you, in the room's last view: Distracted when it goes up. */
let myTimeouts: number | null = null;

/** Checks each new room view for achievements that aren't game events. */
export function achievementRoom(room: RoomView | null): void {
  const me = room?.players.find((p) => p.id === room.youId);
  if (!me) {
    myTimeouts = null;
    return;
  }
  if (myTimeouts !== null && me.timeouts > myTimeouts) unlock('distracted');
  myTimeouts = me.timeouts;
}
