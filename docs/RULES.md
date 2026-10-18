# TximTxom rules

These are the agreed rules. The engine in `packages/shared/src/engine.ts` implements them, and the tests in `packages/shared/test/` check them.

## Setup
- **Deck:** standard 52 cards, no jokers.
- **Players:** 2–4.
- **Turn order:** counter-clockwise. Each player can flip the *visual* layout to clockwise in their own settings; the actual order doesn't change.
- **First dealer:** everyone draws a card, and the lowest card deals. Players who tie redraw from the remaining cards. After that, the dealer passes to the next player in turn order each round.
- **Dealing:**
  - Deal one card at a time, starting with the player to the dealer's right (the next player in turn order), until everyone has 7 cards.
  - The rest of the deck becomes the face-down draw pile.
  - The **bottom** card of the draw pile is turned face up to start the discard pile.
- **First turn:** the dealer plays first.

## A turn
Every player holds 7 cards at the end of their turn. On your turn, choose one:

1. **Take the top discard.** Swap it for a card from your hand. You can't discard the card you just took.
2. **Draw the top card of the draw pile.** Only you can see it. Then either:
   - keep it and discard a card from your hand, or
   - discard the drawn card.
3. **End the round** (*Txi jog*). Allowed after drawing from either pile, provided you then hold a card ranked **≤5** (Ace counts as 1).
   - That card is shown to everyone and slid under the discard pile. Your hand stays at 7.
   - The ending card must be the card you just drew from the draw pile or a card from your hand. You can't end with the card you just took from the discard pile.
4. **Call "TximTxom!"** You need a 7-card straight of a single suit in hand.
   - You can call it on your turn, before or after drawing.
   - It wins the **whole game** immediately.
   - The game and the call are both spelled **TximTxom**.

## When the draw pile runs out
- **First time:** reshuffle every discard except the top card into a new draw pile. This happens only once.
- **Second time (a "pile-out"):** the player who drew the very last card must end the round. They can use **any** card, either the one they drew or one from their hand.
  - If that card is ≤5 and their hand is fully formed, they get the -10.
  - **Nobody can take a ride** after a pile-out, whatever card was used.
- **Edge case:** if a reshuffle would leave the new draw pile empty, the round is treated as a pile-out.

## Formations
| Formation | What it is |
|---|---|
| Pair | 2 cards of the same rank. Not allowed in **Hardcore**. |
| Trio | 3 cards of the same rank |
| Quad | 4 cards of the same rank |
| Straight | 3 or more consecutive cards of the same suit. With **Smeared**, the suits can mix. |

- **Aces:** low by default (A-2-3). With **Superposition** an Ace can also be high (Q-K-A). It can begin or end a straight but never sit in the middle, so K-A-2 is never a straight. An Ace always scores 1 point.
- **Each card** belongs to at most one formation.
- **TximTxom** is always a 7-card straight of **one suit**, with or without Smeared.

## Card values
| Card | Points |
|---|---|
| Ace | 1 |
| 2–10 | face value |
| J | 11 |
| Q | 12 |
| K | 13 |

## Scoring a round
- **-10 bonus:** only for the player who ended the round, and only if they ended with a ≤5 card **and** all 7 of their cards are in formations. Nobody can take a ride after a -10. Anyone else with a fully formed hand scores 0.
- **Revealing hands:** the player who ended the round reveals first (after a pile-out, the player who drew the last card), then the others in turn order. Each player lays down one formation at a time and picks the cards themselves. The optional "No formations possible" notice only says when nothing is left to form.
- **Take a ride** (*Panha Boleia*): allowed only when the round was ended by hand with a ≤5 card and without the -10. After each formation is shown, every other player can add cards to it:
  - **Pairs and trios:** one card per player per formation. Different players can each add one, so a pair can grow into a quad.
  - **Straights:** a player can add several cards at either end, in the straight's suit (any suit with **Smeared**).
  - Ride order is a room setting. **Together:** everyone adds cards at once and passes when done; a new card clears everyone's pass. **In turns:** riders go in turn order, lap after lap, until a full lap adds nothing.
- **Round score:** the points of every card not in a formation, or -10 with the bonus. It is added to the running total.

## Ending the game
- A player who goes **over** the limit (40 or 100) busts (*Rabenta*) and the game ends. The lowest total wins; a tie stays a tie.
- A TximTxom call ends the game at once and the caller wins.

## Room settings
| Setting | Joker | Effect |
|---|---|---|
| Limit | Mr. Bones | 40 or 100 points |
| Hardcore | The Trio | Pairs don't count |
| Superposition | Superposition | Aces can be high |
| Smeared (*Borrod*) | Smeared Joker | Straights can mix suits. TximTxom still needs one suit. |
| Ride order | Ride the Bus | Together or in turns |
| Auto Ride | Chaos the Clown | Ride cards are placed automatically |
| Sixth Sense | Sixth Sense | A Peek button shows which cards are still in play |
| No more formations notice | Blueprint | Tells a revealing player when nothing else can be formed |
| Double Down | The Duo | The player who ended the round doubles their points if they don't have the strictly lowest round score |
| Penalty +10 | Credit Card | Same condition, +10 points. With Double Down on too, double first, then add 10. |
| Turn timer | | Off, 30s or 60s |

## Disconnects
A bot takes over the seat right away. A player who comes back gets the seat back with their hand and score.
A room closes when no human has clicked, typed or played for 10 minutes; bots alone don't keep it open. Everyone goes back to the title screen.
