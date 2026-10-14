# TximTxom

TximTxom is an online card game for 2 to 4 players that runs in the browser. Each player holds 7 cards and tries to group them into pairs, trios, quads and same-suit straights, because only ungrouped cards count as points. A player who goes over the points limit (40 or 100) ends the game, and the lowest total wins. The full rules are in [docs/RULES.md](docs/RULES.md); in-game, see **How to play** and **Formations**.

Play it at **https://badjuice.github.io/tximtxom/**.

## How online play works

There is no game server. The player who creates a room runs it in their own browser: the rules engine, the bots and the turn timer all execute in that tab. Other players connect to the host's browser directly over WebRTC, using [PeerJS](https://peerjs.com). PeerJS's public broker only introduces the browsers to each other; game traffic doesn't pass through it.

- **Host refreshes the page:** the room is saved in the host's localStorage. It reopens under the same code, and guests reconnect on their own. Bots play the host's seat while the page reloads.
- **Host closes the tab:** the game pauses until they come back. The browser asks for confirmation before closing while a game is running.
- **Strict networks:** some mobile carriers and office firewalls block direct WebRTC connections. A TURN relay would fix that; none is configured yet.
- **Cheating:** the host's browser holds every player's cards, so a host who opens the developer tools could see them.

The code also contains an optional Node server (`packages/server`) that hosts rooms the same way. Builds made with `VITE_SERVER_URL` use it instead of peer-to-peer.

## Layout

| Path | What |
|---|---|
| `packages/shared` | Rules engine (a pure, seeded reducer), formations, the bot, per-player hidden-info views, and `RoomServer`/`Room`, which run a room on either the host's browser or the Node server. Tests are in `test/`. |
| `packages/client` | Vite + PixiJS (table, cards, particles) + Preact (menus and HUD) + Howler (audio). `p2p.ts` hosts or joins rooms over WebRTC. |
| `packages/server` | Optional Socket.IO server that wraps `RoomServer`. |
| `tools/extract-assets.mjs` | Crops and compresses the Balatro assets the game uses from a local Telatro checkout. |

## Develop

```bash
# Node 24 (installed with nvm)
npm install
npm run dev          # peer-to-peer mode on http://localhost:5173 (needs internet for the PeerJS broker)
npm run dev:server   # server mode: Node server on :3001 plus the client
npm test             # rules tests and bot-vs-bot simulation
npm run typecheck
npm run e2e          # two browsers play a round (Playwright)
```

## Deploy

Pushing to `main` runs `.github/workflows/pages.yml`. It runs the tests, builds the client with base path `/tximtxom/` (`npm run build:pages`) and publishes it to GitHub Pages.

The `Dockerfile` builds the server-mode version instead, for hosting on your own machine: `docker build -t tximtxom . && docker run -p 8080:8080 tximtxom`.

## Assets

The assets in `packages/client/public/assets` are already extracted, about 4 MB in total (3 MB of that is music). To rebuild them:

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/Infiniti20/Telatro.git .cache/telatro
git -C .cache/telatro sparse-checkout set resources/textures_preresize/1x resources/sounds resources/fonts resources/shaders
npm run assets
```

The card art, Joker art, the m6x11 font and the sound effects come from Balatro, made by LocalThunk and published by Playstack. TximTxom is a non-commercial fan project and claims no rights to them.
