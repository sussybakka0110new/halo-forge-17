// A tiny seeded generator. Every run, and every staged screenshot, comes from the same rules with
// a fixed stream of numbers, so a frame can be reproduced exactly.
export function createRandom(seed) {
  let a = seed >>> 0;
  const random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  random.between = (low, high) => low + (high - low) * random();
  random.chance = (probability) => random() < probability;
  random.pick = (items) => items[Math.floor(random() * items.length)];
  random.weighted = (weights) => {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    let roll = random() * total;
    for (const [key, weight] of Object.entries(weights)) {
      roll -= weight;
      if (roll <= 0) return key;
    }
    return Object.keys(weights)[0];
  };
  return random;
}
