// Every pixel is drawn here with the 2D canvas API. The art direction is a dark observatory:
// concentric brass rings, cold light, four families of incoming shards and a bright central core.
// The renderer never changes game state; it only paints what the simulation hands it.
import { ARENA_RADIUS, CENTRE, COLORS, SHARD_TYPES, UPGRADES, VIEW, WAVES } from './config.js';

const SANS = '"DejaVu Sans", "Liberation Sans", system-ui, sans-serif';
const MONO = '"DejaVu Sans Mono", "Liberation Mono", monospace';

export function font(size, weight = 700, family = SANS) {
  return `${weight} ${size}px ${family}`;
}

export function tracked(ctx, text, x, y, spacing, align = 'left') {
  const chars = [...text];
  const widths = chars.map((character) => ctx.measureText(character).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + spacing * Math.max(0, chars.length - 1);
  let cursor = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  for (let index = 0; index < chars.length; index += 1) {
    ctx.fillText(chars[index], cursor, y);
    cursor += widths[index] + spacing;
  }
  return total;
}

function panel(ctx, x, y, width, height, radius = 16) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function polygon(ctx, x, y, radius, sides, angle) {
  ctx.beginPath();
  for (let index = 0; index < sides; index += 1) {
    const theta = angle + (index / sides) * Math.PI * 2;
    const px = x + Math.cos(theta) * radius;
    const py = y + Math.sin(theta) * radius;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function drawBackground(ctx, state) {
  ctx.fillStyle = COLORS.void;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const halo = ctx.createRadialGradient(CENTRE.x, CENTRE.y, 40, CENTRE.x, CENTRE.y, 620);
  halo.addColorStop(0, 'rgba(26, 54, 96, 0.55)');
  halo.addColorStop(0.55, 'rgba(12, 24, 56, 0.35)');
  halo.addColorStop(1, 'rgba(4, 7, 18, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  for (const star of state.stars) {
    const alpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(star.phase));
    ctx.fillStyle = `rgba(174, 205, 255, ${alpha})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.strokeStyle = 'rgba(63, 92, 150, 0.10)';
  ctx.lineWidth = 1;
  for (let x = 48; x < VIEW.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, VIEW.height);
    ctx.stroke();
  }
  for (let y = 48; y < VIEW.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW.width, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(95, 246, 208, 0.18)';
  ctx.lineWidth = 2;
  const corners = [[28, 28, 1, 1], [VIEW.width - 28, 28, -1, 1], [28, VIEW.height - 28, 1, -1], [VIEW.width - 28, VIEW.height - 28, -1, -1]];
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + sx * 30, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * 30);
    ctx.stroke();
  }
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 70, 110, ${state.flash * 0.18})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
}

export function drawArena(ctx, state) {
  ctx.save();
  ctx.translate(CENTRE.x, CENTRE.y);
  const rings = [
    { radius: ARENA_RADIUS, alpha: 0.38, dash: [4, 12], speed: 0.04 },
    { radius: 268, alpha: 0.16, dash: [2, 14], speed: -0.07 },
    { radius: 206, alpha: 0.12, dash: [1, 10], speed: 0.1 },
    { radius: 142, alpha: 0.16, dash: [8, 18], speed: -0.13 },
  ];
  for (const ring of rings) {
    ctx.save();
    ctx.rotate(state.clock * ring.speed);
    ctx.setLineDash(ring.dash);
    ctx.strokeStyle = `rgba(116, 215, 255, ${ring.alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255, 200, 87, 0.32)';
  ctx.lineWidth = 3;
  for (let index = 0; index < 48; index += 1) {
    const theta = (index / 48) * Math.PI * 2 + state.clock * 0.02;
    const inner = index % 4 === 0 ? 301 : 308;
    ctx.beginPath();
    ctx.moveTo(Math.cos(theta) * inner, Math.sin(theta) * inner);
    ctx.lineTo(Math.cos(theta) * 317, Math.sin(theta) * 317);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCore(ctx, state) {
  const pulse = 1 + Math.sin(state.clock * 3) * 0.06 + Math.min(state.combo, 9) * 0.006;
  const glow = ctx.createRadialGradient(CENTRE.x, CENTRE.y, 4, CENTRE.x, CENTRE.y, 92 * pulse);
  glow.addColorStop(0, 'rgba(95, 246, 208, 0.45)');
  glow.addColorStop(0.45, 'rgba(95, 246, 208, 0.10)');
  glow.addColorStop(1, 'rgba(95, 246, 208, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(CENTRE.x, CENTRE.y, 92 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(CENTRE.x, CENTRE.y);
  ctx.rotate(state.clock * 0.35);
  ctx.shadowColor = COLORS.teal;
  ctx.shadowBlur = 24;
  ctx.strokeStyle = COLORS.teal;
  ctx.lineWidth = 4;
  polygon(ctx, 0, 0, 30, 6, 0);
  ctx.stroke();
  ctx.rotate(-state.clock * 0.8);
  ctx.strokeStyle = 'rgba(236, 244, 255, 0.85)';
  ctx.lineWidth = 2;
  polygon(ctx, 0, 0, 18, 3, 0);
  ctx.stroke();
  ctx.restore();
  ctx.shadowBlur = 0;
  const integrity = Math.max(0, state.integrity) / 100;
  ctx.beginPath();
  ctx.arc(CENTRE.x, CENTRE.y, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * integrity);
  ctx.strokeStyle = integrity > 0.35 ? COLORS.teal : COLORS.rose;
  ctx.lineWidth = 5;
  ctx.stroke();
}

export function drawShards(ctx, state) {
  for (const shard of state.shards) {
    ctx.save();
    if (shard.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(shard.trail[0].x, shard.trail[0].y);
      for (const point of shard.trail) ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = `${shard.color}55`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.shadowColor = shard.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = `${shard.color}33`;
    ctx.strokeStyle = shard.color;
    ctx.lineWidth = 3;
    polygon(ctx, shard.x, shard.y, shard.radius, shard.sides, shard.angle);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = shard.color;
    polygon(ctx, shard.x, shard.y, shard.radius * 0.42, shard.sides, -shard.angle);
    ctx.fill();
    if (shard.maxHp > 1 && shard.hp < shard.maxHp) {
      for (let pip = 0; pip < shard.hp; pip += 1) {
        ctx.fillStyle = COLORS.void;
        ctx.beginPath();
        ctx.arc(shard.x - 6 + pip * 7, shard.y - shard.radius - 10, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

export function drawBolts(ctx, state) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.shadowColor = COLORS.teal;
  ctx.shadowBlur = 14;
  ctx.strokeStyle = '#d8fff5';
  ctx.lineWidth = 4;
  for (const bolt of state.bolts) {
    const tailX = bolt.x - Math.cos(bolt.angle) * 22;
    const tailY = bolt.y - Math.sin(bolt.angle) * 22;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(bolt.x, bolt.y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawEffects(ctx, state) {
  for (const p of state.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const noteItem of state.floaters) {
    ctx.globalAlpha = Math.max(0, noteItem.life / noteItem.maxLife);
    ctx.fillStyle = noteItem.color;
    ctx.font = font(20, 700, MONO);
    ctx.textAlign = 'center';
    ctx.fillText(noteItem.text, noteItem.x, noteItem.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function drawAim(ctx, state) {
  if (state.screen !== 'play') return;
  const reach = 296;
  const x = CENTRE.x + Math.cos(state.aim) * reach;
  const y = CENTRE.y + Math.sin(state.aim) * reach;
  ctx.save();
  ctx.setLineDash([6, 10]);
  ctx.strokeStyle = 'rgba(95, 246, 208, 0.30)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CENTRE.x + Math.cos(state.aim) * 46, CENTRE.y + Math.sin(state.aim) * 46);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(95, 246, 208, 0.75)';
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 20, y);
  ctx.lineTo(x - 15, y);
  ctx.moveTo(x + 15, y);
  ctx.lineTo(x + 20, y);
  ctx.stroke();
  ctx.restore();
}

export function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.text;
  ctx.font = font(14, 700, MONO);
  ctx.fillStyle = COLORS.dim;
  tracked(ctx, 'HALO FORGE / DEFENCE PROTOCOL', 52, 52, 2);
  ctx.font = font(32, 700, MONO);
  ctx.fillStyle = COLORS.text;
  tracked(ctx, String(state.score).padStart(6, '0'), 52, 96, 2);
  ctx.font = font(13, 700, MONO);
  ctx.fillStyle = COLORS.dim;
  tracked(ctx, 'SCORE', 52, 118, 2);

  ctx.textAlign = 'center';
  ctx.font = font(20, 700, MONO);
  ctx.fillStyle = COLORS.gold;
  tracked(ctx, `WAVE ${String(state.wave).padStart(2, '0')} / ${String(WAVES.length).padStart(2, '0')}`, VIEW.width / 2, 60, 3, 'center');
  ctx.font = font(13, 700, MONO);
  ctx.fillStyle = COLORS.dim;
  tracked(ctx, `${state.kills} / ${state.waveSpec.quota} SHARDS CLEARED`, VIEW.width / 2, 84, 1.5, 'center');
  ctx.textAlign = 'left';

  const barX = 946;
  const barY = 62;
  const barW = 280;
  ctx.font = font(13, 700, MONO);
  ctx.fillStyle = COLORS.dim;
  tracked(ctx, 'CORE INTEGRITY', barX, barY - 12, 2);
  ctx.fillStyle = 'rgba(116, 215, 255, 0.15)';
  panel(ctx, barX, barY, barW, 18, 9);
  ctx.fill();
  const integrity = Math.max(0, state.integrity) / 100;
  const fill = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  fill.addColorStop(0, integrity > 0.35 ? COLORS.teal : COLORS.rose);
  fill.addColorStop(1, integrity > 0.35 ? COLORS.cyan : '#ff9a5f');
  ctx.fillStyle = fill;
  panel(ctx, barX, barY, Math.max(4, barW * integrity), 18, 9);
  ctx.fill();
  ctx.font = font(13, 700, MONO);
  ctx.fillStyle = COLORS.text;
  tracked(ctx, `${Math.ceil(state.integrity)}%`, barX + barW, barY + 43, 1, 'right');

  ctx.font = font(13, 700, MONO);
  ctx.fillStyle = COLORS.dim;
  tracked(ctx, 'MOUSE AIM  ·  HOLD CLICK / SPACE TO FIRE  ·  P PAUSE  ·  M SOUND', 52, VIEW.height - 42, 1.5);
  ctx.textAlign = 'right';
  ctx.font = font(22, 700, MONO);
  ctx.fillStyle = state.combo > 1 ? COLORS.gold : COLORS.dim;
  tracked(ctx, `COMBO x${state.combo}`, VIEW.width - 52, VIEW.height - 42, 1.5, 'right');
  ctx.textAlign = 'left';

  if (state.messageTimer > 0) {
    ctx.globalAlpha = Math.min(1, state.messageTimer);
    ctx.textAlign = 'center';
    ctx.font = font(44, 700, MONO);
    ctx.fillStyle = COLORS.text;
    tracked(ctx, state.message, VIEW.width / 2, 174, 6, 'center');
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

export function drawTitle(ctx, state) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  for (const shard of state.shards.slice(0, 8)) {
    ctx.fillStyle = `${shard.color}88`;
    polygon(ctx, shard.x, shard.y, shard.radius, shard.sides, shard.angle);
    ctx.fill();
  }
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.shadowColor = COLORS.teal;
  ctx.shadowBlur = 36;
  ctx.font = font(122, 800);
  ctx.fillStyle = COLORS.text;
  tracked(ctx, 'HALO', VIEW.width / 2, 296, 22, 'center');
  const shine = ctx.createLinearGradient(400, 0, 880, 0);
  shine.addColorStop(0, COLORS.teal);
  shine.addColorStop(0.5, '#d9fff4');
  shine.addColorStop(1, COLORS.cyan);
  ctx.fillStyle = shine;
  tracked(ctx, 'FORGE', VIEW.width / 2, 412, 22, 'center');
  ctx.shadowBlur = 0;
  ctx.font = font(19, 700, MONO);
  ctx.fillStyle = COLORS.gold;
  tracked(ctx, 'D E F E N D   T H E   L A S T   L I G H T', VIEW.width / 2, 462, 3, 'center');

  panel(ctx, 400, 506, 480, 160, 18);
  ctx.fillStyle = 'rgba(10, 18, 42, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(95, 246, 208, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = font(18, 700, MONO);
  tracked(ctx, 'SIX WAVES. ONE CORE. NO SECOND CHANCE.', VIEW.width / 2, 548, 1, 'center');
  ctx.fillStyle = COLORS.dim;
  ctx.font = font(15, 400, MONO);
  tracked(ctx, 'Aim with the mouse, hold to fire. Each wave, choose an upgrade.', VIEW.width / 2, 582, 0.5, 'center');
  ctx.fillStyle = COLORS.teal;
  ctx.font = font(19, 700, MONO);
  tracked(ctx, 'PRESS ENTER OR CLICK TO BEGIN', VIEW.width / 2, 626, 2, 'center');
  ctx.fillStyle = COLORS.dim;
  ctx.font = font(13, 400, MONO);
  tracked(ctx, `BEST ${String(state.best).padStart(6, '0')}`, VIEW.width / 2, 700, 2, 'center');
  ctx.textAlign = 'left';
}

export function drawUpgrade(ctx, state) {
  ctx.fillStyle = 'rgba(5, 9, 22, 0.82)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.font = font(15, 700, MONO);
  ctx.fillStyle = COLORS.teal;
  tracked(ctx, `WAVE ${state.wave} CLEARED`, VIEW.width / 2, 168, 6, 'center');
  ctx.font = font(58, 800);
  ctx.fillStyle = COLORS.text;
  tracked(ctx, 'FORGE YOUR NEXT SHOT', VIEW.width / 2, 236, 3, 'center');
  ctx.font = font(15, 400, MONO);
  ctx.fillStyle = COLORS.dim;
  tracked(ctx, 'Choose one upgrade with 1 / 2 / 3 or a click', VIEW.width / 2, 270, 2, 'center');
  ctx.textAlign = 'left';
  for (let index = 0; index < 3; index += 1) {
    const upgrade = state.offers[index] ?? UPGRADES[index];
    const x = 150 + index * 330;
    const y = 316;
    const w = 290;
    const h = 320;
    const hovered = state.hoverCard === index;
    panel(ctx, x, y, w, h, 20);
    ctx.fillStyle = hovered ? 'rgba(24, 43, 75, 0.96)' : 'rgba(12, 21, 48, 0.94)';
    ctx.fill();
    ctx.strokeStyle = hovered ? COLORS.text : `${upgrade.color}aa`;
    ctx.lineWidth = hovered ? 4 : 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = font(74, 800, MONO);
    ctx.fillStyle = upgrade.color;
    ctx.fillText(upgrade.mark, x + w / 2, y + 118);
    ctx.font = font(20, 800);
    ctx.fillStyle = COLORS.text;
    tracked(ctx, upgrade.name, x + w / 2, y + 190, 1, 'center');
    ctx.font = font(15, 400, MONO);
    ctx.fillStyle = COLORS.dim;
    const words = upgrade.detail.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      if ((line + ' ' + word).trim().length > 26) {
        lines.push(line.trim());
        line = word;
      } else line += ` ${word}`;
    }
    if (line) lines.push(line.trim());
    lines.forEach((text, row) => ctx.fillText(text, x + w / 2, y + 228 + row * 24));
    ctx.font = font(14, 700, MONO);
    ctx.fillStyle = upgrade.color;
    ctx.fillText(`[ ${index + 1} ]`, x + w / 2, y + h - 34);
    ctx.textAlign = 'left';
  }
}

export function drawResult(ctx, state, won) {
  ctx.fillStyle = 'rgba(5, 9, 22, 0.76)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.shadowBlur = 30;
  ctx.shadowColor = won ? COLORS.teal : COLORS.rose;
  ctx.font = font(78, 800);
  ctx.fillStyle = won ? COLORS.teal : COLORS.rose;
  tracked(ctx, won ? 'CORE SECURED' : 'CORE LOST', VIEW.width / 2, 264, 6, 'center');
  ctx.shadowBlur = 0;
  ctx.font = font(17, 700, MONO);
  ctx.fillStyle = COLORS.dim;
  tracked(ctx, won ? 'THE LAST LIGHT SURVIVES SIX WAVES' : 'THE FORGE FELL. THE LIGHT WENT OUT.', VIEW.width / 2, 306, 2, 'center');

  panel(ctx, 374, 352, 532, 234, 20);
  ctx.fillStyle = 'rgba(11, 20, 46, 0.9)';
  ctx.fill();
  ctx.strokeStyle = won ? 'rgba(95, 246, 208, 0.5)' : 'rgba(255, 95, 141, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = font(15, 700, MONO);
  ctx.fillStyle = COLORS.dim;
  tracked(ctx, 'FINAL SCORE', VIEW.width / 2, 392, 3, 'center');
  ctx.font = font(72, 800, MONO);
  ctx.fillStyle = COLORS.text;
  tracked(ctx, String(state.score).padStart(6, '0'), VIEW.width / 2, 470, 3, 'center');
  ctx.font = font(16, 700, MONO);
  ctx.fillStyle = COLORS.dim;
  tracked(ctx, `WAVE ${state.wave}  ·  ${state.accuracy()}% HIT RATE  ·  BEST ${state.best}`, VIEW.width / 2, 530, 1, 'center');
  ctx.font = font(19, 700, MONO);
  ctx.fillStyle = COLORS.gold;
  tracked(ctx, 'PRESS ENTER TO FORGE AGAIN', VIEW.width / 2, 652, 3, 'center');
  ctx.fillStyle = COLORS.dim;
  ctx.font = font(13, 400, MONO);
  tracked(ctx, 'HALO FORGE · AN ORIGINAL MAKE.FUN ENTRY', VIEW.width / 2, 716, 2, 'center');
  ctx.textAlign = 'left';
}

export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(5, 9, 22, 0.7)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.font = font(64, 800);
  ctx.fillStyle = COLORS.text;
  tracked(ctx, 'PAUSED', VIEW.width / 2, 410, 12, 'center');
  ctx.font = font(17, 700, MONO);
  ctx.fillStyle = COLORS.dim;
  tracked(ctx, 'PRESS P TO RESUME', VIEW.width / 2, 460, 3, 'center');
  ctx.textAlign = 'left';
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    scale = Math.min(width / VIEW.width, height / VIEW.height);
    offsetX = (width - VIEW.width * scale) / 2;
    offsetY = (height - VIEW.height * scale) / 2;
  }

  function draw(state) {
    resize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COLORS.void;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.save();
    if (state.shake > 0) {
      ctx.translate(
        Math.sin(state.clock * 91) * state.shake * 0.35,
        Math.cos(state.clock * 73) * state.shake * 0.35,
      );
    }
    drawBackground(ctx, state);
    drawArena(ctx, state);
    if (state.screen === 'title') {
      drawCore(ctx, state);
      drawTitle(ctx, state);
    } else {
      drawAim(ctx, state);
      drawShards(ctx, state);
      drawCore(ctx, state);
      drawBolts(ctx, state);
      drawEffects(ctx, state);
      drawHud(ctx, state);
      if (state.screen === 'upgrade') drawUpgrade(ctx, state);
      else if (state.screen === 'over') drawResult(ctx, state, false);
      else if (state.screen === 'win') drawResult(ctx, state, true);
      else if (state.screen === 'paused') drawPause(ctx);
    }
    ctx.restore();
  }

  return { draw, resize };
}
