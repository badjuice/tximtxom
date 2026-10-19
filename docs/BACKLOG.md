# Backlog

Future work, grouped into batches of items that touch the same code, so each batch opens those files once. Batches run in this order: the ones with bugs first, then quality of life, then features. Each batch gets one plan before any code is written, and ships as one release.

## Batch 1: Settings and preferences

Code: `settings.ts`, the Settings modal (`ui/Menus.tsx`), the sort controls (`ui/Hud.tsx`).

- **Bug:** auto-sort keeps turning itself off.
- Preferences persist, including the sort options (rank or suit, auto-sort).
- Controls move to their own tab in the Settings modal (the modal already has General and Cards tabs).

## Batch 2: Dragging, discarding and feedback on the table

Code: drag and drop in `game/table.ts`, actions in `controller.ts`, the "nope" shake.

- **Bug:** a card can't be dragged onto an empty discard pile; only the buttons work.
- **Bug:** while a card hovers over the discard pile, the "end with" button still works.
- "That is not a valid formation" plays the "nope" animation.
- The draw animation shows clearly whether another player kept the drawn card or returned it to the discard pile.
- "Já está" confusion: players press it thinking it ends their ride, and finish showing formations, often with none shown. Make the state clear and prevent the misclick. A long press is one option; to be discussed.

## Batch 3: Phone layout and interface polish

Code: `styles.css`, `game/layout.ts`, the top bar and plates in `ui/Hud.tsx`.

- Phone layout is too sparse: use the free space to make plates, piles, buttons and labels bigger and cozier.
- In Portuguese the longer top-bar labels wrap to three rows and the name plates cover the ? and Settings buttons.
- Better icons for the Leave, Settings and How to play buttons.
- A hand-drawn cursor that changes image and animates with context: an open hand over a card you can pick up, closing into a fist while grabbing it, and a pointing finger with the thumb out over buttons. Other states to be defined. Needs the art first (can be drawn in Aseprite).

## Batch 4: Match log, end of game and stats

Code: host room events (`shared/src/host/room.ts`), the end-of-game modal, a new log module. The log is the source the stats are counted from, so they are built together.

- **Bug:** when the game is over and the host leaves, players get kicked out. They should stay on the end-of-game modal, see a "host left" notice, and still be able to copy the log, review stats, or go to the main menu.
- A log of actions and game states that can reproduce a match. It is never shown mid-game, so nobody can see the starting hands. When a match ends, the log is dumped to the console, with a copy button per match and one for the full history.
- Player stats, round stats and game stats. To be expanded.

## Batch 5: Hand analysis

Code: `shared/src/formations.ts` and a new hand evaluator. Both items need the same "best and worst formations for this hand" search.

- Show hand points excluding possible formations, as a min–max range that depends on the active rules.
- Chances of an instant loss or instant win, calculated or simulated.

## Batch 6: New rules

Code: `shared/src/rules.ts`, the game engine, `ui/RulesForm.tsx`, rule art in `tools/build-assets.mjs` (`RULE_ART`).

- No rides at all (art idea: Hit the Road).
- One more deck in the pool (art idea: Juggler).
- Bigger hand size (art idea: the Bean).

The art ideas are Balatro Joker names, kept only as a hint of the mood. The art itself comes from Kenney's Board Game Icons.

## Batch 7: Progression

Code: builds on the stats from Batch 4.

- Gold: a currency earned for formations and for rounds and games won. To be expanded.
- Achievements (open question).

## Batch 8: Social and extras

Code: new messages over the existing PeerJS connection, a chat panel.

- In-game chat and emotes.
- A browser easter egg.

## Batch 9: Audio

Code: `SFX` in `tools/build-assets.mjs`, `audio.ts`. Can run any time it's wanted, since it touches nothing else.

- Sound effects: the 0.16.0 Kenney sounds need another pass. Several feel too short, too long or too high-pitched next to the old ones. Pick replacements by ear (sound-check page with old and new side by side).
- Music: replace the Balatro track once the songs arrive.
