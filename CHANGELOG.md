# Changelog

Generated from `packages/client/src/changelog.ts` (`npm run changelog`); the game shows the same list.
Versions follow semantic versioning; up to 0.11.0 they were assigned afterwards from the commit history and are tagged in git.

✨ new · 🔧 changed · 🐛 fixed · 🗑️ removed

## 0.24.1 (2026-10-25)
- 🔧 The "Click to start" button is always there once the game has loaded; the music starts with it.
- 🔧 The title Aces materialise in green, like Balatro's DNA.
- 🔧 The "Random" card back fades through every back in turn.
- 🐛 The question mark on the "Random" card back vanished on hover.

## 0.24.0 (2026-10-25)
- 🔧 Pairs no longer count by default. The new Softcore rule turns them back on; it replaces Hardcore.
- 🔧 Dealt cards fill the hand one by one, in the order they arrive. Auto sort waits until the deal is over.
- ✨ The title Aces appear once you reach the menu: they materialise, then get their editions.
- ✨ Card back "Random": a new back every round.
- 🔧 Tapped title Aces hop straight up along the card.
- 🔧 Penalty +10 now comes before Double Down in the rules.

## 0.23.6 (2026-10-25)
- 🔧 The music loads with the game and starts with the menu. Browsers that need a click first get a "Click to start" button.
- 🔧 The loading text hops like the rest of the game's text.
- 🔧 While others ride on your formation, you can select several cards for your next one.
- 🔧 Text in the game can no longer be selected (names and codes you type still can).

## 0.23.5 (2026-10-25)
- 🔧 New music: the TximTxom Theme by BadJuice, in place of the Balatro track.

## 0.23.4 (2026-10-25)
- 🔧 "Loading..." under the loading card.
- 🔧 The Controls tab lists right-click (deselect all cards), under "Keyboard and mouse".

## 0.23.3 (2026-10-25)
- 🐛 The loading card glitched while it turned.

## 0.23.2 (2026-10-25)
- 🔧 The loading card turns over: red Joker, back, black Joker, back. The back is a new colour each time.
- 🔧 Right-click no longer opens the browser menu. In a game it lets go of the selected cards.

## 0.23.1 (2026-10-25)
- 🐛 The table showed no cards (hand, piles, other players) since 0.23.0.
- 🔧 The Cards tab in Settings is now called Graphics.

## 0.23.0 (2026-10-25)
- ✨ A spinning card shows while the game loads.
- 🔧 Anti-aliasing "Everything" no longer blurs the cards: only the edges between pixels are smoothed. It is now the default.
- 🔧 The hand points read "Total" and "Unformed" (points of the cards left out of formations).
- 🔧 The edition shine sways like a wave: three steps forward, one back.
- 🔧 Bigger Aces on the title screen.
- 🔧 More colour on the buttons: How to play, the bot buttons and the reset buttons.
- 🔧 How to play no longer mentions Mixed Suits; the rule is explained in the room.
- 🐛 "Unformed" counted a card that still fitted a laid formation (a third 7 next to a pair of 7s) as left over.
- 🐛 The hint over the hand points flickered while the pointer moved across it, and the browser showed its own hint too.

## 0.22.1 (2026-10-24)
- 🔧 Polychrome is now a 5% chance per Ace, up from 3%.

## 0.22.0 (2026-10-21)
- 🔧 The title-screen Aces are no longer sure to get an edition: each one rolls for it every time they are dealt (Foil 10%, Holographic 7%, Polychrome 3%, Negative 3%).
- 🔧 Negative inverts the card's colours and keeps its sheen, so rank and suit stay readable.
- 🔧 The title has a thin dark outline, so it reads over any colour of the background.
- ✨ The Aces may answer to a certain word.

## 0.21.0 (2026-10-20)
- ✨ The title-screen Aces get Balatro-style editions: Foil, Holographic, Polychrome and Negative, as shaders that shimmer under the pointer. Each one lands with its own sound and a little jolt, in a new shuffle every visit.
- ✨ Added RDCLSM.
- 🔧 Settings: a switch and the sliders it locks share a frame (Mute with the volumes, CRT with its strength).
- 🔧 In the room, language and Settings sit in the top corner of the screen, as on the title screen.
- 🔧 The small buttons show their name next to the icon where there is room (computer), and just the icon where there is not (phone).
- 🔧 "After formations" is now "Formed". Labels sit on the left, numbers on the right.
- 🐛 TximTxom! and Txi jog are the same size as the other action buttons, and on phones the buttons have more room between them.

## 0.20.0 (2026-10-20)
- ✨ Next to Hand Points, "After formations" shows in blue what your hand would still be worth once you lay your formations: from the best way of laying them to the worst.
- ✨ Added 👾.
- 🔧 Scores, Formations and History are small buttons too, like Rules, on computer and phone.
- 🔧 In the room, the two panels end on the same line.
- 🔧 Settings > Controls: the two columns of keys are evenly spaced.
- 🐛 Phones: the top buttons, the name plates and the bar under the hand no longer overlap, down to 360px wide screens.

## 0.19.0 (2026-10-19)
- ✨ While you drag a card over your hand, the other cards open a gap where it would land, like in Balatro. The title-screen Aces do the same.
- ✨ Anti-aliasing setting (Cards tab): off, card edges (default) or everything.
- ✨ Esc opens Settings during a game.
- ✨ Leaving the room asks first.
- 🔧 Settings sits in the top corner next to the language switch, on the title screen and in the room. The room no longer has a Changelog button.
- 🔧 In a game, Help, Settings and Leave are small buttons with clearer icons. Leave is now "Leave game" or "Leave room".
- 🔧 The room is centred on the screen.
- 🔧 The title is bigger on big screens.
- 🔧 Settings: "Reset to defaults" shows on every tab. Muted sound and CRT off grey out their sliders instead of hiding them. Slider values sit in the middle of the bar.
- 🔧 Keyboard list: "Hold R" instead of "R hold", centred on the screen.
- 🐛 Name plates no longer overflow at 160% text size.
- 🐛 Scoreboard: more space between names and the coloured circles.

