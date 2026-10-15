# TximTxom

A card game for 2 to 4 players in the browser. Group your 7 cards into pairs, trios, quads and straights; ungrouped cards count as points, and the lowest total wins.

Play: https://badjuice.github.io/tximtxom/
Rules: [docs/RULES.md](docs/RULES.md) · Changes: [CHANGELOG.md](CHANGELOG.md)

The room creator's browser hosts the game; other players connect to it over WebRTC ([PeerJS](https://peerjs.com)). There is no game server.

## Develop

```bash
npm install
npm run dev    # http://localhost:5173
npm test
npm run e2e
```

Pushing to `main` tests the code and deploys it to GitHub Pages.

## Credits

Card art, Joker art, sound effects and the m6x11 font come from [Balatro](https://www.playbalatro.com/) by LocalThunk, published by Playstack, taken from the [Telatro](https://github.com/Infiniti20/Telatro) repository. The m6x11 font is by Daniel Linssen. TximTxom is a non-commercial fan project and claims no rights to these assets.

To rebuild them from a Telatro checkout:

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/Infiniti20/Telatro.git .cache/telatro
git -C .cache/telatro sparse-checkout set resources/textures_preresize/1x resources/sounds resources/fonts resources/shaders
npm run assets
```

Made by [badjuice](https://github.com/badjuice).
