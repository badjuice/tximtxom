# Changelog

Generated from `packages/client/src/changelog.ts` (`npm run changelog`); the game shows the same list.
Versions follow semantic versioning; up to 0.11.0 they were assigned afterwards from the commit history and are tagged in git.

✨ new · 🔧 changed · 🐛 fixed · 🗑️ removed

## 0.49.10 (2026-11-01)
- 🐛 The Achievements button's golden glow now goes all the way round, bottom included.

## 0.49.9 (2026-11-01)
- 🐛 The auto-skip countdown no longer runs into the button's text.
- 🔧 Player plates in the game have a thicker border.

## 0.49.8 (2026-11-01)
- ✨ Chat messages show the time they were sent, and a date where the day changes.
- 🔧 Your name in the chat reads "Name (you)".
- 🔧 The chat's Send button still looks like a button while there's nothing to send.

## 0.49.7 (2026-11-01)
- 🔧 Locked rules show the rule they need in its own colour.
- 🔧 The emotes stay open while you pick, and close when you tap elsewhere.
- 🐛 Emotes now rest for 3 seconds after each one: greyed out, with a ring that empties as the wait runs out.

## 0.49.6 (2026-11-01)
- 🔧 The game waits longer before going to sleep in the background: 10 minutes, 15 in a room.

## 0.49.5 (2026-11-01)
- 🔧 Achievements: bigger count and progress bar text, and a hovered card comes forward and grows instead of tilting.
- 🔧 Bigger Aces on the main menu on big screens.

## 0.49.4 (2026-11-01)
- 🔧 Main menu: one button per row on phones, and a wider box on computers.

## 0.49.3 (2026-11-01)
- 🔧 The main menu's Achievements button pulses with a golden glow while any achievement is New!.
- 🔧 Magic sort is only in the game, with the Magic Sort rule: it's gone from Settings.
- 🔧 A new room always starts on the default rules.

## 0.49.2 (2026-11-01)
- 🔧 Nope! and the other quick callouts stay on screen a bit longer.
- 🐛 An achievement unlocked while the Achievements window is open (Window Shopper) gets its New! sign right away.

## 0.49.1 (2026-11-01)
- 🐛 When a round ends, the piles slide aside before any formation is shown, so formations no longer land under them.

## 0.49.0 (2026-11-01)
- 🔧 The "rule off" achievements are now "everything but": finish a game with every other rule on. Mobius Strip goes off with Ace High, and either Magic Sort or Scramble counts.
- 🔧 Magic Sort and Scramble can't be on together: turning one on turns the other off, and says so.
- 🔧 A rule that needs another is striped under a gold padlock sign; tapping it shakes it and flashes the rule it needs. Mobius Strip's achievement says it needs Ace High.
- 🔧 Lobby: How to play and Formations sit at the top next to Settings, as in the game, and Rules is a button above Start game that says how many rules changed.
- 🔧 New achievements glow with a golden tint, and achievement cards lift a little when hovered.

## 0.48.1 (2026-11-01)
- 🔧 Tapping a rule card at the top of the table explains it in a balloon, as on the Formations screen.
- 🔧 Anarchist now needs your whole hand formed in a round, with no J, Q or K.
- 🔧 Card back credits its Kenney pack; the Board game backs are named Blue, Red, Green and Blue Frame, Red Frame, Green Frame.
- 🐛 The lobby no longer jumps when a second player joins.
- 🐛 A dragged TximTxom example card on the Formations screen keeps changing instead of freezing.

## 0.48.0 (2026-11-01)
- ✨ Saves battery: left in the background (3 minutes, 5 in a room), the game goes to sleep. Come back and it reloads, straight into your room.
- ✨ Settings > Graphics: Frame rate (Auto is 30 on phones, 60 on computers; also 15, 30, 60, 120) and Low power graphics.
- 🔧 The music pauses while the tab is hidden; out of focus, everything runs at 10 frames per second. The table stops drawing when no cards are on it.
- 🐛 The Achievements button's letters hop again.

