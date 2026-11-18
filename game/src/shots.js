// Deterministic scenes for the four stitched screenshots. Each scene is produced by the game's
// own renderer from a fixed state, so the images show real game code rather than artwork made
// outside the game. Only the screenshot path calls this module.
import { CENTRE, COLORS, SPAWN_RADIUS, UPGRADES, WAVES } from './config.js';
import { burst, createBolt, createShard, note } from './entities.js';

function place(game, type, angle, distance, hp) {
  const shard = createShard(type, angle, 50, game.rng);
  shard.x = CENTRE.x + Math.cos(angle) * distance;
  shard.y = CENTRE.y + Math.sin(angle) * distance;
  shard.hp = hp ?? shard.hp;
  shard.trail = [
    { x: shard.x + Math.cos(angle) * 22, y: shard.y + Math.sin(angle) * 22 },
    { x: shard.x + Math.cos(angle) * 11, y: shard.y + Math.sin(angle) * 11 },
  ];
  game.shards.push(shard);
  return shard;
}

export function stageShot(game, name) {
  game.reset();
  game.clock = 12.4;
  game.aim = -0.58;
  game.hoverCard = -1;
  game.messageTimer = 0;

  if (name === 'upgrade') {
    game.screen = 'upgrade';
    game.wave = 3;
    game.score = 3840;
    game.integrity = 76;
    game.combo = 6;
    game.best = 9120;
    game.taken = ['rapid', 'heavy'];
    game.offers = [UPGRADES[1], UPGRADES[3], UPGRADES[4]];
    game.hoverCard = 1;
    place(game, 'mote', 0.4, 250);
    place(game, 'dart', 2.5, 280);
    return game.screen;
  }

  if (name === 'win' || name === 'result' || name === 'lose') {
    const won = name !== 'lose';
    game.screen = won ? 'win' : 'over';
    game.wave = 6;
    game.score = won ? 9120 : 6240;
    game.best = won ? 9120 : 6240;
    game.shots = 108;
    game.hits = won ? 91 : 74;
    game.kills = won ? WAVES[WAVES.length - 1].quota : 14;
    game.integrity = won ? 34 : 0;
    game.combo = 8;
    burst(game, CENTRE.x, CENTRE.y, won ? COLORS.teal : COLORS.rose, 70, 320);
    return game.screen;
  }

  if (name === 'play') {
    game.screen = 'play';
    game.wave = 3;
    game.score = 2480;
    game.kills = 7;
    game.integrity = 72;
    game.combo = 7;
    game.shots = 32;
    game.hits = 25;
    game.aim = -0.62;
    game.spawnTimer = 0.4;
    place(game, 'guard', -2.55, 268, 2);
    place(game, 'mote', -1.25, 196);
    place(game, 'dart', -0.6, 168);
    place(game, 'mote', 0.42, 292);
    place(game, 'bloom', 1.75, 228, 1);
    place(game, 'dart', 2.75, 305);
    for (let i = 0; i < 3; i += 1) {
      const angle = -0.62 + (i - 1) * 0.17;
      const distance = 96 + i * 44;
      game.bolts.push(createBolt(
        CENTRE.x + Math.cos(angle) * distance,
        CENTRE.y + Math.sin(angle) * distance,
        angle,
        690,
        1,
        0,
      ));
    }
    burst(game, CENTRE.x + 120, CENTRE.y - 110, COLORS.gold, 26, 220);
    burst(game, CENTRE.x - 90, CENTRE.y + 60, COLORS.cyan, 18, 180);
    note(game, CENTRE.x + 120, CENTRE.y - 120, '+700', COLORS.gold);
    note(game, CENTRE.x - 90, CENTRE.y + 30, '+450', COLORS.cyan);
    game.shake = 2;
    return game.screen;
  }

  // The cover: the real title screen with a slow ring of shards drifting behind the wordmark.
  game.screen = 'title';
  const angles = [-2.7, -1.9, -1.1, -0.3, 0.6, 1.4, 2.2, 2.9];
  const kinds = ['mote', 'dart', 'guard', 'mote', 'bloom', 'dart', 'mote', 'guard'];
  angles.forEach((angle, index) => place(game, kinds[index], angle, SPAWN_RADIUS - 28 - (index % 3) * 22));
  game.best = 0;
  return game.screen;
}
