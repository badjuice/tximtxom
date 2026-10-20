# TximTxom

A card game for 2 to 4 players in the browser. Group your 7 cards into pairs, trios, quads and straights; ungrouped cards count as points, and the lowest total wins.

Play: https://badjuice.github.io/tximtxom/
Rules: [docs/RULES.md](docs/RULES.md) · Changes: [CHANGELOG.md](CHANGELOG.md)

The room creator's browser hosts the game; other players connect to it over WebRTC ([PeerJS](https://peerjs.com)). There is no game server.

## Credits

- Cards, characters, icons and sound effects: [Kenney](https://kenney.nl) (CC0): Playing Cards Pack, Tiny Dungeon, Board Game Icons, Casino Audio, Interface Sounds, Impact Sounds, Music Jingles, RPG Audio, UI Pack and Game Icons. `npm run assets` rebuilds them from the packs unzipped in `.cache/kenney/<pack>/`.
- Font: m6x11plus by [Daniel Linssen](https://managore.itch.io/m6x11).
- Music: from [Balatro](https://www.playbalatro.com/) by LocalThunk, published by Playstack, until it is replaced. TximTxom is a non-commercial fan project and claims no rights to it.

Made by [badjuice](https://github.com/badjuice).
