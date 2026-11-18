// Tuning tables for Halo Forge. Any number that shapes a run lives here so the rules in game.js
// stay readable and the six waves can be tuned without touching the simulation.
export const VIEW = { width: 1280, height: 800 };
export const CENTRE = { x: 640, y: 400 };
export const CORE_RADIUS = 30;
export const ARENA_RADIUS = 314;
export const SPAWN_RADIUS = 352;

export const COLORS = {
  void: '#060a17',
  deep: '#0c1430',
  ink: '#111b3d',
  line: '#23335f',
  text: '#ecf4ff',
  dim: '#8ea4cc',
  teal: '#5ff6d0',
  gold: '#ffc857',
  rose: '#ff5f8d',
  cyan: '#74d7ff',
  violet: '#a98cff',
  green: '#8ef08a',
};

// quota: shards to destroy; every: seconds between spawns; speed: pixels per second inward;
// mix: relative weights of the four shard families. Later waves mix families more freely.
export const WAVES = [
  { quota: 8, every: 1.15, speed: 42, mix: { mote: 1, dart: 0, guard: 0, bloom: 0 } },
  { quota: 10, every: 0.98, speed: 50, mix: { mote: 3, dart: 1, guard: 0, bloom: 0 } },
  { quota: 12, every: 0.86, speed: 57, mix: { mote: 3, dart: 2, guard: 1, bloom: 0 } },
  { quota: 14, every: 0.76, speed: 64, mix: { mote: 2, dart: 2, guard: 2, bloom: 1 } },
  { quota: 16, every: 0.68, speed: 71, mix: { mote: 2, dart: 2, guard: 2, bloom: 2 } },
  { quota: 18, every: 0.6, speed: 79, mix: { mote: 1, dart: 2, guard: 3, bloom: 2 } },
];

// hp, impact on the core, score value and the silhouette used by the renderer.
export const SHARD_TYPES = {
  mote: { hp: 1, damage: 12, value: 100, radius: 15, color: COLORS.gold, sides: 3, spin: 1.1 },
  dart: { hp: 1, damage: 14, value: 150, radius: 11, color: COLORS.rose, sides: 4, spin: 3.2 },
  guard: { hp: 3, damage: 20, value: 280, radius: 19, color: COLORS.cyan, sides: 6, spin: 0.7 },
  bloom: { hp: 2, damage: 16, value: 220, radius: 17, color: COLORS.violet, sides: 8, spin: -1.4 },
};

export const SHOT = {
  speed: 690,
  cooldown: 0.2,
  spread: 0.17,
  damage: 1,
  pierce: 0,
  life: 1.4,
};

// Each upgrade has one clear job; the game applies the effect by id, the cards only describe it.
export const UPGRADES = [
  { id: 'rapid', name: 'PULSE COILS', mark: '//', detail: 'Shoot 28% faster.', color: COLORS.teal },
  { id: 'twin', name: 'SPLIT BARREL', mark: '\\\\', detail: 'One more bolt per shot.', color: COLORS.gold },
  { id: 'heavy', name: 'DENSE CORE', mark: '◆', detail: 'Every bolt deals +1 damage.', color: COLORS.cyan },
  { id: 'lance', name: 'LANCE ROUNDS', mark: '↑', detail: 'Bolts punch through one more shard.', color: COLORS.rose },
  { id: 'mend', name: 'MEND FIELD', mark: '+', detail: 'Restore 30 core integrity.', color: COLORS.green },
  { id: 'brake', name: 'TIDE BRAKE', mark: '≈', detail: 'Shards slow near the core.', color: COLORS.violet },
  { id: 'echo', name: 'ECHO BURST', mark: '◎', detail: 'A leak damages every shard.', color: COLORS.gold },
];

export const BEST_KEY = 'halo-forge-best';
