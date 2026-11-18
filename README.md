# halo-forge-17

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/sussybakka0110new/halo-forge-17/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/sussybakka0110new/halo-forge-17/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Halo Forge** is an original offline browser arcade game. Aim with the mouse and hold click or Space to fire bolts from the central core. Four families of shards drift inward; destroy your wave quota before the core loses all its integrity. Between each of the six waves you pick one of three upgrades, so every run is built differently. Combo, accuracy, a high score and a win/lose screen complete the loop.

Everything in `game/` is a plain static file: an HTML page, a stylesheet and ES modules. There is no build step, no library, no font download and no network request at runtime. Sound is synthesised with the Web Audio API. The four JPEGs in `screenshots/` are real frames captured from the running game in Chromium.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand-in program

`main.ts` is the entrypoint the grader runs on Node 22. It copies `game/` and `screenshots/` into `/output` and writes `dossier.json` with the kit's `buildDossier` helper.

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Controls

| Input | Action |
| --- | --- |
| Mouse | Aim |
| Hold left click / Space | Fire |
| 1 / 2 / 3 | Choose an upgrade between waves |
| P | Pause / resume |
| M | Sound on / off |
| Enter / click | Start or restart |

---

<sub>Entered on [make.fun](https://make.fun/?ref=kk7jw559&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
