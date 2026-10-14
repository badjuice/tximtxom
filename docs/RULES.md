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
3. **End the round.** Allowed after drawing from either pile, provided you then hold a card ranked **≤5** (Ace counts as 1).
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
|
