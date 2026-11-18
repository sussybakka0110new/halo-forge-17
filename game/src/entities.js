// The moving pieces. Shards drift toward the core, bolts fly outward, particles and score notes
// are short-lived decoration. Nothing here reaches for the network or the DOM.
import { CENTRE, CORE_RADIUS, SHARD_TYPES, SPAWN_RADIUS } from './config.js';

export function createShard(type, angle, speed, rng) {
  const spec = SHARD_TYPES[type];
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const drift = rng.between(-0.26, 0.26);
  return {
    kind: type,
    x: CENTRE.x + cos * SPAWN_RADIUS,
    y: CENTRE.y + sin * SPAWN_RADIUS,
    vx: -cos * speed + -sin * drift * speed,
    vy: -sin * speed + cos * drift * speed,
    radius: spec.radius,
    hp: spec.hp,
    maxHp: spec.hp,
    angle: rng.between(0, Math.PI * 2),
    spin: spec.spin * rng.between(0.8, 1.2),
    color: spec.color,
    damage: spec.damage,
    value: spec.value,
    sides: spec.sides,
    trail: [],
  };
}

export function createBolt(x, y, angle, speed, damage, pierce) {
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    damage,
    pierce,
    life: 1.4,
    angle,
  };
}

export function burst(state, x, y, color, count, power) {
  const rng = state.rng;
  for (let i = 0; i < count; i += 1) {
    const angle = rng.between(0, Math.PI * 2);
    const speed = rng.between(power * 0.25, power);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rng.between(0.25, 0.7),
      maxLife: 0.7,
      size: rng.between(1.4, 3.6),
      color,
    });
  }
}

export function note(state, x, y, text, color) {
  state.floaters.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
}

export function corePoint(angle, radius = CORE_RADIUS) {
  return {
    x: CENTRE.x + Math.cos(angle) * radius,
    y: CENTRE.y + Math.sin(angle) * radius,
  };
}