## 0.18.2 (2026-10-19)
- 🔧 The title-screen Aces drag like cards in your hand: drop one on the fan to move it to a new spot, anywhere else and it goes back. The fan starts over when you return to the title screen.

## 0.18.1 (2026-10-19)
- 🔧 The Aces on the title screen stay where you drop them. They go back into the fan when you return to the title screen.

## 0.18.0 (2026-10-19)
- 🐛 A card can be dragged onto an empty discard pile.
- 🐛 While you drag a card, the buttons at the bottom are locked, so "End with" can no longer fire mid-drag.
- 🔧 "That is not a valid formation" now gets the Nope! too.
- 🔧 Another player's draw shows what they did: a returned card turns face up on its way to the discard pile, a kept one tucks into their hand while another card leaves it.
- 🔧 "Já está" is now "Acabar de mostrar" ("Finish showing") and must be held to confirm, so it is no longer pressed by mistake.

## 0.17.0 (2026-10-19)
- 🐛 Auto-sort no longer turns itself off when a dragged card goes back to your hand without moving, or is dropped somewhere it cannot go.
- ✨ Your character is remembered: new rooms give it back to you if nobody else has it.
- ✨ New rooms start with the rules you used last as host. A "Reset to default rules" button puts them back.
- ✨ Settings has a Controls tab: hand sorting, Confirm moves, the keyboard shortcuts, and a Left-handed option that swaps the sides of the buttons at the bottom.

## 0.16.0 (2026-10-19)
- 🔧 New look: cards, card backs, characters, rule pictures and badges now come from Kenney's free art packs instead of Balatro.
- 🔧 Bots are dungeon characters with new names: Mágiku, Kabaleru, Bikingu, Fantasma, Ziku and Frei. Players pick from 14 characters.
- 🔧 New sound effects from Kenney. The music stays for now.
- 🔧 Rules renamed: Superposition is now Ace High, Smeared is Mixed Suits, and Sixth Sense is Peek.
- 🔧 Portuguese text translates every game term except Rabenta, TximTxom, Txi jog and the Panha Boleia! and Jog txid! callouts.
- 🐛 Banners no longer break words in the middle on phones.

## 0.15.3 (2026-10-18)
- 🔧 New browser tab icon made from the TximTxom logo, plus a home screen icon for phones.

## 0.15.2 (2026-10-18)
- ✨ How to play, Formations, Settings and Changelog are now in the game room too.
- 🔧 Cards move snappier, closer to Balatro: selecting, hovering, dealing and sorting settle in about a fifth of a second.
- 🗑️ Small card pictures (history, Formations) no longer show a hint on hover.
- 🔧 A dragged card follows the pointer without bouncing, and the title Aces swing more gently.
- 🔧 Burning cards glow gold, orange and red instead of purple.

## 0.15.1 (2026-10-18)
- ✨ Before a new deal, the cards left on the table burn away like the Hanged Man in Balatro, and a fresh deck is placed in the middle.
- 🔧 The title Aces swing while you drag them: they lean into the movement and wobble when shaken.
- 🔧 Hover hints use the game's own style instead of the browser's.
- 🐛 Callout text has a dark outline, so it reads over card backs.

## 0.15.0 (2026-10-18)
- ✨ Buttons, headings and the title wobble, and a wave hops across their letters one at a time.
- 🔧 New background: a simpler swirl of our own that spins up and changes colour when the screen changes.
- ✨ Rooms and rounds get a random colour palette, including a new gold and silver one. Red and blue stay on the title screen.
- ✨ "Fill with bots" and "Remove all bots" in the lobby, above the player list. Free seats hold their place, so nothing jumps around when players join.
- 🔧 Bots are marked with the Uncommon Tag, and the lobby icons sit in fixed columns.
- ✨ The Aces on the title screen can be picked up, dragged and tapped.
- 🔧 When the round ends, the draw and discard piles slide into one stack next to the ending card.
- 🐛 "Your turn" and other callouts no longer show on top of open windows.
- ✨ Tags on the player plates: the Rare Tag marks the host and the Handy Tag whose turn it is. Hover them for a hint.
- 🔧 New rename and remove icons in the lobby.
- 🔧 A dragged card stays upright instead of leaning.
- 🔧 Opening the history panel moves the table over in one go.
- 🔧 The buttons under the title panel fill its width.
- 🐛 A host who reloaded right after a change (like starting the game) could come back to an older state of the room.

## 0.14.3 (2026-10-18)
- 🐛 Players whose networks block direct connections can play together: the game falls back to a relay server.

## 0.14.2 (2026-10-18)
- ✨ The title screen shows four Aces fanned like a hand.
- 🔧 A drawn card leaves the Draw Pile face down and turns over when it lands.
- 🔧 "Take a ride!" shows before the formation lands, so it no longer covers the cards.
- 🔧 The squares behind callouts are half the size.
- 🔧 "No formations possible" instead of "No more formations possible".
- 🔧 The Join button fills the rest of its row.
- 🐛 With Auto sort on, the hand stays sorted while a discard waits for End Turn.
- 🐛 Your name is saved when you leave the name box.
- 🐛 Renaming yourself in the room no longer resets when someone joins while you type.

## 0.14.1 (2026-10-18)
- 🔧 More servers to help browsers on different networks find each other; a dead relay server was removed.
- 🐛 When the room exists but the connection is blocked, the error says so instead of "Room not found".

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
