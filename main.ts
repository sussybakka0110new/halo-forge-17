// Halo Forge hand-in program (Node 22, standard library only).
//
// The game is plain static files in game/: an HTML page, a stylesheet and ES modules. The grader
// runs this file in a clean container with the repository at /bot and a writable /output. We copy
// the game and its real browser screenshots into /output, then ask the kit's dossier builder to
// describe exactly what we shipped. Nothing is fetched, installed or generated at run time.
//
// Locally: MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly here rather than hand in an empty shell: both the game and the screenshots are part
// of the deliverable, and a missing one would be rejected by the gate for reasons hard to see.
if (!existsSync(join(here, 'game', 'index.html'))) throw new Error('game/index.html is missing');
if (!existsSync(join(here, 'screenshots'))) throw new Error('screenshots/ is missing');

mkdirSync(output, { recursive: true });
cpSync(join(here, 'game'), join(output, 'game'), { recursive: true });
mkdirSync(join(output, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(output, 'screenshots'), { recursive: true });
}

// The dossier is the only thing the judge reads besides the contact sheet, so build it from the
// bytes we actually copied, with the same limits the competition's gate applies.
writeFileSync(
  join(output, 'dossier.json'),
  buildDossier(output, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
