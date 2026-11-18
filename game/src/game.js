// The rules and the simulation. A run is a chain of six waves; each cleared wave offers three
// upgrades, so every player builds a different forge. The core loses integrity on every leak and
// the run ends in either a secured core or a dead one.
import {
  BEST_KEY,
  CENTRE,
  CORE_RADIUS,
  SHOT,
  UPGRADES,
  WAVES,
} from './config.js';
import { burst, corePoint, createBolt, createShard, note } from './entities.js';
import { createRandom } from './rng.js';

const STEP_CAP = 1 / 30;
const COMBO_MAX = 9;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function writeBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // A private window simply keeps the best score for this visit only.
  }
}

export class ForgeGame {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.reset();
  }

  reset() {
    this.rng = createRandom(this.seed);
    this.stars = Array.from({ length: 130 }, () => ({
      x: this.rng.between(0, 1280),
      y: this.rng.between(0, 800),
      size: this.rng.between(0.5, 1.9),
      phase: this.rng.between(0, 6.28),
    }));
    this.screen = 'title';
    this.best = readBest();
    this.wave = 1;
    this.score = 0;
    this.integrity = 100;
    this.combo = 1;
    this.kills = 0;
    this.shots = 0;
    this.hits = 0;
    this.elapsed = 0;
    this.clock = 0;
    this.spawnTimer = 0;
    this.cooldown = 0;
    this.shake = 0;
    this.flash = 0;
    this.message = '';
    this.messageTimer = 0;
    this.aim = -0.6;
    this.hoverCard = -1;
    this.firing = false;
    this.shards = [];
    this.bolts = [];
    this.particles = [];
    this.floaters = [];
    this.offers = [];
    this.taken = [];
    this.mods = {
      rapid: 0,
      twin: 0,
      heavy: 0,
      lance: 0,
      brake: 0,
      echo: 0,
    };
  }

  get waveSpec() {
    return WAVES[Math.min(this.wave, WAVES.length) - 1];
  }

  startRun() {
    const best = this.best;
    this.reset();
    this.best = best;
    this.screen = 'play';
    this.spawnTimer = 0.5;
    this.announce('WAVE 1 / 6', 1.6);
  }

  announce(text, seconds = 1.4) {
    this.message = text;
    this.messageTimer = seconds;
  }

  spawnShard(forceType = null) {
    const wave = this.waveSpec;
    const type = forceType ?? this.rng.weighted(wave.mix);
    const angle = this.rng.between(0, Math.PI * 2);
    const speed = wave.speed * this.rng.between(0.86, 1.12);
    this.shards.push(createShard(type, angle, speed, this.rng));
  }

  fire() {
    if (this.screen !== 'play' || this.cooldown > 0) return;
    const damage = SHOT.damage + this.mods.heavy;
    const pierce = SHOT.pierce + this.mods.lance;
    const offsets = [0];
    for (let side = 1; side <= this.mods.twin; side += 1) {
      offsets.push(-side * SHOT.spread, side * SHOT.spread);
    }
    for (const offset of offsets) {
      const angle = this.aim + offset;
      const muzzle = corePoint(angle, CORE_RADIUS + 6);
      this.bolts.push(createBolt(muzzle.x, muzzle.y, angle, SHOT.speed, damage, pierce));
    }
    this.shots += 1;
    this.cooldown = SHOT.cooldown * Math.pow(0.72, this.mods.rapid);
    burst(this, CENTRE.x, CENTRE.y, '#5ff6d0', 3, 90);
    return 'fire';
  }

  damageShard(shard, amount) {
    shard.hp -= amount;
    this.hits += 1;
    burst(this, shard.x, shard.y, shard.color, shard.hp <= 0 ? 16 : 6, 190);
    if (shard.hp > 0) return 'hit';
    const index = this.shards.indexOf(shard);
    if (index >= 0) this.shards.splice(index, 1);
    const points = Math.round(shard.value * this.combo);
    this.score += points;
    this.kills += 1;
    this.combo = Math.min(COMBO_MAX, this.combo + 1);
    note(this, shard.x, shard.y, `+${points}`, shard.color);
    this.shake = Math.max(this.shake, 5);
    return 'kill';
  }

  leak(shard) {
    const index = this.shards.indexOf(shard);
    if (index >= 0) this.shards.splice(index, 1);
    this.integrity = Math.max(0, this.integrity - shard.damage);
    this.combo = 1;
    this.shake = 16;
    this.flash = 0.55;
    burst(this, CENTRE.x, CENTRE.y, '#ff5f8d', 30, 280);
    note(this, CENTRE.x, CENTRE.y - 60, `-${shard.damage}`, '#ff5f8d');
    if (this.mods.echo) {
      for (const other of [...this.shards]) this.damageShard(other, 2);
    }
    if (this.integrity <= 0) {
      this.screen = 'over';
      this.commitBest();
      return 'over';
    }
    return 'leak';
  }

  commitBest() {
    if (this.score > this.best) {
      this.best = this.score;
      writeBest(this.best);
    }
  }

  offerUpgrades() {
    const fresh = UPGRADES.filter((upgrade) => !this.taken.includes(upgrade.id));
    this.offers = fresh.slice(0, 3);
    // Late waves can exhaust the pool; a repair card is always a meaningful choice.
    const mend = UPGRADES.find((upgrade) => upgrade.id === 'mend');
    while (this.offers.length < 3) this.offers.push(mend);
  }

  chooseUpgrade(index) {
    if (this.screen !== 'upgrade') return null;
    const upgrade = this.offers[index];
    if (!upgrade) return null;
    this.taken.push(upgrade.id);
    if (upgrade.id === 'mend') this.integrity = Math.min(100, this.integrity + 30);
    else this.mods[upgrade.id] += 1;
    this.wave += 1;
    this.screen = 'play';
    this.spawnTimer = 0.5;
    this.announce(`WAVE ${this.wave} / ${WAVES.length}`, 1.5);
    return upgrade.id;
  }

  clearWave() {
    this.kills = 0;
    if (this.wave >= WAVES.length) {
      this.screen = 'win';
      this.commitBest();
      return 'win';
    }
    this.screen = 'upgrade';
    this.offerUpgrades();
    return 'clear';
  }

  step(dt, firing = false) {
    const frame = Math.min(dt, STEP_CAP);
    this.clock += frame;
    this.shake = Math.max(0, this.shake - frame * 32);
    this.flash = Math.max(0, this.flash - frame * 1.8);
    this.messageTimer = Math.max(0, this.messageTimer - frame);
    for (const star of this.stars) star.phase += frame * 0.4;
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.x += p.vx * frame;
      p.y += p.vy * frame;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= frame;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floaters.length - 1; i >= 0; i -= 1) {
      const noteItem = this.floaters[i];
      noteItem.y -= frame * 36;
      noteItem.life -= frame;
      if (noteItem.life <= 0) this.floaters.splice(i, 1);
    }
    if (this.screen !== 'play') return null;

    this.elapsed += frame;
    this.cooldown = Math.max(0, this.cooldown - frame);
    if (firing) this.fire();
    this.spawnTimer -= frame;
    if (this.spawnTimer <= 0) {
      this.spawnShard();
      this.spawnTimer = this.waveSpec.every * this.rng.between(0.82, 1.18);
    }

    const events = [];
    for (const shard of [...this.shards]) {
      const dx = CENTRE.x - shard.x;
      const dy = CENTRE.y - shard.y;
      const distance = Math.hypot(dx, dy) || 1;
      let speedFactor = 1;
      if (this.mods.brake && distance < 180) speedFactor = Math.pow(0.68, this.mods.brake);
      shard.x += (dx / distance) * this.waveSpec.speed * speedFactor * frame + shard.vx * frame * 0.12;
      shard.y += (dy / distance) * this.waveSpec.speed * speedFactor * frame + shard.vy * frame * 0.12;
      shard.angle += shard.spin * frame;
      shard.trail.push({ x: shard.x, y: shard.y });
      if (shard.trail.length > 7) shard.trail.shift();
      if (distance < CORE_RADIUS + shard.radius * 0.5) events.push(this.leak(shard));
    }

    for (const bolt of [...this.bolts]) {
      bolt.x += bolt.vx * frame;
      bolt.y += bolt.vy * frame;
      bolt.life -= frame;
      if (bolt.life <= 0) {
        this.bolts.splice(this.bolts.indexOf(bolt), 1);
        continue;
      }
      for (const shard of [...this.shards]) {
        if (Math.hypot(bolt.x - shard.x, bolt.y - shard.y) > shard.radius + 6) continue;
        events.push(this.damageShard(shard, bolt.damage));
        if (bolt.pierce > 0) bolt.pierce -= 1;
        else this.bolts.splice(this.bolts.indexOf(bolt), 1);
        break;
      }
    }

    if (this.screen === 'over') return 'over';
    if (this.kills >= this.waveSpec.quota) return this.clearWave();
    return events.find(Boolean) ?? null;
  }

  accuracy() {
    return this.shots ? Math.round((this.hits / this.shots) * 100) : 0;
  }
}