## 0.47.0 (2026-11-01)
- ✨ New achievement: Window Shopper, scroll to the end of the Achievements list.
- 🔧 The Credits window is wider, and each section has an icon.

## 0.46.1 (2026-11-01)
- 🔧 Least Worst is now Last One Standing: win a game where everyone but you busted.

## 0.46.0 (2026-11-01)
- ✨ A Credits button next to Language on the main menu: everyone who made the game possible, with links to their pages.
- 🔧 A New! achievement's border pulses with the same glow as its sign.
- 🐛 In Achievements only the list scrolls, its scrollbar starts at the first row, and the cards' right edge and glow are no longer cut off (phones included).

## 0.45.0 (2026-11-01)
- ✨ New achievement: Least Worst, win a game where everyone busted in the last round.
- 🐛 New! signs on achievements now clear: hover or tap the card and the sign fades away.
- 🔧 "Nananinanão!" turns up more often: one time in twenty.

## 0.44.1 (2026-11-01)
- 🔧 In Portuguese, the Pass countdown reads "Passa automaticamente em 9,4s".
- 🐛 The Achievements window is wider, never scrolls sideways, and its first row (with any New! signs) is no longer hidden under the top.

## 0.44.0 (2026-11-01)
- ✨ New rule, Magic Sort (support): turns on the Magic sort button. Magic sort now follows the room's rules and groups cards one short of a formation, after the formed ones.
- ✨ New rule, Scramble (funny): no sorting, and every card someone picks up shuffles everyone's hand.
- ✨ New achievements: Vanilla (win with the default rules), and one per rule for finishing a game with it off while another rule is on.
- ✨ Achievements you haven't seen yet show a New! sign, on the Achievements button and on the card, until you look at them.
- 🔧 Auto-pass waits 10 seconds when the formation could still take a card, 5 when it's full, and the button says "Auto-skipping in 9.4s" over a smooth bar.
- 🔧 Thin scrollbars in the game's colours, beside the content instead of over it. The top of Achievements and the Changelog stays in view while you scroll.
- 🔧 Boardgame card backs: variants 1 and 3 of each colour, and Random never shows one colour twice in a row.
- 🔧 How to play colours "2–10 as printed" like the other card values.

## 0.43.2 (2026-11-01)
- 🔧 The page checks for a newer version as it loads and reloads itself to get it. Game files are fetched fresh for each version.
- 🔧 The achievement shine is slower and more see-through.

## 0.43.1 (2026-11-01)
- 🔧 An automatic pass in the History says why: no card fits, the formation is full, or the player can't add more to it.

## 0.43.0 (2026-11-01)
- ✨ Magic sort puts the cards of each formation together. A setting picks whether the cards that form nothing go left or right.
- ✨ When none of your cards can ride, Pass counts down 5 seconds and passes for you. The History marks moves the game made for a player with a timer icon.
- ✨ The History folds earlier rounds and earlier games in the room instead of losing them. Open one to read it or copy it.
- ✨ Unlocking an achievement shines the whole card three times, with a chime for each.
- ✨ Formations show their cards first, then their name, which shines when laid and again for each card added. A closed formation shines once.
- ✨ Stats count the rides you gave.
- 🔧 Straights are named by their length before rides, like 4-Straight.
- 🔧 TximTxom has to be called with a card of 5 or less, like Txi jog.
- 🔧 Hand points stack on wide screens too, and round totals stay on one line. The pile counters appear once the cards are dealt.
- 🐛 Txi jog with a card picked before drawing ends the round with that card and keeps the drawn one.

## 0.42.0 (2026-11-01)
- ✨ Emotes: 12 pixel emotes by Kenney. Pick one from the smiley button on your plate or next to the chat field, and it pops up over your plate (or your row in the lobby) for everyone.
- ✨ A Chat button in the top bar (shortcut C) opens the chat directly and shows how many messages you haven't read.
- ✨ New achievements: Show, Don't Tell (send your first emote) and Anarchist.
- 🔧 The side panel's close button looks like a button.

