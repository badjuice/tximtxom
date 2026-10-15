# Changelog

Versions follow [semantic versioning](https://semver.org/). Before 1.0, a new
feature or rule raises the middle number and a fix or wording change raises
the last one. Versions up to 0.11.0 were assigned afterwards from the commit
history; each is tagged in git (`v0.4.0` and so on).

## 0.13.1 (2026-10-15)
- Fixed cards flying around and snapping back when a game started. The card
  springs went unstable on slow frames or at game speed above 1x; they now
  move in small fixed steps.
- Round 1 is dealt on screen too (also after Play again); turn callouts wait
  for the deal to finish.

## 0.13.0 (2026-10-15)
- Rules are colour-coded: punishing (red), information (blue), support (green), neutral (grey).

## 0.12.0 (2026-10-15)
- The version and a link to the author's GitHub show on the title screen and in Settings.
- "Invite link copied" shows inside the room-code box instead of a pop-up.

## 0.11.0 (2026-10-15)
- Game over: a button copies a game report (moves, host action log, final state) for bug reports.
- A Rules button shows the current game's rules.
- With nothing left to form, the only button is Finish.
- Callouts use Balatro's timing; a "Show your formations!" callout.
- Settings keeps one size across tabs.

## 0.10.2 (2026-10-15)
- Keycap-style keyboard shortcut hints.
- Hovering a card or Joker no longer stops its idle animation.

## 0.10.1 (2026-10-15)
- English text uses plain words; the Kriolu terms are only in Portuguese.

## 0.10.0 (2026-10-15)
- Balatro-style callouts: turns, Panha Boleia, Nope!, TximTxom!, game over.
- The Handy Tag marks whose turn it is.
- Play again after a game; wins shown as Gold Stake chips.
- Fixed-size buttons and plates; suit-coloured card names on buttons.
- Auto sort is a switch; finished formations close up; idle card sway.

## 0.9.0 (2026-10-15)
- Human players pick from their own set of Jokers.
- A card dropped on the Discard Pile waits for End Turn.
- Dragging sliders or cards no longer selects text.

## 0.8.0 (2026-10-15)
- Every player has a Joker; click it in the room to change it.
- Players can rename themselves before the game.
- The Joker shakes when its player's turn starts.
- Portuguese text keeps J, Q, K.

## 0.7.0 (2026-10-15)
- Rooms close after 10 minutes with no human activity.

## 0.6.1 (2026-10-15)
- Portuguese terms: Trinca, Escada, Dealer, Passar vez.

## 0.6.0 (2026-10-15)
- Smeared rule (Borrod): straights can mix suits.
- Full rules in docs/RULES.md.

## 0.5.0 (2026-10-14)
- Drag cards onto the table to lay formations.
- Phone layouts; fixed hold buttons resetting on redraw.

## 0.4.0 (2026-10-14)
- Portuguese by default, press-and-hold for round-ending moves.
- Sixth Sense rule, Joker bots, menu overhaul.

## 0.3.0 (2026-10-14)
- Drag-and-drop moves; cards are drawn from the top of the pile.
- Fixed hover flicker.

## 0.2.1 (2026-10-14)
- The round chip stays on one line on phones.

## 0.2.0 (2026-10-14)
- Games are hosted in the room creator's browser; deployed to GitHub Pages.

## 0.1.0 (2026-10-14)
- First version: rules engine, bots, Socket.IO server and browser client.
