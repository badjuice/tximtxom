# TximTxom

TximTxom is a Balatro-styled online card game for 2–4 players that runs in the browser. The full rules are in [docs/RULES.md](docs/RULES.md); in-game, see **How to play** and **Formations**.

## Layout

| Path | What |
|---|---|
| `packages/shared` | Rules engine: a pure, seeded reducer; formations; the bot; per-player hidden-info views; network protocol types. Unit tests and the bot simulation live in `test/`. |
| `packages/server` | Authoritative Node + Socket.IO server. Room codes, reconnect by token, bots take over dropped seats, turn timer. In production it also serves the built client. |
| `packages/client` | Vite + PixiJS (table, cards, particles) + Preact (menus/HUD, accessible HTML) + Howler (audio). |
| `tools/extract-assets.mjs` | Crops and compresses the few Balatro assets we use from a local Telatro checkout. |

## Develop

```bash
# Node 24 (installed with nvm)
npm install
npm run dev        # server on :3001, client on http://localhost:5173 (also on your LAN for phones)
npm test           # rules tests + bot-vs-bot simulation
npm run typecheck
```

## Assets

The assets in `packages/client/public/assets` are already extracted. They total about 4 MB, and most of that is music. To rebuild them:

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/Infiniti20/Telatro.git .cache/telatro
git -C .cache/telatro sparse-checkout set resources/textures_preresize/1x resources/sounds resources/fonts resources/shaders
npm run assets
```

The card art, Joker art, the m6x11 font and the sounds belong to LocalThunk and Playstack (Balatro). They're used here for a private, non-commercial prototype only. Replace them before any public release.

## Deploy (Fly.io)

```bash
fly launch --no-deploy   # keep the existing fly.toml
fly deploy
```

Rooms live in memory, so keep exactly **one** machine running. That's already set in `fly.toml`. Any host that runs a Docker container and supports WebSockets will also work (Render, Railway…).