## 0.41.0 (2026-11-01)
- ✨ New achievements: Say Hi, Polyglot, Recycler, Through the Ace, Quick Draw, Royal Flush and Seven Up, plus five secret ones.
- ✨ New achievements with progress bars: Chatterbox, Badge Collector, Scavenger, Marathon, and one for each kind of badge.
- 🔧 Gold badges have a 50-win step after Midas (5) and Card Shark (10).

## 0.40.2 (2026-11-01)
- 🐛 High contrast cards now tell all four suits apart: diamonds are orange and clubs dark blue, while hearts stay red and spades black. Card backs are unchanged.

## 0.40.1 (2026-11-01)
- 🐛 Txi jog plays out as at a real table: the ending card goes face up under the discard pile, then the whole pile is turned face down onto the draw pile.

## 0.40.0 (2026-11-01)
- ✨ Chat: one conversation per room, in the lobby and in a Chat tab next to History during a game. A count shows messages you haven't read.
- ✨ Stats has a Badges tab: gold, silver and bust badges, and the total.
- 🔧 Rule achievements now need a whole game finished with the rule on, not just one round.
- 🔧 The in-game Rules window shows what each rule does, under its name.
- 🔧 The Txi jog sign over the Draw Pile says why a card can't end the round (the card you just took, or higher than 5).
- 🐛 Dropping a card on the Txi jog sign over the Draw Pile now ends the round, as dropping it on the pile does.
- 🐛 The card burn and deck animations render properly on phones.
- 🐛 A tab reopened by the browser (after sleeping, a reload or Back) starts on the main menu instead of jumping into Play.

## 0.39.0 (2026-11-01)
- ✨ New rule, Mobius Strip: straights loop through the Ace, so it can sit in the middle (K-A-2). It needs Ace High.
- ✨ A rule that needs another is greyed out until that one is on, with a sign saying which.
- ✨ New achievement for playing with Mobius Strip. Ace High has a new flavour line.
- 🔧 Settings explain what they do as they are set: "The table stays still", "Cards stay where you put them" and so on.

## 0.38.1 (2026-11-01)
- ✨ New epic achievement: Self-Service, for taking a ride on your own straight.

## 0.38.0 (2026-11-01)
- ✨ New achievements for pairs, trios and straights of 5 cards or more.
- ✨ Once someone stretches your straight, you can add to it too: a 2 on your 3-4-5-6 lets you place an Ace.
- ✨ Tap to deselect: a setting for one tap on the table to let go of your cards. Without it, touch screens take a double tap.
- 🔧 Formation achievement goals follow how often each formation turns up: the last quad one asks for 15, not 100.
- 🔧 Rulebook and Addicted show a progress bar.
- 🔧 Each rule achievement has its own flavour line.
- 🔧 Any number of hand cards can be selected at any time. A move that takes one card uses the last one picked.
- 🔧 A left click on the table no longer lets go of your cards. Right-click does.
- 🐛 A formation keeps the name it was shown with: a trio with a card added is "Trio +1", not "Quad +1".
- 🐛 When the turn timer runs out, your hand stays as it was: a drawn card is discarded, and a card taken from the discard pile goes back.

## 0.37.0 (2026-10-29)
- ✨ Progress achievements at 5, 25 and 100: rounds won, games won, formations, straights, quads, rides taken, rides given, Txi jogs and cards drawn. Each card shows how far along you are, and keeps counting past its goal.
- ✨ New achievements: Close Call, Flawless, Comeback and Generous.
- 🔧 Roundhouse, Card Shark, Midas and Bus Pass show their progress too.
- ✨ Stats count the rides other players take on your formations.

## 0.36.2 (2026-10-29)
- 🔧 Rulebook wears legendary gold. The rainbow frame is saved for a later achievement.

