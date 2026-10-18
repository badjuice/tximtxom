# Backlog

Future work, in the order we plan to tackle it. Each item gets its own plan before any code is written. Bugs and quality-of-life changes come first.

## Bugs

1. Auto-sort keeps turning itself off.
2. A card can't be dragged onto an empty discard pile; only the buttons work.
3. While a card hovers over the discard pile, the "end with" button still works.
4. When the game is over and the host leaves, players get kicked out. They should stay on the end-of-game modal, see a "host left" notice, and still be able to copy the log, review stats, or go to the main menu.

## Quality of life

5. "That is not a valid formation" plays the "nope" animation.
6. User preferences persist, including the sort options.
7. Controls move to their own tab in the settings modal.
8. Better icons for the Leave, Settings and How to play buttons.
9. The draw animation shows clearly whether another player kept the drawn card or returned it to the discard pile.
10. "Já está" confusion: players press it thinking it ends their ride, and finish showing formations, often with none shown. Make the state clear and prevent the misclick. A long press is one option; to be discussed.
11. Show hand points excluding possible formations, as a min–max range that depends on the active rules.

## Logging

12. A log of actions and game states that can reproduce a match. It is never shown mid-game, so nobody can see the starting hands. When a match ends, the log is dumped to the console, with a copy button per match and one for the full history.

## Features

13. Chances of an instant loss or instant win, calculated or simulated.
14. In-game chat and emotes.
15. Gold: a currency earned for formations and for rounds and games won. To be expanded.
16. Player stats, round stats and game stats. To be expanded.
17. Achievements (open question).
18. A hand-drawn cursor that changes image and animates with context: an open hand over a card you can pick up, closing into a fist while grabbing it, and a pointing finger with the thumb out over buttons. Other states to be defined.
19. A browser easter egg.

## New rules

20. No rides at all (art idea: Hit the Road).
21. One more deck in the pool (art idea: Juggler).
22. Bigger hand size (art idea: the Bean).

The art ideas are Balatro Joker names. The 0.16.0 asset swap removes Balatro art, so each rule's art will be picked from the Kenney set when its turn comes.
