# Changelog

Generated from `packages/client/src/changelog.ts` (`npm run changelog`); the game shows the same list.
Versions follow semantic versioning; up to 0.11.0 they were assigned afterwards from the commit history and are tagged in git.

✨ new · 🔧 changed · 🐛 fixed · 🗑️ removed

## 0.14.0 (2026-10-15)
- ✨ Changelog button on the title screen.

## 0.13.1 (2026-10-15)
- 🐛 Cards no longer fly around and snap back when a game starts.
- 🐛 Round 1 is dealt on screen, also after Play again.
- 🔧 Turn callouts wait until the cards are dealt.

## 0.13.0 (2026-10-15)
- ✨ Rules are colour-coded: punishing (red), information (blue), support (green), neutral (grey).

## 0.12.0 (2026-10-15)
- ✨ Version number and GitHub link on the title screen and in Settings.
- 🔧 "Invite link copied" shows inside the room-code box instead of a pop-up.

## 0.11.0 (2026-10-15)
- ✨ A button on the game-over window copies a game report for bug reports.
- ✨ Rules button: shows the rules of the game being played.
- ✨ "Show your formations!" callout.
- 🔧 With no formation left to make, the only button is Finish.
- 🔧 Callouts use Balatro's timing: faster, with a single square behind the text.
- 🐛 Callouts are centred on the table when the history panel is open.
- 🐛 Settings keeps the same size on every tab.

## 0.10.2 (2026-10-15)
- 🔧 Keyboard shortcuts are shown as small keycaps.
- 🐛 Hovering a card or Joker no longer stops its idle animation.

## 0.10.1 (2026-10-15)
- 🔧 English uses plain words (end the round, bust, take a ride); the Kriolu terms are only in Portuguese.

## 0.10.0 (2026-10-15)
- ✨ Callouts for turns, Panha Boleia, Nope!, TximTxom! and the end of the game.
- ✨ The Handy Tag marks the player whose turn it is.
- ✨ Play again after a game; wins are shown as Gold Stake chips (x2, x3…).
- ✨ Cards and Jokers sway gently when idle.
- 🔧 Buttons and player plates keep one size, whatever they say.
- 🔧 Card names on buttons are shown in their suit colour.
- 🔧 Auto sort is a switch; Pass and Done are red; finished formations close up.
- 🐛 Card names in the history were pale on white.

## 0.9.0 (2026-10-15)
- ✨ Human players pick from 10 Jokers of their own.
- 🔧 A card dropped on the Discard Pile waits for End Turn, so others don't see it early.
- 🔧 Undo is orange instead of grey.
- 🔧 A legendary Joker's soul zooms in on hover instead of rising.
- 🐛 Dragging sliders, holding buttons or dragging cards no longer selects text.

## 0.8.0 (2026-10-15)
- ✨ Every player has a Joker; click it in the room to change it.
- ✨ Rename yourself in the room before the game starts.
- ✨ A player's Joker shakes when their turn starts.
- 🔧 Portuguese text uses J, Q, K instead of V, D, R.

## 0.7.0 (2026-10-15)
- ✨ Rooms close after 10 minutes with no human activity.
- 🐛 A table of bots no longer keeps a room open; old rooms don't reopen after a reload.

## 0.6.1 (2026-10-15)
- 🔧 Portuguese terms: Trinca, Escada, Dealer, Passar vez.

## 0.6.0 (2026-10-15)
- ✨ Smeared rule (Borrod): straights can mix suits; TximTxom still needs one suit.
- 🐛 The Formations menu fits phones without scrolling.
- 🐛 The written rules were cut off; they are complete now.

## 0.5.0 (2026-10-14)
- ✨ Drag cards onto the table to show a formation.
- 🔧 New layouts for tall and short phone screens.
- 🐛 Holding Txi jog or TximTxom no longer restarts when the buttons redraw.
- 🐛 The Txi jog card no longer covers formations; no banner over the game-over window.

## 0.4.0 (2026-10-14)
- ✨ Portuguese by default; English in Settings and on the title screen.
- ✨ Kriolu terms: Txi jog, Rabenta, Panha Boleia.
- ✨ Sixth Sense rule with a Peek button.
- ✨ Bots are Jimbo and the legendary Jokers; the host can rename them.
- ✨ Sort by rank, suit or automatically; Hand Points under the hand.
- ✨ Leave button in the top bar.
- ✨ Jokers and small cards tilt and shine under the pointer.
- 🔧 Txi jog and TximTxom moved to their own corners and need a press-and-hold.
- 🔧 Round summary, scoreboard, Settings, How to play and Formations redesigned, with tabs instead of scrolling.

## 0.3.0 (2026-10-14)
- ✨ Drag cards to discard, swap or ride; valid targets glow green.
- 🔧 Drawn and dealt cards leave the top of the draw pile face down and turn over when they land.
- 🐛 Cards no longer flicker under a still pointer.
- 🐛 No hover or taps through an open window or panel.

## 0.2.1 (2026-10-14)
- 🐛 The round chip stays on one line on phones.

## 0.2.0 (2026-10-14)
- ✨ The room creator's browser hosts the game; others connect to it directly. No server needed.
- ✨ The host can refresh the page: the room reopens and guests reconnect.
- ✨ Playable online at badjuice.github.io/tximtxom.
- 🗑️ Fly.io hosting.

## 0.1.0 (2026-10-14)
- ✨ The game: 7-card hands, ending the round with a 5 or lower, one reshuffle, -10 for a full hand, rides, TximTxom.
- ✨ Room rules: points limit 40 or 100, Hardcore, Superposition, Double Down, Penalty +10, Auto Ride, ride order, turn timer.
- ✨ Bots, which also take over a disconnected player's seat.
- ✨ Online rooms with 4-letter codes; reconnect to your seat.
- ✨ Table with springy cards, particles, Balatro's swirling background, CRT effect, sounds and music.
- ✨ Lobby, scoreboard, Formations menu, move history, accessibility settings and phone layouts.