## 0.36.1 (2026-10-29)
- 🔧 Rulebook is a legendary achievement, still in its rainbow frame.

## 0.36.0 (2026-10-29)
- ✨ New achievements: New Look, Distracted, one for playing a round with each rule, and Rulebook for playing with every rule, framed in moving rainbow colours.
- 🔧 Unlocked achievements shine like the rules: their names and cards glint in their rarity's colour.
- 🔧 A legend at the top of Achievements explains the rarity colours, in place of the hint when pointing at a card.

## 0.35.2 (2026-10-29)
- 🔧 Action buttons too narrow for their label say the short form ("Show", "Discard") instead of cutting it off.
- 🔧 With a turn timer, the clock starts again after each formation you show.
- 🔧 The timer bar on the player card shows the seconds left in its middle.

## 0.35.1 (2026-10-29)
- ✨ Joining or creating a room that takes a moment shows "Joining..." with the loading screen's spinning card, over a dimmed screen that waits until you're in.

## 0.35.0 (2026-10-29)
- ✨ New achievement: Full Hand, for ending a round with all 7 cards formed.
- ✨ In Formations, a rule card opens its rule in a balloon pointing at the card.
- 🔧 Every rule you can switch now starts off, so anything switched on was chosen. Formation notice was the one that started on.
- 🔧 Bigger text on large screens. Medium and small screens keep their size, so windows still fit.
- 🔧 Locked achievements say they are locked when you point at them; their rarity shows once unlocked.
- 🔧 The loading card floats up and down as it spins.
- 🐛 TximTxom glows in the rule texts in Formations.

## 0.34.2 (2026-10-29)
- 🔧 Rule cards shine like their names: a glint in the rule's colour crosses each card from top left to bottom right.

## 0.34.1 (2026-10-29)
- 🐛 Changing the language no longer flashes the main menu Aces without their edition.
- 🐛 The Style preview keeps its cards in place while a new card style loads.
- 🐛 "Reportar um problema" breaks onto two lines inside its button.
- 🔧 Achievements wear their rarity colour all the way round.

## 0.34.0 (2026-10-29)
- ✨ New achievements: Ragequit, 2nd Place First Loser, RTFM, Full Party!, Roundhouse, Bus Pass, Addicted, Card Shark, Midas, Bad Timing, and a secret one.
- ✨ Achievements show their rarity down the side: blue common, green uncommon, purple epic, gold legendary, red secret. Grey until unlocked.
- ✨ History: copy one finished round, or the whole game, as a compact log.
- ✨ A Full Hand or a TximTxom stays pinned on screen after its banner, with who did it.
- ✨ Stats count the games you left early. Percentages now sit in parentheses beside wins and losses.
- 🔧 Penalty +10 and Double Down pardon an ender with 0 points.
- 🔧 History only follows new moves while you are at the bottom. Reopening it jumps back to the newest move.
- 🔧 "-10! Full hand" is now "Full Hand! -10".
- 🐛 Tapping the Aces on the main menu quickly no longer flashes them without their edition.

## 0.33.0 (2026-10-29)
- ✨ Silver and bust badges: at the end of a game everyone who lost without busting gets silver, and whoever busted gets the skull. Each badge names itself when you point at it, with its count beside it.
- ✨ The Scoreboard has three tabs: this round, every round of this game, and the badges of every game played at the table. It no longer scrolls.
- ✨ Tap the empty table to let go of the cards you selected.
- 🔧 BUST pulses in red at the end of the game.
- 🔧 Rule names glow in their colour everywhere: the room's rules, the rules in a game, descriptions and banners.
- 🔧 In the room, Leave room sits beside the title and Start game takes the whole row.

## 0.32.0 (2026-10-29)
- 🔧 Shown formations are labelled in their owner's colour instead of with their name, so labels no longer overlap. A +2 after the name counts the cards others added on rides.
- 🔧 Cards added on a ride have a border in the colour of the player who added them.
- 🔧 Bots join as a random character instead of always the same ones in the same order.
- 🔧 Nope! sometimes says Nuh-uh! instead, and very rarely something else.
- 🔧 Totals in the score tables end in pts.

## 0.31.2 (2026-10-29)
- ✨ Achievements have a progress bar.

## 0.31.1 (2026-10-29)
- 🔧 With reduced motion on, TximTxom no longer sits still: the whole word slowly fades from colour to colour.

## 0.31.0 (2026-10-29)
- ✨ A Style tab in Settings: switch the card art to the smooth cards of Kenney's Boardgame Pack, with 15 new card backs, and pick the game's font from five.
- ✨ Infected now also counts how many players caught it from you. Both counts are a secret: you know where to look once you have it.
- 🔧 Stats' Overview fits without scrolling: the big numbers sit beside the formations.
- 🐛 TximTxoms in Stats wasn't colourful or animated.

## 0.30.0 (2026-10-29)
- ✨ Three new achievements: Tip Tap (tap each Ace on the main menu), and two secret ones.
- ✨ Rule names light up in their colour wherever they're mentioned, and the coloured words in How to play wave.
- ✨ Formations: tap a rule card to read its rule. Card values are shown as cards.
- ✨ Stats: your longest game, and a bar of where your cards came from (Draw Pile or Discard Pile).
- ✨ The Language button has an icon.
- 🔧 The player counter is hidden. Rumour has it the name at the bottom of the main menu knows something. It now counts rounds played too.
- 🔧 Infected now spreads at the start of every round, to everyone at the table who doesn't have it yet.
- 🔧 How to play, Stats and Settings are wider, with their tabs in one row. Stats' third tab is just Cards, and Visits and Playing since moved to Overview.
- 🔧 Achievement toasts stay a little longer, so there's time to read them. That's Nuts! is now Dirty Hands.
- 🔧 Taking a ride is explained in How to play instead of Formations.
- 🐛 TximTxom's wave wasn't moving.
- 🐛 The swirly background could be broken on phones.
- 🐛 Hovering the formation chart in Stats showed hints in the top left corner. It shows each formation's share instead.
- 🐛 In the room, the Settings button could cover the other buttons on some screen sizes.
- 🐛 Locks on locked achievements are the size of the question mark.
- 🗑️ Cards discarded and the counts for everyone are gone from Stats.

## 0.29.0 (2026-10-28)
- ✨ Achievements! Eleven to unlock, some of them secret. A toast at the top of the screen tells you when you get one.
- ✨ Pick up the cards in the menus and windows (rules, characters, achievements, card backs) and swing them around, just for fun.
- ✨ The Changelog has buttons to report an issue on GitHub or to contact me.
- ✨ Stats show the date and time you started playing.
- 🔧 TximTxom's colours flow from left to right, with a dark outline so it reads on any background, and its letters ride a wave.
- 🔧 In the room, the rules open in their own window from a red Rules button, next to How to play and Formations. The room no longer scrolls.
- 🔧 Settings has an Accessibility tab. Controls only lists the keyboard and mouse, and is hidden on touch screens. Sorting moved to General.
- 🐛 The Aces only show on the main menu, not behind the Play panel.
- 🐛 The Aces could appear in the wrong colours while materialising on some browsers.

## 0.28.0 (2026-10-28)
- ✨ A new main menu in the style of Balatro: Play, Stats, Achievements (coming soon), Settings, Changelog and How to play.
- ✨ Stats: time in games, rounds and games played, won and lost, win streaks, best and worst round, lowest total, record bust, cards drawn and a chart of your formations.
- ✨ A counter on the main menu shows how many players and visits the game has had.
- ✨ Drag a card onto the Txi jog button to Txi jog. A hand card takes the drawn card's place. The button lights up while you hold a card it takes.
- ✨ Calling TximTxom without one gets a Nope!
- ✨ TximTxom glows in colour and waves wherever it's written, except the title.
- 🔧 Options with several choices are picked with arrows, with dots showing the choice, like Game speed.
- 🔧 Anti-aliasing is just on or off.
- 🔧 A room code is forgotten 10 minutes after you leave the room.
- 🔧 The rules in a game show as a short two-column list, with On in green and Off in red.
- 🔧 Settings, Stats, How to play and the language menu are narrower, and switching tabs no longer changes their size.
- 🔧 Round and game summaries are more compact, and lobby rules take one row each on desktop.
- 🔧 Rename and Remove in the lobby look like buttons, and the language menu's title is blue.
- 🐛 On short screens and with bigger text, the hand and piles move up so nothing overlaps.
- 🐛 Hopping letters no longer shimmer.
- 🐛 The game page can no longer be scrolled.
- 🐛 The Aces on the menu can't be tapped or lit up before they appear.
- 🐛 "cards" no longer spills out of the player plates on phones.
- 🗑️ Stats are no longer in Settings: they have their own button on the main menu.

## 0.27.1 (2026-10-26)
- 🔧 When every player has left, the bots stop and wait: for someone to come back, or for the room to close after 10 minutes.

## 0.27.0 (2026-10-26)
- ✨ Players say Ready in the lobby before the host can start. A tick or an hourglass shows who is ready.
- ✨ A Language button on the main menu opens a language menu. The PT/EN switch in the corner is gone.
- ✨ Left a game in progress? Join on the main menu takes you back to your seat.
- 🐛 Switching language no longer moves buttons and labels: each takes the space of its longest translation.
- 🐛 Scoreboard columns have even widths, and the copy button's icon is centred.
- 🐛 The browser's own tooltips no longer show on hover.
- 🔧 The History log is more compact.
- 🔧 Leave game is no longer in Settings.

## 0.26.1 (2026-10-25)
- 🐛 When the turn timer ran out, the game could end the round for you. Now it only draws and discards for you; the round ends on its own only if the Draw Pile runs out.
- 🐛 Every active rule shows on the round chip, and its hint gives the rule's name and description.
- 🔧 In game, History and How to play swapped places.

## 0.26.0 (2026-10-25)
- ✨ Drag a card of 5 or lower onto the Draw Pile to Txi jog. The pile shows a Txi jog sign while you hold one.
- 🔧 Txi jog plays out as at a real table: the card slides face down under the Discard Pile, and the pile goes onto the Draw Pile. Nobody sees which card it was.
- 🐛 A new round started out of order. Now the old cards burn, the new deck appears, the cards are dealt, then the bottom card opens the Discard Pile. Bots wait for all of it.
- 🔧 Random card backs use every back once before repeating, and never the same one twice in a row.
- 🔧 On the menu, the Aces appear a second after the title, one at a time. Tapping an Ace no longer makes it appear again.
- 🐛 Button hints point at their button near the screen edge, and don't show when the button's text already says it.
- 🔧 Reset to defaults asks first.
- 🔧 Screen shake and Animated background sit under Reduced motion, which turns them off; locked switches are now clearly greyed out.

## 0.25.0 (2026-10-25)
- ✨ Drag the top of the Discard Pile onto a hand card to take it in that card's place; the hand card goes to the pile.
- 🐛 Auto sort turned itself off when a card was dragged. It now stays on and keeps the hand sorted as cards come and go.
- 🔧 Held cards swing and wobble as they move, instead of staying upright.
- 🔧 Sound drops to 10% while the game's window or tab is not in focus.

## 0.24.4 (2026-10-25)
- 🔧 The title Aces start materialising only once the "TximTxom" title is whole.

## 0.24.3 (2026-10-25)
- ✨ Each round, the new deck materialises in Tarot purple before the cards are dealt.

## 0.24.2 (2026-10-25)
- 🔧 "Click to start" always opens the main menu. After a refresh, Join reads "Rejoin" and takes you back to your seat.
- ✨ The "TximTxom" title materialises in Spectral blue before the Aces.

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
